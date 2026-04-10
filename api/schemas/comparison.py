from pydantic import BaseModel


class CompetitorRef(BaseModel):
    node_id: str
    node_name: str
    node_path: str
    content: dict  # raw dimension content


class ComparisonResponse(BaseModel):
    project_id: str
    dimension_key: str
    items: list[CompetitorRef]
    total: int
