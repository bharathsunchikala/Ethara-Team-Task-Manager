from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import CLIENT_URL
from app.database import create_database
from app.routers import ai, auth, projects, tasks, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    client, database = create_database()
    app.state.mongo_client = client
    app.state.db = database
    yield
    client.close()


app = FastAPI(title="Team Task Manager API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in CLIENT_URL.split(",") if origin.strip()],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router, prefix="/api/v1/auth")
app.include_router(users.router, prefix="/api/v1/users")
app.include_router(projects.router, prefix="/api/v1/projects")
app.include_router(tasks.router, prefix="/api/v1/tasks")
app.include_router(ai.router, prefix="/api/v1/ai")


@app.get("/api/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "Team Task Manager API"}
