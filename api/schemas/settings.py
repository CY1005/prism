from pydantic import BaseModel


class ProjectSettingsResponse(BaseModel):
    project_id: str
    name: str
    description: str | None = None
    template_type: str
    members: list[dict] = []
    dimension_configs: list[dict] = []


class ProjectSettingsUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
