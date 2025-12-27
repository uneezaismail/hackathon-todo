"""Add chatkit_item_id to Message model for ChatKit ID preservation

Revision ID: 4f08431bc002
Revises: c8748918d4f7
Create Date: 2025-12-26 00:58:15.152224

"""
from typing import Union
from alembic import op
import sqlalchemy as sa
import sqlmodel

# revision identifiers, used by Alembic.
revision: str = '4f08431bc002'
down_revision: str = 'c8748918d4f7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add chatkit_item_id column to preserve ChatKit item IDs for frontend consistency."""
    # Add the chatkit_item_id column with a default value
    op.add_column(
        'messages',
        sa.Column(
            'chatkit_item_id',
            sa.String(255),
            nullable=False,
            server_default=str(sa.text("uuid_generate_v4()"))
        )
    )

    # Create index for efficient lookups by ChatKit item ID
    op.create_index(
        op.f('ix_messages_chatkit_item_id'),
        'messages',
        ['chatkit_item_id'],
        unique=False
    )


def downgrade() -> None:
    """Remove the chatkit_item_id column."""
    op.drop_index(op.f('ix_messages_chatkit_item_id'), table_name='messages')
    op.drop_column('messages', 'chatkit_item_id')
