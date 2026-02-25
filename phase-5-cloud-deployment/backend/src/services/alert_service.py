"""
Alert Service - Phase V (User Story 2) - Database-Backed Implementation

Manages alert scheduling and cancellation using Dapr Jobs API with PostgreSQL persistence.
Alerts are scheduled to fire at a specific time, triggering notifications.

Architecture:
- schedule_alert(): Creates alert in DB and schedules Dapr job
- _schedule_job(): Calls Dapr Jobs API to schedule
- cancel_alert(): Cancels alert in DB and cancels Dapr job
- _cancel_job(): Calls Dapr Jobs API to cancel
- Job callback triggers notification service via Dapr Pub/Sub

All times are UTC (timezone.utc).
All operations include user_id for user isolation.
All alerts persisted to PostgreSQL for reliability.
"""

import logging
import os
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from uuid import uuid4
import httpx

from sqlmodel import Session, select
from src.models.alert import Alert, AlertStatus, NotificationChannel, DeliveryStatus
from src.events.publisher import EventPublisher
from src.db.session import get_session

logger = logging.getLogger(__name__)


class AlertService:
    """
    Manage alerts using Dapr Jobs API for scheduling with PostgreSQL persistence.

    The service integrates with Dapr sidecar (port 3500) to:
    1. Schedule jobs (Dapr Jobs API)
    2. Cancel jobs (Dapr Jobs API)
    3. Publish alert.fired events (Dapr Pub/Sub)

    Jobs are scheduled with a callback URL that Dapr will call when the job fires.
    All alerts are persisted to PostgreSQL for reliability and recovery.
    """

    def __init__(
        self,
        dapr_port: int | None = None,
        pubsub_name: str = "kafka-pubsub",
        alert_topic: str = "alert-events",
    ):
        """
        Initialize alert service.

        Args:
            dapr_port: Dapr sidecar HTTP port (default: 3500 from env or 3500)
            pubsub_name: Dapr Pub/Sub component name
            alert_topic: Kafka topic for alert events
        """
        self.dapr_port = dapr_port or int(os.getenv("DAPR_HTTP_PORT", "3500"))
        self.pubsub_name = pubsub_name
        self.alert_topic = alert_topic
        self._base_url = f"http://localhost:{self.dapr_port}"
        self.publisher = EventPublisher(dapr_port=self.dapr_port)

    async def schedule_alert(
        self,
        session: Session,
        task_id: str,
        user_id: str,
        alert_time: datetime,
        notification_channels: List[NotificationChannel],
        task_title: str,
        max_retries: int = 3,
    ) -> Optional[Alert]:
        """
        Schedule an alert for a task with database persistence.

        Creates alert record in PostgreSQL and schedules Dapr job to fire at alert_time.
        When job fires, Dapr will POST to the job handler endpoint with alert data.

        Args:
            session: Database session
            task_id: Task ID to alert for
            user_id: User ID (for user isolation)
            alert_time: When alert should fire (UTC)
            notification_channels: List of channels (EMAIL, PUSH, WEBHOOK)
            task_title: Title of task (for notification content)
            max_retries: Max retries for job scheduling

        Returns:
            Alert object if successful, None on failure

        Raises:
            ValueError: If alert_time is not in UTC or is in the past
        """
        # Validate time is UTC
        if alert_time.tzinfo is None or alert_time.tzinfo != timezone.utc:
            raise ValueError("alert_time must be in UTC (timezone.utc)")

        # Validate time is in future
        if alert_time <= datetime.now(timezone.utc):
            raise ValueError("alert_time must be in the future")

        # Create alert object
        alert_id = str(uuid4())
        alert = Alert(
            alert_id=alert_id,
            task_id=str(task_id),
            user_id=user_id,
            alert_time=alert_time,
            notification_channels=[ch.value if isinstance(ch, NotificationChannel) else ch for ch in notification_channels],
            delivery_status=DeliveryStatus.pending,
            delivery_attempts=0,
        )

        # Try to schedule job with retries
        for attempt in range(max_retries):
            try:
                job_id = await self._schedule_job(
                    alert_id=alert_id,
                    alert_time=alert_time,
                    task_id=task_id,
                    user_id=user_id,
                )

                if job_id:
                    # Store Dapr job ID
                    alert.dapr_job_id = job_id
                    alert.delivery_status = DeliveryStatus.scheduled

                    # Persist to database
                    session.add(alert)
                    session.commit()
                    session.refresh(alert)

                    logger.info(
                        f"Scheduled alert {alert_id} for task {task_id} at {alert_time} "
                        f"(job_id={job_id})"
                    )
                    return alert

            except Exception as e:
                logger.warning(f"Alert scheduling attempt {attempt + 1} failed: {e}")
                if attempt < max_retries - 1:
                    # Exponential backoff
                    await asyncio.sleep(2 ** attempt)

        logger.error(
            f"Failed to schedule alert {alert_id} after {max_retries} attempts"
        )
        return None

    async def _schedule_job(
        self,
        alert_id: str,
        alert_time: datetime,
        task_id: str,
        user_id: str,
    ) -> Optional[str]:
        """
        Schedule job via Dapr Jobs API.

        Calls Dapr Jobs API to schedule a one-time job that fires at alert_time.
        Dapr will POST to the job handler endpoint when the job fires.

        Args:
            alert_id: Unique alert ID
            alert_time: When job should fire (ISO 8601 format)
            task_id: Task ID
            user_id: User ID

        Returns:
            Job ID if scheduled, None otherwise
        """
        try:
            job_name = f"alert-{alert_id}"
            due_time = alert_time.isoformat()  # ISO 8601 format

            # Dapr Jobs API payload
            job_payload = {
                "dueTime": due_time,
                "data": {
                    "alert_id": alert_id,
                    "task_id": task_id,
                    "user_id": user_id,
                },
            }

            # Schedule job via Dapr Jobs API
            url = f"{self._base_url}/v1.0-alpha1/jobs/{job_name}"

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, json=job_payload)

                if response.status_code in [200, 201, 202]:
                    logger.debug(f"Job scheduled: {job_name}")
                    return job_name
                else:
                    logger.warning(
                        f"Job scheduling failed: {response.status_code} - {response.text}"
                    )
                    return None

        except Exception as e:
            logger.error(f"Error scheduling job: {e}")
            return None

    async def cancel_alert(self, session: Session, alert_id: str) -> bool:
        """
        Cancel a scheduled alert with database update.

        Removes alert from database and cancels corresponding Dapr job.

        Args:
            session: Database session
            alert_id: Alert ID to cancel

        Returns:
            True if alert was canceled, False if not found
        """
        # Get alert from database
        statement = select(Alert).where(Alert.alert_id == alert_id)
        alert = session.exec(statement).first()

        if not alert:
            logger.warning(f"Alert not found: {alert_id}")
            return False

        # Cancel Dapr job
        success = await self._cancel_job(alert_id)

        if success:
            # Update alert status in database
            alert.delivery_status = DeliveryStatus.cancelled
            session.add(alert)
            session.commit()

            logger.info(f"Canceled alert {alert_id}")
            return True

        return False

    async def _cancel_job(self, alert_id: str) -> bool:
        """
        Cancel job via Dapr Jobs API.

        Args:
            alert_id: Alert ID whose job should be canceled

        Returns:
            True if job was canceled, False otherwise
        """
        try:
            job_name = f"alert-{alert_id}"
            url = f"{self._base_url}/v1.0-alpha1/jobs/{job_name}"

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.delete(url)

                if response.status_code in [200, 204]:
                    logger.debug(f"Job canceled: {job_name}")
                    return True
                elif response.status_code == 404:
                    # Job already completed or doesn't exist
                    logger.debug(f"Job not found (already fired?): {job_name}")
                    return True
                else:
                    logger.warning(
                        f"Job cancellation failed: {response.status_code}"
                    )
                    return False

        except Exception as e:
            logger.error(f"Error canceling job: {e}")
            return False

    async def get_task_alerts(
        self,
        session: Session,
        task_id: str,
        user_id: str,
    ) -> List[Alert]:
        """
        Get all alerts for a task from database.

        Filters by user_id for user isolation.

        Args:
            session: Database session
            task_id: Task ID
            user_id: User ID (for user isolation)

        Returns:
            List of alerts for the task
        """
        statement = (
            select(Alert)
            .where(Alert.task_id == task_id)
            .where(Alert.user_id == user_id)
            .order_by(Alert.alert_time.desc())
        )
        alerts = session.exec(statement).all()
        return list(alerts)

    async def cancel_all_for_task(
        self,
        session: Session,
        task_id: str,
        user_id: str,
    ) -> List[bool]:
        """
        Cancel all alerts for a task from database.

        Used when task is completed or deleted.

        Args:
            session: Database session
            task_id: Task ID
            user_id: User ID (for user isolation)

        Returns:
            List of cancellation results
        """
        alerts = await self.get_task_alerts(session, task_id, user_id)
        results = []

        for alert in alerts:
            result = await self.cancel_alert(session, alert.alert_id)
            results.append(result)

        return results

    async def record_delivery_attempt(
        self,
        session: Session,
        alert_id: str,
        success: bool,
        error: str | None = None,
    ) -> None:
        """
        Record a delivery attempt for an alert in database.

        Used by notification service to track delivery status.

        Args:
            session: Database session
            alert_id: Alert ID
            success: Whether delivery succeeded
            error: Error message if failed
        """
        statement = select(Alert).where(Alert.alert_id == alert_id)
        alert = session.exec(statement).first()

        if not alert:
            logger.warning(f"Alert not found: {alert_id}")
            return

        alert.delivery_attempts += 1

        if success:
            alert.delivery_status = DeliveryStatus.delivered
            alert.delivered_at = datetime.now(timezone.utc)
        else:
            alert.delivery_status = DeliveryStatus.failed
            alert.failed_reason = error or "Unknown error"

        session.add(alert)
        session.commit()

        logger.info(
            f"Recorded delivery attempt for alert {alert_id}: "
            f"{'success' if success else 'failed'}"
        )

    async def update_delivery_status(
        self,
        session: Session,
        alert_id: str,
        status: DeliveryStatus,
        error: str | None = None,
    ) -> None:
        """
        Update alert delivery status in database.

        Args:
            session: Database session
            alert_id: Alert ID
            status: New delivery status
            error: Error message if failed
        """
        statement = select(Alert).where(Alert.alert_id == alert_id)
        alert = session.exec(statement).first()

        if not alert:
            logger.warning(f"Alert not found: {alert_id}")
            return

        alert.delivery_status = status

        if error:
            alert.failed_reason = error

        if status == DeliveryStatus.delivered:
            alert.delivered_at = datetime.now(timezone.utc)

        session.add(alert)
        session.commit()

        logger.info(f"Updated alert {alert_id} status to {status}")

    def get_retry_config(self) -> dict:
        """
        Get retry configuration for alert delivery.

        Returns:
            Dict with retry strategy: initial_delay, backoff_factor, max_retries
        """
        return {
            "initial_delay": 1,  # 1 second
            "backoff_factor": 2,  # Exponential backoff
            "max_retries": 10,  # Up to 10 retries (1s, 2s, 4s, 8s, 16s, 32s, 64s, 128s, 256s, 512s)
        }
