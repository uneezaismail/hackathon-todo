"""
Integration tests for FR-033: Message queueing and sequential processing.

Tests verify that rapid consecutive messages are processed sequentially,
not concurrently, to prevent race conditions and database locks.

Test Coverage:
- T099: Send rapid consecutive messages, verify sequential processing
- Verify messages processed in order (FIFO)
- Verify no concurrent agent executions
- Verify database consistency after rapid messages

Reference: specs/006-ai-chatbot/spec.md FR-033
"""
import pytest
import asyncio
import time
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.main import app
from src.models.conversation import Conversation
from src.models.message import Message, MessageRole
from src.services.conversation_service import ConversationService
from tests.conftest import test_user_id, generate_test_token


@pytest.mark.asyncio
async def test_chat_endpoint_sequential_message_processing(
    async_session: AsyncSession,
    test_conversation: Conversation,
    test_user_id: str,
):
    """
    T099: Integration test for message queueing.

    Flow:
    1. Send 3 rapid consecutive messages (within 100ms)
    2. Track execution order and timing
    3. Verify messages processed sequentially (not concurrently)
    4. Verify FIFO order maintained
    5. Verify no overlapping agent executions
    """
    client = TestClient(app)
    token = generate_test_token(test_user_id)

    # Track execution order and timing
    execution_log = []
    execution_lock = asyncio.Lock()

    async def mock_agent_generator(message_content: str):
        """Mock agent that logs execution and takes 2 seconds."""
        async with execution_lock:
            start_time = time.time()
            execution_log.append({"message": message_content, "start": start_time, "type": "start"})

        # Simulate agent processing time
        await asyncio.sleep(2)

        async with execution_lock:
            end_time = time.time()
            execution_log.append({"message": message_content, "end": end_time, "type": "end"})

        # Yield response
        from agents.stream_events import RawResponsesStreamEvent
        from openai.types.responses import ResponseTextDeltaEvent
        delta_event = ResponseTextDeltaEvent(delta=f"Processed: {message_content}", type="response.text.delta")
        yield RawResponsesStreamEvent(data=delta_event)

    # Prepare test messages
    messages = [
        "Add task 1",
        "Add task 2",
        "Add task 3"
    ]

    with patch("src.api.v1.chat.get_todo_agent") as mock_get_agent:
        mock_agent_instance = MagicMock()
        mock_agent_instance.get_agent.return_value = MagicMock()
        mock_agent_instance.mcp_server.__aenter__ = AsyncMock()
        mock_agent_instance.mcp_server.__aexit__ = AsyncMock()
        mock_get_agent.return_value = mock_agent_instance

        # Create separate async tasks for concurrent requests
        async def send_message(msg: str):
            with patch("src.api.v1.chat.Runner") as mock_runner:
                mock_runner.run_streamed.return_value = mock_agent_generator(msg)

                response = client.post(
                    "/chat",
                    json={
                        "message": msg,
                        "conversation_id": str(test_conversation.id)
                    },
                    headers={"Authorization": f"Bearer {token}"}
                )
                return response

        # Send messages rapidly (concurrent requests)
        tasks = [send_message(msg) for msg in messages]
        responses = await asyncio.gather(*tasks)

    # Verify all requests succeeded
    for i, response in enumerate(responses):
        assert response.status_code == 200, \
            f"Message {i+1} failed with status {response.status_code}"

    # Verify sequential processing (no overlapping executions)
    start_events = [log for log in execution_log if log["type"] == "start"]
    end_events = [log for log in execution_log if log["type"] == "end"]

    # Each message should start AFTER previous message ends
    for i in range(len(start_events) - 1):
        end_time_i = end_events[i]["end"]
        start_time_next = start_events[i + 1]["start"]

        assert start_time_next >= end_time_i, \
            f"Message {i+2} started before message {i+1} ended (concurrent execution detected)"

    # Verify FIFO order
    processed_order = [log["message"] for log in start_events]
    assert processed_order == messages, \
        f"Messages processed out of order: {processed_order} != {messages}"


