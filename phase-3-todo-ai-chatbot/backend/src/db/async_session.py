"""
Async database session configuration for Phase 3 chat endpoints.

Uses asyncpg driver for non-blocking I/O in streaming chat responses.
Coexists with sync session.py for Phase 2 task endpoints.

Reference: openai-agents-mcp-integration skill section 5.1
"""
import asyncio
import logging
import os
from pathlib import Path
from typing import AsyncIterator, Callable, TypeVar

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError, DBAPIError

# Load environment variables from .env file first (if it exists)
# This is critical for MCP server subprocess which needs dotenv loaded
env_path = Path(__file__).parent.parent.parent / ".env"
if env_path.exists():
    load_dotenv(env_path, override=True)

logger = logging.getLogger(__name__)

# Type variable for retry decorator
T = TypeVar('T')

# Get database URL and convert to async format
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

# Convert postgresql:// to postgresql+asyncpg:// for async engine
# This allows both sync (psycopg2) and async (asyncpg) drivers to work side-by-side
# Also allow SQLite for testing (sqlite+aiosqlite://)
if DATABASE_URL.startswith("postgresql://") or DATABASE_URL.startswith("postgres://"):
    async_database_url = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
    async_database_url = async_database_url.replace("postgres://", "postgresql+asyncpg://")

    # CRITICAL FIX: asyncpg doesn't support 'sslmode' query parameter
    # It expects 'ssl' in connect_args instead (set in _create_async_engine)
    # Remove sslmode from URL to prevent "unexpected keyword argument 'sslmode'" error
    if "sslmode=" in async_database_url:
        # Remove sslmode parameter (e.g., ?sslmode=require or &sslmode=require)
        import re
        async_database_url = re.sub(r'[?&]sslmode=[^&]*', '', async_database_url)
        # Clean up any resulting double ? or & or trailing separators
        async_database_url = re.sub(r'\?&', '?', async_database_url)
        async_database_url = re.sub(r'[?&]$', '', async_database_url)

elif DATABASE_URL.startswith("sqlite://"):
    # For testing: convert sqlite:// to sqlite+aiosqlite://
    async_database_url = DATABASE_URL.replace("sqlite://", "sqlite+aiosqlite://")
else:
    raise ValueError(f"Unsupported database URL format: {DATABASE_URL}")

# Lazy initialization of async engine
_async_engine = None
_async_engine_lock = asyncio.Lock()

async def _get_async_engine():
    """Lazy initialization of async database engine - only connects when first used."""
    global _async_engine
    if _async_engine is None:
        async with _async_engine_lock:
            if _async_engine is None:
                _async_engine = _create_async_engine()
    return _async_engine

def _create_async_engine():
    """Create the async database engine based on database type."""
    if DATABASE_URL.startswith("sqlite://"):
        from sqlmodel.pool import StaticPool
        return create_async_engine(
            async_database_url,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
            echo=False,
        )
    else:
        # Use minimal pool settings for serverless PostgreSQL
        # Note: asyncpg uses ssl='require' instead of sslmode='require'
        return create_async_engine(
            async_database_url,
            pool_size=1,              # Minimal pool to avoid connection issues
            max_overflow=0,           # No overflow connections
            pool_pre_ping=True,       # Verify connections before use
            pool_recycle=300,         # Recycle connections every 5 minutes
            echo=False,               # Set to True for debugging
            connect_args={"ssl": "require"},  # asyncpg uses ssl='require'
        )

# Lazy session factory
_async_session_factory = None

async def _get_session_factory():
    """Lazy initialization of async session factory."""
    global _async_session_factory
    if _async_session_factory is None:
        engine = await _get_async_engine()
        _async_session_factory = sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
            autocommit=False,
        )
    return _async_session_factory


async def get_async_session() -> AsyncIterator[AsyncSession]:
    """
    Dependency for FastAPI endpoints requiring async database access.

    Yields async session for chat endpoints that need non-blocking I/O.
    Automatically commits on success, rolls back on exception.

    Usage:
        @router.post("/chat")
        async def chat_endpoint(
            session: AsyncSession = Depends(get_async_session)
        ):
            ...
    """
    factory = await _get_session_factory()
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# Export engine for alembic migrations and other use cases
async def get_async_engine():
    """Return the configured async engine (lazy initialization)."""
    return await _get_async_engine()


async def get_session_factory():
    """
    Return the configured async session factory.
    Useful for non-FastAPI contexts (like ChatKit stores).
    """
    return await _get_session_factory()


# T105: Database retry logic with exponential backoff
async def execute_with_retry(
    operation: Callable[[], T],
    max_attempts: int = 3,
    initial_delay: float = 1.0
) -> T:
    """
    Execute database operation with exponential backoff retry logic.

    Retries on transient errors (connection issues, timeouts, deadlocks).
    Does NOT retry on permanent errors (constraint violations, data errors).

    Args:
        operation: Async callable to execute
        max_attempts: Maximum retry attempts (default: 3)
        initial_delay: Initial delay in seconds (default: 1.0)

    Returns:
        Result of operation

    Raises:
        Exception: Final exception after all retries exhausted

    Example:
        async def create_message():
            async with get_async_session() as session:
                message = Message(...)
                session.add(message)
                await session.commit()
                return message

        message = await execute_with_retry(create_message)
    """
    delays = [initial_delay * (2 ** i) for i in range(max_attempts)]  # [1s, 2s, 4s]

    for attempt in range(max_attempts):
        try:
            return await operation()
        except (OperationalError, DBAPIError) as e:
            # Check if error is retryable (connection, timeout, deadlock)
            error_msg = str(e).lower()
            is_retryable = any(
                keyword in error_msg
                for keyword in ["connection", "timeout", "deadlock", "pool", "closed"]
            )

            if not is_retryable or attempt >= max_attempts - 1:
                # Non-retryable error or final attempt - reraise
                logger.error(f"Database operation failed after {attempt + 1} attempts: {e}")
                raise

            # Retryable error - wait and retry
            delay = delays[attempt]
            logger.warning(
                f"Database operation failed (attempt {attempt + 1}/{max_attempts}), "
                f"retrying in {delay}s: {e}"
            )
            await asyncio.sleep(delay)
            continue
