"""
Unit tests for Event Publisher - Phase V (T051)

Tests CloudEvents format, all event types, and error handling for event publishing.
Mocks Dapr Pub/Sub HTTP API responses.
"""

import pytest
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch, MagicMock
import httpx

from src.events.publisher import EventPublisher
from src.events.schemas import (
    TaskCreatedEvent,
    TaskCompletedEvent,
    TaskUpdatedEvent,
    TaskDeletedEvent,
    AlertScheduledEvent,
    AlertFiredEvent,
)


class TestEventPublisher:
    """Test suite for EventPublisher class."""

    @pytest.fixture
    def publisher(self):
        """Create EventPublisher instance for testing."""
        return EventPublisher(dapr_port=3500, pubsub_name="kafka-pubsub")

    @pytest.mark.asyncio
    async def test_check_health_success(self, publisher):
        """Test Dapr sidecar health check successful."""
        with patch("httpx.AsyncClient.get") as mock_get:
            mock_response = AsyncMock()
            mock_response.status_code = 200
            mock_get.return_value = mock_response

            result = await publisher.check_health()
            assert result is True

    @pytest.mark.asyncio
    async def test_check_health_failure(self, publisher):
        """Test Dapr sidecar health check failure."""
        with patch("httpx.AsyncClient.get") as mock_get:
            mock_get.side_effect = Exception("Connection refused")

            result = await publisher.check_health()
            assert result is False

    @pytest.mark.asyncio
    async def test_publish_task_created_event(self, publisher):
        """Test publishing task.created event with CloudEvents format."""
        with patch("httpx.AsyncClient.post") as mock_post:
            mock_response = AsyncMock()
            mock_response.status_code = 204
            mock_post.return_value = mock_response

            result = await publisher.publish_task_created(
                task_id=123,
                user_id="user-456",
                task_title="Test Task",
                task_description="Test Description",
                priority="High",
                due_date="2025-12-31",
                recurring_pattern="DAILY",
                is_pattern=False,
            )

            assert result is True
            mock_post.assert_called_once()
            call_args = mock_post.call_args

            # Verify URL
            assert "task-events" in call_args[0][0]

            # Verify event payload includes CloudEvents fields
            event_data = call_args[1]["json"]
            assert event_data["event_type"] == "task.created"
            assert event_data["user_id"] == "user-456"
            assert event_data["task_id"] == 123

    @pytest.mark.asyncio
    async def test_publish_task_completed_event(self, publisher):
        """Test publishing task.completed event."""
        with patch("httpx.AsyncClient.post") as mock_post:
            mock_response = AsyncMock()
            mock_response.status_code = 204
            mock_post.return_value = mock_response

            result = await publisher.publish_task_completed(
                task_id=123,
                user_id="user-456",
                task_title="Test Task",
                recurring_pattern="DAILY",
                recurring_end_date="2026-01-31",
                next_occurrence_due="2025-12-30",
                is_pattern=False,
                parent_task_id=None,
            )

            assert result is True
            event_data = mock_post.call_args[1]["json"]
            assert event_data["event_type"] == "task.completed"
            assert "completed_at" in event_data["data"]

    @pytest.mark.asyncio
    async def test_publish_task_updated_event(self, publisher):
        """Test publishing task.updated event."""
        with patch("httpx.AsyncClient.post") as mock_post:
            mock_response = AsyncMock()
            mock_response.status_code = 204
            mock_post.return_value = mock_response

            result = await publisher.publish_task_updated(
                task_id=123,
                user_id="user-456",
                task_title="Updated Task",
                changed_fields=["title", "priority"],
                previous_values={"title": "Old Title", "priority": "Low"},
                new_values={"title": "Updated Task", "priority": "High"},
            )

            assert result is True
            event_data = mock_post.call_args[1]["json"]
            assert event_data["event_type"] == "task.updated"
            assert event_data["data"]["changed_fields"] == ["title", "priority"]

    @pytest.mark.asyncio
    async def test_publish_task_deleted_event(self, publisher):
        """Test publishing task.deleted event."""
        with patch("httpx.AsyncClient.post") as mock_post:
            mock_response = AsyncMock()
            mock_response.status_code = 204
            mock_post.return_value = mock_response

            result = await publisher.publish_task_deleted(
                task_id=123,
                user_id="user-456",
                task_title="Deleted Task",
                was_recurring=True,
                cascade_deleted_count=5,
            )

            assert result is True
            event_data = mock_post.call_args[1]["json"]
            assert event_data["event_type"] == "task.deleted"
            assert event_data["data"]["was_recurring"] is True

    @pytest.mark.asyncio
    async def test_publish_with_retry_on_network_error(self, publisher):
        """Test exponential backoff retry on network error."""
        with patch("httpx.AsyncClient.post") as mock_post:
            # First 2 attempts fail, 3rd succeeds
            mock_responses = [
                httpx.RequestError("Connection error"),
                httpx.RequestError("Connection error"),
                AsyncMock(status_code=204),
            ]
            mock_post.side_effect = mock_responses

            result = await publisher.publish_task_created(
                task_id=123,
                user_id="user-456",
                task_title="Test",
            )

            assert result is True
            assert mock_post.call_count == 3

    @pytest.mark.asyncio
    async def test_publish_failure_after_max_retries(self, publisher):
        """Test failure after exhausting max retries."""
        with patch("httpx.AsyncClient.post") as mock_post:
            mock_post.side_effect = httpx.RequestError("Connection refused")

            result = await publisher.publish_task_created(
                task_id=123,
                user_id="user-456",
                task_title="Test",
            )

            assert result is False
            assert mock_post.call_count == 3  # max_retries = 3

    @pytest.mark.asyncio
    async def test_publish_alert_scheduled_event(self, publisher):
        """Test publishing alert.scheduled event."""
        with patch("httpx.AsyncClient.post") as mock_post:
            mock_response = AsyncMock()
            mock_response.status_code = 204
            mock_post.return_value = mock_response

            result = await publisher.publish_alert_scheduled(
                alert_id="alert-123",
                task_id=456,
                user_id="user-789",
                alert_time="2025-12-31T10:00:00Z",
                notification_channels=["email", "push"],
            )

            assert result is True
            event_data = mock_post.call_args[1]["json"]
            assert event_data["event_type"] == "alert.scheduled"

    @pytest.mark.asyncio
    async def test_publish_alert_fired_event(self, publisher):
        """Test publishing alert.fired event."""
        with patch("httpx.AsyncClient.post") as mock_post:
            mock_response = AsyncMock()
            mock_response.status_code = 204
            mock_post.return_value = mock_response

            result = await publisher.publish_alert_fired(
                alert_id="alert-123",
                task_id=456,
                user_id="user-789",
                notification_channels=["email"],
            )

            assert result is True
            event_data = mock_post.call_args[1]["json"]
            assert event_data["event_type"] == "alert.fired"

    @pytest.mark.asyncio
    async def test_event_includes_user_id_for_isolation(self, publisher):
        """Test that all events include user_id for user isolation."""
        with patch("httpx.AsyncClient.post") as mock_post:
            mock_response = AsyncMock()
            mock_response.status_code = 204
            mock_post.return_value = mock_response

            await publisher.publish_task_created(
                task_id=123,
                user_id="user-456",
                task_title="Test",
            )

            event_data = mock_post.call_args[1]["json"]
            assert event_data["user_id"] == "user-456"

    @pytest.mark.asyncio
    async def test_event_includes_timestamp_in_utc(self, publisher):
        """Test that events include UTC timestamps."""
        with patch("httpx.AsyncClient.post") as mock_post:
            mock_response = AsyncMock()
            mock_response.status_code = 204
            mock_post.return_value = mock_response

            before = datetime.now(timezone.utc)
            await publisher.publish_task_completed(
                task_id=123,
                user_id="user-456",
                task_title="Test",
            )
            after = datetime.now(timezone.utc)

            event_data = mock_post.call_args[1]["json"]
            timestamp_str = event_data["data"]["completed_at"]

            # Verify timestamp format is ISO 8601 with Z suffix
            assert timestamp_str.endswith("Z")
            timestamp = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
            assert before <= timestamp <= after

    @pytest.mark.asyncio
    async def test_event_has_unique_event_id(self, publisher):
        """Test that each event has a unique event_id."""
        with patch("httpx.AsyncClient.post") as mock_post:
            mock_response = AsyncMock()
            mock_response.status_code = 204
            mock_post.return_value = mock_response

            await publisher.publish_task_created(task_id=1, user_id="u1", task_title="T1")
            event_id_1 = mock_post.call_args[1]["json"]["event_id"]

            await publisher.publish_task_created(task_id=2, user_id="u2", task_title="T2")
            event_id_2 = mock_post.call_args[1]["json"]["event_id"]

            assert event_id_1 != event_id_2
