"""add_missing_chatkit_fields

Revision ID: c8748918d4f7
Revises: 003_fix_messages_schema
Create Date: 2025-12-25 13:44:45.392777

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel  # Import SQLModel for custom types


# revision identifiers, used by Alembic.
revision = 'c8748918d4f7'
down_revision = '003_fix_messages_schema'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add missing ChatKit fields to conversations and messages tables."""

    # Add tool_calls JSONB column to messages table (for MCP tool invocation logging)
    op.execute("""
        ALTER TABLE messages
        ADD COLUMN IF NOT EXISTS tool_calls JSONB DEFAULT NULL
    """)

    # Add thread_id to conversations table (for ChatKit protocol)
    op.execute("""
        ALTER TABLE conversations
        ADD COLUMN IF NOT EXISTS thread_id VARCHAR NOT NULL DEFAULT gen_random_uuid()::text
    """)

    # Add title to conversations table
    op.execute("""
        ALTER TABLE conversations
        ADD COLUMN IF NOT EXISTS title VARCHAR(500) NOT NULL DEFAULT 'New Conversation'
    """)

    # Add is_active to conversations table
    op.execute("""
        ALTER TABLE conversations
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE
    """)

    # Create unique index on thread_id
    op.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_thread_id
        ON conversations(thread_id)
    """)

    # Create index on is_active for filtering
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_conversations_is_active
        ON conversations(is_active)
    """)


def downgrade() -> None:
    """Remove ChatKit fields from conversations and messages tables."""

    # Drop indexes first
    op.execute("DROP INDEX IF EXISTS idx_conversations_is_active")
    op.execute("DROP INDEX IF EXISTS idx_conversations_thread_id")

    # Drop columns
    op.execute("ALTER TABLE conversations DROP COLUMN IF EXISTS is_active")
    op.execute("ALTER TABLE conversations DROP COLUMN IF EXISTS title")
    op.execute("ALTER TABLE conversations DROP COLUMN IF EXISTS thread_id")
    op.execute("ALTER TABLE messages DROP COLUMN IF EXISTS tool_calls")
