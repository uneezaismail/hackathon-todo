"""add_recurrence_fields

Revision ID: 05f28ccbd23b
Revises: 4f08431bc002
Create Date: 2025-12-27 13:20:52.422157

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '05f28ccbd23b'
down_revision = '4f08431bc002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add recurrence fields to tasks table for Phase 4 recurring tasks feature."""
    # Create recurrence type enum
    recurrence_type_enum = sa.Enum('daily', 'weekly', 'monthly', 'yearly', name='recurrencetype')
    recurrence_type_enum.create(op.get_bind(), checkfirst=True)

    # Add recurrence columns to tasks table
    op.add_column('tasks', sa.Column('is_recurring', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('tasks', sa.Column('recurrence_type', sa.Enum('daily', 'weekly', 'monthly', 'yearly', name='recurrencetype'), nullable=True))
    op.add_column('tasks', sa.Column('recurrence_interval', sa.Integer(), nullable=False, server_default='1'))
    op.add_column('tasks', sa.Column('recurrence_days', sa.String(length=27), nullable=True))
    op.add_column('tasks', sa.Column('recurrence_end_date', sa.Date(), nullable=True))
    op.add_column('tasks', sa.Column('max_occurrences', sa.Integer(), nullable=True))
    op.add_column('tasks', sa.Column('parent_task_id', sa.UUID(), nullable=True))
    op.add_column('tasks', sa.Column('occurrence_count', sa.Integer(), nullable=False, server_default='0'))

    # Create indexes for efficient querying
    op.create_index('ix_tasks_parent_task_id', 'tasks', ['parent_task_id'], unique=False)
    op.create_index('ix_tasks_user_id_is_recurring', 'tasks', ['user_id', 'is_recurring'], unique=False)

    # Add self-referential foreign key for parent_task_id
    op.create_foreign_key(
        'fk_tasks_parent_task_id',
        'tasks', 'tasks',
        ['parent_task_id'], ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    """Remove recurrence fields from tasks table."""
    # Drop foreign key constraint
    op.drop_constraint('fk_tasks_parent_task_id', 'tasks', type_='foreignkey')

    # Drop indexes
    op.drop_index('ix_tasks_user_id_is_recurring', table_name='tasks')
    op.drop_index('ix_tasks_parent_task_id', table_name='tasks')

    # Drop columns
    op.drop_column('tasks', 'occurrence_count')
    op.drop_column('tasks', 'parent_task_id')
    op.drop_column('tasks', 'max_occurrences')
    op.drop_column('tasks', 'recurrence_end_date')
    op.drop_column('tasks', 'recurrence_days')
    op.drop_column('tasks', 'recurrence_interval')
    op.drop_column('tasks', 'recurrence_type')
    op.drop_column('tasks', 'is_recurring')

    # Drop enum type
    recurrence_type_enum = sa.Enum('daily', 'weekly', 'monthly', 'yearly', name='recurrencetype')
    recurrence_type_enum.drop(op.get_bind(), checkfirst=True)
