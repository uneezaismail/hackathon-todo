"""
Database engine configuration for Neon Serverless PostgreSQL with SQLModel.
Configured with optimal settings for serverless environment.
"""

from sqlmodel import create_engine
from typing import Optional
import os

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

# Determine if we're using PostgreSQL or SQLite
is_postgresql = DATABASE_URL.startswith("postgresql://") or DATABASE_URL.startswith("postgres://")

# Create engine with appropriate configuration based on database type
if is_postgresql:
    # Neon-optimized configuration for serverless PostgreSQL
    engine = create_engine(
        DATABASE_URL,
        pool_size=5,              # Optimal for serverless workloads
        max_overflow=10,          # Allow overflow during traffic spikes
        pool_pre_ping=True,       # Verify connections before use (critical for serverless)
        pool_recycle=300,         # Recycle connections every 5 minutes to handle timeouts
        echo=False,               # Set to True for debugging only
        connect_args={
            "sslmode": "require",           # Required for Neon
            "application_name": "todo-app", # Help with monitoring in Neon console
            "connect_timeout": 10,          # Connection timeout
        }
    )
else:
    # SQLite configuration (for testing)
    # Note: SQLite doesn't support PostgreSQL-specific parameters
    engine = create_engine(
        DATABASE_URL,
        echo=False,  # Set to True for debugging only
        connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
    )


def get_engine():
    """Return the configured SQLModel engine"""
    return engine