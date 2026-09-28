from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import MONGO_URI


def create_database() -> tuple[AsyncIOMotorClient, AsyncIOMotorDatabase]:
    client = AsyncIOMotorClient(MONGO_URI)
    database_name = MONGO_URI.rsplit("/", 1)[-1].split("?", 1)[0]
    if not database_name:
        database_name = "ethara_team_task_manager"
    return client, client[database_name]
