"""add updated_at to messages

Revision ID: 007_add_updated_at_to_messages
Revises: d6842adee7c6
Create Date: 2026-02-22 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from datetime import datetime


# revision identifiers, used by Alembic.
revision: str = '007_add_updated_at_to_messages'
down_revision: Union[str, None] = 'd6842adee7c6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add updated_at column to messages table
    op.add_column('messages', sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')))
    op.create_index(op.f('ix_messages_updated_at'), 'messages', ['updated_at'], unique=False)


def downgrade() -> None:
    # Remove updated_at column from messages table
    op.drop_index(op.f('ix_messages_updated_at'), table_name='messages')
    op.drop_column('messages', 'updated_at')
