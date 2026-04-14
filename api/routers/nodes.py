"""Nodes CRUD router."""

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from api.db import get_db
from api.models.tables import Node, User
from api.routers.auth import require_user

logger = logging.getLogger(__name__)
router = APIRouter()


class NodeCreate(BaseModel):
    name: str
    parent_id: Optional[str] = None
    node_type: str = "folder"  # 'folder' | 'file'
    sort_order: int = 0


class NodeUpdate(BaseModel):
    name: Optional[str] = None
    sort_order: Optional[int] = None


class NodeResponse(BaseModel):
    id: str
    project_id: str
    parent_id: Optional[str]
    name: str
    type: str
    depth: int
    sort_order: int
    path: str
    created_at: Optional[str]
    updated_at: Optional[str]


@router.post("/{project_id}/nodes/", response_model=NodeResponse, status_code=201)
def create_node(
    project_id: str,
    req: NodeCreate,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Create a node (folder or file) in the project tree."""
    parent_id = uuid.UUID(req.parent_id) if req.parent_id else None
    depth = 0
    path = ""

    if parent_id:
        parent = db.query(Node).filter(Node.id == parent_id).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent node not found")
        depth = parent.depth + 1
        path = f"{parent.path}/{req.name}" if parent.path else req.name
    else:
        path = req.name

    node = Node(
        id=uuid.uuid4(),
        project_id=uuid.UUID(project_id),
        parent_id=parent_id,
        name=req.name,
        type=req.node_type,
        depth=depth,
        sort_order=req.sort_order,
        path=path,
    )
    db.add(node)
    db.commit()
    db.refresh(node)
    return {
        "id": str(node.id),
        "project_id": str(node.project_id),
        "parent_id": str(node.parent_id) if node.parent_id else None,
        "name": node.name,
        "type": node.type,
        "depth": node.depth,
        "sort_order": node.sort_order,
        "path": node.path,
        "created_at": node.created_at.isoformat() if node.created_at else None,
        "updated_at": node.updated_at.isoformat() if node.updated_at else None,
    }


@router.patch("/{project_id}/nodes/{node_id}", response_model=NodeResponse)
def update_node(
    project_id: str,
    node_id: str,
    req: NodeUpdate,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Update a node's name or sort order."""
    node = db.query(Node).filter(
        Node.id == uuid.UUID(node_id),
        Node.project_id == uuid.UUID(project_id),
    ).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    if req.name is not None:
        node.name = req.name
    if req.sort_order is not None:
        node.sort_order = req.sort_order

    db.commit()
    db.refresh(node)
    return {
        "id": str(node.id),
        "project_id": str(node.project_id),
        "parent_id": str(node.parent_id) if node.parent_id else None,
        "name": node.name,
        "type": node.type,
        "depth": node.depth,
        "sort_order": node.sort_order,
        "path": node.path,
        "created_at": node.created_at.isoformat() if node.created_at else None,
        "updated_at": node.updated_at.isoformat() if node.updated_at else None,
    }


@router.delete("/{project_id}/nodes/{node_id}")
def delete_node(
    project_id: str,
    node_id: str,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """Delete a node from the project tree."""
    node = db.query(Node).filter(
        Node.id == uuid.UUID(node_id),
        Node.project_id == uuid.UUID(project_id),
    ).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    db.delete(node)
    db.commit()
    return {"status": "deleted", "node_id": node_id}
