"""Greetings node — responds to simple chitchat, greetings, and generic conversation."""

from app.graph.state import ConversationState
from app.services.llm_service import chat_completion
from app.utils.logger import get_logger

logger = get_logger(__name__)

SYSTEM_PROMPT = """You are a polite, friendly AI customer support agent for NovaTech.
Acknowledge the user's greeting, say hello back, and ask how you can assist them with their orders, devices, subscriptions, or policies today.
Keep the response brief, friendly, and helpful."""


def greetings_node(state: ConversationState) -> ConversationState:
    """Generates a friendly response to greetings and conversational prompts."""
    # Slice last 4 messages to maintain brief context
    history = state.messages[-4:] if len(state.messages) > 4 else state.messages
    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + history
    messages.append({"role": "user", "content": state.current_input})

    reply = chat_completion(messages, temperature=0.5, max_tokens=150)
    logger.info("Greetings node replied | session=%s", state.session_id)
    return state.model_copy(update={"reply": reply})
