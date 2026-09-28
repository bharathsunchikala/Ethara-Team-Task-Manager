from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field

from app.auth import get_current_user
from app.routers.common import object_id, require_admin, serialize

router = APIRouter(tags=["projects"])


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str = Field(default="", max_length=1000)
    members: list[str] = Field(default_factory=list)


class ProjectPatch(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=1000)
    members: list[str] | None = None


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_project(
    body: ProjectCreate,
    request: Request,
    current_user: Annotated[dict, Depends(get_current_user)],
) -> dict:
    require_admin(current_user)
    member_ids = [object_id(member) for member in body.members]
    count = await request.app.state.db.users.count_documents({"_id": {"$in": member_ids}})
    if count != len(set(member_ids)):
        raise HTTPException(status_code=400, detail="One or more project members do not exist")
    project = {
        "name": body.name.strip(),
        "description": body.description,
        "members": member_ids,
        "createdBy": object_id(current_user["_id"]),
        "createdAt": datetime.now(timezone.utc),
    }
    result = await request.app.state.db.projects.insert_one(project)
    project["_id"] = result.inserted_id
    return serialize(project)


@router.get("")
async def list_projects(
    request: Request, current_user: Annotated[dict, Depends(get_current_user)]
) -> list[dict]:
    query = {} if current_user.get("role") == "Admin" else {"members": object_id(current_user["_id"])}
    cursor = request.app.state.db.projects.find(query).sort("createdAt", -1)
    return [serialize(item) async for item in cursor]


@router.get("/{project_id}")
async def get_project(
    project_id: str,
    request: Request,
    current_user: Annotated[dict, Depends(get_current_user)],
) -> dict:
    project = await request.app.state.db.projects.find_one({"_id": object_id(project_id)})
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    if current_user.get("role") != "Admin" and object_id(current_user["_id"]) not in project.get("members", []):
        raise HTTPException(status_code=403, detail="You do not have access to this project")
    return serialize(project)


@router.get("/{project_id}/stats")
async def project_stats(
    project_id: str,
    request: Request,
    current_user: Annotated[dict, Depends(get_current_user)],
) -> dict:
    await get_project(project_id, request, current_user)
    pipeline = [
        {"$match": {"project": object_id(project_id)}},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
    ]
    counts = {row["_id"]: row["count"] async for row in request.app.state.db.tasks.aggregate(pipeline)}
    return {"project": project_id, "total": sum(counts.values()), "byStatus": counts}


@router.patch("/{project_id}")
async def update_project(
    project_id: str,
    patch: ProjectPatch,
    request: Request,
    current_user: Annotated[dict, Depends(get_current_user)],
) -> dict:
    require_admin(current_user)
    changes = patch.model_dump(exclude_unset=True, exclude_none=True)
    if "members" in changes:
        changes["members"] = [object_id(member) for member in changes["members"]]
    await request.app.state.db.projects.update_one({"_id": object_id(project_id)}, {"$set": changes})
    updated = await request.app.state.db.projects.find_one({"_id": object_id(project_id)})
    if updated is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return serialize(updated)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    request: Request,
    current_user: Annotated[dict, Depends(get_current_user)],
) -> None:
    require_admin(current_user)
    result = await request.app.state.db.projects.delete_one({"_id": object_id(project_id)})
    if not result.deleted_count:
        raise HTTPException(status_code=404, detail="Project not found")
    await request.app.state.db.tasks.delete_many({"project": object_id(project_id)})
