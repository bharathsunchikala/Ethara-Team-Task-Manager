from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class User(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(default=None, alias="_id")
    name: str
    email: str
    hashed_password: str = Field(validation_alias=AliasChoices("hashed_password", "password"))
    role: str = "Member"
    skills: list[str] = Field(default_factory=list)
