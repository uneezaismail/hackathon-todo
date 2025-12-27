"""
LLM Model Factory for multi-provider support.

This module provides a centralized factory function for creating LLM model instances.
Supports OpenAI, Gemini, Groq, and OpenRouter providers.

Usage:
    from agent_config.factory import create_model
    model = create_model()  # Uses LLM_PROVIDER env var
    model = create_model(provider="gemini", model="gemini-2.5-flash")

Environment Variables:
    LLM_PROVIDER: Provider selection (openai|gemini|groq|openrouter)
    OPENAI_API_KEY: OpenAI API key
    OPENAI_DEFAULT_MODEL: Default OpenAI model (default: gpt-4o-mini)
    GEMINI_API_KEY: Google Gemini API key
    GEMINI_DEFAULT_MODEL: Default Gemini model (default: gemini-2.5-flash)
    GROQ_API_KEY: Groq API key
    GROQ_DEFAULT_MODEL: Default Groq model (default: llama-3.3-70b-versatile)
    OPENROUTER_API_KEY: OpenRouter API key
    OPENROUTER_DEFAULT_MODEL: Default OpenRouter model (default: openai/gpt-4o-mini)
"""

import os
from pathlib import Path

from agents import OpenAIChatCompletionsModel
from openai import AsyncOpenAI
from dotenv import load_dotenv

# Disable OpenAI telemetry/tracing for faster responses
# This prevents the SDK from trying to send traces to api.openai.com
os.environ.setdefault("OTEL_SDK_DISABLED", "true")
os.environ.setdefault("OTEL_TRACES_EXPORTER", "none")
os.environ.setdefault("OTEL_METRICS_EXPORTER", "none")


def create_model(
    provider: str | None = None,
    model: str | None = None,
) -> OpenAIChatCompletionsModel:
    """
    Create an LLM model instance based on configuration.

    Args:
        provider: Override LLM_PROVIDER env var ("openai"|"gemini"|"groq"|"openrouter")
        model: Override default model name for the provider

    Returns:
        OpenAIChatCompletionsModel: Configured model instance

    Raises:
        ValueError: If provider not supported or required API key is missing

    Examples:
        >>> model = create_model()  # Uses LLM_PROVIDER env var
        >>> model = create_model(provider="openai", model="gpt-4o")
        >>> model = create_model(provider="gemini")
        >>> model = create_model(provider="groq", model="llama-3.3-70b-versatile")
        >>> model = create_model(provider="openrouter", model="openai/gpt-oss-20b:free")
    """
    # Load environment variables from .env file
    env_path = Path(__file__).parent.parent.parent / ".env"
    if env_path.exists():
        load_dotenv(env_path, override=True)
    else:
        load_dotenv(override=True)

    # Determine provider
    provider = (provider or os.getenv("LLM_PROVIDER", "openai")).lower()

    if provider == "gemini":
        return _create_gemini_model(model)
    elif provider == "groq":
        return _create_groq_model(model)
    elif provider == "openrouter":
        return _create_openrouter_model(model)
    else:  # openai (default)
        return _create_openai_model(model)


def _create_openai_model(model: str | None = None) -> OpenAIChatCompletionsModel:
    """Create OpenAI model instance."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable is required when LLM_PROVIDER=openai")

    client = AsyncOpenAI(api_key=api_key)
    model_name = model or os.getenv("OPENAI_DEFAULT_MODEL", "gpt-4o-mini")

    return OpenAIChatCompletionsModel(
        model=model_name,
        openai_client=client,
    )


def _create_gemini_model(model: str | None = None) -> OpenAIChatCompletionsModel:
    """Create Gemini model instance via OpenAI-compatible endpoint."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is required when LLM_PROVIDER=gemini")

    client = AsyncOpenAI(
        api_key=api_key,
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
    )
    model_name = model or os.getenv("GEMINI_DEFAULT_MODEL", "gemini-2.5-flash")

    return OpenAIChatCompletionsModel(
        model=model_name,
        openai_client=client,
    )


def _create_groq_model(model: str | None = None) -> OpenAIChatCompletionsModel:
    """Create Groq model instance via OpenAI-compatible endpoint."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable is required when LLM_PROVIDER=groq")

    client = AsyncOpenAI(
        api_key=api_key,
        base_url="https://api.groq.com/openai/v1",
    )
    model_name = model or os.getenv("GROQ_DEFAULT_MODEL", "llama-3.3-70b-versatile")

    return OpenAIChatCompletionsModel(
        model=model_name,
        openai_client=client,
    )


def _create_openrouter_model(model: str | None = None) -> OpenAIChatCompletionsModel:
    """Create OpenRouter model instance via OpenAI-compatible endpoint."""
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY environment variable is required when LLM_PROVIDER=openrouter")

    client = AsyncOpenAI(
        api_key=api_key,
        base_url="https://openrouter.ai/api/v1",
    )
    model_name = model or os.getenv("OPENROUTER_DEFAULT_MODEL", "openai/gpt-4o-mini")

    return OpenAIChatCompletionsModel(
        model=model_name,
        openai_client=client,
    )
