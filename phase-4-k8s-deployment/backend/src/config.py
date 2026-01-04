"""
Application configuration using pydantic-settings.

Loads configuration from environment variables with validation.
All configuration is centralized here for easy management.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.

    Required fields:
    - DATABASE_URL: Neon PostgreSQL connection string
    - BETTER_AUTH_SECRET: Shared secret for JWT validation (min 32 chars)

    Optional fields with defaults:
    - ENVIRONMENT: Application environment (default: "development")
    - CORS_ORIGINS: Comma-separated list of allowed origins
    - LOG_LEVEL: Logging level (default: "INFO")
    - HOST: Server host (default: "0.0.0.0")
    - PORT: Server port (default: 8000)
    - DB_ECHO: Echo SQL queries to console (default: False)
    - JWT_ALGORITHM: JWT signing algorithm (default: "HS256")
    """

    # Required fields
    DATABASE_URL: str
    BETTER_AUTH_SECRET: str

    # Optional fields with defaults
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: str = "http://localhost:3000"
    LOG_LEVEL: str = "INFO"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DB_ECHO: bool = False
    JWT_ALGORITHM: str = "HS256"

    # Database Pool Settings (Neon optimized defaults)
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_PRE_PING: bool = True
    DB_POOL_RECYCLE: int = 300

    # JWT Settings
    JWT_EXPIRATION: int = 604800  # 7 days

    # Phase 3 AI Chatbot Settings
    AI_PROVIDER: str = "openai"  # Also accepts: groq, gemini, openrouter
    LLM_PROVIDER: str = "openai"
    AI_MODEL: str = "gpt-4o-mini"
    AI_TEMPERATURE: float = 0.7
    AI_MAX_TOKENS: int = 1000
    AI_SYSTEM_PROMPT: str = "You are a helpful task management assistant."

    # OpenAI Settings
    OPENAI_API_KEY: str = ""

    # Gemini Settings
    GEMINI_API_KEY: str = ""
    GEMINI_DEFAULT_MODEL: str = "gemini-2.5-flash"

    # Groq Settings
    GROQ_API_KEY: str = ""
    GROQ_DEFAULT_MODEL: str = "llama-3.3-70b-versatile"

    # OpenRouter Settings
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_DEFAULT_MODEL: str = "openai/gpt-oss-20b:free"

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse comma-separated CORS_ORIGINS into a list"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"  # Ignore extra environment variables (e.g., frontend vars in .env)


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.

    Uses lru_cache to ensure settings are loaded once and reused.
    This is the recommended pattern for FastAPI dependencies.

    Returns:
        Settings: Application settings instance
    """
    return Settings()
