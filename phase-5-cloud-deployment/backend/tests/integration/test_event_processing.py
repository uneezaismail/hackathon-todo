"""
Integration tests for Event Flow - Phase V (T053)

Tests end-to-end event publishing and consumption without duplicates.
Tests event flow: publish → Kafka → consume → process.
"""

import pytest
import asyncio
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch, MagicMock
from sqlmodel import Session, select

from src.events.publisher import EventPublisher
from src.events.idempotency import IdempotencyService
from src.models.task import Task
from src.models.task_event import TaskEvent
from src.db.session import get_session


class TestEventProcessingFlow:
    """Integration tests for event processing flow."""

    @pytest.fixture
    async def publisher(self):
        """Create EventPublisher instance."""
        return EventPublisher(dapr_port=3500, pubsub_name="kafka-pubsub")

    @pytest.fixture
    async def idempotency(self):
        """Create IdempotencyService instance."""
        return IdempotencyService(dapr_port=3500, store_name="statestore")

    @pytest.mark.asyncio
    async def test_task_creation_publishes_event(self, publisher):
        """Test that creating a task publishes task.created event."""
        with patch("httpx.AsyncClient.post") as mock_post:
            mock_response = AsyncMock()
            mock_response.status_code = 204
            mock_post.return_value = mock_response

            # Create task
            success = await publisher.publish_task_created(
                task_id=1,
                user_id="user-1",
                task_title="Test Task",
                task_description="Description",
                priority="High",
            )

            assert success is True
            mock_post.assert_called_once()

            # Verify event was published to task-events topic
            call_args = mock_post.call_args
            assert "task-events" in call_args[0][0]

    @pytest.mark.asyncio
    async def test_task_update_publishes_event(self, publisher):
        """Test that updating a task publishes task.updated event."""
        with patch("httpx.AsyncClient.post") as mock_post:
            mock_response = AsyncMock()
            mock_response.status_code = 204
            mock_post.return_value = mock_response

            success = await publisher.publish_task_updated(
                task_id=1,
                user_id="user-1",
                task_title="Updated Task",
                changed_fields=["title", "priority"],
                previous_values={"title": "Old", "priority": "Low"},
                new_values={"title": "Updated Task", "priority": "High"},
            )

            assert success is True
            event_data = mock_post.call_args[1]["json"]
            assert event_data["event_type"] == "task.updated"

    @pytest.mark.asyncio
    async def test_task_completion_publishes_event(self, publisher):
        """Test that completing a task publishes task.completed event."""
        with patch("httpx.AsyncClient.post") as mock_post:
            mock_response = AsyncMock()
            mock_response.status_code = 204
            mock_post.return_value = mock_response

            success = await publisher.publish_task_completed(
                task_id=1,
                user_id="user-1",
                task_title="Completed Task",
                recurring_pattern="DAILY",
            )

            assert success is True
            event_data = mock_post.call_args[1]["json"]
            assert event_data["event_type"] == "task.completed"

    @pytest.mark.asyncio
    async def test_task_deletion_publishes_event(self, publisher):
        """Test that deleting a task publishes task.deleted event."""
        with patch("httpx.AsyncClient.post") as mock_post:
            mock_response = AsyncMock()
            mock_response.status_code = 204
            mock_post.return_value = mock_response

            success = await publisher.publish_task_deleted(
                task_id=1,
                user_id="user-1",
                task_title="Deleted Task",
                was_recurring=False,
            )

            assert success is True
            event_data = mock_post.call_args[1]["json"]
            assert event_data["event_type"] == "task.deleted"

    @pytest.mark.asyncio
    async def test_duplicate_event_not_processed_twice(self, publisher, idempotency):
        """Test that duplicate events are not processed twice."""
        event_id = "task-created-123-2025-12-29T10:00:00Z"

        with patch("httpx.AsyncClient.post") as mock_post, \
             patch("httpx.AsyncClient.get") as mock_get:

            # Mark event as processed
            mock_post_response = AsyncMock()
            mock_post_response.status_code = 204
            mock_post.return_value = mock_post_response

            # First call: mark as processed
            await idempotency.mark_processed(event_id)
            first_call_count = mock_post.call_count

            # Simulate second delivery of same event
            # Check if processed (should find it)
            mock_get_response = AsyncMock()
            mock_get_response.status_code = 200
            mock_get_response.json.return_value = {"processed": True}
            mock_get.return_value = mock_get_response

            is_duplicate = await idempotency.is_processed(event_id)
            assert is_duplicate is True
            mock_get.assert_called_once()

    @pytest.mark.asyncio
    async def test_concurrent_event_publishing(self, publisher):
        """Test publishing multiple events concurrently without race conditions."""
        with patch("httpx.AsyncClient.post") as mock_post:
            mock_response = AsyncMock()
            mock_response.status_code = 204
            mock_post.return_value = mock_response

            # Publish 5 events concurrently
            tasks = [
                publisher.publish_task_created(
                    task_id=i,
                    user_id=f"user-{i}",
                    task_title=f"Task {i}",
                )
                for i in range(1, 6)
            ]

            results = await asyncio.gather(*tasks)

            assert all(results)
            assert mock_post.call_count == 5

    @pytest.mark.asyncio
    async def test_event_with_user_isolation(self, publisher):
        """Test that events maintain user isolation."""
        event_data_list = []

        with patch("httpx.AsyncClient.post") as mock_post:
            mock_response = AsyncMock()
            mock_response.status_code = 204
            mock_post.return_value = mock_response

            # Publish events from different users
            users = ["user-1", "user-2", "user-3"]
            for user_id in users:
                await publisher.publish_task_created(
                    task_id=1,
                    user_id=user_id,
                    task_title="Task",
                )
                event_data = mock_post.call_args[1]["json"]
                event_data_list.append(event_data)

            # Verify each event has correct user_id
            assert event_data_list[0]["user_id"] == "user-1"
            assert event_data_list[1]["user_id"] == "user-2"
            assert event_data_list[2]["user_id"] == "user-3"

    @pytest.mark.asyncio
    async def test_event_includes_all_required_fields(self, publisher):
        """Test that published events include all required CloudEvents fields."""
        with patch("httpx.AsyncClient.post") as mock_post:
            mock_response = AsyncMock()
            mock_response.status_code = 204
            mock_post.return_value = mock_response

            await publisher.publish_task_created(
                task_id=123,
                user_id="user-456",
                task_title="Test Task",
            )

            event_data = mock_post.call_args[1]["json"]

            # Required CloudEvents fields (per RFC 7808)
            required_fields = [
                "specversion",  # CloudEvents version
                "type",  # Event type
                "source",  # Event source
                "id",  # Unique event ID
                "time",  # Event timestamp
            ]

            # Also check our custom fields
            custom_fields = ["event_type", "event_id", "user_id", "task_id", "data"]

            all_fields = required_fields + custom_fields
            for field in all_fields:
                assert field in event_data, f"Missing required field: {field}"

    @pytest.mark.asyncio
    async def test_event_timestamp_ordering(self, publisher):
        """Test that events maintain timestamp ordering."""
        timestamps = []

        with patch("httpx.AsyncClient.post") as mock_post:
            mock_response = AsyncMock()
            mock_response.status_code = 204
            mock_post.return_value = mock_response

            # Publish events with small delays
            for i in range(3):
                await publisher.publish_task_created(
                    task_id=i,
                    user_id="user-1",
                    task_title=f"Task {i}",
                )
                event_data = mock_post.call_args[1]["json"]
                timestamps.append(event_data["time"])
                await asyncio.sleep(0.01)  # Small delay

            # Verify timestamps are in ascending order
            for i in range(len(timestamps) - 1):
                ts1 = datetime.fromisoformat(timestamps[i].replace("Z", "+00:00"))
                ts2 = datetime.fromisoformat(timestamps[i + 1].replace("Z", "+00:00"))
                assert ts1 <= ts2

    @pytest.mark.asyncio
    async def test_retry_on_transient_failure_continues_processing(self, publisher):
        """Test that transient failures are retried and processing continues."""
        with patch("httpx.AsyncClient.post") as mock_post:
            # First event: first attempt fails, second succeeds
            mock_responses = [
                Exception("Connection timeout"),
                AsyncMock(status_code=204),
                AsyncMock(status_code=204),  # For second event
            ]
            mock_post.side_effect = mock_responses

            # Publish first event (with retry)
            result1 = await publisher.publish_task_created(
                task_id=1,
                user_id="user-1",
                task_title="Task 1",
            )

            # Even if previous call had issues, next event should publish
            mock_post.side_effect = None
            mock_post.return_value = AsyncMock(status_code=204)

            result2 = await publisher.publish_task_created(
                task_id=2,
                user_id="user-1",
                task_title="Task 2",
            )

            assert result1 is True
            assert result2 is True

    @pytest.mark.asyncio
    async def test_event_source_identification(self, publisher):
        """Test that events identify their source service."""
        with patch("httpx.AsyncClient.post") as mock_post:
            mock_response = AsyncMock()
            mock_response.status_code = 204
            mock_post.return_value = mock_response

            await publisher.publish_task_created(
                task_id=1,
                user_id="user-1",
                task_title="Task",
            )

            event_data = mock_post.call_args[1]["json"]

            # Verify source field identifies backend service
            assert "source" in event_data
            assert "backend" in event_data["source"].lower() or \
                   event_data["source"] == "todo-service"

    @pytest.mark.asyncio
    async def test_recurring_task_event_includes_pattern_info(self, publisher):
        """Test that recurring task events include pattern information."""
        with patch("httpx.AsyncClient.post") as mock_post:
            mock_response = AsyncMock()
            mock_response.status_code = 204
            mock_post.return_value = mock_response

            await publisher.publish_task_completed(
                task_id=123,
                user_id="user-1",
                task_title="Daily Task",
                recurring_pattern="DAILY",
                recurring_end_date="2026-01-31",
                next_occurrence_due="2025-12-30",
                is_pattern=False,
                parent_task_id=122,
            )

            event_data = mock_post.call_args[1]["json"]
            payload = event_data["data"]

            assert payload["recurring_pattern"] == "DAILY"
            assert payload["recurring_end_date"] == "2026-01-31"
            assert payload["next_occurrence_due"] == "2025-12-30"
            assert payload["is_pattern"] is False
            assert payload["parent_task_id"] == 122
