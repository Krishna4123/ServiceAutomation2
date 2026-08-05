"""Session routes — POST /session/start creates a session; GET /session/{id}/history retrieves it."""

import uuid
from fastapi import APIRouter, HTTPException
from app.schemas.session import SessionStartResponse, HistoryResponse, HistoryEntry
from app.services.session_store import create_session, get_session
from app.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()


@router.post("/start", response_model=SessionStartResponse)
async def start_session() -> SessionStartResponse:
    """Creates a new conversation session and returns its unique session_id."""
    session_id = str(uuid.uuid4())
    create_session(session_id)
    logger.info("New session started | session_id=%s", session_id)
    return SessionStartResponse(session_id=session_id)


@router.get("/{session_id}/history", response_model=HistoryResponse)
async def get_history(session_id: str) -> HistoryResponse:
    """Returns the full conversation history for the given session_id."""
    session = get_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")

    history = [
        HistoryEntry(role=msg["role"], content=msg["content"])
        for msg in session.get("messages", [])
    ]
    return HistoryResponse(session_id=session_id, history=history)
