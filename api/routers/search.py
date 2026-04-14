from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import or_
from sqlalchemy.orm import Session

from api.db import get_db, engine
from api.models.tables import KnowledgeItem, Node
from api.schemas.search import SearchResponse
from api.services.search import unified_search
from api.services.hybrid_search import hybrid_search

router = APIRouter()


class KnowledgeItemCreate(BaseModel):
    project_id: str | None = None
    node_id: str | None = None
    title: str
    content: str
    content_type: str = "text"
    tags: list[str] = []
    source: str = "manual"


class KnowledgeItemUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    tags: list[str] | None = None


class KnowledgeSearchResult(BaseModel):
    id: str
    title: str
    content: str
    tags: list[str]
    source: str | None
    confidence: float | None


class KnowledgeSearchResponse(BaseModel):
    results: list[KnowledgeSearchResult]


class KnowledgeItemRef(BaseModel):
    id: str
    title: str


class StatusResponse(BaseModel):
    status: str


@router.get("/", response_model=KnowledgeSearchResponse)
def search_knowledge(
    q: str = Query(..., min_length=1),
    project_id: str | None = None,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Search knowledge items by keyword (ILIKE)"""
    pattern = f"%{q}%"
    query = db.query(KnowledgeItem).filter(
        or_(
            KnowledgeItem.title.ilike(pattern),
            KnowledgeItem.content.ilike(pattern),
        )
    )
    if project_id:
        query = query.filter(KnowledgeItem.project_id == project_id)

    results = query.order_by(KnowledgeItem.updated_at.desc()).limit(limit).all()
    return {
        "results": [
            {
                "id": str(r.id),
                "title": r.title,
                "content": r.content[:200],
                "tags": r.tags or [],
                "source": r.source,
                "confidence": r.confidence,
            }
            for r in results
        ]
    }


@router.post("/", response_model=KnowledgeItemRef, status_code=201)
def create_knowledge_item(item: KnowledgeItemCreate, db: Session = Depends(get_db)):
    """Create a new knowledge item"""
    ki = KnowledgeItem(**item.model_dump())
    db.add(ki)
    db.commit()
    db.refresh(ki)
    return {"id": str(ki.id), "title": ki.title}


@router.put("/{item_id}", response_model=KnowledgeItemRef)
def update_knowledge_item(
    item_id: str, update: KnowledgeItemUpdate, db: Session = Depends(get_db)
):
    """Update a knowledge item"""
    ki = db.query(KnowledgeItem).filter(KnowledgeItem.id == item_id).first()
    if not ki:
        raise HTTPException(status_code=404, detail="Knowledge item not found")
    if update.title is not None:
        ki.title = update.title
    if update.content is not None:
        ki.content = update.content
    if update.tags is not None:
        ki.tags = update.tags
    db.commit()
    return {"id": str(ki.id), "title": ki.title}


@router.delete("/{item_id}", response_model=StatusResponse)
def delete_knowledge_item(item_id: str, db: Session = Depends(get_db)):
    """Delete a knowledge item"""
    ki = db.query(KnowledgeItem).filter(KnowledgeItem.id == item_id).first()
    if not ki:
        raise HTTPException(status_code=404, detail="Knowledge item not found")
    db.delete(ki)
    db.commit()
    return {"status": "deleted"}


@router.get("/unified", response_model=SearchResponse)
async def search_unified(
    q: str = Query(..., min_length=1),
    project_id: str | None = None,
    dimension_type: str | None = None,
    issue_category: str | None = None,
    user_id: str = Query(..., description="User ID for permission check"),
    limit: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """F18: Hybrid search (BM25 + pgvector semantic + RRF fusion).

    Automatically upgrades F9 keyword search with semantic vector search.
    Degrades gracefully to pure keyword search if pgvector is unavailable.
    Each result includes match_type: 'keyword' | 'semantic' | 'both'.
    """
    return await hybrid_search(
        db=db,
        db_engine=engine,
        query=q,
        user_id=user_id,
        project_id=project_id,
        dimension_type=dimension_type,
        issue_category=issue_category,
        limit=limit,
    )


@router.get("/nodes")
def search_nodes(
    q: str = Query(..., min_length=1),
    project_id: str | None = None,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    """Search nodes (features/modules) by name"""
    pattern = f"%{q}%"
    query = db.query(Node).filter(Node.name.ilike(pattern))
    if project_id:
        query = query.filter(Node.project_id == project_id)
    return {
        "results": [
            {"id": str(n.id), "name": n.name, "path": n.path}
            for n in query.limit(limit).all()
        ]
    }
