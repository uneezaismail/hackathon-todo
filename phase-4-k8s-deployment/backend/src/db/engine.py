"""
Database engine configuration for Neon Serverless PostgreSQL with SQLModel.
Configured with optimal settings for serverless environment.
"""

from sqlmodel import create_engine
from typing import Optional
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file first (if it exists)
# This is critical for MCP server subprocess which needs dotenv loaded
env_path = Path(__file__).parent.parent.parent / ".env"
if env_path.exists():
    load_dotenv(env_path, override=True)

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL environment variable is required. "
        "Make sure .env file exists in the backend directory."
    )

# Determine if we're using PostgreSQL or SQLite
is_postgresql = DATABASE_URL.startswith("postgresql://") or DATABASE_URL.startswith("postgres://")

# Store engine creation function for lazy initialization
def _create_engine():
    """Create the database engine based on database type."""
    if is_postgresql:
        # Simplified Neon configuration for serverless PostgreSQL
        # Note: sslmode is already in DATABASE_URL so no need for connect_args
        # Removed pool_pre_ping which can cause hangs with cold starts

        # Add connection timeout to prevent indefinite hanging during cold starts
        # Use connect_args for psycopg2/psycopg connection timeout
        connect_args = {
            "connect_timeout": 30,  # 30 second connection timeout
        }

        return create_engine(
            DATABASE_URL,
            pool_size=5,              # Allow 5 concurrent connections
            max_overflow=5,           # Allow 5 more overflow connections
            pool_recycle=300,         # Recycle connections every 5 minutes
            pool_timeout=30,          # Wait up to 30 seconds for a connection
            echo=False,               # Set to True for debugging only
            connect_args=connect_args,
        )
    else:
        # SQLite configuration (for testing)
        # Note: SQLite doesn't support PostgreSQL-specific parameters
        return create_engine(
            DATABASE_URL,
            echo=False,  # Set to True for debugging only
            connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
        )

# Lazy engine initialization
_engine = None

def get_engine():
    """Return the configured SQLModel engine (lazy initialization)."""
    global _engine
    if _engine is None:
        _engine = _create_engine()
    return _engine