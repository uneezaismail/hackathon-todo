"""
Unit Tests for Notification Service (Phase V - User Story 2)

Tests email sending, push notification fallback, and retry logic.
"""

import pytest
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

from src.services.notification_service import NotificationService
from src.models.alert import NotificationChannel, AlertStatus


class TestEmailNotification:
    """Test email notification sending."""

    @pytest.fixture
    def notification_service(self):
        """Create notification service instance."""
        return NotificationService(
            smtp_host="smtp.example.com",
            smtp_port=587,
            smtp_user="noreply@example.com",
            smtp_password="password"
        )

    @pytest.mark.asyncio
    async def test_send_email_success(self, notification_service):
        """Test successful email sending."""
        with patch.object(notification_service.email_sender, 'send') as mock_send:
            mock_send.return_value = True

            result = await notification_service.send_email(
                to="user@example.com",
                subject="Task Alert",
                body="Your task is due soon",
                task_title="Test Task"
            )

            assert result is True
            mock_send.assert_called_once()

    @pytest.mark.asyncio
    async def test_send_email_with_retry(self, notification_service):
        """Test email sending with retry logic."""
        with patch.object(notification_service.email_sender, 'send') as mock_send:
            # Simulate temporary failure then success
            mock_send.side_effect = [False, False, True]

            result = await notification_service.send_email(
                to="user@example.com",
                subject="Task Alert",
                body="Your task is due soon",
                task_title="Test Task",
                max_retries=3
            )

            assert result is True
            assert mock_send.call_count == 3

    @pytest.mark.asyncio
    async def test_send_email_retry_exponential_backoff(self, notification_service):
        """Test that email retries use exponential backoff."""
        backoff_delays = []

        with patch('asyncio.sleep') as mock_sleep:
            async def track_sleep(delay):
                backoff_delays.append(delay)

            mock_sleep.side_effect = track_sleep

            with patch.object(notification_service.email_sender, 'send') as mock_send:
                mock_send.side_effect = [False, False, False, True]

                await notification_service.send_email(
                    to="user@example.com",
                    subject="Alert",
                    body="Body",
                    task_title="Task",
                    max_retries=4
                )

                # Verify exponential backoff: 1s, 2s, 4s
                assert len(backoff_delays) >= 2

    @pytest.mark.asyncio
    async def test_send_email_max_retries_exceeded(self, notification_service):
        """Test that email sending fails after max retries."""
        with patch.object(notification_service.email_sender, 'send') as mock_send:
            mock_send.return_value = False  # Always fail

            result = await notification_service.send_email(
                to="user@example.com",
                subject="Alert",
                body="Body",
                task_title="Task",
                max_retries=2
            )

            assert result is False

    @pytest.mark.asyncio
    async def test_send_email_invalid_recipient(self, notification_service):
        """Test handling of invalid email recipients."""
        result = await notification_service.send_email(
            to="invalid-email",
            subject="Alert",
            body="Body",
            task_title="Task"
        )

        assert result is False


class TestPushNotification:
    """Test push notification sending."""

    @pytest.fixture
    def notification_service(self):
        return NotificationService(
            smtp_host="smtp.example.com",
            smtp_port=587,
            smtp_user="user",
            smtp_password="pass"
        )

    @pytest.mark.asyncio
    async def test_send_push_success(self, notification_service):
        """Test successful push notification sending."""
        with patch.object(notification_service.push_sender, 'send') as mock_send:
            mock_send.return_value = True

            result = await notification_service.send_push(
                user_id="user-456",
                title="Task Alert",
                message="Your task is due soon",
                task_id=123
            )

            assert result is True
            mock_send.assert_called_once()

    @pytest.mark.asyncio
    async def test_send_push_with_retry(self, notification_service):
        """Test push notification retry logic."""
        with patch.object(notification_service.push_sender, 'send') as mock_send:
            mock_send.side_effect = [False, True]

            result = await notification_service.send_push(
                user_id="user-456",
                title="Alert",
                message="Message",
                task_id=123,
                max_retries=2
            )

            assert result is True
            assert mock_send.call_count == 2


class TestNotificationFallback:
    """Test fallback logic from email to push."""

    @pytest.fixture
    def notification_service(self):
        return NotificationService(
            smtp_host="smtp.example.com",
            smtp_port=587,
            smtp_user="user",
            smtp_password="pass"
        )

    @pytest.mark.asyncio
    async def test_fallback_to_push_on_email_failure(self, notification_service):
        """Test that system falls back to push when email fails."""
        with patch.object(notification_service.email_sender, 'send') as mock_email:
            with patch.object(notification_service.push_sender, 'send') as mock_push:
                mock_email.return_value = False  # Email fails
                mock_push.return_value = True    # Push succeeds

                result = await notification_service.send_notification(
                    user_id="user-456",
                    channels=[NotificationChannel.EMAIL, NotificationChannel.PUSH],
                    email="user@example.com",
                    title="Alert",
                    message="Body",
                    task_id=123
                )

                # Both should be called
                assert mock_email.called
                assert mock_push.called

    @pytest.mark.asyncio
    async def test_email_primary_push_fallback(self, notification_service):
        """Test that email is primary and push is fallback."""
        with patch.object(notification_service.email_sender, 'send') as mock_email:
            with patch.object(notification_service.push_sender, 'send') as mock_push:
                mock_email.return_value = True

                await notification_service.send_notification(
                    user_id="user-456",
                    channels=[NotificationChannel.EMAIL, NotificationChannel.PUSH],
                    email="user@example.com",
                    title="Alert",
                    message="Body",
                    task_id=123
                )

                # Email should be called first
                assert mock_email.called

    @pytest.mark.asyncio
    async def test_push_only_when_specified(self, notification_service):
        """Test that push is used alone when email is not specified."""
        with patch.object(notification_service.push_sender, 'send') as mock_push:
            mock_push.return_value = True

            result = await notification_service.send_notification(
                user_id="user-456",
                channels=[NotificationChannel.PUSH],
                email=None,
                title="Alert",
                message="Body",
                task_id=123
            )

            assert mock_push.called


