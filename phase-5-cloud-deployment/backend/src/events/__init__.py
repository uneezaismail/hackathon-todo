"""
Phase V Event Infrastructure

This package provides event-driven architecture support for the Todo application:

- schemas: CloudEvents 1.0 compliant event models
- publisher: Dapr Pub/Sub publisher for Kafka
- idempotency: Event deduplication using Dapr State Store

Usage:
    from src.events import EventPublisher, TaskCreatedEvent, TaskCompletedEvent

    publisher = EventPublisher()
    await publisher.publish_task_created(task_id=123, user_id="user-456", payload={...})
"""

from src.events.schemas import (
    EventSchema,
    TaskCreatedEvent,
    TaskCompletedEvent,
    TaskDeletedEvent,
    TaskUpdatedEvent,
    AlertScheduledEvent,
    AlertFiredEvent,
)
from src.events.publisher import EventPublisher
from src.events.idempotency import IdempotencyService

__all__ = [
    # Event schemas
    "EventSchema",
    "TaskCreatedEvent",
    "TaskCompletedEvent",
    "TaskDeletedEvent",
    "TaskUpdatedEvent",
    "AlertScheduledEvent",
    "AlertFiredEvent",
    # Services
    "EventPublisher",
    "IdempotencyService",
]
