"""add is_pattern field for recurring task optimization

Revision ID: a1b2c3d4e5f6
Revises: 05f28ccbd23b
Create Date: 2025-12-28 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '05f28ccbd23b'
branch_labels = None
depends_on = None


def upgrade():
    """
    Add is_pattern field to tasks table.

    This field distinguishes recurring task patterns (templates)
    from their generated instances. This optimization:
    - Keeps patterns active (not marked complete)
    - Allows cleanup of old completed instances
    - Improves query performance for "show recurring patterns"
    """
    # Add is_pattern column (default False for backward compatibility)
    op.add_column('tasks', sa.Column('is_pattern', sa.Boolean(), nullable=False, server_default='false'))

    # Create index for faster querying of patterns
    op.create_index('ix_tasks_is_pattern', 'tasks', ['is_pattern', 'user_id'])

    # Update existing recurring tasks to be patterns if they have no parent
    # This makes existing data work with the new model
    op.execute("""
        UPDATE tasks
        SET is_pattern = true
        WHERE is_recurring = true
          AND parent_task_id IS NULL
          AND completed = false
    """)


def downgrade():
    """Remove is_pattern field and index"""
    op.drop_index('ix_tasks_is_pattern', table_name='tasks')
    op.drop_column('tasks', 'is_pattern')
