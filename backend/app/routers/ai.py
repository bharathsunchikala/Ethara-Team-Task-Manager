import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request
from openai import APIError
from pydantic import BaseModel, Field

from app.ai.planner import generate_project_plan
from app.auth import get_current_user
from app.routers.common import object_id

router = APIRouter(tags=["ai"])
logger = logging.getLogger(__name__)


class ProjectPlanRequest(BaseModel):
    project_id: str
    goal: str = Field(min_length=12, max_length=1000)


@router.post("/project-plan")
async def create_project_plan(
    body: ProjectPlanRequest,
    request: Request,
    current_user: Annotated[dict, Depends(get_current_user)],
) -> dict:
    project_id = object_id(body.project_id)
    database = request.app.state.db
    project = await database.projects.find_one({"_id": project_id})
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    if (
        current_user.get("role") != "Admin"
        and object_id(current_user["_id"]) not in project.get("members", [])
    ):
        raise HTTPException(status_code=403, detail="You do not have access to this project")

    task_cursor = database.tasks.find({"project": project_id}).sort("updatedAt", -1).limit(100)
    tasks = [task async for task in task_cursor]
    try:
        plan, metadata = await generate_project_plan(body.goal, project, tasks)
    except APIError as error:
        logger.warning(
            "ai_provider_request_failed",
            extra={"provider": "openai", "error_type": type(error).__name__},
        )
        raise HTTPException(status_code=502, detail="The configured AI provider request failed") from error
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=502, detail="AI response failed validation") from error
    return {"plan": plan.model_dump(), "metadata": metadata}