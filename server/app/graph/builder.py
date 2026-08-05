"""Builds and compiles the LangGraph StateGraph; exposes `run_graph()` as the single call entry point."""

from langgraph.graph import StateGraph, END

from app.graph.state import ConversationState
from app.graph.nodes.supervisor import supervisor_node
from app.graph.nodes.clarify import clarify_node
from app.graph.nodes.escalate import escalate_node
from app.graph.nodes.rag_node import rag_node
from app.graph.nodes.order_status import order_status_node
from app.graph.nodes.troubleshooting import troubleshooting_node
from app.graph.nodes.subscription import subscription_node
from app.schemas.chat import ChatResponse, EscalationInfo
from app.services.session_store import get_session, upsert_session, create_session
from app.utils.logger import get_logger

logger = get_logger(__name__)


# ── Intent router ─────────────────────────────────────────────────────────────

def _route_intent(state: ConversationState) -> str:
    """Conditional edge: routes to the appropriate worker node based on state.intent."""
    return {
        "order_status": "order_status",
        "troubleshooting": "troubleshooting",
        "subscription": "subscription",
        "general": "rag",
        "escalate": "escalate",
        "clarify": "clarify",
    }.get(state.intent or "general", "rag")


# ── Graph construction ─────────────────────────────────────────────────────────

def _build_graph() -> StateGraph:
    """Constructs the LangGraph StateGraph with all nodes and edges."""
    builder = StateGraph(ConversationState)

    # Nodes
    builder.add_node("supervisor", supervisor_node)
    builder.add_node("clarify", clarify_node)
    builder.add_node("escalate", escalate_node)
    builder.add_node("rag", rag_node)
    builder.add_node("order_status", order_status_node)
    builder.add_node("troubleshooting", troubleshooting_node)
    builder.add_node("subscription", subscription_node)

    # Entry point
    builder.set_entry_point("supervisor")

    # Conditional routing from supervisor
    builder.add_conditional_edges(
        "supervisor",
        _route_intent,
        {
            "clarify": "clarify",
            "escalate": "escalate",
            "rag": "rag",
            "order_status": "order_status",
            "troubleshooting": "troubleshooting",
            "subscription": "subscription",
        },
    )

    # All worker nodes finish at END
    for node in ["clarify", "escalate", "rag", "order_status", "troubleshooting", "subscription"]:
        builder.add_edge(node, END)

    return builder


# Compiled graph singleton
_compiled_graph = _build_graph().compile()


# ── Public API ─────────────────────────────────────────────────────────────────

def run_graph(session_id: str, message: str, channel: str = "web") -> ChatResponse:
    """Runs the full LangGraph pipeline for a given session and user message.

    Args:
        session_id: The active session identifier.
        message: The user's latest message.
        channel: The channel the message came from (web | mobile | email).

    Returns:
        A fully populated ChatResponse ready to send back to the client.
    """
    # Load or create session state
    stored = get_session(session_id)
    if stored is None:
        stored = create_session(session_id)

    # Build current ConversationState
    state = ConversationState(
        session_id=session_id,
        channel=channel,
        messages=stored.get("messages", []),
        current_input=message,
        slots=stored.get("slots", {}),
        intent=stored.get("intent"),
    )

    logger.info("Running graph | session=%s | message_len=%d", session_id, len(message))

    # Invoke the compiled graph
    result: ConversationState = _compiled_graph.invoke(state)

    # Append turn to history
    updated_messages = list(result.messages) + [
        {"role": "user", "content": message},
        {"role": "assistant", "content": result.reply},
    ]

    # Persist updated state
    upsert_session(session_id, {
        **stored,
        "messages": updated_messages,
        "intent": result.intent,
        "slots": result.slots,
        "escalated": result.escalated,
    })

    # Build escalation info if needed
    escalation_info = None
    if result.escalated and result.ticket_id:
        escalation_info = EscalationInfo(
            ticket_id=result.ticket_id,
            reason=result.escalation_reason or "Escalated to human support",
            priority=result.escalation_priority,
        )

    return ChatResponse(
        session_id=session_id,
        reply=result.reply,
        intent=result.intent,
        escalated=result.escalated,
        escalation_info=escalation_info,
        sources=result.sources or None,
    )
