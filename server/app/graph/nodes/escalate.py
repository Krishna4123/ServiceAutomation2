"""Escalate node — creates a support ticket and delivers the handoff message to the user.

This node is TERMINAL: it always creates a ticket and always sets escalated=True.
It never loops back or asks clarifying questions.
"""

from app.graph.state import ConversationState
from app.services.ticket_service import create_ticket
from app.utils.logger import get_logger

logger = get_logger(__name__)


def escalate_node(state: ConversationState) -> ConversationState:
    """Creates a support ticket, sets escalation state, and returns the handoff reply.

    Guaranteed to produce:
      - escalated = True
      - ticket_id = "TKT-XXXXXXXX"
      - escalation_reason populated
      - A human-readable reply with the ticket ID
    """
    logger.info(
        "ESCALATE node invoked | session=%s | pre-set reason=%r",
        state.session_id, state.escalation_reason,
    )

    # Derive a reason from whatever context we have
    reason = (
        state.escalation_reason
        or f"Customer escalation request: {state.current_input[:200]}"
    )

    # Determine priority: if the user has already sent several messages, bump to high
    turn_count = len(state.messages) // 2  # each turn = 1 user + 1 assistant message
    priority = state.escalation_priority
    if turn_count >= 3 and priority == "normal":
        priority = "high"

    # Create the ticket — this always succeeds (mock)
    ticket = create_ticket(
        session_id=state.session_id,
        reason=reason,
        priority=priority,
    )

    reply = (
        f"I'm escalating your case to a human specialist right away. 🎫\n\n"
        f"**Ticket ID: {ticket['ticket_id']}**\n\n"
        f"A member of our support team will contact you shortly. "
        f"You can also email **support@novatech.example.com** quoting your ticket ID for priority handling.\n\n"
        f"Is there anything else I can note for the agent before we hand off?"
    )

    logger.info(
        "Escalation complete | ticket_id=%s | priority=%s | reason=%r | session=%s",
        ticket["ticket_id"], priority, reason, state.session_id,
    )

    return state.model_copy(update={
        "reply": reply,
        "escalated": True,
        "ticket_id": ticket["ticket_id"],
        "escalation_reason": reason,
        "escalation_priority": priority,
        "intent": "escalate",
        "sources": [],  # escalation responses never cite policy docs
    })
