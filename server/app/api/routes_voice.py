"""Voice route stub — POST /voice/transcribe is a placeholder for future Whisper/STT integration."""

from fastapi import APIRouter, UploadFile, File, HTTPException
from app.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()


@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)) -> dict:
    """[STUB] Accepts an audio file and returns a mock transcription.

    Future implementation: integrate OpenAI Whisper or Google Speech-to-Text here.
    The transcribed text should then be passed to POST /chat.
    """
    if not file.content_type or not file.content_type.startswith("audio/"):
        raise HTTPException(
            status_code=415,
            detail="Unsupported media type. Please upload an audio file (e.g. audio/wav, audio/mp3).",
        )
    filename = file.filename or "upload"
    logger.info("Voice transcribe stub called | filename=%s | content_type=%s", filename, file.content_type)
    # Stub response — replace with real STT call
    return {
        "filename": filename,
        "transcription": "[STUB] Transcription not yet implemented.",
        "note": "Integrate Whisper or Google STT here.",
    }
