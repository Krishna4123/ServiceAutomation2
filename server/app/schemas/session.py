"""Pydantic models for session management endpoints."""

from typing import List, Optional
from pydantic import BaseModel, Field


class SessionStartResponse(BaseModel):
    """Returned when a new session is created."""

    session_id: str
    message: str = "Session started successfully."


class HistoryEntry(BaseModel):
    """A single turn in the conversation history."""

    role: str = Field(..., description="user | assistant")
    content: str
    timestamp: Optional[str] = None


class HistoryResponse(BaseModel):
    """Full conversation history for a given session."""

    session_id: str
    history: List[HistoryEntry]
