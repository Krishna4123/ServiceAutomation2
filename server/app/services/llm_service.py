"""Single shared LLM client wrapper — all graph nodes call this instead of instantiating their own clients."""

from openai import OpenAI
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

# One shared OpenAI-compatible client pointed at the institution's Gemini endpoint
_client = OpenAI(
    api_key=settings.openai_api_key,
    base_url=settings.openai_base_url,
)


def chat_completion(
    messages: list[dict],
    temperature: float = 0.3,
    max_tokens: int = 1024,
) -> str:
    """Calls the Gemini 2.5 Flash model via the OpenAI-compatible endpoint and returns the reply text.

    Args:
        messages: List of {"role": ..., "content": ...} dicts.
        temperature: Sampling temperature.
        max_tokens: Maximum tokens in the response.

    Returns:
        The assistant reply string.
    """
    logger.debug("Calling LLM | model=%s | messages=%d", settings.llm_model, len(messages))
    response = _client.chat.completions.create(
        model=settings.llm_model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    reply = response.choices[0].message.content or ""
    logger.debug("LLM reply received | length=%d", len(reply))
    return reply
