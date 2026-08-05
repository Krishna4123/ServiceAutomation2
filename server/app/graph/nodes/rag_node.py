"""RAG node — retrieves relevant policy documents from FAISS and generates a grounded answer."""

from app.graph.state import ConversationState
from app.rag.retriever import retrieve
from app.services.llm_service import chat_completion
from app.utils.logger import get_logger

logger = get_logger(__name__)

SYSTEM_PROMPT = """You are a helpful customer support assistant. Answer the user's question using ONLY the provided context.
If the context does not contain enough information, say so honestly and offer to escalate.
Be concise, friendly, and precise. Cite the source document name when relevant."""


def rag_node(state: ConversationState) -> ConversationState:
    """Retrieves policy docs via FAISS and generates a grounded LLM response."""
    product = state.slots.get("product")
    retrieval_query = f"{product} {state.current_input}" if product else state.current_input
    
    chunks = retrieve(retrieval_query, k=4)
    sources = list({c["source"] for c in chunks})
    context = "\n\n".join(f"[{c['source']}]\n{c['content']}" for c in chunks)

    user_content = f"Context:\n{context}\n\nQuestion: {state.current_input}"
    if product:
        user_content = f"Product context: The customer is asking specifically about the product: {product}.\n\n" + user_content

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_content},
    ]
    reply = chat_completion(messages, temperature=0.2, max_tokens=512)
    logger.info("RAG node replied | product=%s | sources=%s | session=%s", product, sources, state.session_id)
    return state.model_copy(update={"reply": reply, "sources": sources})
