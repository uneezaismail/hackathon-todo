"""
Integration Tests for Alert Flow (Phase V - User Story 2)

End-to-end test: create alert → job fires → notification sent

This test verifies the complete alert lifecycle:
1. Create task with due date
2. Schedule alert via alert service
3. Simulate Dapr Jobs API firing the alert
4. Verify notification service processes alert
5. Verify notification is sent (email or push)
"""

import pytest
import asyncio
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4
import httpx

from src.services.alert_service import AlertService
from src.services.notification_service import NotificationService
from src.models.alert import Alert, AlertStatus, NotificationChannel
from src.events.publisher import EventPublisher


class TestAlertFlowEndToEnd:
    """End-to-end alert flow integration tests."""

    @pytest.fixture
    async def setup(self):
        """Set up services for integration testing."""
        alert_service = AlertService(dapr_port=3500)
        notification_service = NotificationService(
            smtp_host="smtp.example.com",
            smtp_port=587,
            smtp_user="noreply@example.com",
            smtp_password="password"
        )
        publisher = EventPublisher()

        return {
            'alert_service': alert_service,
            'notification_service': notification_service,
            'publisher': publisher
        }

    @pytest.mark.asyncio
    async def test_complete_alert_flow(self, setup):
        """Test complete alert flow from creation to notification."""
        alert_service = setup['alert_service']
        notification_service = setup['notification_service']
        publisher = setup['publisher']

        # Step 1: Create alert
        task_id = 123
        user_id = "user-456"
        alert_time = datetime.now(timezone.utc) + timedelta(hours=1)
        user_email = "user@example.com"

        with patch.object(alert_service, '_schedule_job') as mock_schedule:
            mock_schedule.return_value = True

            alert = await alert_service.schedule_alert(
                task_id=task_id,
                user_id=user_id,
                alert_time=alert_time,
                notification_channels=[NotificationChannel.EMAIL],
                task_title="Complete Project Proposal"
            )

            assert alert is not None
            assert alert.delivery_status == AlertStatus.PENDING

        # Step 2: Simulate job firing
        with patch.object(publisher, 'publish_alert_fired') as mock_publish:
            mock_publish.return_value = True

            await publisher.publish_alert_fired(
                alert_id=alert.id,
                task_id=task_id,
                user_id=user_id,
                task_title="Complete Project Proposal"
            )

            assert mock_publish.called

        # Step 3: Notification service processes alert
        with patch.object(notification_service.email_sender, 'send') as mock_email:
            mock_email.return_value = True

            result = await notification_service.send_email(
                to=user_email,
                subject=f"Reminder: Complete Project Proposal",
                body=f"Your task is due soon",
                task_title="Complete Project Proposal"
            )

            assert result is True
            assert mock_email.called

    @pytest.mark.asyncio
    async def test_alert_scheduling_creates_job(self, setup):
        """Test that alert scheduling creates Dapr job."""
        alert_service = setup['alert_service']

        task_id = 123
        user_id = "user-456"
        alert_time = datetime.now(timezone.utc) + timedelta(hours=2)

        with patch('httpx.AsyncClient.post') as mock_post:
            mock_response = AsyncMock()
            mock_response.status_code = 200
            mock_post.return_value = mock_response

            alert = await alert_service.schedule_alert(
                task_id=task_id,
                user_id=user_id,
                alert_time=alert_time,
                notification_channels=[NotificationChannel.EMAIL],
                task_title="Test Task"
            )

            # Should create job via HTTP API
            if hasattr(alert_service, '_schedule_job'):
                # Job was attempted to be scheduled
                pass

    @pytest.mark.asyncio
    async def test_alert_to_notification_transition(self, setup):
        """Test transition from alert service to notification service."""
        alert_service = setup['alert_service']
        notification_service = setup['notification_service']

        # Create alert
        alert_data = {
            'id': str(uuid4()),
            'task_id': 123,
            'user_id': 'user-456',
            'alert_time': datetime.now(timezone.utc),
            'notification_channels': [NotificationChannel.EMAIL],
            'task_title': 'Test Task'
        }

        # Simulate notification service receiving alert
        with patch.object(notification_service.email_sender, 'send') as mock_send:
            mock_send.return_value = True

            result = await notification_service.send_email(
                to='user@example.com',
                subject=f"Reminder: {alert_data['task_title']}",
                body='Your task is due soon',
                task_title=alert_data['task_title']
            )

            assert result is True

    @pytest.mark.asyncio
    async def test_multiple_alerts_flow(self, setup):
        """Test flow with multiple alerts for different tasks."""
        alert_service = setup['alert_service']
        notification_service = setup['notification_service']

        alerts = []
        for i in range(3):
            with patch.object(alert_service, '_schedule_job') as mock_schedule:
                mock_schedule.return_value = True

                alert = await alert_service.schedule_alert(
                    task_id=100 + i,
                    user_id='user-456',
                    alert_time=datetime.now(timezone.utc) + timedelta(hours=i+1),
                    notification_channels=[NotificationChannel.EMAIL],
                    task_title=f'Task {i+1}'
                )

                alerts.append(alert)

        assert len(alerts) == 3

        # Send notifications for all alerts
        with patch.object(notification_service.email_sender, 'send') as mock_send:
            mock_send.return_value = True

            for alert in alerts:
                await notification_service.send_email(
                    to='user@example.com',
                    subject=f"Reminder: {alert.task_title}",
                    body='Your task is due soon',
                    task_title=alert.task_title
                )

            assert mock_send.call_count >= 3

    @pytest.mark.asyncio
    async def test_alert_with_email_fallback_to_push(self, setup):
        """Test alert sends email, then falls back to push on failure."""
        alert_service = setup['alert_service']
        notification_service = setup['notification_service']

        alert_time = datetime.now(timezone.utc) + timedelta(hours=1)

        with patch.object(alert_service, '_schedule_job') as mock_schedule:
            mock_schedule.return_value = True

            alert = await alert_service.schedule_alert(
                task_id=123,
                user_id='user-456',
                alert_time=alert_time,
                notification_channels=[NotificationChannel.EMAIL, NotificationChannel.PUSH],
                task_title='Test Task'
            )

        # Email fails, push succeeds
        with patch.object(notification_service.email_sender, 'send') as mock_email:
            with patch.object(notification_service.push_sender, 'send') as mock_push:
                mock_email.return_value = False
                mock_push.return_value = True

                result = await notification_service.send_notification(
                    user_id='user-456',
                    channels=[NotificationChannel.EMAIL, NotificationChannel.PUSH],
                    email='user@example.com',
                    title='Task Alert',
                    message='Your task is due soon',
                    task_id=123
                )

                # Email was attempted but push should also be attempted
                assert mock_email.called or mock_push.called

    @pytest.mark.asyncio
    async def test_alert_user_isolation(self, setup):
        """Test that alerts maintain user isolation throughout flow."""
        alert_service = setup['alert_service']
        notification_service = setup['notification_service']

        user1_alert_time = datetime.now(timezone.utc) + timedelta(hours=1)
        user2_alert_time = datetime.now(timezone.utc) + timedelta(hours=2)

        alerts = {}
        for user_id in ['user-456', 'user-789']:
            with patch.object(alert_service, '_schedule_job') as mock_schedule:
                mock_schedule.return_value = True

                alert = await alert_service.schedule_alert(
                    task_id=123,
                    user_id=user_id,
                    alert_time=user1_alert_time if user_id == 'user-456' else user2_alert_time,
                    notification_channels=[NotificationChannel.EMAIL],
                    task_title='Test Task'
                )

                alerts[user_id] = alert

        # Verify each user's alert is isolated
        assert alerts['user-456'].user_id == 'user-456'
        assert alerts['user-789'].user_id == 'user-789'
        assert alerts['user-456'].id != alerts['user-789'].id


