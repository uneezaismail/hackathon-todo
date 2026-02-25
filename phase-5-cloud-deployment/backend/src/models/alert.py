"""
Alert model for the Todo application Phase V.
Defines the database schema for scheduled task alerts/reminders.

Phase V Alert System:
- Scheduled alerts via Dapr Jobs API
- Multiple notification channels (email, push, webhook)
- Delivery tracking with retry logic
- User-scoped alert management
"""

from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import uuid4

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlmodel import Field, SQLModel

from .base import TimestampMixin


class DeliveryStatus(str, Enum):
    """Alert delivery status."""

    pending = "pending"
    scheduled = "scheduled"
    delivered = "delivered"
    failed = "failed"
    cancelled = "cancelled"


class NotificationChannel(str, Enum):
    """Notification channel types."""

    in_app = "in_app"  # Primary: In-app notifications via WebSocket/SSE
    email = "email"    # Secondary: Email notifications (optional)
    push = "push"      # Tertiary: Push notifications (optional)
    webhook = "webhook"  # Optional: Webhook notifications


# Alias for compatibility with alert_service.py
AlertStatus = DeliveryStatus


class Alert(TimestampMixin, table=True):
    """
    Alert model for scheduled task reminders.

    Alerts are scheduled via Dapr Jobs API and delivered through
    multiple notification channels. Includes delivery tracking
    and retry logic for reliable notification delivery.

    Indexes:
    - Primary key on alert_id (UUID)
    - Index on task_id for task-scoped queries
    - Index on user_id for user isolation
    - Index on alert_time for scheduling queries
    - Index on delivery_status for processing queries
    - Composite index on (user_id, alert_time) for user timeline
    - Composite index on (delivery_status, alert_time) for job processing
    """

    __tablename__ = "alerts"

    # Primary key - UUID for distributed systems
    alert_id: str = Field(
        default_factory=lambda: str(uuid4()),
        primary_key=True,
        description="Unique alert identifier (UUID v4)",
    )

    # Foreign key to tasks (UUID string to match Task.id)
    task_id: str = Field(
        index=True,
        nullable=False,
        description="Associated task ID (UUID)",
    )

    # User isolation - CRITICAL for security
    user_id: str = Field(
        index=True,
        nullable=False,
        description="Better Auth user ID for isolation",
    )

    # Alert timing
    alert_time: datetime = Field(
        index=True,
        nullable=False,
        description="Scheduled alert time (UTC)",
    )

    # Notification channels as JSON array
    # Example: ["in_app", "email", "push"]
    # Default: in_app only (no email required)
    notification_channels: list[str] = Field(
        default_factory=lambda: ["in_app"],
        sa_column=Column(JSONB, nullable=False, server_default='["in_app"]'),
        description="List of notification channels to use",
    )

    # Delivery status tracking
    delivery_status: DeliveryStatus = Field(
        default=DeliveryStatus.pending,
        index=True,
        description="Current delivery status",
    )

    # Retry tracking
    delivery_attempts: int = Field(
        default=0,
        ge=0,
        description="Number of delivery attempts",
    )

    # Failure reason for debugging
    failed_reason: Optional[str] = Field(
        default=None,
        max_length=1000,
        description="Reason for delivery failure (if any)",
    )

    # Dapr Job ID for cancellation
    dapr_job_id: Optional[str] = Field(
        default=None,
        max_length=255,
        description="Dapr Jobs API job identifier",
    )

    # Delivery timestamp
    delivered_at: Optional[datetime] = Field(
        default=None,
        description="When alert was delivered (UTC)",
    )

    # created_at and updated_at inherited from TimestampMixin


class AlertCreate(SQLModel):
    """Schema for creating new alerts."""

    task_id: str = Field(..., description="Associated task ID")
    alert_time: datetime = Field(..., description="Scheduled alert time (UTC)")
    notification_channels: list[str] = Field(
        default_factory=lambda: ["in_app"],
        description="Notification channels to use (in_app, email, push, webhook)",
    )


class AlertUpdate(SQLModel):
    """Schema for updating alerts."""

    alert_time: Optional[datetime] = Field(None, description="New alert time (UTC)")
    notification_channels: Optional[list[str]] = Field(
        None, description="Updated notification channels"
    )
    delivery_status: Optional[DeliveryStatus] = Field(
        None, description="Updated delivery status"
    )
    failed_reason: Optional[str] = Field(None, description="Failure reason")


class AlertResponse(SQLModel):
    """Schema for alert API responses."""

    alert_id: str
    task_id: str
    user_id: str
    alert_time: datetime
    notification_channels: list[str]
    delivery_status: DeliveryStatus
    delivery_attempts: int
    failed_reason: Optional[str]
    dapr_job_id: Optional[str]
    delivered_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
