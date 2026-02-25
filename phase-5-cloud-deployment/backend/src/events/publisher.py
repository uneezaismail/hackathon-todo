"""
Dapr Pub/Sub Event Publisher - Phase V

This module provides the EventPublisher class for publishing events
to Kafka via Dapr's Pub/Sub API (HTTP localhost:3500).

CRITICAL: Dapr sidecar MUST be running for publishing to work.
In Kubernetes, this is automatic with dapr.io/enabled annotation.
In local development, use: dapr run --app-id backend --app-port 8000 -- uvicorn ...

Usage:
    publisher = EventPublisher()

    # Check if Dapr sidecar is healthy
    if await publisher.check_health():
        await publisher.publish_task_completed(
            task_id=123,
            user_id="user-456",
            payload={...}
        )
"""

import asyncio
import logging
import os
from datetime import datetime, timezone
from typing import Any, Optional
from uuid import uuid4

import httpx

from src.events.schemas import (
    EventSchema,
    TaskCreatedEvent,
    TaskCreatedPayload,
    TaskCompletedEvent,
    TaskCompletedPayload,
    TaskUpdatedEvent,
    TaskUpdatedPayload,
    TaskDeletedEvent,
    TaskDeletedPayload,
    AlertScheduledEvent,
    AlertScheduledPayload,
    AlertFiredEvent,
    AlertFiredPayload,
)

logger = logging.getLogger(__name__)


