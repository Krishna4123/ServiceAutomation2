"""Order status node — looks up mock order data and generates a plain-language status response.

This node NEVER touches the RAG/FAISS index. It only uses mock_orders.json via db.py.
"""

import json
from app.graph.state import ConversationState
from app.data.db import get_order_by_id, get_orders_by_account
from app.services.llm_service import chat_completion
from app.utils.logger import get_logger

logger = get_logger(__name__)

SYSTEM_PROMPT = """You are a customer support agent helping with order tracking and status.
You have been given the customer's order data in JSON format.
Write a friendly, concise status update — include the order ID, product name, current status, and (if shipped) tracking number.
If no order data was found, tell the customer clearly that you couldn't find their order and ask them to double-check their order ID.
Do NOT mention policy documents, warranties, or any other unrelated topics."""

NO_ID_REPLY = (
    "I'd be happy to check your order status! To look it up, I'll need your order ID "
    "(usually in the format ORD-XXXXXX, or just the 6-digit number). "
    "You can find it in your confirmation email. Could you share that with me?"
)


def order_status_node(state: ConversationState) -> ConversationState:
    """Fetches order info from mock DB and returns a formatted status update.

    This node is the ONLY handler for order_status intent — it never calls RAG.
    """
    logger.info(
        "ORDER_STATUS node invoked | session=%s | slots=%s | input=%r",
        state.session_id, state.slots, state.current_input,
    )

    order_id = state.slots.get("order_id")
    account_id = state.slots.get("account_id")

    # ── Case 1: No identifiers at all — ask for them ──────────────────────────
    if not order_id and not account_id:
        logger.info("Order status: no identifiers in slots — asking customer | session=%s", state.session_id)
        return state.model_copy(update={"reply": NO_ID_REPLY, "sources": []})

    # ── Case 2: Look up by order ID ───────────────────────────────────────────
    order_data = None
    if order_id:
        order_data = get_order_by_id(order_id)
        logger.info(
            "Order lookup | order_id=%s | found=%s | session=%s",
            order_id, order_data is not None, state.session_id,
        )

    # ── Case 3: Fall back to account's most recent order ─────────────────────
    if order_data is None and account_id:
        orders = get_orders_by_account(account_id)
        order_data = orders[-1] if orders else None
        logger.info(
            "Order lookup by account | account_id=%s | found=%s | session=%s",
            account_id, order_data is not None, state.session_id,
        )

    # ── Build context and generate reply ─────────────────────────────────────
    if order_data:
        context = json.dumps(order_data, indent=2)
    else:
        # Give the LLM explicit "not found" context
        context = (
            f"No order found for the provided identifier(s): "
            f"order_id={order_id!r}, account_id={account_id!r}"
        )

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"Order data:\n{context}\n\nCustomer message: {state.current_input}"},
    ]
    reply = chat_completion(messages, temperature=0.2, max_tokens=300)

    logger.info(
        "Order status node replied | order_id=%s | found=%s | session=%s",
        order_id, order_data is not None, state.session_id,
    )
    # Explicitly clear sources — order status never cites policy documents
    return state.model_copy(update={"reply": reply, "sources": []})
