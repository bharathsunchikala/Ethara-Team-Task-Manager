from typing import Any

from bson import ObjectId
from fastapi import HTTPException


def object_id(value: str) -> ObjectId:
    if not ObjectId.is_valid(value):
        raise HTTPException(status_code=400, detail="Invalid id")
    return ObjectId(value)


def serialize(document: dict[str, Any]) -> dict[str, Any]:
    result = dict(document)
    if "_id" in result:
        result["_id"] = str(result["_id"])
    for key, value in result.items():
        if isinstance(value, ObjectId):
            result[key] = str(value)
        elif isinstance(value, list):
            result[key] = [str(item) if isinstance(item, ObjectId) else item for item in value]
    return result


def require_admin(user: dict[str, Any]) -> None:
    if user.get("role") != "Admin":
        raise HTTPException(status_code=403, detail="Administrator access required")
