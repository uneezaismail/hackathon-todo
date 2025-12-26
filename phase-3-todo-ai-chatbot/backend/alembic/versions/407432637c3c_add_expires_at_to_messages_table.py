"""add expires_at to messages table

Revision ID: 407432637c3c
Revises: 002_add_chat_tables
Create Date: 2025-12-23 01:48:47.150696

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel  # Import SQLModel for custom types


# revision identifiers, used by Alembic.
revision = '407432637c3c'
down_revision = '002_add_chat_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add expires_at column to messages table
    # Default: 2 days from creation (now() + interval '2 days')
    op.add_column(
        'messages',
        sa.Column(
            'expires_at',
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now() + interval '2 days'")
        )
    )

    # Create index for efficient retention cleanup queries
    op.create_index('idx_messages_expires_at', 'messages', ['expires_at'])


def downgrade() -> None:
    # Drop index first
    op.drop_index('idx_messages_expires_at', table_name='messages')

    # Drop expires_at column
    op.drop_column('messages', 'expires_at')
