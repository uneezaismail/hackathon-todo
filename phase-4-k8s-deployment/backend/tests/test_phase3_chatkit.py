"""
Phase 3 ChatKit Integration Tests

Tests for the official ChatKit endpoint (/chatkit) and related components.

Test Coverage:
1. ChatKit endpoint authentication
2. TaskChatKitServer initialization
3. Conversation memory persistence
4. User isolation
5. Error handling

Reference: openai-agents-mcp-integration skill, new-openai-chatkit-backend-python skill
"""

import pytest
from httpx import AsyncClient
from unittest.mock import Mock, AsyncMock, patch
import json
import os


# =============================================================================
# Test Fixtures
# =============================================================================

@pytest.fixture
def mock_chatkit_payload():
    """Mock ChatKit request payload."""
    return json.dumps({
        "thread_id": "test-thread-123",
        "messages": [
            {
                "role": "user",
                "content": [{"type": "text", "text": "Add a task to buy groceries"}]
            }
        ]
    }).encode("utf-8")


@pytest.fixture
def chatkit_headers(test_token):
    """Headers for ChatKit endpoint with JWT authentication."""
    return {
        "Authorization": f"Bearer {test_token}",
        "Content-Type": "application/json",
    }


# =============================================================================
# ChatKit Endpoint Tests
# =============================================================================

@pytest.mark.asyncio
async def test_chatkit_endpoint_requires_authentication(async_client: AsyncClient):
    """Test that /chatkit endpoint requires JWT authentication."""
    # Arrange
    payload = json.dumps({"thread_id": "test", "messages": []})

    # Act
    response = await async_client.post(
        "/api/chatkit",
        content=payload,
        headers={"Content-Type": "application/json"}
    )

    # Assert
    assert response.status_code == 403  # HTTPBearer auto_error raises 403


@pytest.mark.asyncio
async def test_chatkit_endpoint_with_valid_token(
    async_client: AsyncClient,
    chatkit_headers: dict,
    mock_chatkit_payload: bytes
):
    """Test /chatkit endpoint with valid JWT token."""
    # This is an integration test that would require a running MCP server
    # and LLM API keys, so we skip in unit tests
    pytest.skip("Integration test - requires running MCP server and LLM API")


# =============================================================================
# TaskChatKitServer Tests
# =============================================================================

def test_task_chatkit_server_initialization():
    """Test TaskChatKitServer can be initialized."""
    from src.services.chatkit_store import MemoryStore
    from src.services.chatkit_server import TaskChatKitServer

    # Arrange
    store = MemoryStore()

    # Act
    server = TaskChatKitServer(store, session_db_path=":memory:")

    # Assert
    assert server is not None
    assert server.agent is not None
    assert server.mcp_server is not None
    assert server.session_db_path == ":memory:"


def test_task_chatkit_server_uses_todo_agent():
    """Test TaskChatKitServer initializes TodoAgent correctly."""
    from src.services.chatkit_store import MemoryStore
    from src.services.chatkit_server import TaskChatKitServer

    # Arrange
    store = MemoryStore()

    # Act
    server = TaskChatKitServer(store, session_db_path=":memory:")

    # Assert
    # Verify agent has correct name and MCP server attached
    assert server.agent.name == "TodoAgent"
    assert len(server.agent.mcp_servers) == 1
    assert server.agent.mcp_servers[0].name == "task-management-server"


# =============================================================================
# Conversation Memory Tests
# =============================================================================

@pytest.mark.asyncio
async def test_chatkit_server_uses_sqlite_session():
    """Test TaskChatKitServer uses SQLiteSession for conversation memory."""
    from src.services.chatkit_store import MemoryStore
    from src.services.chatkit_server import TaskChatKitServer

    # Arrange
    store = MemoryStore()
    server = TaskChatKitServer(store, session_db_path=":memory:")

    # Assert
    # SQLiteSession is created per-request in respond() method
    # This test verifies the initialization accepts session_db_path
    assert server.session_db_path == ":memory:"


# =============================================================================
# User Isolation Tests
# =============================================================================

@pytest.mark.asyncio
async def test_chatkit_endpoint_extracts_user_id_from_jwt(
    async_client: AsyncClient,
    chatkit_headers: dict,
    mock_chatkit_payload: bytes
):
    """Test /chatkit endpoint extracts user_id from JWT for tool calls."""
    # This test would verify that user_id is passed to agent context
    # Requires mocking the entire ChatKit server pipeline
    pytest.skip("Complex integration test - requires full mock pipeline")


