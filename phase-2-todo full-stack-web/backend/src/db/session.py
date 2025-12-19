"""
Database session factory with dependency for FastAPI.
Provides database sessions to endpoints using dependency injection.
"""

from sqlmodel import Session
from typing import Generator
from .engine import engine


def get_session() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides database sessions.
    Use this in endpoint dependencies to get a database session.

    Example usage in endpoint:
    def read_tasks(session: Session = Depends(get_session)):
        # Use session for database operations
        pass
    """
    with Session(engine) as session:
        yield session


# Optional: Context manager for manual session handling
from contextlib import contextmanager

@contextmanager
def get_session_context():
    """
    Context manager for database sessions when not using FastAPI dependency injection.
    Use only when FastAPI dependency injection is not available.
    """
    with Session(engine) as session:
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()