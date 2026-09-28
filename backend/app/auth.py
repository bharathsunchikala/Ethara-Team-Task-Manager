from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from bson import ObjectId
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from passlib.context import CryptContext

from app.core.config import ALGORITHM, JWT_EXPIRES_MINUTES, JWT_SECRET

password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)
bearer_credentials_dependency = Depends(bearer_scheme)


def hash_password(password: str) -> str:
    return password_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return password_context.verify(password, hashed_password)


def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    if not JWT_SECRET:
        raise RuntimeError("JWT_SECRET must be configured before issuing tokens")
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=JWT_EXPIRES_MINUTES)
    )
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)


def verify_token(token: str) -> dict[str, Any]:
    if not JWT_SECRET:
        raise HTTPException(status_code=500, detail="JWT_SECRET is not configured")
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
    except jwt.PyJWTError as error:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from error


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = bearer_credentials_dependency,
) -> dict[str, Any]:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    payload = verify_token(credentials.credentials)
    user_id = payload.get("id")
    if not isinstance(user_id, str) or not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=401, detail="Invalid token subject")
    user = await request.app.state.db.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise HTTPException(status_code=401, detail="User no longer exists")
    user.pop("password", None)
    user.pop("hashed_password", None)
    user["_id"] = str(user["_id"])
    return user
