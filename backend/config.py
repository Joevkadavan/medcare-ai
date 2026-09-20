"""Application configuration, loaded from environment variables."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    frontend_url: str = "http://localhost:3000"

    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    mock_ai_only: bool = False

    rag_enabled: bool = True
    rag_top_k: int = 4

    @property
    def allowed_origins(self) -> list[str]:
        """Parse FRONTEND_URL into a list of origins, in addition to local dev."""
        extra = [
            origin.strip().rstrip("/")
            for origin in self.frontend_url.split(",")
            if origin.strip()
        ]
        dev = [
            "http://localhost:3000",
            "http://localhost:8000",
            "http://127.0.0.1:3000",
        ]
        seen: list[str] = []
        for origin in dev + extra:
            if origin not in seen:
                seen.append(origin)
        return seen

    @property
    def ai_live(self) -> bool:
        """True when a real LLM call can be made."""
        return bool(self.openai_api_key) and not self.mock_ai_only


@lru_cache
def get_settings() -> Settings:
    return Settings()
