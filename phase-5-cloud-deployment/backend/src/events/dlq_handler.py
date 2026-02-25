"""
Dead Letter Queue (DLQ) Handler - Phase V

Handles failed events that exceed max retry attempts.

Retry Strategies (per spec.md FR-020a):
- Alert events: 10 retries with exponential backoff (1s to 512s ≈ 17min total)
- Task completion events: 3 retries with exponential backoff (30s, 5min, 30min)
- Task update events: 5 retries with exponential backoff (1s to 16s ≈ 31s total)

DLQ Retention Periods (per spec.md FR-020c):
- Alert events: 7-day retention
- Task completion events: 30-day retention
- Task update events: 14-day retention

Alerting (per spec.md FR-020d, FR-020e):
- Alert operations team when events moved to DLQ
- Alert users when reminder notifications fail to deliver

Based on: .claude/skills/kafka-event-driven
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from enum import Enum
import httpx
import os

logger = logging.getLogger(__name__)


class EventType(str, Enum):
    """Event types with specific retry/DLQ strategies."""
    ALERT_FIRED = "alert.fired"
    TASK_COMPLETED = "task.completed"
    TASK_UPDATED = "task.updated"
    TASK_DELETED = "task.deleted"


# Retry strategies: [delay1, delay2, delay3, ...]
RETRY_STRATEGIES: Dict[EventType, list[int]] = {
    EventType.ALERT_FIRED: [1, 2, 4, 8, 16, 32, 64, 128, 256, 512],  # 1s to 512s (10 retries)
    EventType.TASK_COMPLETED: [30, 300, 1800],  # 30s, 5min, 30min (3 retries)
    EventType.TASK_UPDATED: [1, 2, 4, 8, 16],  # 1s to 16s (5 retries)
    EventType.TASK_DELETED: [1, 2, 4],  # 1s, 2s, 4s (3 retries)
}

# Max retry counts
MAX_RETRIES: Dict[EventType, int] = {
    EventType.ALERT_FIRED: 10,
    EventType.TASK_COMPLETED: 3,
    EventType.TASK_UPDATED: 5,
    EventType.TASK_DELETED: 3,
}

# DLQ retention periods (days)
DLQ_RETENTION: Dict[EventType, int] = {
    EventType.ALERT_FIRED: 7,      # 7 days
    EventType.TASK_COMPLETED: 30,  # 30 days
    EventType.TASK_UPDATED: 14,    # 14 days
    EventType.TASK_DELETED: 14,    # 14 days
}


class DLQHandler:
    """
    Dead Letter Queue handler for failed events.

    Responsibilities:
    - Move failed events to DLQ after max retries exceeded
    - Alert operations team
    - Alert users for failed alert notifications
    - Maintain DLQ retention policies
    """

    def __init__(self, dapr_port: int = 3500, pubsub_name: str = "kafka-pubsub"):
        """
        Initialize DLQ handler.

        Args:
            dapr_port: Dapr sidecar HTTP port
            pubsub_name: Dapr Pub/Sub component name
        """
        self.dapr_port = dapr_port or int(os.getenv("DAPR_HTTP_PORT", "3500"))
        self.pubsub_name = pubsub_name
        self._base_url = f"http://localhost:{self.dapr_port}"

    async def handle_failed_event(
        self,
        event: Dict[str, Any],
        error: Exception,
        retry_count: int
    ) -> None:
        """
        Handle failed event after max retries exceeded.

        Actions:
        1. Move event to DLQ topic (dlq-{original-topic})
        2. Alert operations team
        3. Alert user (if alert event)

        Args:
            event: Failed event data
            error: Exception that caused the failure
            retry_count: Number of retry attempts made

        Raises:
            httpx.HTTPStatusError: If DLQ publish fails
        """
        event_type = event.get("event_type")
        task_id = event.get("task_id")
        user_id = event.get("user_id")

        logger.error(
            f"Moving event to DLQ: event_type={event_type}, task_id={task_id}, "
            f"retry_count={retry_count}, error={error}"
        )

        # Determine DLQ topic
        dlq_topic = self._get_dlq_topic(event_type)

        # Add DLQ metadata
        dlq_event = {
            **event,
            "dlq_metadata": {
                "failed_at": datetime.now(timezone.utc).isoformat(),
                "error": str(error),
                "error_type": type(error).__name__,
                "retry_count": retry_count,
                "retention_days": self._get_retention_days(event_type)
            }
        }

        # Publish to DLQ topic
        try:
            await self._publish_to_dlq(dlq_topic, dlq_event)
            logger.info(
                f"Event moved to DLQ: topic={dlq_topic}, task_id={task_id}, "
                f"retention_days={dlq_event['dlq_metadata']['retention_days']}"
            )
        except Exception as e:
            logger.error(f"Failed to publish to DLQ: {e}")
            # Don't raise - we don't want to fail the consumer

        # Alert operations team
        await self._alert_ops_team(event, error, retry_count)

        # Alert user if alert notification failed
        if event_type == EventType.ALERT_FIRED.value:
            await self._alert_user_failed_notification(event)

    def _get_dlq_topic(self, event_type: str) -> str:
        """
        Get DLQ topic name for event type.

        Mapping:
        - alert.fired -> dlq-alert-events
        - task.completed -> dlq-task-events
        - task.updated -> dlq-task-events
        - task.deleted -> dlq-task-events

        Args:
            event_type: Event type string

        Returns:
            DLQ topic name
        """
        if event_type == EventType.ALERT_FIRED.value:
            return "dlq-alert-events"
        else:
            return "dlq-task-events"

    def _get_retention_days(self, event_type: str) -> int:
        """
        Get DLQ retention period for event type.

        Args:
            event_type: Event type string

        Returns:
            Retention period in days
        """
        try:
            event_enum = EventType(event_type)
            return DLQ_RETENTION.get(event_enum, 7)
        except ValueError:
            return 7  # Default 7 days

    async def _publish_to_dlq(self, topic: str, event: Dict[str, Any]) -> None:
        """
        Publish event to DLQ topic via Dapr Pub/Sub.

        Args:
            topic: DLQ topic name
            event: Event data with DLQ metadata

        Raises:
            httpx.HTTPStatusError: If publish fails
        """
        url = f"{self._base_url}/v1.0/publish/{self.pubsub_name}/{topic}"

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json=event)
            response.raise_for_status()

    async def _alert_ops_team(
        self,
        event: Dict[str, Any],
        error: Exception,
        retry_count: int
    ) -> None:
        """
        Alert operations team about failed event.

        In production, this would:
        - Send to PagerDuty/OpsGenie
        - Post to Slack #alerts channel
        - Create Jira ticket
        - Send email to ops@company.com

        Args:
            event: Failed event data
            error: Exception that caused failure
            retry_count: Number of retry attempts
        """
        event_type = event.get("event_type")
        task_id = event.get("task_id")
        user_id = event.get("user_id")

        alert_message = (
            f"🚨 Event moved to DLQ\n"
            f"Event Type: {event_type}\n"
            f"Task ID: {task_id}\n"
            f"User ID: {user_id}\n"
            f"Retry Count: {retry_count}\n"
            f"Error: {error}\n"
            f"Timestamp: {datetime.now(timezone.utc).isoformat()}"
        )

        logger.critical(f"OPS ALERT: {alert_message}")

        # TODO: Integrate with alerting system
        # await send_to_pagerduty(alert_message)
        # await send_to_slack("#alerts", alert_message)

    async def _alert_user_failed_notification(self, event: Dict[str, Any]) -> None:
        """
        Alert user that their notification failed to deliver.

        In production, this would:
        - Show in-app notification
        - Send fallback SMS
        - Update notification preferences

        Args:
            event: Failed alert event data
        """
        user_id = event.get("user_id")
        task_id = event.get("task_id")
        payload = event.get("payload", {})
        task_title = payload.get("task_title", f"Task {task_id}")

        logger.warning(
            f"User notification failed: user_id={user_id}, task_id={task_id}, "
            f"task_title={task_title}"
        )

        # TODO: Implement user notification
        # - Show in-app banner: "We couldn't send your reminder for '{task_title}'"
        # - Send fallback SMS if configured
        # - Update user's notification preferences

    def get_retry_delay(self, event_type: str, attempt: int) -> Optional[int]:
        """
        Get retry delay for event type and attempt number.

        Args:
            event_type: Event type string
            attempt: Retry attempt number (0-indexed)

        Returns:
            Delay in seconds, or None if max retries exceeded
        """
        try:
            event_enum = EventType(event_type)
            strategy = RETRY_STRATEGIES.get(event_enum, [])

            if attempt < len(strategy):
                return strategy[attempt]
            return None
        except ValueError:
            return None

    def get_max_retries(self, event_type: str) -> int:
        """
        Get max retry count for event type.

        Args:
            event_type: Event type string

        Returns:
            Max retry count
        """
        try:
            event_enum = EventType(event_type)
            return MAX_RETRIES.get(event_enum, 3)
        except ValueError:
            return 3  # Default 3 retries