class EventPublisher:
    """
    Publish events to Kafka via Dapr Pub/Sub HTTP API.

    All events are published to Dapr sidecar at localhost:3500.
    Dapr handles Kafka producer complexity (batching, retries, etc.).

    Attributes:
        dapr_port: Dapr sidecar HTTP port (default: 3500)
        pubsub_name: Dapr Pub/Sub component name (default: kafka-pubsub)
        task_events_topic: Topic for task events (default: task-events)
        alert_events_topic: Topic for alert events (default: alert-events)
    """

    def __init__(
        self,
        dapr_port: int | None = None,
        pubsub_name: str | None = None,
        task_events_topic: str = "task-events",
        alert_events_topic: str = "alert-events",
    ):
        self.dapr_port = dapr_port or int(os.getenv("DAPR_HTTP_PORT", "3500"))
        self.pubsub_name = pubsub_name or os.getenv("PUBSUB_NAME", "kafka-pubsub")
        self.task_events_topic = task_events_topic
        self.alert_events_topic = alert_events_topic
        self._base_url = f"http://localhost:{self.dapr_port}"

    async def check_health(self) -> bool:
        """
        Check if Dapr sidecar is running and healthy.

        Returns:
            True if sidecar is healthy, False otherwise.
        """
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self._base_url}/v1.0/healthz")
                return response.status_code == 200
        except Exception as e:
            logger.warning(f"Dapr sidecar health check failed: {e}")
            return False

    async def _publish(
        self,
        topic: str,
        event: EventSchema,
        max_retries: int = 3,
    ) -> bool:
        """
        Publish event to Dapr Pub/Sub with retry logic.

        Args:
            topic: Kafka topic name
            event: Event to publish
            max_retries: Maximum retry attempts

        Returns:
            True if published successfully, False otherwise
        """
        url = f"{self._base_url}/v1.0/publish/{self.pubsub_name}/{topic}"

        # Serialize event to CloudEvents format
        event_data = event.model_dump(by_alias=True, mode="json")

        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.post(
                        url,
                        json=event_data,
                        headers={
                            "Content-Type": "application/cloudevents+json",
                        },
                    )
                    response.raise_for_status()

                    logger.info(
                        f"Published event {event.event_type} to {topic}",
                        extra={
                            "event_id": event.event_id,
                            "event_type": event.event_type,
                            "user_id": event.user_id,
                            "task_id": event.task_id,
                            "topic": topic,
                        },
                    )
                    return True

            except httpx.HTTPStatusError as e:
                logger.error(
                    f"Failed to publish event (attempt {attempt + 1}/{max_retries}): {e}",
                    extra={"event_id": event.event_id, "status_code": e.response.status_code},
                )
                if attempt < max_retries - 1:
                    await asyncio.sleep(2**attempt)  # Exponential backoff

            except httpx.RequestError as e:
                logger.error(
                    f"Network error publishing event (attempt {attempt + 1}/{max_retries}): {e}",
                    extra={"event_id": event.event_id},
                )
                if attempt < max_retries - 1:
                    await asyncio.sleep(2**attempt)

        return False

    # =========================================================================
    # Task Event Publishers
    # =========================================================================

    async def publish_task_created(
        self,
        task_id: int,
        user_id: str,
        task_title: str,
        task_description: str | None = None,
        priority: str = "Medium",
        due_date: str | None = None,
        recurring_pattern: str | None = None,
        is_pattern: bool = False,
    ) -> bool:
        """Publish task.created event."""
        event = TaskCreatedEvent(
            user_id=user_id,
            task_id=task_id,
            payload=TaskCreatedPayload(
                task_title=task_title,
                task_description=task_description,
                priority=priority,
                due_date=due_date,
                recurring_pattern=recurring_pattern,
                is_pattern=is_pattern,
            ),
        )
        return await self._publish(self.task_events_topic, event)

    async def publish_task_updated(
        self,
        task_id: int,
        user_id: str,
        task_title: str,
        changed_fields: list[str],
        previous_values: dict[str, Any],
        new_values: dict[str, Any],
    ) -> bool:
        """Publish task.updated event."""
        event = TaskUpdatedEvent(
            user_id=user_id,
            task_id=task_id,
            payload=TaskUpdatedPayload(
                task_title=task_title,
                changed_fields=changed_fields,
                previous_values=previous_values,
                new_values=new_values,
            ),
        )
        return await self._publish(self.task_events_topic, event)

    async def publish_task_completed(
        self,
        task_id: int,
        user_id: str,
        task_title: str,
        recurring_pattern: str | None = None,
        recurring_end_date: str | None = None,
        next_occurrence_due: str | None = None,
        is_pattern: bool = False,
        parent_task_id: int | None = None,
    ) -> bool:
        """
        Publish task.completed event.

        This event triggers the Recurring Task Service to create
        the next occurrence for recurring tasks.
        """
        completed_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

        event = TaskCompletedEvent(
            user_id=user_id,
            task_id=task_id,
            payload=TaskCompletedPayload(
                task_title=task_title,
                completed_at=completed_at,
                recurring_pattern=recurring_pattern,
                recurring_end_date=recurring_end_date,
                next_occurrence_due=next_occurrence_due,
                is_pattern=is_pattern,
                parent_task_id=parent_task_id,
            ),
        )
        return await self._publish(self.task_events_topic, event)

    async def publish_task_deleted(
        self,
        task_id: int,
        user_id: str,
        task_title: str,
        was_recurring: bool = False,
        cascade_deleted_count: int = 0,
    ) -> bool:
        """Publish task.deleted event."""
        deleted_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

        event = TaskDeletedEvent(
            user_id=user_id,
            task_id=task_id,
            payload=TaskDeletedPayload(
                task_title=task_title,
                deleted_at=deleted_at,
                was_recurring=was_recurring,
                cascade_deleted_count=cascade_deleted_count,
            ),
        )
        return await self._publish(self.task_events_topic, event)

    # =========================================================================
    # Alert Event Publishers
    # =========================================================================

    async def publish_alert_scheduled(
        self,
        task_id: int,
        user_id: str,
        alert_id: str,
        alert_time: str,
        dapr_job_id: str,
        notification_channels: list[str] | None = None,
    ) -> bool:
        """Publish alert.scheduled event."""
        event = AlertScheduledEvent(
            user_id=user_id,
            task_id=task_id,
            payload=AlertScheduledPayload(
                alert_id=alert_id,
                alert_time=alert_time,
                notification_channels=notification_channels or ["email"],
                dapr_job_id=dapr_job_id,
            ),
        )
        return await self._publish(self.alert_events_topic, event)

    async def publish_alert_fired(
        self,
        task_id: int,
        user_id: str,
        alert_id: str,
        delivery_status: str,
        channels_notified: list[str] | None = None,
        failed_channels: list[str] | None = None,
    ) -> bool:
        """Publish alert.fired event."""
        fired_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

        event = AlertFiredEvent(
            user_id=user_id,
            task_id=task_id,
            payload=AlertFiredPayload(
                alert_id=alert_id,
                fired_at=fired_at,
                delivery_status=delivery_status,
                channels_notified=channels_notified or [],
                failed_channels=failed_channels or [],
            ),
        )
        return await self._publish(self.alert_events_topic, event)


# Global publisher instance (lazy initialization)
_publisher: EventPublisher | None = None


def get_event_publisher() -> EventPublisher:
    """Get or create global EventPublisher instance."""
    global _publisher
    if _publisher is None:
        _publisher = EventPublisher()
    return _publisher
