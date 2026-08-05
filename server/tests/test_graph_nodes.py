"""Unit tests for individual LangGraph nodes — tests each node in complete isolation."""

import pytest
from unittest.mock import patch
from app.graph.state import ConversationState


def _make_state(**kwargs) -> ConversationState:
    """Helper to build a minimal ConversationState for testing."""
    defaults = {
        "session_id": "test-session",
        "current_input": "test input",
        "channel": "web",
    }
    defaults.update(kwargs)
    return ConversationState(**defaults)


# ── Supervisor node ────────────────────────────────────────────────────────────

@patch("app.graph.nodes.supervisor.chat_completion", return_value="order_status")
def test_supervisor_routes_order_status(mock_llm):
    from app.graph.nodes.supervisor import supervisor_node
    state = _make_state(current_input="Where is my order ORD-100001?")
    result = supervisor_node(state)
    assert result.intent == "order_status"
    mock_llm.assert_called_once()


@patch("app.graph.nodes.supervisor.chat_completion", return_value="invalid_xyz")
def test_supervisor_defaults_to_general(mock_llm):
    from app.graph.nodes.supervisor import supervisor_node
    state = _make_state(current_input="hello")
    result = supervisor_node(state)
    assert result.intent == "general"


# ── Clarify node ───────────────────────────────────────────────────────────────

@patch("app.graph.nodes.clarify.chat_completion", return_value="Could you clarify what product you mean?")
def test_clarify_node(mock_llm):
    from app.graph.nodes.clarify import clarify_node
    state = _make_state(current_input="it's not working")
    result = clarify_node(state)
    assert "clarify" in result.reply.lower() or len(result.reply) > 0
    assert result.intent == "clarify"


# ── Escalate node ──────────────────────────────────────────────────────────────

def test_escalate_node_creates_ticket():
    from app.graph.nodes.escalate import escalate_node
    state = _make_state(escalation_reason="Customer is very frustrated", escalation_priority="high")
    result = escalate_node(state)
    assert result.escalated is True
    assert result.ticket_id is not None
    assert result.ticket_id.startswith("TKT-")
    assert "ticket" in result.reply.lower()


# ── Order status node ──────────────────────────────────────────────────────────

@patch("app.graph.nodes.order_status.chat_completion", return_value="Your order has been delivered.")
def test_order_status_node_with_order_id(mock_llm):
    from app.graph.nodes.order_status import order_status_node
    state = _make_state(
        current_input="Where is my order?",
        slots={"order_id": "ORD-100001"},
    )
    result = order_status_node(state)
    assert len(result.reply) > 0
    mock_llm.assert_called_once()


# ── RAG node ───────────────────────────────────────────────────────────────────

@patch("app.graph.nodes.rag_node.retrieve", return_value=[
    {"content": "Warranty covers 1 year.", "source": "warranty.md"}
])
@patch("app.graph.nodes.rag_node.chat_completion", return_value="Your warranty is 1 year.")
def test_rag_node(mock_llm, mock_retrieve):
    from app.graph.nodes.rag_node import rag_node
    state = _make_state(current_input="What is the warranty?")
    result = rag_node(state)
    assert "warranty" in result.reply.lower()
    assert "warranty.md" in result.sources
