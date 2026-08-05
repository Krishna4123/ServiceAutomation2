"""Loads the FAISS index from disk and exposes a retriever function for graph nodes to call."""

from functools import lru_cache
from pathlib import Path
from typing import List

from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS

from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

INDEX_PATH = Path(settings.faiss_index_path)


@lru_cache(maxsize=1)
def _get_vector_store() -> FAISS:
    """Loads and caches the FAISS vector store from disk."""
    if not INDEX_PATH.exists():
        raise FileNotFoundError(
            f"FAISS index not found at '{INDEX_PATH}'. "
            "Run `python -m app.rag.ingest` first."
        )
    embeddings = OpenAIEmbeddings(
        model="text-embedding-3-small",
        openai_api_key=settings.openai_api_key,
        openai_api_base=settings.openai_base_url,
    )
    store = FAISS.load_local(str(INDEX_PATH), embeddings, allow_dangerous_deserialization=True)
    logger.info("FAISS index loaded from %s", INDEX_PATH)
    return store


def retrieve(query: str, k: int = 4) -> List[dict]:
    """Returns the top-k relevant document chunks for a given query.

    Args:
        query: The user's question or topic.
        k: Number of top chunks to retrieve.

    Returns:
        List of dicts with 'content' and 'source' keys.
    """
    store = _get_vector_store()
    docs = store.similarity_search(query, k=k)
    results = []
    for doc in docs:
        results.append({
            "content": doc.page_content,
            "source": Path(doc.metadata.get("source", "unknown")).name,
        })
    logger.debug("Retrieved %d chunks for query: %s", len(results), query[:60])
    return results
