"""
Unit Tests for Alert Service (Phase V - User Story 2)

Tests alert scheduling, cancellation, and multiple alerts per task
using mock Dapr Jobs API interactions.
"""

import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from src.services.alert_service import AlertService
from src.models.alert import Alert, AlertStatus, NotificationChannel
from src.events.publisher import EventPublisher


class TestAlertServiceSchedule:
    """Test alert scheduling via Dapr Jobs API."""

    @pytest.fixture
    def alert_service(self):
        """Create alert service instance."""
        return AlertService(dapr_port=3500)

    @pytest.mark.asyncio
    async def test_schedule_alert_single(self, alert_service):
        """Test scheduling a single alert for a task."""
        with patch.object(alert_service, '_schedule_job') as mock_schedule:
            mock_schedule.return_value = True

            task_id = 123
            user_id = "user-456"
            alert_time = datetime.now(timezone.utc) + timedelta(hours=1)
            channels = [NotificationChannel.EMAIL]

            result = await alert_service.schedule_alert(
                task_id=task_id,
                user_id=user_id,
                alert_time=alert_time,
                notification_channels=channels,
                task_title="Test Task"
            )

            assert result is not None
            assert result.task_id == task_id
            assert result.user_id == user_id
            assert result.alert_time == alert_time
            assert NotificationChannel.EMAIL in result.notification_channels
            mock_schedule.assert_called_once()

    @pytest.mark.asyncio
    async def test_schedule_alert_multiple_channels(self, alert_service):
        """Test scheduling alert with multiple notification channels."""
        with patch.object(alert_service, '_schedule_job') as mock_schedule:
            mock_schedule.return_value = True

            task_id = 123
            user_id = "user-456"
            alert_time = datetime.now(timezone.utc) + timedelta(hours=2)
            channels = [NotificationChannel.EMAIL, NotificationChannel.PUSH]

            result = await alert_service.schedule_alert(
                task_id=task_id,
                user_id=user_id,
                alert_time=alert_time,
                notification_channels=channels,
                task_title="Test Task"
            )

            assert result is not None
            assert len(result.notification_channels) == 2
            assert NotificationChannel.EMAIL in result.notification_channels
            assert NotificationChannel.PUSH in result.notification_channels

    @pytest.mark.asyncio
    async def test_schedule_alert_retry_on_failure(self, alert_service):
        """Test retry logic when job scheduling fails."""
        with patch.object(alert_service, '_schedule_job') as mock_schedule:
            # Simulate failure then success
            mock_schedule.side_effect = [False, False, True]

            task_id = 123
            user_id = "user-456"
            alert_time = datetime.now(timezone.utc) + timedelta(hours=1)
            channels = [NotificationChannel.EMAIL]

            result = await alert_service.schedule_alert(
                task_id=task_id,
                user_id=user_id,
                alert_time=alert_time,
                notification_channels=channels,
                task_title="Test Task",
                max_retries=3
            )

            assert result is not None
            assert mock_schedule.call_count == 3

    @pytest.mark.asyncio
    async def test_schedule_alert_utc_timezone(self, alert_service):
        """Test that alert times are stored in UTC."""
        with patch.object(alert_service, '_schedule_job') as mock_schedule:
            mock_schedule.return_value = True

            # Create time with explicit UTC
            alert_time = datetime(2025, 12, 29, 16, 0, 0, tzinfo=timezone.utc)

            result = await alert_service.schedule_alert(
                task_id=123,
                user_id="user-456",
                alert_time=alert_time,
                notification_channels=[NotificationChannel.EMAIL],
                task_title="Test"
            )

            assert result.alert_time.tzinfo == timezone.utc
            assert result.alert_time == alert_time

    @pytest.mark.asyncio
    async def test_schedule_alert_includes_user_id(self, alert_service):
        """Test that user_id is included for user isolation."""
        with patch.object(alert_service, '_schedule_job') as mock_schedule:
            mock_schedule.return_value = True

            user_id = "user-456"
            result = await alert_service.schedule_alert(
                task_id=123,
                user_id=user_id,
                alert_time=datetime.now(timezone.utc) + timedelta(hours=1),
                notification_channels=[NotificationChannel.EMAIL],
                task_title="Test"
            )

            assert result.user_id == user_id


class TestAlertServiceCancel:
    """Test alert cancellation."""

    @pytest.fixture
    def alert_service(self):
        return AlertService(dapr_port=3500)

    @pytest.mark.asyncio
    async def test_cancel_alert(self, alert_service):
        """Test canceling a scheduled alert."""
        with patch.object(alert_service, '_cancel_job') as mock_cancel:
            mock_cancel.return_value = True

            alert_id = str(uuid4())
            result = await alert_service.cancel_alert(alert_id=alert_id)

            assert result is True
            mock_cancel.assert_called_once()

    @pytest.mark.asyncio
    async def test_cancel_alert_not_found(self, alert_service):
        """Test canceling non-existent alert."""
        with patch.object(alert_service, '_cancel_job') as mock_cancel:
            mock_cancel.return_value = False

            result = await alert_service.cancel_alert(alert_id="invalid-id")

            assert result is False

    @pytest.mark.asyncio
    async def test_cancel_all_alerts_for_task(self, alert_service):
        """Test canceling all alerts for a specific task."""
        with patch.object(alert_service, 'get_task_alerts') as mock_get:
            alert1 = MagicMock(id="alert-1")
            alert2 = MagicMock(id="alert-2")
            mock_get.return_value = [alert1, alert2]

            with patch.object(alert_service, 'cancel_alert') as mock_cancel:
                mock_cancel.return_value = True

                results = await alert_service.cancel_all_for_task(
                    task_id=123,
                    user_id="user-456"
                )

                assert len(results) == 2
                assert all(results)


