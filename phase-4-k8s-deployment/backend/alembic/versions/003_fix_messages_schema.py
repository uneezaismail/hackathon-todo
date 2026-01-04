"""Fix messages table schema - add user_id and expires_at

Revision ID: 003_fix_messages_schema
Revises: 407432637c3c_add_expires_at_to_messages_table
Create Date: 2025-12-25 00:00:00.000000

This migration fixes the messages table schema to match the SQLModel definition:
1. Add user_id column (if not exists) - required for user isolation queries
2. Verify expires_at column exists (added in previous migration)
3. Add index on user_id for performance
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '003_fix_messages_schema'
down_revision: Union[str, None] = '407432637c3c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add user_id column if it doesn't exist
    # Check if column exists first to avoid errors if migration re-run
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'messages' AND column_name = 'user_id'
            ) THEN
                ALTER TABLE messages ADD COLUMN user_id VARCHAR NOT NULL DEFAULT '';
            END IF;
        END $$;
    """)

    # Create index on user_id for user isolation queries
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_indexes WHERE tablename = 'messages' AND indexname = 'idx_messages_user_id'
            ) THEN
                CREATE INDEX idx_messages_user_id ON messages (user_id);
            END IF;
        END $$;
    """)

    # Verify expires_at exists (should be added by previous migration)
    # If not, add it now
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'messages' AND column_name = 'expires_at'
            ) THEN
                ALTER TABLE messages ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '2 days');
            END IF;
        END $$;
    """)

    # Create index on expires_at for cleanup queries
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_indexes WHERE tablename = 'messages' AND indexname = 'idx_messages_expires_at'
            ) THEN
                CREATE INDEX idx_messages_expires_at ON messages (expires_at);
            END IF;
        END $$;
    """)


def downgrade() -> None:
    # Drop indexes first
    op.execute("DROP INDEX IF EXISTS idx_messages_expires_at")
    op.execute("DROP INDEX IF EXISTS idx_messages_user_id")

    # Drop columns (careful - this loses data!)
    op.execute("ALTER TABLE messages DROP COLUMN IF EXISTS user_id")
    op.execute("ALTER TABLE messages DROP COLUMN IF EXISTS expires_at")
