"""update_alerts_default_notification_channels_to_in_app

Revision ID: d6842adee7c6
Revises: 006
Create Date: 2026-02-02 12:35:00.356580

Updates the alerts table to use in_app as the default notification channel
instead of email. This supports the multi-channel notification strategy
where in-app notifications are primary and email is optional.

Changes:
- Update default notification_channels from ["email"] to ["in_app"]
- Existing alerts will keep their current channels
- New alerts will default to in_app only

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel  # Import SQLModel for custom types
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'd6842adee7c6'
down_revision = '006'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Update the default value for notification_channels column
    # This only affects NEW rows, existing rows are unchanged
    op.alter_column(
        'alerts',
        'notification_channels',
        existing_type=postgresql.JSONB(astext_type=sa.Text()),
        server_default='["in_app"]',
        existing_nullable=False
    )


def downgrade() -> None:
    # Revert to email as default
    op.alter_column(
        'alerts',
        'notification_channels',
        existing_type=postgresql.JSONB(astext_type=sa.Text()),
        server_default='["email"]',
        existing_nullable=False
    )
