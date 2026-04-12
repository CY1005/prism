from pydantic import BaseModel


class SearchResultItem(BaseModel):
    id: str
    type: str  # "node" | "dimension" | "issue"
    title: str
    content_snippet: str
    project_id: str | None = None
    project_name: str | None = None
    node_path: str | None = None
    node_id: str | None = None  # F9: for frontend links to feature pages
    dimension_type: str | None = None  # e.g. "功能描述", "技术实现"
    issue_category: str | None = None  # F9: bug/tech_debt/design_flaw/performance
    breadcrumb: list[str] | None = None  # F9: human-readable path segments
    highlight_positions: list[dict] | None = None  # F9: keyword match positions
    relevance: str = "keyword"  # "keyword" | "semantic" (future)


class SearchResponse(BaseModel):
    query: str
    total: int
    results: list[SearchResultItem]