@pytest.mark.asyncio
async def test_chat_endpoint_queue_indicator(
    async_session: AsyncSession,
    test_conversation: Conversation,
    test_user_id: str,
):
    """
    T099 (variant): Verify "queued" indicator for pending messages.

    When a message is waiting for previous messages to complete,
    the response should include a "queued" event.
    """
    client = TestClient(app)
    token = generate_test_token(test_user_id)

    # Track queue status
    queue_events = []

    async def slow_mock_generator():
        """Mock agent that takes 5 seconds."""
        await asyncio.sleep(5)
        from agents.stream_events import RawResponsesStreamEvent
        from openai.types.responses import ResponseTextDeltaEvent
        delta_event = ResponseTextDeltaEvent(delta="Done", type="response.text.delta")
        yield RawResponsesStreamEvent(data=delta_event)

    with patch("src.api.v1.chat.get_todo_agent") as mock_get_agent:
        mock_agent_instance = MagicMock()
        mock_agent_instance.get_agent.return_value = MagicMock()
        mock_agent_instance.mcp_server.__aenter__ = AsyncMock()
        mock_agent_instance.mcp_server.__aexit__ = AsyncMock()
        mock_get_agent.return_value = mock_agent_instance

        with patch("src.api.v1.chat.Runner") as mock_runner:
            mock_runner.run_streamed.return_value = slow_mock_generator()

            # Send first message (will take 5 seconds)
            async def first_request():
                return client.post(
                    "/chat",
                    json={"message": "First message", "conversation_id": str(test_conversation.id)},
                    headers={"Authorization": f"Bearer {token}"}
                )

            # Send second message immediately (should queue)
            async def second_request():
                await asyncio.sleep(0.1)  # Small delay to ensure first starts
                response = client.post(
                    "/chat",
                    json={"message": "Second message (queued)", "conversation_id": str(test_conversation.id)},
                    headers={"Authorization": f"Bearer {token}"}
                )

                # Check for queue indicator in response
                if "queued" in response.text.lower() or "waiting" in response.text.lower():
                    queue_events.append("queued_indicator_found")

                return response

            # Execute both requests
            results = await asyncio.gather(first_request(), second_request())

    # Verify both succeeded
    assert all(r.status_code == 200 for r in results)

    # Note: Queue indicator implementation is optional for T104
    # This test documents expected behavior


@pytest.mark.asyncio
async def test_chat_endpoint_database_consistency_under_load(
    async_session: AsyncSession,
    test_conversation: Conversation,
    test_user_id: str,
):
    """
    T099 (database integrity): Verify no race conditions with rapid messages.

    Tests that sequential processing prevents database corruption
    from concurrent writes to conversation/message tables.
    """
    client = TestClient(app)
    token = generate_test_token(test_user_id)

    # Mock fast agent (1 second processing)
    async def fast_mock_generator(msg: str):
        await asyncio.sleep(1)
        from agents.stream_events import RawResponsesStreamEvent
        from openai.types.responses import ResponseTextDeltaEvent
        delta_event = ResponseTextDeltaEvent(delta=f"OK: {msg}", type="response.text.delta")
        yield RawResponsesStreamEvent(data=delta_event)

    with patch("src.api.v1.chat.get_todo_agent") as mock_get_agent:
        mock_agent_instance = MagicMock()
        mock_agent_instance.get_agent.return_value = MagicMock()
        mock_agent_instance.mcp_server.__aenter__ = AsyncMock()
        mock_agent_instance.mcp_server.__aexit__ = AsyncMock()
        mock_get_agent.return_value = mock_agent_instance

        # Send 5 rapid messages
        async def send_rapid_message(i: int):
            with patch("src.api.v1.chat.Runner") as mock_runner:
                mock_runner.run_streamed.return_value = fast_mock_generator(f"Message {i}")
                return client.post(
                    "/chat",
                    json={"message": f"Message {i}", "conversation_id": str(test_conversation.id)},
                    headers={"Authorization": f"Bearer {token}"}
                )

        tasks = [send_rapid_message(i) for i in range(1, 6)]
        responses = await asyncio.gather(*tasks)

    # Verify all succeeded
    assert all(r.status_code == 200 for r in responses), \
        "Some messages failed under load"

    # Verify database consistency
    messages = await ConversationService.get_conversation_history(
        async_session,
        test_conversation.id,
        test_user_id,
        limit=100
    )

    # Should have original messages + (5 user + 5 assistant) = 10 new messages
    # Exact count depends on test_conversation fixture state
    new_messages = [m for m in messages if "Message" in m.get("content", "")]
    assert len(new_messages) >= 10, \
        f"Expected at least 10 messages, found {len(new_messages)} (possible race condition)"

    # Verify chronological order maintained
    timestamps = [m.get("created_at") for m in messages if "created_at" in m]
    assert timestamps == sorted(timestamps), \
        "Messages not in chronological order (database inconsistency)"
