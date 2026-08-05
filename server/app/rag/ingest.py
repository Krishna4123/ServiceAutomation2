"""RAG ingestion script — loads policy docs, chunks them, embeds via OpenAI-compatible API, and saves a FAISS index.

Run once (or whenever docs change):
    python -m app.rag.ingest
"""

from pathlib import Path
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS

from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

DOCS_DIR = Path(__file__).parent / "documents"
INDEX_PATH = Path(settings.faiss_index_path)


def ingest() -> None:
    """Loads all .md documents, splits them into chunks, and builds/saves a FAISS vector index."""
    logger.info("Starting RAG ingestion from %s", DOCS_DIR)

    loader = DirectoryLoader(
        str(DOCS_DIR),
        glob="**/*.md",
        loader_cls=TextLoader,
        loader_kwargs={"encoding": "utf-8"},
    )
    docs = loader.load()
    logger.info("Loaded %d documents", len(docs))

    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=80)
    chunks = splitter.split_documents(docs)
    logger.info("Created %d chunks", len(chunks))

    embeddings = OpenAIEmbeddings(
        model="text-embedding-3-small",
        openai_api_key=settings.openai_api_key,
        openai_api_base=settings.openai_base_url,
    )

    vector_store = FAISS.from_documents(chunks, embeddings)
    INDEX_PATH.mkdir(parents=True, exist_ok=True)
    vector_store.save_local(str(INDEX_PATH))
    logger.info("FAISS index saved to %s", INDEX_PATH)


if __name__ == "__main__":
    ingest()
