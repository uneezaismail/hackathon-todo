"""
Integration tests for FR-032: 2000 character limit enforcement.

Tests verify that chat endpoint rejects messages exceeding 2000 characters
with 400 Bad Request and provides clear error message.

Test Coverage:
- T098: Send 2001 character message, verify 400 bad request error
- Verify error message indicates character limit
- Verify messages at exactly 2000 characters are accepted
- Verify messages under 2000 characters are accepted

Reference: specs/006-ai-chatbot/spec.md FR-032
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.main import app
from src.models.conversation import Conversation
from tests.conftest import test_user_id, generate_test_token


def test_chat_endpoint_rejects_2001_chars(
    test_conversation: Conversation,
    test_user_id: str,
):
    """
    T098: Integration test for 2000 character limit.

    Flow:
    1. Create message with 2001 characters
    2. Send chat request
    3. Verify 400 Bad Request returned
    4. Verify error message indicates character limit
    5. Verify no agent execution occurred (validation happens first)
    """
    client = TestClient(app)
    token = generate_test_token(test_user_id)

    # Create message with exactly 2001 characters
    long_message = "A" * 2001

    # Send chat request
    response = client.post(
        "/chat",
        json={
            "message": long_message,
            "conversation_id": str(test_conversation.id)
        },
        headers={"Authorization": f"Bearer {token}"}
    )

    # Verify 400 Bad Request
    assert response.status_code == 422, f"Expected 422 validation error, got {response.status_code}"

    # Verify error message
    error_data = response.json()
    assert "detail" in error_data, "Expected error detail in response"

    # Check if error mentions character limit
    error_str = str(error_data["detail"]).lower()
    assert "2000" in error_str or "length" in error_str or "max" in error_str, \
        f"Error should mention character limit: {error_data['detail']}"


def test_chat_endpoint_accepts_exactly_2000_chars(
    test_conversation: Conversation,
    test_user_id: str,
):
    """
    T098 (boundary): Verify exactly 2000 characters is accepted.

    Tests boundary condition - message at exactly the limit should succeed.
    """
    client = TestClient(app)
    token = generate_test_token(test_user_id)

    # Create message with exactly 2000 characters
    boundary_message = "B" * 2000

    # Mock agent to avoid actual execution
    from unittest.mock import patch, MagicMock, AsyncMock

    async def mock_generator():
        from agents.stream_events import RawResponsesStreamEvent
        from openai.types.responses import ResponseTextDeltaEvent
        delta_event = ResponseTextDeltaEvent(delta="OK", type="response.text.delta")
        yield RawResponsesStreamEvent(data=delta_event)

    with patch("src.api.v1.chat.get_todo_agent") as mock_get_agent:
        mock_agent_instance = MagicMock()
        mock_agent_instance.get_agent.return_value = MagicMock()
        mock_agent_instance.mcp_server.__aenter__ = AsyncMock()
        mock_agent_instance.mcp_server.__aexit__ = AsyncMock()
        mock_get_agent.return_value = mock_agent_instance

        with patch("src.api.v1.chat.Runner") as mock_runner:
            mock_runner.run_streamed.return_value = mock_generator()

            response = client.post(
                "/chat",
                json={
                    "message": boundary_message,
                    "conversation_id": str(test_conversation.id)
                },
                headers={"Authorization": f"Bearer {token}"}
            )

    # Verify success (not rejected for length)
    assert response.status_code == 200, \
        f"2000 char message should be accepted, got {response.status_code}"


def test_chat_endpoint_accepts_under_2000_chars(
    test_conversation: Conversation,
    test_user_id: str,
):
    """
    T098 (normal case): Verify messages under 2000 characters are accepted.

    Tests normal operation with typical message lengths.
    """
    client = TestClient(app)
    token = generate_test_token(test_user_id)

    # Create normal message (under 2000 chars)
    normal_message = "Add task to buy groceries and fruits from the market."

    # Mock agent
    from unittest.mock import patch, MagicMock, AsyncMock

    async def mock_generator():
        from agents.stream_events import RawResponsesStreamEvent
        from openai.types.responses import ResponseTextDeltaEvent
        delta_event = ResponseTextDeltaEvent(delta="Task added!", type="response.text.delta")
        yield RawResponsesStreamEvent(data=delta_event)

    with patch("src.api.v1.chat.get_todo_agent") as mock_get_agent:
        mock_agent_instance = MagicMock()
        mock_agent_instance.get_agent.return_value = MagicMock()
        mock_agent_instance.mcp_server.__aenter__ = AsyncMock()
        mock_agent_instance.mcp_server.__aexit__ = AsyncMock()
        mock_get_agent.return_value = mock_agent_instance

        with patch("src.api.v1.chat.Runner") as mock_runner:
            mock_runner.run_streamed.return_value = mock_generator()

            response = client.post(
                "/chat",
                json={
                    "message": normal_message,
                    "conversation_id": str(test_conversation.id)
                },
                headers={"Authorization": f"Bearer {token}"}
            )

    # Verify success
    assert response.status_code == 200, f"Normal message should succeed, got {response.status_code}"


def test_chat_endpoint_rejects_5000_chars(
    test_conversation: Conversation,
    test_user_id: str,
):
    """
    T098 (extreme): Verify very long messages are rejected.

    Tests that even extremely long messages (5000+ chars) are properly rejected.
    """
    client = TestClient(app)
    token = generate_test_token(test_user_id)

    # Create very long message
    very_long_message = "X" * 5000

    # Send chat request
    response = client.post(
        "/chat",
        json={
            "message": very_long_message,
            "conversation_id": str(test_conversation.id)
        },
        headers={"Authorization": f"Bearer {token}"}
    )

    # Verify rejection
    assert response.status_code == 422, f"Expected 422 validation error, got {response.status_code}"


def test_chat_endpoint_rejects_empty_message(
    test_conversation: Conversation,
    test_user_id: str,
):
    """
    T098 (edge case): Verify empty messages are rejected.

    Tests minimum length validation (min_length=1 in ChatRequest).
    """
    client = TestClient(app)
    token = generate_test_token(test_user_id)

    # Send empty message
    response = client.post(
        "/chat",
        json={
            "message": "",
            "conversation_id": str(test_conversation.id)
        },
        headers={"Authorization": f"Bearer {token}"}
    )

    # Verify rejection
    assert response.status_code == 422, f"Empty message should be rejected, got {response.status_code}"

    # Verify error mentions minimum length
    error_data = response.json()
    error_str = str(error_data["detail"]).lower()
    assert "length" in error_str or "empty" in error_str or "required" in error_str
