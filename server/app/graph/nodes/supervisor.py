"""Supervisor node — classifies user intent, extracts slot data, and routes to the correct node."""

import re
from app.graph.state import ConversationState
from app.services.llm_service import chat_completion
from app.utils.logger import get_logger

logger = get_logger(__name__)

# ---------------------------------------------------------------------------
# Intent classification prompt
# ---------------------------------------------------------------------------
# IMPORTANT: The LLM must return EXACTLY one token from the list below.
# We enumerate them explicitly and give examples to prevent the model from
# returning free-form text, adding spaces, or using a synonym.
SYSTEM_PROMPT = """You are a customer support routing classifier. Your ONLY job is to output one of these exact intent labels:

greetings         – hello, hi, how are you, good morning, simple chitchat
order_status      – asking about an order, tracking number, delivery, shipping, where is my order, order ID
troubleshooting   – device not working, technical problem, error, bug, won't turn on, slow, crash
subscription      – billing, payment, plan, subscription, invoice, cancel, upgrade, downgrade, refund
general           – general product questions, policy, pricing, warranty, returns, FAQs
escalate          – angry customer, legal threat, repeated failures, urgent safety issue, ask for manager
clarify           – completely ambiguous, cannot determine any of the above with confidence

Rules:
- Reply with ONLY the single intent keyword. No punctuation, no explanation, no spaces.
- If unsure between two intents, pick the most specific one.
- A message mentioning an order ID (e.g. "100002", "ORD-100002") → order_status
- A message mentioning billing or subscription → subscription
- Do NOT output "order status" (with a space) — output "order_status" (with underscore)

Examples:
"hello there" → greetings
"where is my order 100002" → order_status
"my tablet won't turn on" → troubleshooting
"I want to cancel my plan" → subscription
"what is your warranty policy" → general
"I'm very angry and will sue you" → escalate
"help" → clarify"""


# ---------------------------------------------------------------------------
# Slot extraction helpers
# ---------------------------------------------------------------------------

def _extract_order_id(text: str) -> str | None:
    """Extracts an order ID from user text, handling ORD-XXXXX or bare 5-6 digit numbers."""
    # Explicit ORD- prefix (canonical form)
    m = re.search(r"\bORD[-\s]?(\d{5,8})\b", text, re.IGNORECASE)
    if m:
        return f"ORD-{m.group(1)}"

    # "order ID 100002" / "order # 100002" / "order number 100002"
    m = re.search(r"order\s*(?:id|#|number|num|no\.?|:)?\s*(\d{5,8})\b", text, re.IGNORECASE)
    if m:
        return f"ORD-{m.group(1)}"

    # "ID 100002" by itself when the surrounding context is about orders
    m = re.search(r"\b(?:id|#)\s*(\d{5,8})\b", text, re.IGNORECASE)
    if m:
        return f"ORD-{m.group(1)}"

    return None


def _extract_account_id(text: str) -> str | None:
    """Extracts an account ID from user text."""
    m = re.search(r"\bACC[-\s]?(\d{3,6})\b", text, re.IGNORECASE)
    if m:
        return f"ACC-{m.group(1)}"
    return None


# ---------------------------------------------------------------------------
# Supervisor node
# ---------------------------------------------------------------------------

VALID_INTENTS = frozenset({
    "greetings",
    "order_status",
    "troubleshooting",
    "subscription",
    "general",
    "escalate",
    "clarify",
})


def supervisor_node(state: ConversationState) -> ConversationState:
    """Calls the LLM to classify the user's intent and extracts metadata (slots) from the message text."""

    # 1. Classify Intent via LLM
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": state.current_input},
    ]
    raw_intent = chat_completion(messages, temperature=0.0, max_tokens=20)

    # Normalise: lower-case, strip whitespace/punctuation, replace spaces with underscores
    intent = raw_intent.strip().lower().replace(" ", "_").strip(".")

    # Guard: if the LLM returned something unexpected, fall back to clarify (never rag)
    if intent not in VALID_INTENTS:
        logger.warning(
            "Supervisor: unexpected intent %r (raw=%r) — defaulting to clarify | session=%s",
            intent, raw_intent, state.session_id,
        )
        intent = "clarify"

    # 2. Extract Slots
    slots = dict(state.slots)

    order_id = _extract_order_id(state.current_input)
    if order_id:
        slots["order_id"] = order_id
        logger.info("Extracted order_id slot: %s", order_id)

    account_id = _extract_account_id(state.current_input)
    if account_id:
        slots["account_id"] = account_id
        logger.info("Extracted account_id slot: %s", account_id)

    # 3. If intent is order_status but we have absolutely no identifiers, keep clarify-like
    #    intent so we ask — but we use the order_status node itself which already handles this.

    logger.info(
        "Supervisor routing | intent=%s (raw=%r) | slots=%s | session=%s",
        intent, raw_intent.strip(), slots, state.session_id,
    )
    return state.model_copy(update={"intent": intent, "slots": slots})
