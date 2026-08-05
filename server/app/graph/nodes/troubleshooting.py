"""Troubleshooting node — retrieves device-specific steps from RAG docs and guides the user."""

from app.graph.state import ConversationState
from app.rag.retriever import retrieve
from app.services.llm_service import chat_completion
from app.utils.logger import get_logger

logger = get_logger(__name__)

SYSTEM_PROMPT = """You are a technical support specialist. Use the troubleshooting steps below to help the customer.
Provide clear, numbered steps. If the issue requires escalation (physical damage, data loss, repeated failures), say so."""


def troubleshooting_node(state: ConversationState) -> ConversationState:
    """Retrieves troubleshooting context and generates a step-by-step support reply."""
    chunks = retrieve(f"troubleshooting {state.current_input}", k=4)
    sources = list({c["source"] for c in chunks})
    context = "\n\n".join(f"{c['content']}" for c in chunks)

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"Troubleshooting guide:\n{context}\n\nIssue: {state.current_input}"},
    ]
    reply = chat_completion(messages, temperature=0.2, max_tokens=500)
    logger.info("Troubleshooting node replied | session=%s", state.session_id)
    return state.model_copy(update={"reply": reply, "sources": sources})
