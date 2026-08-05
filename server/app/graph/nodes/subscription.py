"""Subscription node — handles billing/plan queries using RAG policy docs and account data."""

import json
from app.graph.state import ConversationState
from app.data.db import get_account_by_id
from app.rag.retriever import retrieve
from app.services.llm_service import chat_completion
from app.utils.logger import get_logger

logger = get_logger(__name__)

SYSTEM_PROMPT = """You are a billing and subscription support specialist. Use the plan policy and account info below to help.
Be empathetic. For cancellations or refund requests, confirm the customer's intent before describing the process."""


def subscription_node(state: ConversationState) -> ConversationState:
    """Handles subscription/billing queries using account data and RAG policy context."""
    account_id = state.slots.get("account_id")
    account_data = get_account_by_id(account_id) if account_id else None
    account_ctx = json.dumps(account_data, indent=2) if account_data else "Account info not provided."

    chunks = retrieve(f"subscription billing plan {state.current_input}", k=3)
    sources = list({c["source"] for c in chunks})
    policy_ctx = "\n\n".join(c["content"] for c in chunks)

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"Account info:\n{account_ctx}\n\n"
                f"Policy:\n{policy_ctx}\n\n"
                f"Customer message: {state.current_input}"
            ),
        },
    ]
    reply = chat_completion(messages, temperature=0.3, max_tokens=400)
    logger.info("Subscription node replied | account_id=%s | session=%s", account_id, state.session_id)
    return state.model_copy(update={"reply": reply, "sources": sources})
