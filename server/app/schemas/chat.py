"""Pydantic models for chat request/response payloads and escalation info."""

from typing import Optional, List
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Incoming chat message from the client."""

    session_id: str = Field(..., description="Unique session identifier")
    message: str = Field(..., description="User's message text")
    channel: str = Field(default="web", description="Channel: web | mobile | email")


class EscalationInfo(BaseModel):
    """Details when a conversation is escalated to a human agent."""

    ticket_id: str
    reason: str
    priority: str = "normal"


class ChatResponse(BaseModel):
    """Response returned to the client after processing a chat message."""

    session_id: str
    reply: str
    intent: Optional[str] = None
    escalated: bool = False
    escalation_info: Optional[EscalationInfo] = None
    sources: Optional[List[str]] = Field(default=None, description="RAG source document names")
