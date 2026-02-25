"""
Integration tests for FR-031: 30-second timeout handling.

Tests verify that chat endpoint properly handles slow agent responses
with asyncio.TimeoutError and returns 504 Gateway Timeout.

Test Coverage:
- T097: Mock slow agent response, verify timeout error after 30 seconds
- Verify user-friendly error message (no stack traces)
- Verify graceful cleanup of MCP server context

Reference: specs/006-ai-chatbot/spec.md FR-031
"""
import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.main import app
from src.models.conversation import Conversation
from src.models.message import Message, MessageRole
from tests.conftest import test_user_id, generate_test_token


@pytest.mark.asyncio
async def test_chat_endpoint_timeout_30_seconds(
    async_session: AsyncSession,
    test_conversation: Conversation,
    test_user_id: str,
):
    """
    T097: Integration test for 30-second timeout.

    Flow:
    1. Mock agent response to take > 30 seconds
    2. Send chat request
    3. Verify 504 Gateway Timeout returned after 30s
    4. Verify error message is user-friendly
    5. Verify no stack traces exposed
    """
    # Create test client
    client = TestClient(app)

    # Generate valid JWT token for test user
    token = generate_test_token(test_user_id)

    # Mock slow agent response (takes 35 seconds)
    async def slow_agent_generator():
        """Simulate agent that takes longer than 30 seconds."""
        await asyncio.sleep(35)  # Exceeds 30-second timeout
        yield MagicMock()  # Would yield event if timeout didn't occur

    with patch("src.api.v1.chat.get_todo_agent") as mock_get_agent:
        # Setup mock agent
        mock_agent_instance = MagicMock()
        mock_agent_instance.get_agent.return_value = MagicMock()
        mock_agent_instance.mcp_server.__aenter__ = AsyncMock()
        mock_agent_instance.mcp_server.__aexit__ = AsyncMock()
        mock_get_agent.return_value = mock_agent_instance

        # Mock Runner.run_streamed to return slow generator
        with patch("src.api.v1.chat.Runner") as mock_runner:
            mock_runner.run_streamed.return_value = slow_agent_generator()

            # Send chat request
            response = client.post(
                "/chat",
                json={
                    "message": "Add task to buy groceries",
                    "conversation_id": str(test_conversation.id)
                },
                headers={"Authorization": f"Bearer {token}"}
            )

    # Verify timeout response
    assert response.status_code == 504, f"Expected 504 timeout, got {response.status_code}"

    # Verify error event in stream
    error_data = None
    for line in response.text.split("\n"):
        if line.startswith("data: "):
            import json
            try:
                event = json.loads(line[6:])  # Strip "data: " prefix
                if event.get("type") == "error":
                    error_data = event
                    break
            except json.JSONDecodeError:
                continue

    # Verify user-friendly error message
    assert error_data is not None, "Expected error event in stream"
    assert "type" in error_data
    assert error_data["type"] == "error"
    assert "message" in error_data

    # Verify message is user-friendly (no stack traces)
    error_message = error_data["message"].lower()
    assert "timeout" in error_message or "too long" in error_message
    assert "traceback" not in error_message
    assert "exception" not in error_message

    # Verify no sensitive details exposed
    assert "internal" not in error_message or "user" in error_message


@pytest.mark.asyncio
async def test_chat_endpoint_timeout_cleanup(
    async_session: AsyncSession,
    test_conversation: Conversation,
    test_user_id: str,
):
    """
    T097 (variant): Verify MCP server cleanup after timeout.

    Tests that MCP server context manager properly exits
    even when timeout occurs during agent execution.
    """
    client = TestClient(app)
    token = generate_test_token(test_user_id)

    # Track context manager calls
    enter_called = False
    exit_called = False

    async def track_enter():
        nonlocal enter_called
        enter_called = True

    async def track_exit(*args):
        nonlocal exit_called
        exit_called = True

    # Mock slow agent with tracked context manager
    async def slow_agent_generator():
        await asyncio.sleep(35)
        yield MagicMock()

    with patch("src.api.v1.chat.get_todo_agent") as mock_get_agent:
        mock_agent_instance = MagicMock()
        mock_agent_instance.get_agent.return_value = MagicMock()
        mock_agent_instance.mcp_server.__aenter__ = track_enter
        mock_agent_instance.mcp_server.__aexit__ = track_exit
        mock_get_agent.return_value = mock_agent_instance

        with patch("src.api.v1.chat.Runner") as mock_runner:
            mock_runner.run_streamed.return_value = slow_agent_generator()

            response = client.post(
                "/chat",
                json={
                    "message": "Test timeout cleanup",
                    "conversation_id": str(test_conversation.id)
                },
                headers={"Authorization": f"Bearer {token}"}
            )

    # Verify cleanup occurred
    assert enter_called, "MCP server context should have been entered"
    assert exit_called, "MCP server context should have been exited (cleanup)"


@pytest.mark.asyncio
async def test_chat_endpoint_success_under_30_seconds(
    async_session: AsyncSession,
    test_conversation: Conversation,
    test_user_id: str,
):
    """
    T097 (baseline): Verify normal operation under 30 seconds.

    Tests that requests completing within 30 seconds work normally.
    """
    client = TestClient(app)
    token = generate_test_token(test_user_id)

    # Mock fast agent response (completes in 1 second)
    async def fast_agent_generator():
        """Simulate normal fast agent response."""
        await asyncio.sleep(1)  # Well under 30-second timeout

        # Yield text delta event
        from agents.stream_events import RawResponsesStreamEvent
        from openai.types.responses import ResponseTextDeltaEvent

        delta_event = ResponseTextDeltaEvent(delta="Task added successfully!", type="response.text.delta")
        yield RawResponsesStreamEvent(data=delta_event)

    with patch("src.api.v1.chat.get_todo_agent") as mock_get_agent:
        mock_agent_instance = MagicMock()
        mock_agent_instance.get_agent.return_value = MagicMock()
        mock_agent_instance.mcp_server.__aenter__ = AsyncMock()
        mock_agent_instance.mcp_server.__aexit__ = AsyncMock()
        mock_get_agent.return_value = mock_agent_instance

        with patch("src.api.v1.chat.Runner") as mock_runner:
            mock_runner.run_streamed.return_value = fast_agent_generator()

            response = client.post(
                "/chat",
                json={
                    "message": "Add task to buy groceries",
                    "conversation_id": str(test_conversation.id)
                },
                headers={"Authorization": f"Bearer {token}"}
            )

    # Verify success
    assert response.status_code == 200, f"Expected 200 success, got {response.status_code}"

    # Verify streaming response contains chunk
    response_text = response.text
    assert "chunk" in response_text, "Expected chunk event in successful response"
    assert "Task added successfully!" in response_text
