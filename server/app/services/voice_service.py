"""Voice service — thin wrappers around Whisper STT and gpt-4o-mini-tts TTS using the shared OpenAI client."""

from app.services.llm_service import _client
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)


def transcribe_audio(audio_bytes: bytes, filename: str = "audio.webm") -> str:
    """Transcribes audio bytes using Whisper via the OpenAI-compatible endpoint.

    Args:
        audio_bytes: Raw audio content (webm, wav, mp3, m4a, etc.).
        filename: Original filename with extension — used to hint the format to the API.

    Returns:
        Transcribed text string.

    Raises:
        Exception: Propagates any API error to the caller for HTTP error mapping.
    """
    logger.info("Transcribing audio | filename=%s | size=%d bytes", filename, len(audio_bytes))
    response = _client.audio.transcriptions.create(
        model=settings.stt_model,
        file=(filename, audio_bytes),
    )
    text = response.text.strip()
    logger.info("Transcription complete | text_length=%d", len(text))
    return text


def synthesize_speech(text: str, voice: str = "alloy") -> bytes:
    """Synthesizes speech from text using gpt-4o-mini-tts via the OpenAI-compatible endpoint.

    Args:
        text: The text to convert to speech (markdown stripped by caller if desired).
        voice: Voice ID — alloy, echo, fable, onyx, nova, shimmer.

    Returns:
        Raw MP3 audio bytes.

    Raises:
        Exception: Propagates any API error to the caller for HTTP error mapping.
    """
    logger.info("Synthesizing speech | model=%s | voice=%s | text_length=%d", settings.tts_model, voice, len(text))
    response = _client.audio.speech.create(
        model=settings.tts_model,
        voice=voice,
        input=text,
    )
    audio_bytes = response.content
    logger.info("TTS complete | audio_size=%d bytes", len(audio_bytes))
    return audio_bytes
