from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field

from app.auth import get_current_user
from app.routers.common import object_id, require_admin, serialize

router = APIRouter(tags=["users"])


class UserPatch(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=80)
    email: EmailStr | None = None
    skills: list[str] | None = None


@router.get("")
async def list_users(
    request: Request, current_user: Annotated[dict, Depends(get_current_user)]
) -> list[dict]:
    require_admin(current_user)
    cursor = request.app.state.db.users.find({}, {"password": 0, "hashed_password": 0})
    return [serialize(item) async for item in cursor]


@router.get("/{user_id}")
async def get_user(
    user_id: str,
    request: Request,
    current_user: Annotated[dict, Depends(get_current_user)],
) -> dict:
    target_id = object_id(user_id)
    if current_user.get("role") != "Admin" and current_user["_id"] != user_id:
        raise HTTPException(status_code=403, detail="You do not have access to this user")
    user = await request.app.state.db.users.find_one(
        {"_id": target_id}, {"password": 0, "hashed_password": 0}
    )
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return serialize(user)


@router.patch("/{user_id}")
async def update_user(
    user_id: str,
    patch: UserPatch,
    request: Request,
    current_user: Annotated[dict, Depends(get_current_user)],
) -> dict:
    if current_user.get("role") != "Admin" and current_user["_id"] != user_id:
        raise HTTPException(status_code=403, detail="You cannot update this user")
    changes = patch.model_dump(exclude_unset=True, exclude_none=True)
    if "email" in changes:
        changes["email"] = str(changes["email"]).lower()
        existing = await request.app.state.db.users.find_one(
            {"email": changes["email"], "_id": {"$ne": object_id(user_id)}}
        )
        if existing:
            raise HTTPException(status_code=409, detail="Email is already registered")
    await request.app.state.db.users.update_one({"_id": object_id(user_id)}, {"$set": changes})
    updated = await request.app.state.db.users.find_one(
        {"_id": object_id(user_id)}, {"password": 0, "hashed_password": 0}
    )
    if updated is None:
        raise HTTPException(status_code=404, detail="User not found")
    return serialize(updated)