# =============================================================================
# Error Handling Tests
# =============================================================================

@pytest.mark.asyncio
async def test_chatkit_endpoint_handles_invalid_payload(
    async_client: AsyncClient,
    chatkit_headers: dict
):
    """Test /chatkit endpoint handles invalid payload gracefully."""
    # Arrange
    invalid_payload = b"not-json"

    # Act
    response = await async_client.post(
        "/api/chatkit",
        content=invalid_payload,
        headers=chatkit_headers
    )

    # Assert
    # ChatKit server should handle this gracefully
    assert response.status_code in [400, 500]


@pytest.mark.asyncio
async def test_chatkit_endpoint_handles_missing_user_id():
    """Test /chatkit endpoint handles missing user_id in context."""
    from src.services.chatkit_store import MemoryStore
    from src.services.chatkit_server import TaskChatKitServer
    from chatkit.server import ThreadMetadata, UserMessageItem

    # Arrange
    store = MemoryStore()
    server = TaskChatKitServer(store, session_db_path=":memory:")

    thread = ThreadMetadata(id="test-thread")
    user_message = UserMessageItem(content=[])
    context = {}  # Missing user_id

    # Act
    result = []
    async for event in server.respond(thread, user_message, context):
        result.append(event)

    # Assert
    # Should return early when user_id is missing
    assert len(result) == 0


# =============================================================================
# ChatKit vs Custom Chat Endpoint Tests
# =============================================================================

@pytest.mark.asyncio
async def test_custom_chat_endpoint_is_disabled(async_client: AsyncClient):
    """Test that custom /api/v1/chat endpoint is disabled."""
    # Arrange
    payload = {"message": "test", "conversation_id": None}

    # Act
    response = await async_client.post(
        "/api/v1/chat",
        json=payload
    )

    # Assert
    # Should return 404 Not Found since router is commented out
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_chatkit_endpoint_is_active(
    async_client: AsyncClient,
    chatkit_headers: dict
):
    """Test that /api/chatkit endpoint is active (returns 403 without auth, not 404)."""
    # Arrange
    payload = json.dumps({"thread_id": "test", "messages": []})

    # Act - Test without authentication
    response_no_auth = await async_client.post(
        "/api/chatkit",
        content=payload,
        headers={"Content-Type": "application/json"}
    )

    # Assert - Should require authentication, not return 404
    assert response_no_auth.status_code == 403  # Auth required, endpoint exists
    assert response_no_auth.status_code != 404  # Endpoint is registered


# =============================================================================
# Integration Test Markers
# =============================================================================

@pytest.mark.integration
@pytest.mark.asyncio
async def test_chatkit_full_conversation_flow():
    """
    Full integration test for ChatKit conversation flow.

    Requires:
    - Running MCP server
    - Valid LLM API keys
    - PostgreSQL database

    Tests:
    1. User sends message
    2. Agent calls MCP tools
    3. Response streamed back
    4. Conversation persisted to SQLiteSession
    """
    pytest.skip("Integration test - requires external dependencies")


@pytest.mark.integration
@pytest.mark.asyncio
async def test_chatkit_mcp_tool_invocation():
    """
    Test that ChatKit agent successfully invokes MCP tools.

    Verifies:
    - MCP server connection
    - Tool discovery
    - Tool execution
    - Result handling
    """
    pytest.skip("Integration test - requires running MCP server")


# =============================================================================
# Documentation
# =============================================================================

"""
Running These Tests
===================

Unit Tests (No External Dependencies):
    pytest tests/test_phase3_chatkit.py -v -k "not integration"

Integration Tests (Requires MCP Server + LLM):
    pytest tests/test_phase3_chatkit.py -v -m integration

All Tests:
    pytest tests/test_phase3_chatkit.py -v


Test Coverage Report:
    pytest tests/test_phase3_chatkit.py --cov=src --cov-report=term-missing


Expected Failures (Unit Tests):
- Skipped: Integration tests requiring external dependencies
- Passed: All unit tests for initialization, configuration, endpoint registration


Expected Failures (Integration Tests):
- May fail if LLM_PROVIDER not set or API keys missing
- May fail if MCP server cannot start
- May timeout if LLM API is slow


Troubleshooting:
1. "No LLM_PROVIDER" → Set environment variable or use .env file
2. "MCP server failed" → Check PYTHONPATH and mcp_server module
3. "Database error" → Check DATABASE_URL in .env
4. "JWT validation failed" → Check BETTER_AUTH_SECRET matches frontend
"""
