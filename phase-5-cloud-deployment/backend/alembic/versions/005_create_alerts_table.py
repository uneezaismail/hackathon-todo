"""Create alerts table for Phase V alert system

Revision ID: 005
Revises: 004
Create Date: 2026-01-17

Phase V Alert System:
- Scheduled alerts via Dapr Jobs API
- Multiple notification channels (email, push, webhook)
- Delivery tracking with retry logic
- User-scoped alert management
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '005'
down_revision: Union[str, None] = '004'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create alerts table for scheduled task reminders."""
    # Create delivery_status enum - handle existing type gracefully
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'deliverystatus') THEN
                CREATE TYPE deliverystatus AS ENUM ('pending', 'scheduled', 'delivered', 'failed', 'cancelled');
            END IF;
        END $$;
    """)

    # Create alerts table
    op.create_table(
        'alerts',
        # Primary key - UUID for distributed systems
        sa.Column(
            'alert_id',
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text('gen_random_uuid()'),
            comment='Unique alert identifier (UUID v4)'
        ),
        # Foreign key to tasks
        sa.Column(
            'task_id',
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey('tasks.id', ondelete='CASCADE'),
            nullable=False,
            index=True,
            comment='Associated task ID'
        ),
        # User isolation - CRITICAL for security
        sa.Column(
            'user_id',
            sa.String(),
            nullable=False,
            index=True,
            comment='Better Auth user ID for isolation'
        ),
        # Alert timing
        sa.Column(
            'alert_time',
            sa.DateTime(timezone=True),
            nullable=False,
            index=True,
            comment='Scheduled alert time (UTC)'
        ),
        # Notification channels as JSON array
        # Example: ["email", "push", "webhook"]
        sa.Column(
            'notification_channels',
            postgresql.JSONB,
            nullable=False,
            server_default='["email"]',
            comment='List of notification channels to use'
        ),
        # Delivery status tracking
        sa.Column(
            'delivery_status',
            postgresql.ENUM('pending', 'scheduled', 'delivered', 'failed', 'cancelled', name='deliverystatus', create_type=False),
            nullable=False,
            server_default='pending',
            index=True,
            comment='Current delivery status'
        ),
        # Retry tracking
        sa.Column(
            'delivery_attempts',
            sa.Integer(),
            nullable=False,
            server_default='0',
            comment='Number of delivery attempts'
        ),
        # Failure reason for debugging
        sa.Column(
            'failed_reason',
            sa.String(length=1000),
            nullable=True,
            comment='Reason for delivery failure (if any)'
        ),
        # Dapr Job ID for cancellation
        sa.Column(
            'dapr_job_id',
            sa.String(length=255),
            nullable=True,
            unique=True,
            comment='Dapr Jobs API job identifier'
        ),
        # Timestamps
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text('NOW()'),
            comment='Alert creation timestamp (UTC)'
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text('NOW()'),
            onupdate=sa.text('NOW()'),
            comment='Last update timestamp (UTC)'
        ),
        sa.Column(
            'delivered_at',
            sa.DateTime(timezone=True),
            nullable=True,
            comment='When alert was delivered (UTC)'
        ),
    )

    # Create composite indexes for common queries
    op.create_index(
        'ix_alerts_user_id_alert_time',
        'alerts',
        ['user_id', 'alert_time'],
        unique=False
    )
    op.create_index(
        'ix_alerts_delivery_status_alert_time',
        'alerts',
        ['delivery_status', 'alert_time'],
        unique=False
    )


def downgrade() -> None:
    """Drop alerts table and enum."""
    # Drop indexes
    op.drop_index('ix_alerts_delivery_status_alert_time', table_name='alerts')
    op.drop_index('ix_alerts_user_id_alert_time', table_name='alerts')

    # Drop table
    op.drop_table('alerts')

    # Drop enum
    try:
        delivery_status_enum = sa.Enum(
            'pending', 'scheduled', 'delivered', 'failed', 'cancelled',
            name='deliverystatus'
        )
        delivery_status_enum.drop(op.get_bind(), checkfirst=True)
    except Exception:
        # Type doesn't exist, continue
        pass
