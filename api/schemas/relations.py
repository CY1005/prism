from pydantic import BaseModel


class GraphNode(BaseModel):
    id: str
    name: str
    type: str  # "folder" | "file"
    depth: int
    completion_percent: float


class GraphEdge(BaseModel):
    id: int
    source: str
    target: str
    relation_type: str  # "depends_on" | "related_to" | "conflicts_with"
    description: str | None = None


class RelationGraphResponse(BaseModel):
    project_id: str
    nodes: list[GraphNode]
    edges: list[GraphEdge]
