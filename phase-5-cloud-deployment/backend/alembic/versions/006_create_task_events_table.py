"""Create task_events table for Phase V event sourcing

Revision ID: 006
Revises: 005
Create Date: 2026-01-17

Phase V Event Sourcing:
- All task mutations publish CloudEvents to Kafka
- Event versioning for schema evolution
- Audit trail for compliance
- Replay capability for debugging
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '006'
down_revision: Union[str, None] = '005'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create task_events table for event sourcing."""
    # Create task_events table
    op.create_table(
        'task_events',
        # Primary key - UUID for CloudEvents id
        sa.Column(
            'event_id',
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text('gen_random_uuid()'),
            comment='Unique event identifier (CloudEvents id)'
        ),
        # Event type discriminator
        sa.Column(
            'event_type',
            sa.String(length=100),
            nullable=False,
            index=True,
            comment='Event type (task.created, task.completed, task.deleted, etc.)'
        ),
        # User isolation - CRITICAL for security
        sa.Column(
            'user_id',
            sa.String(),
            nullable=False,
            index=True,
            comment='Better Auth user ID for isolation and partitioning'
        ),
        # Related task (nullable for deleted tasks)
        sa.Column(
            'task_id',
            postgresql.UUID(as_uuid=True),
            nullable=True,
            index=True,
            comment='Associated task ID (may be NULL if task was deleted)'
        ),
        # Event payload as JSONB for flexibility
        sa.Column(
            'payload',
            postgresql.JSONB,
            nullable=False,
            server_default='{}',
            comment='Event-specific payload data'
        ),
        # Event timestamp (when event occurred)
        sa.Column(
            'occurred_at',
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text('NOW()'),
            index=True,
            comment='When the event occurred (UTC)'
        ),
        # Schema version for evolution
        sa.Column(
            'event_version',
            sa.String(length=10),
            nullable=False,
            server_default='1.0',
            comment='Event schema version (major.minor format)'
        ),
        # CloudEvents metadata
        sa.Column(
            'source',
            sa.String(length=255),
            nullable=False,
            server_default='backend',
            comment='CloudEvents source (service that produced the event)'
        ),
        sa.Column(
            'specversion',
            sa.String(length=10),
            nullable=False,
            server_default='1.0',
            comment='CloudEvents specification version'
        ),
        # Processing metadata
        sa.Column(
            'published_to_kafka',
            sa.Boolean(),
            nullable=False,
            server_default='false',
            comment='Whether event was successfully published to Kafka'
        ),
        sa.Column(
            'kafka_topic',
            sa.String(length=255),
            nullable=True,
            comment='Kafka topic where event was published'
        ),
        sa.Column(
            'kafka_partition',
            sa.Integer(),
            nullable=True,
            comment='Kafka partition where event was published'
        ),
        sa.Column(
            'kafka_offset',
            sa.BigInteger(),
            nullable=True,
            comment='Kafka offset of published event'
        ),
    )

    # Create composite indexes for common queries
    op.create_index(
        'ix_task_events_user_id_occurred_at',
        'task_events',
        ['user_id', 'occurred_at'],
        unique=False
    )
    op.create_index(
        'ix_task_events_event_type_occurred_at',
        'task_events',
        ['event_type', 'occurred_at'],
        unique=False
    )
    op.create_index(
        'ix_task_events_task_id_occurred_at',
        'task_events',
        ['task_id', 'occurred_at'],
        unique=False
    )
    # Index for replay queries (unpublished events)
    op.create_index(
        'ix_task_events_published_to_kafka',
        'task_events',
        ['published_to_kafka'],
        unique=False,
        postgresql_where=sa.text('published_to_kafka = false')
    )


def downgrade() -> None:
    """Drop task_events table."""
    # Drop indexes
    op.drop_index('ix_task_events_published_to_kafka', table_name='task_events')
    op.drop_index('ix_task_events_task_id_occurred_at', table_name='task_events')
    op.drop_index('ix_task_events_event_type_occurred_at', table_name='task_events')
    op.drop_index('ix_task_events_user_id_occurred_at', table_name='task_events')

    # Drop table
    op.drop_table('task_events')
