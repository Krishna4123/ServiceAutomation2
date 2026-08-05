"""Chat route — POST /chat delegates entirely to the LangGraph pipeline via run_graph()."""

from fastapi import APIRouter, HTTPException
from app.schemas.chat import ChatRequest, ChatResponse
from app.graph.builder import run_graph
from app.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """Accepts a user message and returns an AI-generated response from the multi-agent graph.

    - Delegates all logic to `run_graph()` — no business logic lives here.
    - Automatically handles session state persistence internally.
    """
    try:
        logger.info("POST /chat | session=%s | channel=%s", request.session_id, request.channel)
        response = run_graph(
            session_id=request.session_id,
            message=request.message,
            channel=request.channel,
        )
        return response
    except Exception as exc:
        logger.error("Chat endpoint error | session=%s | error=%s", request.session_id, str(exc))
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(exc)}")
