"""Integration tests for the /chat and /session endpoints using FastAPI TestClient."""

import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


@pytest.fixture
def mock_run_graph():
    """Patches run_graph so tests never call the real LLM."""
    from app.schemas.chat import ChatResponse
    mock_response = ChatResponse(
        session_id="test-session-001",
        reply="Your order ORD-100001 has been delivered.",
        intent="order_status",
        escalated=False,
    )
    with patch("app.api.routes_chat.run_graph", return_value=mock_response) as mock:
        yield mock


def test_health_endpoint():
    """GET /health should return 200 with status ok."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_session_start():
    """POST /session/start should return a new session_id."""
    response = client.post("/session/start")
    assert response.status_code == 200
    data = response.json()
    assert "session_id" in data
    assert len(data["session_id"]) > 0


def test_chat_endpoint(mock_run_graph):
    """POST /chat should return a ChatResponse when run_graph is mocked."""
    payload = {
        "session_id": "test-session-001",
        "message": "Where is my order?",
        "channel": "web",
    }
    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["session_id"] == "test-session-001"
    assert "reply" in data
    assert data["intent"] == "order_status"
    mock_run_graph.assert_called_once_with(
        session_id="test-session-001",
        message="Where is my order?",
        channel="web",
    )


def test_session_history_not_found():
    """GET /session/{id}/history should return 404 for unknown session."""
    response = client.get("/session/nonexistent-session-xyz/history")
    assert response.status_code == 404


def test_session_history_after_start():
    """GET /session/{id}/history should return empty history for a new session."""
    start = client.post("/session/start")
    session_id = start.json()["session_id"]
    hist = client.get(f"/session/{session_id}/history")
    assert hist.status_code == 200
    assert hist.json()["session_id"] == session_id
    assert hist.json()["history"] == []
