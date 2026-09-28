from pydantic import BaseModel, ConfigDict, Field


class Project(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(default=None, alias="_id")
    name: str
    description: str = ""
    members: list[str] = Field(default_factory=list)
    createdBy: str
