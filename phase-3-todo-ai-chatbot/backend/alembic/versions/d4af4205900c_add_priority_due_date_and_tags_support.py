"""Add priority due_date and tags support

Revision ID: d4af4205900c
Revises: 001
Create Date: 2025-12-15 12:05:51.163847

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel  # Import SQLModel for custom types


# revision identifiers, used by Alembic.
revision = 'd4af4205900c'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # T004: Add priority column to tasks table
    op.add_column('tasks', sa.Column(
        'priority',
        sa.Text(),
        nullable=False,
        server_default='Medium'
    ))
    op.create_check_constraint(
        'ck_tasks_priority',
        'tasks',
        "priority IN ('High', 'Medium', 'Low')"
    )

    # T005: Add due_date column to tasks table
    op.add_column('tasks', sa.Column(
        'due_date',
        sa.Date(),
        nullable=True
    ))

    # T006: Create tags table
    op.create_table(
        'tags',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.Text(), nullable=False),
        sa.Column('name', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint("length(name) >= 1 AND length(name) <= 50", name='ck_tags_name_length')
    )

    # T009: Add unique constraint to tags table
    op.create_unique_constraint('uq_tags_user_name', 'tags', ['user_id', 'name'])

    # T007: Create task_tags junction table
    op.create_table(
        'task_tags',
        sa.Column('task_id', sa.UUID(), nullable=False),
        sa.Column('tag_id', sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('task_id', 'tag_id')
    )

    # T008: Create composite indexes for filter/sort performance
    op.create_index('ix_tasks_user_priority', 'tasks', ['user_id', 'priority'])
    op.create_index('ix_tasks_user_due_date', 'tasks', ['user_id', 'due_date'])
    op.create_index('ix_tasks_user_priority_due', 'tasks', ['user_id', 'priority', 'due_date'])
    op.create_index('ix_tags_user_id', 'tags', ['user_id'])
    op.create_index('ix_tags_user_name', 'tags', ['user_id', 'name'])
    op.create_index('ix_task_tags_tag_id', 'task_tags', ['tag_id'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_task_tags_tag_id')
    op.drop_index('ix_tags_user_name')
    op.drop_index('ix_tags_user_id')
    op.drop_index('ix_tasks_user_priority_due')
    op.drop_index('ix_tasks_user_due_date')
    op.drop_index('ix_tasks_user_priority')

    # Drop tables
    op.drop_table('task_tags')
    op.drop_table('tags')

    # Drop columns from tasks
    op.drop_column('tasks', 'due_date')
    op.drop_column('tasks', 'priority')
