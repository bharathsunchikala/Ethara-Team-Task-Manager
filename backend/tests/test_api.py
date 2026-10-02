import json
from types import SimpleNamespace

import pytest
from bson import ObjectId
from fastapi import HTTPException
from httpx import ASGITransport, AsyncClient
from starlette.requests import Request

from app import auth
from app.ai import planner
from app.auth import get_current_user
from app.main import app
from app.routers.ai import ProjectPlanRequest, create_project_plan


@pytest.mark.asyncio
async def test_health_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_task_routes_require_authentication():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/tasks")

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_ai_project_planner_requires_authentication():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/v1/ai/project-plan",
            json={"project_id": "507f1f77bcf86cd799439011", "goal": "Plan a new project milestone"},
        )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_demo_planner_returns_valid_grounded_plan():
    project = {"name": "Payments"}
    tasks = [
        {
            "_id": "task-1",
            "title": "Build payment dashboard",
            "description": "Report payment analytics and revenue",
            "status": "Todo",
            "priority": "High",
        }
    ]

    plan, metadata = await planner.generate_project_plan(
        "Build a payment analytics dashboard", project, tasks, provider="demo"
    )

    assert plan.title == "Payments delivery plan"
    assert metadata["provider"] == "demo"
    assert metadata["context_task_count"] == 1
    allowed_ids = {item["id"] for item in metadata["evidence"]}
    assert all(
        source_id in allowed_ids
        for milestone in plan.milestones
        for task in milestone.tasks
        for source_id in task.source_task_ids
    )


@pytest.mark.asyncio
async def test_demo_planner_handles_long_goal_and_empty_vocabulary():
    plan, metadata = await planner.generate_project_plan(
        "make it better " * 100,
        {"name": "A" * 200},
        [{"_id": "task-2", "title": "the and of", "description": "to for a"}],
        provider="demo",
    )

    assert len(plan.summary) <= 600
    assert len(plan.title) <= 120
    assert metadata["context_task_count"] == 1


@pytest.mark.asyncio
async def test_openai_provider_requires_api_key(monkeypatch):
    monkeypatch.setattr(planner, "OPENAI_API_KEY", "")

    with pytest.raises(RuntimeError, match="OPENAI_API_KEY"):
        await planner.generate_project_plan(
            "Plan a new project milestone", {"name": "Example"}, [], provider="openai"
        )


@pytest.mark.asyncio
@pytest.mark.parametrize("source_id, should_pass", [("task-1", True), ("invented-task", False)])
async def test_openai_output_is_schema_checked_and_citations_are_grounded(
    monkeypatch, source_id, should_pass
):
    generated = {
        "title": "Payments delivery plan",
        "summary": "A short grounded plan for the payments project goal.",
        "milestones": [
            {
                "title": "Ship payments",
                "outcome": "Release and verify a payment analytics dashboard.",
                "tasks": [
                    {
                        "title": "Implement reporting",
                        "description": "Add revenue reporting for payment transactions.",
                        "priority": "High",
                        "source_task_ids": [source_id],
                    }
                ],
            }
        ],
        "risks": [],
        "open_questions": [],
    }

    class FakeCompletions:
        async def create(self, **kwargs):
            assert kwargs["response_format"] == {"type": "json_object"}
            return SimpleNamespace(
                choices=[SimpleNamespace(message=SimpleNamespace(content=json.dumps(generated)))],
                usage=SimpleNamespace(prompt_tokens=25, completion_tokens=40),
            )

    class FakeClient:
        def __init__(self, **kwargs):
            self.chat = SimpleNamespace(completions=FakeCompletions())

        async def close(self):
            return None

    monkeypatch.setattr(planner, "OPENAI_API_KEY", "test-key")
    monkeypatch.setattr(planner, "AsyncOpenAI", FakeClient)
    tasks = [
        {
            "_id": "task-1",
            "title": "Payment analytics",
            "description": "Revenue dashboard for payment transactions",
        }
    ]

    if should_pass:
        plan, metadata = await planner.generate_project_plan(
            "Build payment revenue dashboard", {"name": "Payments"}, tasks, provider="openai"
        )
        assert plan.milestones[0].tasks[0].source_task_ids == ["task-1"]
        assert metadata["prompt_tokens"] == 25
    else:
        with pytest.raises(ValueError, match="outside the retrieved evidence"):
            await planner.generate_project_plan(
                "Build payment revenue dashboard", {"name": "Payments"}, tasks, provider="openai"
            )


@pytest.mark.asyncio
async def test_project_planner_rejects_non_member_before_retrieving_tasks(monkeypatch):
    project_id = ObjectId()

    class Projects:
        async def find_one(self, query):
            return {"_id": project_id, "members": []}

    class Tasks:
        def find(self, query):
            raise AssertionError("Task retrieval must not run for a non-member")

    monkeypatch.setattr(
        app.state,
        "db",
        SimpleNamespace(projects=Projects(), tasks=Tasks()),
        raising=False,
    )
    request = Request({"type": "http", "app": app, "headers": [], "method": "POST", "path": "/"})

    with pytest.raises(HTTPException) as error:
        await create_project_plan(
            ProjectPlanRequest(project_id=str(project_id), goal="Plan a new delivery milestone"),
            request,
            {"_id": str(ObjectId()), "role": "Member"},
        )

    assert error.value.status_code == 403


@pytest.mark.asyncio
async def test_project_planner_returns_grounded_plan_for_project_member(monkeypatch):
    project_id = ObjectId()
    member_id = ObjectId()
    project = {"_id": project_id, "name": "Payments", "description": "Revenue reporting", "members": [member_id]}
    task = {
        "_id": ObjectId(),
        "project": project_id,
        "title": "Payment reporting",
        "description": "Build revenue analytics dashboard",
        "status": "Todo",
        "priority": "High",
    }

    class Projects:
        async def find_one(self, query):
            return project if query["_id"] == project_id else None

    class TaskCursor:
        def sort(self, *args):
            return self

        def limit(self, count):
            return self

        async def __aiter__(self):
            yield task

    class Tasks:
        def find(self, query):
            assert query == {"project": project_id}
            return TaskCursor()

    monkeypatch.setattr(
        app.state,
        "db",
        SimpleNamespace(projects=Projects(), tasks=Tasks()),
        raising=False,
    )
    monkeypatch.setitem(
        app.dependency_overrides,
        get_current_user,
        lambda: {"_id": str(member_id), "role": "Member"},
    )

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/v1/ai/project-plan",
            json={"project_id": str(project_id), "goal": "Launch payment analytics and revenue reporting"},
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["metadata"]["provider"] == "demo"
    assert payload["metadata"]["evidence"][0]["id"] == str(task["_id"])


def test_password_hash_and_token_round_trip(monkeypatch):
    monkeypatch.setattr(auth, "JWT_SECRET", "test-secret-that-is-long-enough-for-hs256")
    hashed_password = auth.hash_password("password123")
    token = auth.create_access_token({"id": "user-id"})

    assert auth.verify_password("password123", hashed_password)
    assert auth.verify_token(token)["id"] == "user-id"