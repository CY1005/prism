"""Issues CRUD router for F7 问题沉淀."""

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Any, List, Optional

from api.db import get_db
from api.models.tables import Issue, User
from api.routers.auth import require_user

logger = logging.getLogger(__name__)
router = APIRouter()


class IssueCreate(BaseModel):
    node_id: Optional[str] = None
    category: str  # 'bug' | 'tech_debt' | 'design_flaw' | 'performance'
    title: str
    description: str
    severity: str = "medium"
    status: str = "open"
    tags: List[Any] = []


class IssueUpdate(BaseModel):
    category: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[List[Any]] = None


class IssueResponse(BaseModel):
    id: str
    project_id: str
    node_id: Optional[str]
    category: str
    title: str
    description: str
    severity: str
    status: str
    tags: List[Any] = []
    created_at: Optional[str]
    updated_at: Optional[str]


@router.post("/{project_id}/issues/", response_model=IssueResponse, status_code=201)
def create_issue(
    project_id: str,
    req: IssueCreate,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Create a new issue for a project."""
    import json
    from sqlalchemy import text
    result = db.execute(
        text("""
            INSERT INTO issues (id, project_id, node_id, category, title, description, severity, status, tags, created_by)
            VALUES (:id, :project_id, :node_id, :category, :title, :description, :severity, :status, cast(:tags as jsonb), :created_by)
            RETURNING id, project_id, node_id, category, title, description, severity, status, tags, created_at, updated_at
        """),
        {
            "id": str(uuid.uuid4()),
            "project_id": project_id,
            "node_id": req.node_id,
            "category": req.category,
            "title": req.title,
            "description": req.description,
            "severity": req.severity,
            "status": req.status,
            "tags": json.dumps(req.tags),
            "created_by": str(user.id),
        }
    )
    db.commit()
    row = result.fetchone()
    return {
        "id": str(row[0]),
        "project_id": str(row[1]),
        "node_id": str(row[2]) if row[2] else None,
        "category": row[3],
        "title": row[4],
        "description": row[5],
        "severity": row[6],
        "status": row[7],
        "tags": row[8] if row[8] is not None else [],
        "created_at": row[9].isoformat() if row[9] else None,
        "updated_at": row[10].isoformat() if row[10] else None,
    }


@router.get("/{project_id}/issues/", response_model=list[IssueResponse])
def list_issues(
    project_id: str,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """List issues for a project."""
    from sqlalchemy import text
    result = db.execute(
        text("SELECT id, project_id, node_id, category, title, description, severity, status, tags, created_at, updated_at FROM issues WHERE project_id = :project_id"),
        {"project_id": project_id}
    )
    return [
        {
            "id": str(row[0]),
            "project_id": str(row[1]),
            "node_id": str(row[2]) if row[2] else None,
            "category": row[3],
            "title": row[4],
            "description": row[5],
            "severity": row[6],
            "status": row[7],
            "tags": row[8] if row[8] is not None else [],
            "created_at": row[9].isoformat() if row[9] else None,
            "updated_at": row[10].isoformat() if row[10] else None,
        }
        for row in result.fetchall()
    ]


@router.patch("/{project_id}/issues/{issue_id}", response_model=IssueResponse)
def update_issue(
    project_id: str,
    issue_id: str,
    req: IssueUpdate,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Update an issue."""
    from sqlalchemy import text
    # Check exists
    existing = db.execute(
        text("SELECT id FROM issues WHERE id = :id AND project_id = :project_id"),
        {"id": issue_id, "project_id": project_id}
    ).fetchone()
    if not existing:
        raise HTTPException(status_code=404, detail="Issue not found")

    updates = {}
    if req.category is not None:
        updates["category"] = req.category
    if req.title is not None:
        updates["title"] = req.title
    if req.description is not None:
        updates["description"] = req.description
    if req.severity is not None:
        updates["severity"] = req.severity
    if req.status is not None:
        updates["status"] = req.status
    if req.tags is not None:
        import json
        updates["tags"] = json.dumps(req.tags)

    if updates:
        set_parts = []
        for k in updates:
            if k == "tags":
                set_parts.append(f"{k} = cast(:{k} as jsonb)")
            else:
                set_parts.append(f"{k} = :{k}")
        set_clause = ", ".join(set_parts)
        updates["id"] = issue_id
        updates["project_id"] = project_id
        db.execute(
            text(f"UPDATE issues SET {set_clause}, updated_at = now() WHERE id = :id AND project_id = :project_id"),
            updates
        )
        db.commit()

    row = db.execute(
        text("SELECT id, project_id, node_id, category, title, description, severity, status, tags, created_at, updated_at FROM issues WHERE id = :id"),
        {"id": issue_id}
    ).fetchone()
    return {
        "id": str(row[0]),
        "project_id": str(row[1]),
        "node_id": str(row[2]) if row[2] else None,
        "category": row[3],
        "title": row[4],
        "description": row[5],
        "severity": row[6],
        "status": row[7],
        "tags": row[8] if row[8] is not None else [],
        "created_at": row[9].isoformat() if row[9] else None,
        "updated_at": row[10].isoformat() if row[10] else None,
    }


@router.delete("/{project_id}/issues/{issue_id}")
def delete_issue(
    project_id: str,
    issue_id: str,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Delete an issue."""
    from sqlalchemy import text
    result = db.execute(
        text("DELETE FROM issues WHERE id = :id AND project_id = :project_id"),
        {"id": issue_id, "project_id": project_id}
    )
    db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Issue not found")
    return {"status": "deleted", "issue_id": issue_id}
