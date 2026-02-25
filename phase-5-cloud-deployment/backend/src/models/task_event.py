"""
TaskEvent model for the Todo application Phase V.
Defines the database schema for event sourcing and audit trail.

Phase V Event Sourcing:
- All task mutations publish CloudEvents to Kafka
- Event versioning for schema evolution
- Audit trail for compliance
- Replay capability for debugging
"""

from datetime import datetime
from typing import Any, Optional
from uuid import uuid4

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


class TaskEvent(SQLModel, table=True):
    """
    TaskEvent model for event sourcing.

    Stores all task-related events for audit trail, replay capability,
    and event-driven architecture. Events are published to Kafka via
    Dapr Pub/Sub and stored in the database for querying.

    Indexes:
    - Primary key on event_id (UUID)
    - Index on event_type for type-based queries
    - Index on user_id for user isolation
    - Index on task_id for task history
    - Index on occurred_at for time-based queries
    - Composite indexes for common query patterns
    - Partial index on published_to_kafka for replay queries
    """

    __tablename__ = "task_events"

    # Primary key - UUID for CloudEvents id
    event_id: str = Field(
        default_factory=lambda: str(uuid4()),
        primary_key=True,
        description="Unique event identifier (CloudEvents id)",
    )

    # Event type discriminator
    event_type: str = Field(
        index=True,
        nullable=False,
        max_length=100,
        description="Event type (task.created, task.completed, task.deleted, etc.)",
    )

    # User isolation - CRITICAL for security
    user_id: str = Field(
        index=True,
        nullable=False,
        description="Better Auth user ID for isolation and partitioning",
    )

    # Related task (nullable for deleted tasks)
    task_id: Optional[str] = Field(
        default=None,
        index=True,
        description="Associated task ID (may be NULL if task was deleted)",
    )

    # Event payload as JSONB for flexibility
    payload: dict[str, Any] = Field(
        default_factory=dict,
        sa_column=Column(JSONB, nullable=False, server_default="{}"),
        description="Event-specific payload data",
    )

    # Event timestamp (when event occurred)
    occurred_at: datetime = Field(
        default_factory=datetime.utcnow,
        index=True,
        nullable=False,
        description="When the event occurred (UTC)",
    )

    # Schema version for evolution
    event_version: str = Field(
        default="1.0",
        max_length=10,
        nullable=False,
        description="Event schema version (major.minor format)",
    )

    # CloudEvents metadata
    source: str = Field(
        default="backend",
        max_length=255,
        nullable=False,
        description="CloudEvents source (service that produced the event)",
    )

    specversion: str = Field(
        default="1.0",
        max_length=10,
        nullable=False,
        description="CloudEvents specification version",
    )

    # Processing metadata
    published_to_kafka: bool = Field(
        default=False,
        nullable=False,
        description="Whether event was successfully published to Kafka",
    )

    kafka_topic: Optional[str] = Field(
        default=None,
        max_length=255,
        description="Kafka topic where event was published",
    )

    kafka_partition: Optional[int] = Field(
        default=None,
        description="Kafka partition where event was published",
    )

    kafka_offset: Optional[int] = Field(
        default=None,
        description="Kafka offset of published event",
    )


class TaskEventCreate(SQLModel):
    """Schema for creating new task events."""

    event_type: str = Field(..., description="Event type")
    user_id: str = Field(..., description="User ID")
    task_id: Optional[str] = Field(None, description="Task ID")
    payload: dict[str, Any] = Field(default_factory=dict, description="Event payload")
    event_version: str = Field(default="1.0", description="Event schema version")


class TaskEventResponse(SQLModel):
    """Schema for task event API responses."""

    event_id: str
    event_type: str
    user_id: str
    task_id: Optional[str]
    payload: dict[str, Any]
    occurred_at: datetime
    event_version: str
    source: str
    specversion: str
    published_to_kafka: bool
    kafka_topic: Optional[str]
    kafka_partition: Optional[int]
    kafka_offset: Optional[int]


class TaskEventQuery(SQLModel):
    """Schema for querying task events."""

    event_type: Optional[str] = Field(None, description="Filter by event type")
    task_id: Optional[str] = Field(None, description="Filter by task ID")
    start_date: Optional[datetime] = Field(None, description="Start of date range")
    end_date: Optional[datetime] = Field(None, description="End of date range")
    limit: int = Field(default=50, ge=1, le=1000, description="Max results")
    offset: int = Field(default=0, ge=0, description="Pagination offset")
