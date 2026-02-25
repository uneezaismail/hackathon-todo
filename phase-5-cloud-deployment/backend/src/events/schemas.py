"""
CloudEvents 1.0 Compliant Event Schemas - Phase V

This module defines event schemas for the Todo application event-driven architecture.
All events follow the CloudEvents 1.0 specification: https://cloudevents.io/

Event Types:
- task.created: New task created
- task.updated: Task fields modified
- task.completed: Task marked complete (triggers recurring service)
- task.deleted: Task removed
- alert.scheduled: Alert scheduled via Dapr Jobs
- alert.fired: Alert time reached and notification sent

Usage:
    event = TaskCompletedEvent(
        user_id="user-456",
        task_id=123,
        payload=TaskCompletedPayload(
            task_title="Daily standup",
            completed_at=datetime.utcnow(),
            recurring_pattern="DAILY"
        )
    )
    event_dict = event.model_dump()
"""

from datetime import datetime, timezone
from typing import Any, Optional
from uuid import uuid4

from pydantic import BaseModel, Field, field_validator


def utc_now_iso() -> str:
    """Return current UTC time in ISO 8601 format with Z suffix."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def generate_event_id() -> str:
    """Generate unique event ID for idempotency."""
    return str(uuid4())


class EventSchema(BaseModel):
    """
    Base CloudEvents 1.0 schema.

    All events MUST include:
    - event_id: Unique identifier for idempotency
    - event_type: Event type discriminator
    - event_version: Schema version for evolution
    - timestamp: Event creation time (UTC)
    - user_id: User context for isolation and partitioning (CRITICAL)
    - task_id: Related task ID
    - payload: Event-specific data
    - specversion: CloudEvents spec version (always "1.0")
    - source: Service that produced the event
    """

    # CloudEvents required fields
    specversion: str = Field(default="1.0", description="CloudEvents specification version")
    event_id: str = Field(default_factory=generate_event_id, alias="id", description="Unique event identifier")
    event_type: str = Field(..., alias="type", description="Event type discriminator")
    source: str = Field(default="backend", description="Service that produced the event")
    timestamp: str = Field(default_factory=utc_now_iso, alias="time", description="Event creation time (UTC ISO 8601)")

    # Application-specific fields
    event_version: str = Field(default="1.0", description="Event schema version (major.minor)")
    user_id: str = Field(..., description="User ID for isolation and Kafka partitioning")
    task_id: str = Field(..., description="Related task ID (UUID string)")
    payload: dict[str, Any] = Field(default_factory=dict, alias="data", description="Event-specific payload")

    @field_validator("timestamp")
    @classmethod
    def validate_timestamp_utc(cls, v: str) -> str:
        """Ensure timestamp is ISO 8601 UTC format with 'Z' suffix."""
        if not v.endswith("Z"):
            raise ValueError("Timestamp must be in UTC with 'Z' suffix")
        try:
            datetime.fromisoformat(v.replace("Z", "+00:00"))
        except ValueError as e:
            raise ValueError(f"Timestamp must be valid ISO 8601 format: {e}")
        return v

    @field_validator("user_id")
    @classmethod
    def validate_user_id_not_empty(cls, v: str) -> str:
        """Ensure user_id is not empty (required for partitioning)."""
        if not v or not v.strip():
            raise ValueError("user_id must not be empty")
        return v

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "specversion": "1.0",
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "type": "task.completed",
                "source": "backend",
                "time": "2026-01-17T12:00:00Z",
                "event_version": "1.0",
                "user_id": "user-123",
                "task_id": 456,
                "data": {},
            }
        },
    }


# ============================================================================
# Task Event Payloads
# ============================================================================


class TaskCreatedPayload(BaseModel):
    """Payload for task.created event."""

    task_title: str = Field(..., description="Task title")
    task_description: Optional[str] = Field(None, description="Task description")
    priority: str = Field(default="Medium", description="Task priority (High/Medium/Low)")
    due_date: Optional[str] = Field(None, description="Due date (ISO 8601 date)")
    recurring_pattern: Optional[str] = Field(None, description="RRULE pattern for recurring tasks")
    is_pattern: bool = Field(default=False, description="Whether this is a recurring pattern template")


class TaskUpdatedPayload(BaseModel):
    """Payload for task.updated event."""

    task_title: str = Field(..., description="Updated task title")
    changed_fields: list[str] = Field(default_factory=list, description="List of changed field names")
    previous_values: dict[str, Any] = Field(default_factory=dict, description="Previous values of changed fields")
    new_values: dict[str, Any] = Field(default_factory=dict, description="New values of changed fields")


class TaskCompletedPayload(BaseModel):
    """Payload for task.completed event."""

    task_title: str = Field(..., description="Task title")
    completed_at: str = Field(..., description="Completion timestamp (UTC ISO 8601)")
    recurring_pattern: Optional[str] = Field(None, description="RRULE pattern for recurring tasks")
    recurring_end_date: Optional[str] = Field(None, description="When recurrence should stop (UTC ISO 8601)")
    next_occurrence_due: Optional[str] = Field(None, description="Calculated next occurrence (UTC ISO 8601)")
    is_pattern: bool = Field(default=False, description="Whether completed task was a pattern")
    parent_task_id: Optional[str] = Field(None, description="Parent recurring task ID (UUID string)")


class TaskDeletedPayload(BaseModel):
    """Payload for task.deleted event."""

    task_title: str = Field(..., description="Deleted task title")
    deleted_at: str = Field(..., description="Deletion timestamp (UTC ISO 8601)")
    was_recurring: bool = Field(default=False, description="Whether deleted task was recurring")
    cascade_deleted_count: int = Field(default=0, description="Number of child tasks also deleted")


# ============================================================================
# Alert Event Payloads
# ============================================================================


class AlertScheduledPayload(BaseModel):
    """Payload for alert.scheduled event."""

    alert_id: str = Field(..., description="Alert UUID")
    alert_time: str = Field(..., description="Scheduled alert time (UTC ISO 8601)")
    notification_channels: list[str] = Field(default_factory=lambda: ["email"], description="Notification channels")
    dapr_job_id: str = Field(..., description="Dapr Jobs API job identifier")


class AlertFiredPayload(BaseModel):
    """Payload for alert.fired event."""

    alert_id: str = Field(..., description="Alert UUID")
    fired_at: str = Field(..., description="When alert fired (UTC ISO 8601)")
    delivery_status: str = Field(..., description="Delivery status (delivered/failed)")
    channels_notified: list[str] = Field(default_factory=list, description="Channels that received notification")
    failed_channels: list[str] = Field(default_factory=list, description="Channels that failed")


# ============================================================================
# Typed Event Classes
# ============================================================================


class TaskCreatedEvent(EventSchema):
    """Task creation event."""

    event_type: str = Field(default="task.created", alias="type")
    payload: TaskCreatedPayload = Field(..., alias="data")


class TaskUpdatedEvent(EventSchema):
    """Task update event."""

    event_type: str = Field(default="task.updated", alias="type")
    payload: TaskUpdatedPayload = Field(..., alias="data")


class TaskCompletedEvent(EventSchema):
    """Task completion event - triggers recurring service."""

    event_type: str = Field(default="task.completed", alias="type")
    payload: TaskCompletedPayload = Field(..., alias="data")


class TaskDeletedEvent(EventSchema):
    """Task deletion event."""

    event_type: str = Field(default="task.deleted", alias="type")
    payload: TaskDeletedPayload = Field(..., alias="data")


class AlertScheduledEvent(EventSchema):
    """Alert scheduled event."""

    event_type: str = Field(default="alert.scheduled", alias="type")
    payload: AlertScheduledPayload = Field(..., alias="data")


class AlertFiredEvent(EventSchema):
    """Alert fired event."""

    event_type: str = Field(default="alert.fired", alias="type")
    payload: AlertFiredPayload = Field(..., alias="data")
