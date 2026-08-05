"""Loads all environment variables and exposes a typed Settings singleton used across the app."""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables / .env file."""

    # LLM (OpenAI-compatible endpoint for Gemini 2.5 Flash)
    openai_api_key: str = "no-key-set"
    openai_base_url: str = "https://generativelanguage.googleapis.com/v1beta/openai/"
    llm_model: str = "gemini-2.5-flash"
    tts_model: str = "gpt-4o-mini-tts"
    stt_model: str = "whisper-1"

    # App
    app_env: str = "development"
    app_port: int = 8000
    log_level: str = "INFO"

    # FAISS
    faiss_index_path: str = "faiss_index"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    """Returns a cached Settings singleton."""
    return Settings()


settings = get_settings()
