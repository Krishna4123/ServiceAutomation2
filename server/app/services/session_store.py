"""In-memory session store — maps session_id to ConversationState; swap for Redis in production."""

from typing import Dict, Optional
from app.utils.logger import get_logger

logger = get_logger(__name__)

# Simple dict acting as in-memory store: { session_id: state_dict }
_store: Dict[str, dict] = {}


def create_session(session_id: str) -> dict:
    """Initializes a new empty session and persists it to the store."""
    initial_state = {
        "session_id": session_id,
        "messages": [],
        "intent": None,
        "escalated": False,
        "escalation_info": None,
        "sources": [],
        "slots": {},
    }
    _store[session_id] = initial_state
    logger.info("Session created | session_id=%s", session_id)
    return initial_state


def get_session(session_id: str) -> Optional[dict]:
    """Returns the state dict for session_id, or None if not found."""
    return _store.get(session_id)


def upsert_session(session_id: str, state: dict) -> None:
    """Saves or updates the state for session_id."""
    _store[session_id] = state
    logger.debug("Session upserted | session_id=%s", session_id)


def delete_session(session_id: str) -> None:
    """Removes a session from the store."""
    _store.pop(session_id, None)
    logger.info("Session deleted | session_id=%s", session_id)
