"""Alembic environment configuration for SQLModel with Neon Serverless PostgreSQL."""

import asyncio
import os
from logging.config import fileConfig
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# Import SQLModel base for metadata
from sqlmodel import SQLModel

# Import all models to ensure they are registered with SQLModel.metadata
# This enables Alembic autogenerate to detect model changes
# NOTE: Add all model imports here as they are created
from src.models.task import Task  # Task model for Phase 2

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set the target metadata for 'autogenerate' support
# This is the SQLModel.metadata that contains all table definitions
target_metadata = SQLModel.metadata

# Get DATABASE_URL from environment variable (not from alembic.ini)
# This allows different databases for dev/staging/production
def get_url() -> str:
    """Get database URL from environment variable."""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError(
            "DATABASE_URL environment variable is not set. "
            "Please set it in .env file or environment."
        )
    return database_url


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    """Run migrations with the given connection."""
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in 'online' mode with async support.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    This is modified to support async operations with asyncpg
    for Neon Serverless PostgreSQL.
    """
    # Get database URL and convert to async format for asyncpg
    database_url = get_url()

    # Replace postgresql:// with postgresql+asyncpg:// for async support
    if database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif not database_url.startswith("postgresql+asyncpg://"):
        raise ValueError(
            f"Invalid DATABASE_URL format: {database_url}. "
            "Expected postgresql:// or postgresql+asyncpg://"
        )

    # Remove sslmode from URL query string (asyncpg doesn't support it)
    # We'll add ssl='require' in connect_args instead
    if "?sslmode=" in database_url or "&sslmode=" in database_url:
        import re
        # Remove sslmode parameter from query string
        database_url = re.sub(r'[?&]sslmode=[^&]*', '', database_url)
        # Clean up any trailing ? or & if query string is now empty
        database_url = re.sub(r'[?&]$', '', database_url)

    # Configure async engine for migrations
    configuration = config.get_section(config.config_ini_section) or {}
    configuration["sqlalchemy.url"] = database_url

    # Configure connect_args for asyncpg (async PostgreSQL driver)
    # Note: asyncpg uses 'ssl' not 'sslmode'
    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,  # Use NullPool for migrations (no connection pooling)
        connect_args={
            "ssl": "require",  # For asyncpg (not 'sslmode')
            "server_settings": {
                "application_name": "todo-app-migrations",
                "statement_timeout": "30000"
            }
        }
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
