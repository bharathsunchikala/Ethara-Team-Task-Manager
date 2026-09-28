from datetime import datetime, timezone
from typing import Annotated

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field

from app.ai.infer import recommend_with_confidence
from app.auth import get_current_user
from app.routers.common import object_id, require_admin, serialize

router = APIRouter(tags=["tasks"])
VALID_STATUSES = {"Todo", "In Progress", "Completed"}
VALID_PRIORITIES = {"Low", "Medium", "High", "Urgent"}


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    description: str = Field(default="", max_length=1500)
    status: str = "Todo"
    priority: str = "Medium"
    dueDate: datetime
    project: str
    assignedTo: str


class TaskPatch(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=160)
    description: str | None = Field(default=None, max_length=1500)
    status: str | None = None
    priority: str | None = None
    dueDate: datetime | None = None
    project: str | None = None
    assignedTo: str | None = None


async def get_accessible_task(request: Request, task_id: str, current_user: dict) -> dict:
    task = await request.app.state.db.tasks.find_one({"_id": object_id(task_id)})
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    if current_user.get("role") != "Admin" and task.get("assignedTo") != object_id(current_user["_id"]):
        raise HTTPException(status_code=403, detail="You do not have access to this task")
    return task


async def validate_assignment(request: Request, project_id: str, assignee_id: str) -> tuple[ObjectId, ObjectId]:
    project_oid, assignee_oid = object_id(project_id), object_id(assignee_id)
    project = await request.app.state.db.projects.find_one({"_id": project_oid})
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    if assignee_oid not in project.get("members", []):
        raise HTTPException(status_code=400, detail="Assigned user must be a member of the project")
    return project_oid, assignee_oid


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_task(
    body: TaskCreate,
    request: Request,
    current_user: Annotated[dict, Depends(get_current_user)],
) -> dict:
    require_admin(current_user)
    if body.status not in VALID_STATUSES or body.priority not in VALID_PRIORITIES:
        raise HTTPException(status_code=400, detail="Invalid task status or priority")
    project_id, assignee_id = await validate_assignment(request, body.project, body.assignedTo)
    if body.dueDate.date() < datetime.now(timezone.utc).date():
        raise HTTPException(status_code=400, detail="Due date cannot be in the past")
    task = {
        "title": body.title.strip(),
        "description": body.description,
        "status": body.status,
        "priority": body.priority,
        "dueDate": body.dueDate,
        "project": project_id,
        "assignedTo": assignee_id,
        "createdBy": object_id(current_user["_id"]),
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc),
    }
    result = await request.app.state.db.tasks.insert_one(task)
    task["_id"] = result.inserted_id
    return serialize(task)


@router.get("")
async def list_tasks(
    request: Request, current_user: Annotated[dict, Depends(get_current_user)]
) -> list[dict]:
    query = {} if current_user.get("role") == "Admin" else {"assignedTo": object_id(current_user["_id"])}
    cursor = request.app.state.db.tasks.find(query).sort("createdAt", -1)
    return [serialize(item) async for item in cursor]


@router.get("/{task_id}")
async def get_task(
    task_id: str,
    request: Request,
    current_user: Annotated[dict, Depends(get_current_user)],
) -> dict:
    return serialize(await get_accessible_task(request, task_id, current_user))


@router.patch("/{task_id}")
async def update_task(
    task_id: str,
    patch: TaskPatch,
    request: Request,
    current_user: Annotated[dict, Depends(get_current_user)],
) -> dict:
    require_admin(current_user)
    changes = patch.model_dump(exclude_unset=True, exclude_none=True)
    if "status" in changes and changes["status"] not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid task status")
    if "priority" in changes and changes["priority"] not in VALID_PRIORITIES:
        raise HTTPException(status_code=400, detail="Invalid task priority")
    current = await request.app.state.db.tasks.find_one({"_id": object_id(task_id)})
    if current is None:
        raise HTTPException(status_code=404, detail="Task not found")
    project_id = changes.get("project", str(current["project"]))
    assignee_id = changes.get("assignedTo", str(current["assignedTo"]))
    project_oid, assignee_oid = await validate_assignment(request, project_id, assignee_id)
    changes["project"], changes["assignedTo"] = project_oid, assignee_oid
    if changes.get("dueDate") and changes["dueDate"].date() < datetime.now(timezone.utc).date():
        raise HTTPException(status_code=400, detail="Due date cannot be in the past")
    changes["updatedAt"] = datetime.now(timezone.utc)
    await request.app.state.db.tasks.update_one({"_id": object_id(task_id)}, {"$set": changes})
    updated = await request.app.state.db.tasks.find_one({"_id": object_id(task_id)})
    return serialize(updated)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: str,
    request: Request,
    current_user: Annotated[dict, Depends(get_current_user)],
) -> None:
    require_admin(current_user)
    result = await request.app.state.db.tasks.delete_one({"_id": object_id(task_id)})
    if not result.deleted_count:
        raise HTTPException(status_code=404, detail="Task not found")


@router.post("/{task_id}/recommend")
async def recommend_task_assignee(
    task_id: str,
    request: Request,
    current_user: Annotated[dict, Depends(get_current_user)],
) -> dict:
    task = await get_accessible_task(request, task_id, current_user)
    project = await request.app.state.db.projects.find_one({"_id": task["project"]})
    candidates = [str(member) for member in (project or {}).get("members", [])]
    if not candidates:
        raise HTTPException(status_code=400, detail="The task project has no members")
    confidence = 0.0
    try:
        prediction, confidence = recommend_with_confidence(task.get("description") or task["title"])
    except (FileNotFoundError, ValueError):
        prediction = ""
    recommended = prediction if prediction in candidates else candidates[0]
    return {"recommended_user_id": recommended, "confidence": confidence if prediction in candidates else 0.0}
