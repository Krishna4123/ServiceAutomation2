"""FastAPI application entrypoint — creates the app, wires CORS, and includes all routers."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes_chat import router as chat_router
from app.api.routes_session import router as session_router
from app.api.routes_voice import router as voice_router
from app.utils.logger import get_logger

logger = get_logger(__name__)

app = FastAPI(
    title="AI Customer Success Platform",
    description="Multi-agent AI backend powered by LangGraph, Gemini 2.5 Flash, and FAISS RAG.",
    version="1.0.0",
)

# ── CORS (allow all origins for development) ──────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(chat_router, prefix="/chat", tags=["Chat"])
app.include_router(session_router, prefix="/session", tags=["Session"])
app.include_router(voice_router, prefix="/voice", tags=["Voice"])


@app.get("/health", tags=["Health"])
async def health_check():
    """Returns a simple liveness probe response."""
    return {"status": "ok"}


@app.on_event("startup")
async def startup_event():
    logger.info("AI Customer Success Platform started successfully.")
