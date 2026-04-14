from pydantic import BaseModel


class MemberInfo(BaseModel):
    user_id: str
    role: str


class DimensionConfigInfo(BaseModel):
    id: int
    dimension_key: str
    dimension_name: str
    enabled: bool
    sort_order: int


class ProjectSettingsResponse(BaseModel):
    project_id: str
    name: str
    description: str | None = None
    template_type: str
    hierarchy_labels: dict | list | None = None
    members: list[MemberInfo] = []
    dimension_configs: list[DimensionConfigInfo] = []


class ProjectSettingsUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    hierarchy_labels: dict | list | None = None
