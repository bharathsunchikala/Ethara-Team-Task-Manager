from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class Task(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = Field(default=None, alias="_id")
    title: str
    description: str = ""
    status: str = "Todo"
    priority: str = "Medium"
    dueDate: datetime
    project: str
    assignedTo: str
    createdBy: str
