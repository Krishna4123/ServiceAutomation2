"""Ticket service — generates mock escalation ticket IDs and logs escalation summaries."""

import uuid
from datetime import datetime
from app.utils.logger import get_logger

logger = get_logger(__name__)


def create_ticket(session_id: str, reason: str, priority: str = "normal") -> dict:
    """Generates a mock support ticket for an escalated conversation.

    Args:
        session_id: The session being escalated.
        reason: Human-readable reason for escalation.
        priority: Ticket priority level (low | normal | high | critical).

    Returns:
        A dict with ticket_id, session_id, reason, priority, and created_at.
    """
    ticket = {
        "ticket_id": f"TKT-{uuid.uuid4().hex[:8].upper()}",
        "session_id": session_id,
        "reason": reason,
        "priority": priority,
        "created_at": datetime.utcnow().isoformat(),
    }
    logger.info(
        "Escalation ticket created | ticket_id=%s | session_id=%s | reason=%s",
        ticket["ticket_id"],
        session_id,
        reason,
    )
    return ticket
