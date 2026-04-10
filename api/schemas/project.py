from pydantic import BaseModel


class ProjectStats(BaseModel):
    project_id: str
    project_name: str
    total_folders: int
    total_files: int  # "功能项"
    total_dimension_records: int
    avg_completion_percent: float  # average across all files
    dimension_type_count: int


class TreeNodeOverview(BaseModel):
    id: str
    name: str
    type: str  # "folder" | "file"
    depth: int
    filled_dimensions: int
    total_dimensions: int
    completion_percent: float
    children: list["TreeNodeOverview"] = []


class ProjectTreeOverview(BaseModel):
    project_id: str
    project_name: str
    tree: list[TreeNodeOverview]