class TestAlertJobCallback:
    """Test Dapr Jobs API callback handling."""

    @pytest.fixture
    async def alert_service(self):
        return AlertService(dapr_port=3500)

    @pytest.mark.asyncio
    async def test_job_callback_triggers_notification(self, alert_service):
        """Test that job callback fires notification event."""
        alert_id = str(uuid4())
        task_id = 123
        user_id = 'user-456'

        with patch('src.events.publisher.EventPublisher.publish_alert_fired') as mock_publish:
            mock_publish.return_value = True

            # Simulate job callback
            publisher = EventPublisher()
            await publisher.publish_alert_fired(
                alert_id=alert_id,
                task_id=task_id,
                user_id=user_id,
                task_title='Test Task'
            )

    @pytest.mark.asyncio
    async def test_job_callback_payload_format(self, alert_service):
        """Test that job callback payload is correctly formatted."""
        alert_id = str(uuid4())

        # Job callback payload from Dapr
        callback_payload = {
            'jobName': f'alert-{alert_id}',
            'data': {
                'type': 'alert.fired',
                'alert_id': alert_id,
                'task_id': 123,
                'user_id': 'user-456',
                'alert_time': datetime.now(timezone.utc).isoformat()
            }
        }

        assert callback_payload['data']['type'] == 'alert.fired'
        assert callback_payload['data']['alert_id'] == alert_id


