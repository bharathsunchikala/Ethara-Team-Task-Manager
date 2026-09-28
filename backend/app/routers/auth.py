from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr, Field

from app.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.routers.common import serialize

router = APIRouter(tags=["auth"])


class RegisterBody(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8)


class LoginBody(BaseModel):
    email: EmailStr
    password: str


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(body: RegisterBody, request: Request) -> dict:
    database = request.app.state.db
    email = str(body.email).lower()
    if await database.users.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="Email is already registered")
    user = {
        "name": body.name.strip(),
        "email": email,
        "password": hash_password(body.password),
        "role": "Member",
        "createdAt": datetime.now(timezone.utc),
    }
    result = await database.users.insert_one(user)
    user["_id"] = result.inserted_id
    user.pop("password")
    return {"access_token": create_access_token({"id": str(result.inserted_id)}), "user": serialize(user)}


@router.post("/login")
async def login(body: LoginBody, request: Request) -> dict:
    user = await request.app.state.db.users.find_one({"email": str(body.email).lower()})
    stored_hash = (user or {}).get("password") or (user or {}).get("hashed_password")
    if not user or not stored_hash or not verify_password(body.password, stored_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    safe_user = serialize(user)
    safe_user.pop("password", None)
    safe_user.pop("hashed_password", None)
    return {"access_token": create_access_token({"id": str(user["_id"])}), "user": safe_user}


@router.get("/me")
async def me(user: Annotated[dict, Depends(get_current_user)]) -> dict:
    return {"user": user}


@router.get("/users")
async def list_users(request: Request, user: Annotated[dict, Depends(get_current_user)]) -> dict:
    if user.get("role") != "Admin":
        raise HTTPException(status_code=403, detail="Administrator access required")
    users = request.app.state.db.users.find({}, {"password": 0, "hashed_password": 0})
    return {"data": [serialize(item) async for item in users]}
