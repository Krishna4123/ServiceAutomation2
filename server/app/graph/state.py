"""ConversationState — the shared LangGraph state schema passed between all nodes."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ConversationState(BaseModel):
    """Typed state object that flows through every node in the LangGraph graph."""

    # Identity
    session_id: str
    channel: str = "web"

    # Conversation
    messages: List[Dict[str, str]] = Field(default_factory=list)
    current_input: str = ""

    # Routing
    intent: Optional[str] = None  # order_status | troubleshooting | subscription | general | escalate | clarify
    slots: Dict[str, Any] = Field(default_factory=dict)
    missing_slots: List[str] = Field(default_factory=list)

    # Response
    reply: str = ""
    sources: List[str] = Field(default_factory=list)

    # Escalation
    escalated: bool = False
    escalation_reason: Optional[str] = None
    ticket_id: Optional[str] = None
    escalation_priority: str = "normal"
