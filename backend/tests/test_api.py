import pytest
from httpx import ASGITransport, AsyncClient

from app import auth
from app.main import app


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


def test_password_hash_and_token_round_trip(monkeypatch):
    monkeypatch.setattr(auth, "JWT_SECRET", "test-secret-that-is-long-enough-for-hs256")
    hashed_password = auth.hash_password("password123")
    token = auth.create_access_token({"id": "user-id"})

    assert auth.verify_password("password123", hashed_password)
    assert auth.verify_token(token)["id"] == "user-id"