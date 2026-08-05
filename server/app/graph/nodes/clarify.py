"""Clarify node — asks the user for additional information when the message is ambiguous."""

from app.graph.state import ConversationState
from app.services.llm_service import chat_completion
from app.utils.logger import get_logger

logger = get_logger(__name__)

SYSTEM_PROMPT = """You are a friendly customer support assistant. The user's message is unclear or missing information.
Ask a single, short, polite clarifying question to understand what they need.
Do not make assumptions — ask one question only."""


def clarify_node(state: ConversationState) -> ConversationState:
    """Generates a clarifying question when the user's intent is ambiguous."""
    history = state.messages[-6:] if len(state.messages) > 6 else state.messages
    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + history
    messages.append({"role": "user", "content": state.current_input})

    reply = chat_completion(messages, temperature=0.4, max_tokens=150)
    logger.info("Clarify node responding | session=%s", state.session_id)
    return state.model_copy(update={"reply": reply, "intent": "clarify"})
