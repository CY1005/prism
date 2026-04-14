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
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id", ondelete="SET NULL"))
    deleted_at = Column(DateTime)  # F2 AC15-18: soft delete
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
    scope = Column(Text, nullable=False, default="project")
    created_at = Column(DateTime, server_default=func.now())


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    __table_args__ = TABLE_ARGS

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_hash = Column(Text, nullable=False)
    expires_at = Column(DateTime, nullable=False)
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
    # current_version_id, created_by, updated_by may not exist yet (migration pending)
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
    # created_by, updated_by may not exist yet (migration pending)
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
    change_type = Column(Text, nullable=False, default="added")
    is_current = Column(Boolean, nullable=False, default=False)
    snapshot_data = Column(JSONB)
    mode = Column(Text, nullable=False, default="release")
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
    # created_by may not exist yet (migration pending)
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


# ─── Issues (F7 问题沉淀) ────────────────────────────

class Issue(Base):
    __tablename__ = "issues"
    __table_args__ = TABLE_ARGS

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    node_id = Column(UUID(as_uuid=True), ForeignKey("nodes.id", ondelete="SET NULL"))
    category = Column(Text, nullable=False)  # 'bug' | 'tech_debt' | 'design_flaw' | 'performance'
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(Text, nullable=False, default="medium")
    status = Column(Text, nullable=False, default="open")
    tags = Column(JSONB, server_default="[]")
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now())


# ─── Competitors (F6 竞品全局实体) ────────────────────

class Competitor(Base):
    __tablename__ = "competitors"
    __table_args__ = TABLE_ARGS

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name = Column(Text, nullable=False)
    website = Column(Text)
    description = Column(Text)
    created_at = Column(DateTime, server_default=func.now())


# ─── Competitor References (F6 竞品参考记录) ──────────

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    __table_args__ = TABLE_ARGS

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    action_type = Column(Text, nullable=False)
    target_type = Column(Text, nullable=False)
    target_id = Column(Text, nullable=False)
    summary = Column(Text, nullable=False)
    metadata_ = Column("metadata", JSONB)
    created_at = Column(DateTime, server_default=func.now())


class CompetitorReference(Base):
    __tablename__ = "competitor_references"
    __table_args__ = TABLE_ARGS

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    node_id = Column(UUID(as_uuid=True), ForeignKey("nodes.id", ondelete="CASCADE"), nullable=False)
    competitor_id = Column(UUID(as_uuid=True), ForeignKey("competitors.id", ondelete="CASCADE"), nullable=False)
    version = Column(Text)
    feature_coverage = Column(Text)
    technical_approach = Column(Text)
    pros_and_cons = Column(JSONB)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now())


# ─── Feed Sources (F14 行业动态) ────────────────────

class FeedSource(Base):
    __tablename__ = "feed_sources"
    __table_args__ = TABLE_ARGS

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    source_type = Column(Text, nullable=False)  # 'rss' | 'search'
    url = Column(Text, nullable=False)
    name = Column(Text, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, server_default=func.now())


# ─── Feed Items (F14 行业动态) ──────────────────────

class FeedItem(Base):
    __tablename__ = "feed_items"
    __table_args__ = TABLE_ARGS

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    source_id = Column(UUID(as_uuid=True), ForeignKey("feed_sources.id", ondelete="SET NULL"))
    title = Column(Text, nullable=False)
    source = Column(Text, nullable=False)
    published_date = Column(DateTime, nullable=False)
    summary = Column(Text, nullable=False)
    tags = Column(JSONB, default=[])
    suggested_node_id = Column(UUID(as_uuid=True), ForeignKey("nodes.id", ondelete="SET NULL"))
    confidence = Column(Float, nullable=False, default=0)
    status = Column(Text, nullable=False, default="pending")
    created_at = Column(DateTime, server_default=func.now())


# ─── Feed Node Links (F14 行业动态) ────────────────

class FeedNodeLink(Base):
    __tablename__ = "feed_node_links"
    __table_args__ = TABLE_ARGS

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    feed_item_id = Column(UUID(as_uuid=True), ForeignKey("feed_items.id", ondelete="CASCADE"), nullable=False)
    node_id = Column(UUID(as_uuid=True), ForeignKey("nodes.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())


# ─── Teams (F20 团队空间) ────────────────────────────

class Team(Base):
    __tablename__ = "teams"
    __table_args__ = TABLE_ARGS

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    description = Column(Text)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())


# ─── Team Members (F20 团队成员) ─────────────────────

class TeamMember(Base):
    __tablename__ = "team_members"
    __table_args__ = TABLE_ARGS

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(Text, nullable=False, default="member")
    joined_at = Column(DateTime, server_default=func.now())
