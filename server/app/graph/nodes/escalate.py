"""Escalate node — creates a support ticket and composes a handoff message for the user."""

from app.graph.state import ConversationState
from app.services.ticket_service import create_ticket
from app.utils.logger import get_logger

logger = get_logger(__name__)


def escalate_node(state: ConversationState) -> ConversationState:
    """Creates a mock escalation ticket and sets escalation fields on the state."""
    reason = state.escalation_reason or "Customer requested human support"
    ticket = create_ticket(
        session_id=state.session_id,
        reason=reason,
        priority=state.escalation_priority,
    )

    reply = (
        f"I'm sorry you're experiencing difficulties. I've escalated your case to our support team. "
        f"Your ticket ID is **{ticket['ticket_id']}** — a specialist will reach out to you shortly. "
        f"You can also email us at support@novatech.example.com with your ticket ID for updates."
    )

    logger.info("Escalation complete | ticket_id=%s | session=%s", ticket["ticket_id"], state.session_id)
    return state.model_copy(update={
        "reply": reply,
        "escalated": True,
        "ticket_id": ticket["ticket_id"],
        "intent": "escalate",
    })
