"""Supervisor node — classifies user intent, extracts slot data, and routes to the correct node."""

import re
from app.graph.state import ConversationState
from app.services.llm_service import chat_completion
from app.utils.logger import get_logger

logger = get_logger(__name__)

# ---------------------------------------------------------------------------
# Intent classification prompt
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """You are a customer support routing classifier. Your ONLY job is to output one of these exact intent labels:

greetings         – hello, hi, how are you, good morning, simple chitchat
order_status      – asking about an order, tracking number, delivery, shipping, where is my order, order ID
troubleshooting   – device not working, technical problem, error, bug, won't turn on, slow, crash
subscription      – billing, payment, plan, subscription, invoice, cancel, upgrade, downgrade, refund
general           – general product questions, policy, pricing, warranty, returns, FAQs
warranty          – warranty info, warranty policy, limited manufacturer warranty coverage
pricing           – pricing info, price lists, cost, how much does it cost
subscription_policy – rules about subscription cancellation, refund policy, plan details
escalate          – angry customer, legal threat, repeated failures, urgent safety issue, ask for manager
clarify           – completely ambiguous, cannot determine any of the above with confidence

Rules:
- Reply with ONLY the single intent keyword. No punctuation, no explanation, no spaces.
- If unsure between two intents, pick the most specific one.
- A message mentioning an order ID (e.g. "100002", "ORD-100002") → order_status
- A message mentioning warranty, warranty policy, returns policy → warranty
- A message mentioning pricing, costs → pricing
- A message mentioning billing or subscription → subscription
- Do NOT output "order status" (with a space) — output "order_status" (with underscore)

Examples:
"hello there" → greetings
"where is my order 100002" → order_status
"my tablet won't turn on" → troubleshooting
"I want to cancel my plan" → subscription
"what is your warranty policy" → warranty
"how much does NovaPro cost" → pricing
"I'm very angry and will sue you" → escalate
"help" → clarify"""


# ---------------------------------------------------------------------------
# Slot extraction helpers
# ---------------------------------------------------------------------------

def _extract_order_id(text: str) -> str | None:
    """Extracts an order ID from user text, handling ORD-XXXXX or bare 5-6 digit numbers."""
    m = re.search(r"\bORD[-\s]?(\d{5,8})\b", text, re.IGNORECASE)
    if m:
        return f"ORD-{m.group(1)}"

    m = re.search(r"order\s*(?:id|#|number|num|no\.?|:)?\s*(\d{5,8})\b", text, re.IGNORECASE)
    if m:
        return f"ORD-{m.group(1)}"

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


def _extract_product_name(text: str) -> str | None:
    """Extracts known product names from text to help ground RAG answers."""
    products = [
        "NovaPro Wireless Headphones",
        "NovaPro",
        "AuraTab 10 Inch Tablet",
        "AuraTab",
        "ZenStream 4K Streaming Stick",
        "ZenStream",
        "PulseWatch Gen 3",
        "PulseWatch",
        "CloudSync Smart Speaker",
        "CloudSync"
    ]
    for p in products:
        if re.search(rf"\b{re.escape(p)}\b", text, re.IGNORECASE):
            return p
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
    "warranty",
    "warranty_info",
    "warranty_policy",
    "pricing",
    "subscription_policy",
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
    raw_intent = chat_completion(messages, temperature=0.0, max_tokens=150)

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

    product = _extract_product_name(state.current_input)
    if product:
        slots["product"] = product
        logger.info("Extracted product slot: %s", product)

    # 3. Slot constraints check
    missing_slots = []
    if intent == "order_status":
        if slots.get("order_id") is not None:
            missing_slots = []
        else:
            missing_slots = ["order_id"]
            intent = "clarify"

    # Print debug log exactly as requested
    print(f"Message: '{state.current_input}'")
    print(f"Extracted intent: {intent}")
    print(f"Extracted slots: {slots}")
    print(f"Missing slots: {missing_slots}")

    logger.info(
        "Supervisor routing | intent=%s (raw=%r) | slots=%s | session=%s",
        intent, raw_intent.strip(), slots, state.session_id,
    )
    return state.model_copy(update={
        "intent": intent,
        "slots": slots,
        "missing_slots": missing_slots,
    })