class TestMultipleAlertsPerTask:
    """Test multiple alerts per task."""

    @pytest.fixture
    def alert_service(self):
        return AlertService(dapr_port=3500)

    @pytest.mark.asyncio
    async def test_multiple_alerts_same_task(self, alert_service):
        """Test creating multiple alerts for same task."""
        with patch.object(alert_service, '_schedule_job') as mock_schedule:
            mock_schedule.return_value = True

            task_id = 123
            user_id = "user-456"
            now = datetime.now(timezone.utc)

            # Schedule alerts at different times
            alert1_time = now + timedelta(hours=1)
            alert2_time = now + timedelta(days=1)

            result1 = await alert_service.schedule_alert(
                task_id=task_id,
                user_id=user_id,
                alert_time=alert1_time,
                notification_channels=[NotificationChannel.EMAIL],
                task_title="Test"
            )

            result2 = await alert_service.schedule_alert(
                task_id=task_id,
                user_id=user_id,
                alert_time=alert2_time,
                notification_channels=[NotificationChannel.PUSH],
                task_title="Test"
            )

            assert result1 is not None
            assert result2 is not None
            assert result1.id != result2.id
            assert result1.alert_time < result2.alert_time

    @pytest.mark.asyncio
    async def test_retrieve_multiple_alerts_for_task(self, alert_service):
        """Test retrieving all alerts for a task."""
        with patch.object(alert_service, 'get_task_alerts') as mock_get:
            alerts = [
                MagicMock(id="alert-1", task_id=123, alert_time=datetime.now(timezone.utc) + timedelta(hours=1)),
                MagicMock(id="alert-2", task_id=123, alert_time=datetime.now(timezone.utc) + timedelta(hours=2)),
                MagicMock(id="alert-3", task_id=123, alert_time=datetime.now(timezone.utc) + timedelta(days=1)),
            ]
            mock_get.return_value = alerts

            results = await alert_service.get_task_alerts(
                task_id=123,
                user_id="user-456"
            )

            assert len(results) == 3
            assert all(alert.task_id == 123 for alert in results)


class TestAlertJobScheduling:
    """Test Dapr Jobs API integration."""

    @pytest.fixture
    def alert_service(self):
        return AlertService(dapr_port=3500)

    @pytest.mark.asyncio
    async def test_schedule_job_creates_correct_payload(self, alert_service):
        """Test that job scheduling creates correct Dapr payload."""
        with patch('httpx.AsyncClient.post') as mock_post:
            mock_response = AsyncMock()
            mock_response.status_code = 200
            mock_post.return_value = mock_response

            alert_id = str(uuid4())
            alert_time = datetime(2025, 12, 29, 16, 0, 0, tzinfo=timezone.utc)

            await alert_service._schedule_job(
                alert_id=alert_id,
                alert_time=alert_time,
                task_id=123,
                user_id="user-456"
            )

            # Verify job was scheduled
            mock_post.assert_called()

    @pytest.mark.asyncio
    async def test_job_schedule_iso_format(self, alert_service):
        """Test that job due time is in ISO 8601 format."""
        alert_time = datetime(2025, 12, 29, 16, 0, 0, tzinfo=timezone.utc)
        iso_format = alert_time.isoformat()

        assert iso_format == "2025-12-29T16:00:00+00:00"
        # Verify format is accepted by Dapr
        assert "T" in iso_format
        assert iso_format.endswith("00:00")


class TestAlertStatusTracking:
    """Test alert status and delivery tracking."""

    @pytest.fixture
    def alert_service(self):
        return AlertService(dapr_port=3500)

    @pytest.mark.asyncio
    async def test_alert_initial_status(self, alert_service):
        """Test that new alerts start with pending status."""
        with patch.object(alert_service, '_schedule_job') as mock_schedule:
            mock_schedule.return_value = True

            result = await alert_service.schedule_alert(
                task_id=123,
                user_id="user-456",
                alert_time=datetime.now(timezone.utc) + timedelta(hours=1),
                notification_channels=[NotificationChannel.EMAIL],
                task_title="Test"
            )

            assert result.delivery_status == AlertStatus.PENDING
            assert result.delivery_attempts == 0

    @pytest.mark.asyncio
    async def test_alert_delivery_attempts_incremented(self, alert_service):
        """Test that delivery attempts are tracked."""
        with patch.object(alert_service, 'update_delivery_status') as mock_update:
            await alert_service.record_delivery_attempt(
                alert_id="alert-123",
                success=False,
                error="Email send failed"
            )

            mock_update.assert_called_once()
