"""SQLAlchemy read-only models mirroring Drizzle schema.

These models do NOT manage migrations. Drizzle (frontend) is the single
source of truth for schema changes. FastAPI reads these tables and writes
only to knowledge_items / analysis_tasks.
"""

import uuid

from sqlalchemy import (
    Column,
    ForeignKey,
    Text,
    Integer,
    Boolean,
    Float,
    DateTime,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func

from api.db import Base

TABLE_ARGS = {"extend_existing": True}


# ─── Users ────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"
    __table_args__ = TABLE_ARGS

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(Text, nullable=False, unique=True)
    name = Column(Text, nullable=False)
    password_hash = Column(Text, nullable=False)
    role = Column(Text, nullable=False, default="user")
    status = Column(Text, nullable=False, default="active")
    token_invalidated_at = Column(DateTime)
    failed_login_count = Column(Integer, nullable=False, default=0)
    locked_until = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now())


# ─── Projects ─────────────────────────────────────────

class Project(Base):
    __tablename__ = "projects"
    __table_args__ = TABLE_ARGS

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    description = Column(Text)
    template_type = Column(Text, nullable=False, default="custom")
    hierarchy_labels = Column(JSONB, nullable=False, default=["层级1", "层级2", "层级3"])
    version_mode = Column(Text, nullable=False, default="release")
    ai_provider = Column(Text, default="local")
    ai_api_key_enc = Column(Text)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now())


# ─── Project Members ──────────────────────────────────

class ProjectMember(Base):
    __tablename__ = "project_members"
    __table_args__ = TABLE_ARGS

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(Text, nullable=False, default="viewer")
    created_at = Column(DateTime, server_default=func.now())


# ─── Nodes ────────────────────────────────────────────

class Node(Base):
    __tablename__ = "nodes"
    __table_args__ = TABLE_ARGS

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    parent_id = Column(UUID(as_uuid=True))
    name = Column(Text, nullable=False)
    type = Column(Text, nullable=False, default="folder")
    depth = Column(Integer, nullable=False, default=0)
    sort_order = Column(Integer, nullable=False, default=0)
    path = Column(Text, nullable=False, default="")
    # current_version_id may not exist yet in DB (migration pending)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now())


# ─── Dimension Types ──────────────────────────────────

class DimensionType(Base):
    __tablename__ = "dimension_types"
    __table_args__ = TABLE_ARGS

    id = Column(Integer, primary_key=True, autoincrement=True)
    key = Column(Text, nullable=False, unique=True)
    name = Column(Text, nullable=False)
    icon = Column(Text, nullable=False, default="FileText")
    description = Column(Text)
    field_schema = Column(JSONB)


# ─── Project Dimension Configs ────────────────────────

class ProjectDimensionConfig(Base):
    __tablename__ = "project_dimension_configs"
    __table_args__ = TABLE_ARGS

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    dimension_type_id = Column(Integer, ForeignKey("dimension_types.id"), nullable=False)
    enabled = Column(Boolean, nullable=False, default=True)
    sort_order = Column(Integer, nullable=False, default=0)


# ─── Dimension Records ───────────────────────────────

class DimensionRecord(Base):
    __tablename__ = "dimension_records"
    __table_args__ = TABLE_ARGS

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    node_id = Column(UUID(as_uuid=True), ForeignKey("nodes.id", ondelete="CASCADE"), nullable=False)
    dimension_type_id = Column(Integer, ForeignKey("dimension_types.id"), nullable=False)
    content = Column(JSONB, nullable=False)
    version = Column(Integer, nullable=False, default=1)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now())


# ─── Version Records ─────────────────────────────────

class VersionRecord(Base):
    __tablename__ = "version_records"
    __table_args__ = TABLE_ARGS

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    node_id = Column(UUID(as_uuid=True), ForeignKey("nodes.id", ondelete="CASCADE"), nullable=False)
    version_label = Column(Text, nullable=False)
    summary = Column(Text, nullable=False)
    details = Column(Text)
    created_at = Column(DateTime, server_default=func.now())


# ─── Node Relations ──────────────────────────────────

class NodeRelation(Base):
    __tablename__ = "node_relations"
    __table_args__ = TABLE_ARGS

    id = Column(Integer, primary_key=True, autoincrement=True)
    source_node_id = Column(UUID(as_uuid=True), ForeignKey("nodes.id", ondelete="CASCADE"), nullable=False)
    target_node_id = Column(UUID(as_uuid=True), ForeignKey("nodes.id", ondelete="CASCADE"), nullable=False)
    relation_type = Column(Text, nullable=False, default="related_to")
    description = Column(Text)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, server_default=func.now())


# ─── Analysis Tasks ──────────────────────────────────

class AnalysisTask(Base):
    __tablename__ = "analysis_tasks"
    __table_args__ = TABLE_ARGS

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    task_type = Column(Text, nullable=False)
    input_hash = Column(Text, nullable=False)
    status = Column(Text, nullable=False, default="pending")
    input_data = Column(JSONB, nullable=False)
    result_data = Column(JSONB)
    error_message = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    completed_at = Column(DateTime)


# ─── Knowledge Items ─────────────────────────────────

class KnowledgeItem(Base):
    __tablename__ = "knowledge_items"
    __table_args__ = TABLE_ARGS

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"))
    node_id = Column(UUID(as_uuid=True), ForeignKey("nodes.id", ondelete="SET NULL"))
    title = Column(Text, nullable=False)
    content = Column(Text, nullable=False)
    content_type = Column(Text, nullable=False, default="text")
    tags = Column(JSONB, default=[])
    source = Column(Text, default="manual")
    confidence = Column(Float, default=1.0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now())


# ─── Project Templates ───────────────────────────────

class ProjectTemplate(Base):
    __tablename__ = "project_templates"
    __table_args__ = TABLE_ARGS

    id = Column(Integer, primary_key=True, autoincrement=True)
    key = Column(Text, nullable=False, unique=True)
    name = Column(Text, nullable=False)
    description = Column(Text)
    hierarchy_labels = Column(JSONB, nullable=False)
    dimension_keys = Column(JSONB, nullable=False)
