"""F14 行业动态 — Feed sources, items, and manual fetch."""

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from api.db import get_db
from api.models.tables import FeedItem, FeedNodeLink, FeedSource, Node, Project
from api.schemas.feed import (
    FeedItemConfirmRequest,
    FeedItemReassignRequest,
    FeedItemResponse,
    FeedSourceCreate,
    FeedSourceResponse,
    FeedSourceUpdate,
)
from api.services.feed_fetcher import ai_search_feed, fetch_rss, process_feed_items

logger = logging.getLogger(__name__)

router = APIRouter()


def _get_project(db: Session, project_id: uuid.UUID) -> Project:
    project = db.query(Project).filter(
        Project.id == str(project_id),
        Project.deleted_at.is_(None),
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


# ─── Feed Items ──────────────────────────────────────


@router.get("/items", response_model=list[FeedItemResponse])
def list_feed_items(
    project_id: uuid.UUID = Query(...),
    status: str = Query("pending"),
    db: Session = Depends(get_db),
):
    """List feed items with optional status filter, joined with suggested node name."""
    _get_project(db, project_id)

    items = (
        db.query(FeedItem, Node.name)
        .outerjoin(Node, FeedItem.suggested_node_id == Node.id)
        .filter(
            FeedItem.project_id == str(project_id),
            FeedItem.status == status,
        )
        .order_by(FeedItem.published_date.desc())
        .all()
    )

    return [
        FeedItemResponse(
            id=item.id,
            project_id=item.project_id,
            source_id=item.source_id,
            title=item.title,
            source=item.source,
            published_date=item.published_date,
            summary=item.summary,
            tags=item.tags or [],
            suggested_node_id=item.suggested_node_id,
            suggested_node_name=node_name,
            confidence=item.confidence,
            status=item.status,
            created_at=item.created_at,
        )
        for item, node_name in items
    ]


@router.post("/items/{item_id}/confirm")
def confirm_feed_item(
    item_id: uuid.UUID,
    req: FeedItemConfirmRequest,
    db: Session = Depends(get_db),
):
    """Confirm a feed item and link it to a node."""
    item = db.query(FeedItem).filter(FeedItem.id == str(item_id)).first()
    if not item:
        raise HTTPException(status_code=404, detail="Feed item not found")

    # Verify node exists
    node = db.query(Node).filter(Node.id == str(req.node_id)).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    # Create link
    link = FeedNodeLink(
        id=uuid.uuid4(),
        feed_item_id=str(item_id),
        node_id=str(req.node_id),
    )
    db.add(link)

    item.status = "confirmed"
    db.commit()

    return {"message": "Feed item confirmed", "item_id": str(item_id)}


@router.post("/items/{item_id}/ignore")
def ignore_feed_item(
    item_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Mark a feed item as ignored."""
    item = db.query(FeedItem).filter(FeedItem.id == str(item_id)).first()
    if not item:
        raise HTTPException(status_code=404, detail="Feed item not found")

    item.status = "ignored"
    db.commit()

    return {"message": "Feed item ignored", "item_id": str(item_id)}


@router.put("/items/{item_id}/reassign")
def reassign_feed_item(
    item_id: uuid.UUID,
    req: FeedItemReassignRequest,
    db: Session = Depends(get_db),
):
    """Reassign a feed item's suggested node."""
    item = db.query(FeedItem).filter(FeedItem.id == str(item_id)).first()
    if not item:
        raise HTTPException(status_code=404, detail="Feed item not found")

    node = db.query(Node).filter(Node.id == str(req.node_id)).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    item.suggested_node_id = str(req.node_id)
    db.commit()

    return {"message": "Feed item reassigned", "item_id": str(item_id)}


# ─── Feed Sources ────────────────────────────────────


@router.get("/sources", response_model=list[FeedSourceResponse])
def list_feed_sources(
    project_id: uuid.UUID = Query(...),
    db: Session = Depends(get_db),
):
    """List feed sources for a project."""
    _get_project(db, project_id)

    sources = (
        db.query(FeedSource)
        .filter(FeedSource.project_id == str(project_id))
        .order_by(FeedSource.created_at.desc())
        .all()
    )

    return [
        FeedSourceResponse(
            id=s.id,
            project_id=s.project_id,
            source_type=s.source_type,
            url=s.url,
            name=s.name,
            is_active=s.is_active,
            created_at=s.created_at,
        )
        for s in sources
    ]


@router.post("/sources", response_model=FeedSourceResponse)
def create_feed_source(
    req: FeedSourceCreate,
    db: Session = Depends(get_db),
):
    """Create a new feed source."""
    _get_project(db, req.project_id)

    source = FeedSource(
        id=uuid.uuid4(),
        project_id=str(req.project_id),
        source_type=req.source_type,
        url=req.url,
        name=req.name,
    )
    db.add(source)
    db.commit()
    db.refresh(source)

    return FeedSourceResponse(
        id=source.id,
        project_id=source.project_id,
        source_type=source.source_type,
        url=source.url,
        name=source.name,
        is_active=source.is_active,
        created_at=source.created_at,
    )


@router.put("/sources/{source_id}", response_model=FeedSourceResponse)
def update_feed_source(
    source_id: uuid.UUID,
    req: FeedSourceUpdate,
    db: Session = Depends(get_db),
):
    """Update a feed source."""
    source = db.query(FeedSource).filter(FeedSource.id == str(source_id)).first()
    if not source:
        raise HTTPException(status_code=404, detail="Feed source not found")

    if req.name is not None:
        source.name = req.name
    if req.url is not None:
        source.url = req.url
    if req.is_active is not None:
        source.is_active = req.is_active

    db.commit()
    db.refresh(source)

    return FeedSourceResponse(
        id=source.id,
        project_id=source.project_id,
        source_type=source.source_type,
        url=source.url,
        name=source.name,
        is_active=source.is_active,
        created_at=source.created_at,
    )


@router.delete("/sources/{source_id}")
def delete_feed_source(
    source_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Delete a feed source."""
    source = db.query(FeedSource).filter(FeedSource.id == str(source_id)).first()
    if not source:
        raise HTTPException(status_code=404, detail="Feed source not found")

    db.delete(source)
    db.commit()

    return {"message": "Feed source deleted", "source_id": str(source_id)}


# ─── Manual Fetch ────────────────────────────────────


@router.post("/fetch")
def trigger_fetch(
    project_id: uuid.UUID = Query(...),
    db: Session = Depends(get_db),
):
    """Manually trigger feed fetch for all active sources in a project."""
    _get_project(db, project_id)

    sources = (
        db.query(FeedSource)
        .filter(
            FeedSource.project_id == str(project_id),
            FeedSource.is_active.is_(True),
        )
        .all()
    )

    total_new = 0
    errors = []

    for source in sources:
        try:
            if source.source_type == "rss":
                raw_items = fetch_rss(source.url)
            else:
                raw_items = ai_search_feed(str(project_id), db)

            count = process_feed_items(str(project_id), raw_items, str(source.id), db)
            total_new += count
            logger.info("Fetched %d new items from source %s", count, source.name)
        except Exception as e:
            logger.error("Error fetching from source %s: %s", source.name, e)
            errors.append({"source": source.name, "error": str(e)})

    return {
        "message": f"Fetch complete: {total_new} new items",
        "new_items": total_new,
        "errors": errors,
    }