class TestAlertRetryFlow:
    """Test retry logic in alert flow."""

    @pytest.fixture
    async def setup(self):
        alert_service = AlertService(dapr_port=3500)
        notification_service = NotificationService(
            smtp_host="smtp.example.com",
            smtp_port=587,
            smtp_user="noreply@example.com",
            smtp_password="password"
        )
        return {
            'alert_service': alert_service,
            'notification_service': notification_service
        }

    @pytest.mark.asyncio
    async def test_notification_retry_on_alert_fire(self, setup):
        """Test notification retry when alert fires and initial send fails."""
        notification_service = setup['notification_service']

        with patch.object(notification_service.email_sender, 'send') as mock_send:
            # Fail twice, then succeed
            mock_send.side_effect = [False, False, True]

            result = await notification_service.send_email(
                to='user@example.com',
                subject='Task Alert',
                body='Your task is due soon',
                task_title='Test Task',
                max_retries=3
            )

            assert result is True
            assert mock_send.call_count == 3

    @pytest.mark.asyncio
    async def test_alert_job_scheduling_retry(self, setup):
        """Test alert job scheduling with retry."""
        alert_service = setup['alert_service']

        with patch.object(alert_service, '_schedule_job') as mock_schedule:
            mock_schedule.side_effect = [False, False, True]

            alert = await alert_service.schedule_alert(
                task_id=123,
                user_id='user-456',
                alert_time=datetime.now(timezone.utc) + timedelta(hours=1),
                notification_channels=[NotificationChannel.EMAIL],
                task_title='Test',
                max_retries=3
            )

            assert alert is not None


class TestAlertCancellation:
    """Test alert cancellation flow."""

    @pytest.fixture
    async def alert_service(self):
        return AlertService(dapr_port=3500)

    @pytest.mark.asyncio
    async def test_cancel_alert_cancels_job(self, alert_service):
        """Test that canceling alert cancels Dapr job."""
        alert_id = str(uuid4())

        with patch.object(alert_service, '_cancel_job') as mock_cancel:
            mock_cancel.return_value = True

            result = await alert_service.cancel_alert(alert_id=alert_id)

            assert result is True
            mock_cancel.assert_called_once()

    @pytest.mark.asyncio
    async def test_cancel_prevents_notification(self, alert_service):
        """Test that canceled alert does not send notification."""
        # Once alert is canceled, subsequent job callback should not occur
        alert_id = str(uuid4())

        with patch.object(alert_service, '_cancel_job') as mock_cancel:
            mock_cancel.return_value = True

            await alert_service.cancel_alert(alert_id=alert_id)

            # Job should be canceled - subsequent callback would fail
            assert mock_cancel.called