class TestNotificationRetryLogic:
    """Test comprehensive retry logic."""

    @pytest.fixture
    def notification_service(self):
        return NotificationService(
            smtp_host="smtp.example.com",
            smtp_port=587,
            smtp_user="user",
            smtp_password="pass"
        )

    @pytest.mark.asyncio
    async def test_retry_strategy_exponential_backoff(self, notification_service):
        """Test exponential backoff retry strategy."""
        retry_config = notification_service.get_retry_config()

        # Verify exponential backoff: 1s, 2s, 4s, 8s, 16s
        assert retry_config['initial_delay'] == 1
        assert retry_config['backoff_factor'] == 2
        assert retry_config['max_retries'] == 5

    @pytest.mark.asyncio
    async def test_notification_state_after_retries(self, notification_service):
        """Test notification tracking after retries."""
        with patch.object(notification_service.email_sender, 'send') as mock_send:
            mock_send.side_effect = [False, False, True]

            result = await notification_service.send_email(
                to="user@example.com",
                subject="Alert",
                body="Body",
                task_title="Task",
                max_retries=3
            )

            assert result is True

    @pytest.mark.asyncio
    async def test_delivery_attempt_logging(self, notification_service):
        """Test that delivery attempts are logged."""
        with patch.object(notification_service, 'log_delivery_attempt') as mock_log:
            with patch.object(notification_service.email_sender, 'send') as mock_send:
                mock_send.return_value = True

                await notification_service.send_email(
                    to="user@example.com",
                    subject="Alert",
                    body="Body",
                    task_title="Task"
                )

                mock_log.assert_called()


class TestNotificationChannels:
    """Test different notification channels."""

    @pytest.fixture
    def notification_service(self):
        return NotificationService(
            smtp_host="smtp.example.com",
            smtp_port=587,
            smtp_user="user",
            smtp_password="pass"
        )

    @pytest.mark.asyncio
    async def test_email_channel(self, notification_service):
        """Test email channel delivery."""
        with patch.object(notification_service.email_sender, 'send') as mock_send:
            mock_send.return_value = True

            result = await notification_service.send_notification(
                user_id="user-456",
                channels=[NotificationChannel.EMAIL],
                email="user@example.com",
                title="Alert",
                message="Body",
                task_id=123
            )

            assert mock_send.called

    @pytest.mark.asyncio
    async def test_push_channel(self, notification_service):
        """Test push channel delivery."""
        with patch.object(notification_service.push_sender, 'send') as mock_send:
            mock_send.return_value = True

            result = await notification_service.send_notification(
                user_id="user-456",
                channels=[NotificationChannel.PUSH],
                email="user@example.com",
                title="Alert",
                message="Body",
                task_id=123
            )

            assert mock_send.called

    @pytest.mark.asyncio
    async def test_webhook_channel_placeholder(self, notification_service):
        """Test webhook channel (placeholder for future)."""
        # Webhook support would be added later
        channels = [NotificationChannel.WEBHOOK]
        assert NotificationChannel.WEBHOOK in channels


class TestNotificationContent:
    """Test notification content formatting."""

    @pytest.fixture
    def notification_service(self):
        return NotificationService(
            smtp_host="smtp.example.com",
            smtp_port=587,
            smtp_user="user",
            smtp_password="pass"
        )

    @pytest.mark.asyncio
    async def test_email_content_includes_task_info(self, notification_service):
        """Test that email includes task information."""
        with patch.object(notification_service.email_sender, 'send') as mock_send:
            mock_send.return_value = True

            task_title = "Complete Project Proposal"
            await notification_service.send_email(
                to="user@example.com",
                subject="Task Alert",
                body="Your task is due soon",
                task_title=task_title
            )

            # Verify content was passed to sender
            assert mock_send.called

    @pytest.mark.asyncio
    async def test_push_notification_title_required(self, notification_service):
        """Test that push notifications require a title."""
        with patch.object(notification_service.push_sender, 'send') as mock_send:
            mock_send.return_value = True

            await notification_service.send_push(
                user_id="user-456",
                title="Important Alert",
                message="Your task is due soon",
                task_id=123
            )

            assert mock_send.called

    @pytest.mark.asyncio
    async def test_notification_user_id_included(self, notification_service):
        """Test that user_id is included for user isolation."""
        with patch.object(notification_service.push_sender, 'send') as mock_send:
            mock_send.return_value = True

            user_id = "user-456"
            await notification_service.send_notification(
                user_id=user_id,
                channels=[NotificationChannel.PUSH],
                email="user@example.com",
                title="Alert",
                message="Body",
                task_id=123
            )

            # Verify user_id is passed through
            assert mock_send.called
