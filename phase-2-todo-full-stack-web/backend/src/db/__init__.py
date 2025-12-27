"""
Database package for the FastAPI backend.
Exports engine and session factory for use throughout the application.
"""

from .engine import engine, get_engine
from .session import get_session, get_session_context

__all__ = ["engine", "get_engine", "get_session", "get_session_context"]
