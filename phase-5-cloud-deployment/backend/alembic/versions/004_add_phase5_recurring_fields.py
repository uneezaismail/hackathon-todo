"""Add Phase V recurring task fields (RRULE pattern, next_occurrence)

Revision ID: 004
Revises: a1b2c3d4e5f6
Create Date: 2026-01-17

Phase V adds RRULE-based recurring task support:
- recurring_pattern: RRULE string (e.g., "DAILY", "FREQ=WEEKLY;INTERVAL=2")
- recurring_end_date: TIMESTAMP for when recurrence should stop (replaces DATE)
- next_occurrence: TIMESTAMP for calculated next occurrence (UTC)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '004'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add Phase V recurring task fields to tasks table."""
    # Add recurring_pattern column for RRULE strings
    # This replaces the recurrence_type enum with more flexible RRULE support
    op.add_column(
        'tasks',
        sa.Column(
            'recurring_pattern',
            sa.String(length=500),
            nullable=True,
            comment='RRULE pattern string (e.g., DAILY, WEEKLY, FREQ=DAILY;INTERVAL=1)'
        )
    )

    # Add next_occurrence column for calculated next occurrence timestamp (UTC)
    op.add_column(
        'tasks',
        sa.Column(
            'next_occurrence',
            sa.DateTime(timezone=True),
            nullable=True,
            comment='Calculated next occurrence timestamp (UTC)'
        )
    )

    # Create index for next_occurrence queries (scheduled job processing)
    op.create_index(
        'ix_tasks_next_occurrence',
        'tasks',
        ['next_occurrence'],
        unique=False
    )

    # Create composite index for user + next_occurrence queries
    op.create_index(
        'ix_tasks_user_id_next_occurrence',
        'tasks',
        ['user_id', 'next_occurrence'],
        unique=False
    )

    # Migrate existing recurrence_type data to recurring_pattern
    # This ensures backward compatibility with Phase IV data
    op.execute("""
        UPDATE tasks
        SET recurring_pattern = UPPER(recurrence_type::text)
        WHERE recurrence_type IS NOT NULL
          AND recurring_pattern IS NULL
    """)


def downgrade() -> None:
    """Remove Phase V recurring task fields."""
    # Drop indexes
    op.drop_index('ix_tasks_user_id_next_occurrence', table_name='tasks')
    op.drop_index('ix_tasks_next_occurrence', table_name='tasks')

    # Drop columns
    op.drop_column('tasks', 'next_occurrence')
    op.drop_column('tasks', 'recurring_pattern')
