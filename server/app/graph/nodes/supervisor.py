"""Supervisor node — classifies user intent and routes to the correct worker node."""

from app.graph.state import ConversationState
from app.services.llm_service import chat_completion
from app.utils.logger import get_logger

logger = get_logger(__name__)

SYSTEM_PROMPT = """You are a customer support routing assistant. Classify the user message into exactly one intent:
- order_status: asking about an order, tracking, delivery, shipping
- troubleshooting: device problems, technical issues, not working, bugs
- subscription: billing, plan, payment, cancellation, upgrade, downgrade
- general: general product questions, policy, pricing, warranty info
- escalate: angry customer, legal threats, repeated failures, urgent safety issue
- clarify: message is ambiguous and needs more info

Reply with ONLY the intent keyword, nothing else."""


def supervisor_node(state: ConversationState) -> ConversationState:
    """Calls the LLM to classify the user's intent, then updates state.intent for routing."""
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": state.current_input},
    ]
    intent = chat_completion(messages, temperature=0.0, max_tokens=20).strip().lower()

    valid_intents = {"order_status", "troubleshooting", "subscription", "general", "escalate", "clarify"}
    if intent not in valid_intents:
        intent = "general"

    logger.info("Supervisor intent: %s | session=%s", intent, state.session_id)
    return state.model_copy(update={"intent": intent})
