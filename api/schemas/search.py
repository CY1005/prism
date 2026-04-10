from pydantic import BaseModel


class SearchResultItem(BaseModel):
    id: str
    type: str  # "node" | "dimension" | "knowledge"
    title: str
    content_snippet: str
    project_id: str | None = None
    project_name: str | None = None
    node_path: str | None = None
    dimension_type: str | None = None  # e.g. "功能描述", "技术实现"
    relevance: str = "keyword"  # "keyword" | "semantic" (future)


class SearchResponse(BaseModel):
    query: str
    total: int
    results: list[SearchResultItem]
