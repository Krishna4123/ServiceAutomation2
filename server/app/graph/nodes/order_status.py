"""Order status node — looks up mock order data and generates a plain-language status response."""

import json
from app.graph.state import ConversationState
from app.data.db import get_order_by_id, get_orders_by_account
from app.services.llm_service import chat_completion
from app.utils.logger import get_logger

logger = get_logger(__name__)

SYSTEM_PROMPT = """You are a customer support agent. Given order data (JSON), write a friendly, concise status update for the customer.
If no order data is provided, ask the customer for their order ID or account ID."""


def order_status_node(state: ConversationState) -> ConversationState:
    """Fetches order info from mock DB and returns a formatted status update."""
    order_id = state.slots.get("order_id")
    account_id = state.slots.get("account_id")

    order_data = None
    if order_id:
        order_data = get_order_by_id(order_id)
    elif account_id:
        orders = get_orders_by_account(account_id)
        order_data = orders[-1] if orders else None  # most recent

    context = json.dumps(order_data, indent=2) if order_data else "No order found."
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"Order data:\n{context}\n\nCustomer message: {state.current_input}"},
    ]
    reply = chat_completion(messages, temperature=0.2, max_tokens=300)
    logger.info("Order status node replied | order_id=%s | session=%s", order_id, state.session_id)
    return state.model_copy(update={"reply": reply})
