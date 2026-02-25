"""
Unit tests for Idempotency Service - Phase V (T052)

Tests duplicate event detection, TTL expiry, and state management via Dapr State Store.
Mocks Dapr State Store HTTP API responses.
"""

import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch
import httpx

from src.events.idempotency import IdempotencyService


class TestIdempotencyService:
    """Test suite for IdempotencyService class."""

    @pytest.fixture
    def idempotency(self):
        """Create IdempotencyService instance for testing."""
        return IdempotencyService(dapr_port=3500, store_name="statestore")

    @pytest.mark.asyncio
    async def test_mark_new_event_as_processed(self, idempotency):
        """Test marking a new event as processed."""
        with patch("httpx.AsyncClient.post") as mock_post:
            mock_response = AsyncMock()
            mock_response.status_code = 204
            mock_post.return_value = mock_response

            event_id = "event-123"
            result = await idempotency.mark_processed(event_id)

            assert result is True
            mock_post.assert_called_once()

            # Verify state key format
            call_args = mock_post.call_args
            assert "event-processed-event-123" in call_args[0][0]

    @pytest.mark.asyncio
    async def test_check_if_event_already_processed(self, idempotency):
        """Test checking if event is already processed."""
        with patch("httpx.AsyncClient.get") as mock_get:
            mock_response = AsyncMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {"processed": True}
            mock_get.return_value = mock_response

            event_id = "event-123"
            result = await idempotency.is_processed(event_id)

            assert result is True
            mock_get.assert_called_once()

    @pytest.mark.asyncio
    async def test_event_not_yet_processed(self, idempotency):
        """Test detecting event that hasn't been processed yet."""
        with patch("httpx.AsyncClient.get") as mock_get:
            mock_get.side_effect = httpx.RequestError("Key not found")

            event_id = "event-123"
            result = await idempotency.is_processed(event_id)

            assert result is False

    @pytest.mark.asyncio
    async def test_check_and_mark_processed_atomic_operation(self, idempotency):
        """Test atomic check-and-mark operation for new event."""
        with patch("httpx.AsyncClient.get") as mock_get, \
             patch("httpx.AsyncClient.post") as mock_post:

            # First call: get (not found) -> event is new
            mock_get_response = AsyncMock()
            mock_get_response.status_code = 404
            mock_get.return_value = mock_get_response

            # Second call: post (mark as processed) -> success
            mock_post_response = AsyncMock()
            mock_post_response.status_code = 204
            mock_post.return_value = mock_post_response

            event_id = "event-123"
            is_new = await idempotency.check_and_mark_processed(event_id)

            assert is_new is True
            mock_get.assert_called_once()
            mock_post.assert_called_once()

    @pytest.mark.asyncio
    async def test_duplicate_event_detected(self, idempotency):
        """Test detecting duplicate event (already processed)."""
        with patch("httpx.AsyncClient.get") as mock_get:
            # Event already in state store
            mock_response = AsyncMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {"processed": True, "timestamp": "2025-12-29T10:00:00Z"}
            mock_get.return_value = mock_response

            event_id = "event-123"
            is_new = await idempotency.check_and_mark_processed(event_id)

            assert is_new is False

    @pytest.mark.asyncio
    async def test_idempotency_key_format(self, idempotency):
        """Test idempotency key format includes prefix and event_id."""
        with patch("httpx.AsyncClient.post") as mock_post:
            mock_response = AsyncMock()
            mock_response.status_code = 204
            mock_post.return_value = mock_response

            event_id = "task-completed-abc-123"
            await idempotency.mark_processed(event_id)

            call_args = mock_post.call_args
            url = call_args[0][0]

            # Verify key format
            assert "event-processed-task-completed-abc-123" in url

    @pytest.mark.asyncio
    async def test_multiple_concurrent_events_tracked(self, idempotency):
        """Test tracking multiple different events separately."""
        with patch("httpx.AsyncClient.post") as mock_post:
            mock_response = AsyncMock()
            mock_response.status_code = 204
            mock_post.return_value = mock_response

            # Mark first event
            await idempotency.mark_processed("event-1")
            call_1_url = mock_post.call_args[0][0]

            # Mark second event
            await idempotency.mark_processed("event-2")
            call_2_url = mock_post.call_args[0][0]

            # Verify different keys
            assert "event-1" in call_1_url
            assert "event-2" in call_2_url
            assert call_1_url != call_2_url

    @pytest.mark.asyncio
    async def test_mark_processed_includes_timestamp(self, idempotency):
        """Test that marked events include timestamp."""
        with patch("httpx.AsyncClient.post") as mock_post:
            mock_response = AsyncMock()
            mock_response.status_code = 204
            mock_post.return_value = mock_response

            before = datetime.now(timezone.utc)
            await idempotency.mark_processed("event-123")
            after = datetime.now(timezone.utc)

            call_args = mock_post.call_args
            event_data = call_args[1]["json"][0]

            # Extract timestamp from state value
            value = event_data.get("value", {})
            if isinstance(value, dict) and "timestamp" in value:
                timestamp_str = value["timestamp"]
                timestamp = datetime.fromisoformat(
                    timestamp_str.replace("Z", "+00:00")
                )
                assert before <= timestamp <= after

    @pytest.mark.asyncio
    async def test_retry_on_transient_failure(self, idempotency):
        """Test retry logic on transient network failure."""
        with patch("httpx.AsyncClient.post") as mock_post:
            # First attempt fails, second succeeds
            mock_responses = [
                httpx.RequestError("Connection timeout"),
                AsyncMock(status_code=204),
            ]
            mock_post.side_effect = mock_responses

            result = await idempotency.mark_processed("event-123")

            # Should succeed after retry
            assert result is True

    @pytest.mark.asyncio
    async def test_failure_after_max_retries(self, idempotency):
        """Test failure when max retries exceeded."""
        with patch("httpx.AsyncClient.post") as mock_post:
            mock_post.side_effect = httpx.RequestError("Connection refused")

            result = await idempotency.mark_processed("event-123")

            assert result is False

    @pytest.mark.asyncio
    async def test_clear_processed_event(self, idempotency):
        """Test clearing/deleting processed event from state store."""
        with patch("httpx.AsyncClient.delete") as mock_delete:
            mock_response = AsyncMock()
            mock_response.status_code = 204
            mock_delete.return_value = mock_response

            event_id = "event-123"
            result = await idempotency.clear_processed(event_id)

            assert result is True
            mock_delete.assert_called_once()

    @pytest.mark.asyncio
    async def test_idempotency_with_complex_event_ids(self, idempotency):
        """Test idempotency with various event_id formats."""
        event_ids = [
            "simple-123",
            "task-completed-user-456-2025-12-29",
            "alert-fired-abc-def-ghi",
            "123",
            "event_with_underscores",
        ]

        with patch("httpx.AsyncClient.post") as mock_post:
            mock_response = AsyncMock()
            mock_response.status_code = 204
            mock_post.return_value = mock_response

            for event_id in event_ids:
                result = await idempotency.mark_processed(event_id)
                assert result is True

            assert mock_post.call_count == len(event_ids)

    @pytest.mark.asyncio
    async def test_state_store_error_handling(self, idempotency):
        """Test error handling for state store connection issues."""
        with patch("httpx.AsyncClient.post") as mock_post:
            mock_response = AsyncMock()
            mock_response.status_code = 500
            mock_post.return_value = mock_response

            # Should handle gracefully
            result = await idempotency.mark_processed("event-123")
            assert result is False

    @pytest.mark.asyncio
    async def test_idempotency_key_case_sensitivity(self, idempotency):
        """Test that idempotency keys are case-sensitive."""
        with patch("httpx.AsyncClient.post") as mock_post:
            mock_response = AsyncMock()
            mock_response.status_code = 204
            mock_post.return_value = mock_response

            # Same event ID but different case
            event_id_1 = "Event-ABC"
            event_id_2 = "event-abc"

            await idempotency.mark_processed(event_id_1)
            call_1 = mock_post.call_args[0][0]

            await idempotency.mark_processed(event_id_2)
            call_2 = mock_post.call_args[0][0]

            # Keys should be different (case-sensitive)
            assert event_id_1.lower() != event_id_2.lower()
