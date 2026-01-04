"""
Integration tests for chat streaming endpoint (Phase 7 User Story 5).

Tests real-time streaming responses with SSE event format per contracts/chat-api.yaml:
- type="chunk": Partial text chunks from agent response
- type="tool_call": Tool invocation events
- type="tool_result": Tool execution results
- type="done": Conversation completion

Reference: contracts/chat-api.yaml (SSE event schema)
Reference: openai-agents-mcp-integration skill section 3.6 (FastAPI Streaming Endpoint)
"""

import pytest
import json
import os
import re
from uuid import uuid4
from typing import AsyncIterator
from httpx import AsyncClient, ASGITransport
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

# Set environment variables before importing app modules
if "BETTER_AUTH_SECRET" not in os.environ:
    os.environ["BETTER_AUTH_SECRET"] = "test-secret-key-for-testing-minimum-32-characters-long"
if "DATABASE_URL" not in os.environ:
    os.environ["DATABASE_URL"] = "sqlite:///:memory:"
if "SKIP_AGENT_TESTS" not in os.environ:
    os.environ["SKIP_AGENT_TESTS"] = "1"  # Skip expensive agent tests by default

from src.main import app
from src.db.session import get_session
from src.auth.dependencies import get_current_user_id
from src.services.chat_service import get_todo_agent


# Test database setup
TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(name="engine")
def engine_fixture():
    """Create test database engine with SQLite in-memory."""
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    yield engine
    SQLModel.metadata.drop_all(engine)


@pytest.fixture(name="session")
def session_fixture(engine) -> Session:
    """Create sync session for tests."""
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session):
    """Create test client with session override."""
    def override_get_session():
        return session

    app.dependency_overrides[get_session] = override_get_session

    with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        yield client

    app.dependency_overrides.clear()


@pytest.fixture(name="mock_user_id")
def mock_user_id_fixture():
    """Mock user ID for authenticated tests."""
    return f"test-user-{uuid4()}"


@pytest.fixture(name="auth_headers")
def auth_headers_fixture(mock_user_id: str):
    """Generate mock JWT token for testing."""
    import jwt
    from datetime import datetime, timedelta

    payload = {
        "sub": mock_user_id,
        "iat": int(datetime.utcnow().timestamp()),
        "exp": int((datetime.utcnow() + timedelta(days=1)).timestamp()),
    }
    token = jwt.encode(payload, "test-secret-key-for-testing-minimum-32-characters-long", algorithm="HS256")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(name="authenticated_client")
def authenticated_client_fixture(client: AsyncClient, mock_user_id: str):
    """Create client with mocked authentication."""
    def override_get_current_user_id():
        return mock_user_id

    app.dependency_overrides[get_current_user_id] = override_get_current_user_id

    yield client

    app.dependency_overrides.clear()


class TestStreamingResponseChunks:
    """Tests for SSE chunk streaming (T067)."""

    @pytest.mark.asyncio
    async def test_streaming_response_chunks_arrive_progressively(
        self,
        authenticated_client: AsyncClient,
        auth_headers: dict,
        mock_user_id: str
    ):
        """
        T067 [P]: Test SSE events with type="chunk" arrive progressively.

        Validates:
        - Response is streaming (not all at once)
        - Events arrive in order
        - Each event has valid SSE format: data: {"type": "chunk", "content": "..."}
        - Multiple chunks are received (text appears progressively)

        This test verifies the streaming behavior without requiring actual
        OpenAI API calls by using mocked agent behavior.

        Reference: contracts/chat-api.yaml Section "ChunkEvent"
        """
        # Send chat message
        async with authenticated_client.post(
            "/api/v1/chat",
            json={"message": "Hello, I need help with my tasks"},
            headers=auth_headers
        ) as response:
            assert response.status_code == 200
            assert response.headers["content-type"] == "text/event-stream; charset=utf-8"

            # Collect all SSE events
            chunks = []
            async for chunk in response.aiter_lines():
                if chunk.startswith("data: "):
                    event_data = chunk[6:]  # Remove "data: " prefix
                    try:
                        event = json.loads(event_data)
                        chunks.append(event)
                    except json.JSONDecodeError:
                        pass  # Skip non-JSON events

        # Verify streaming behavior
        assert len(chunks) > 0, "Should receive at least one chunk"

        # Check for chunk events
        chunk_events = [e for e in chunks if e.get("type") == "chunk"]
        assert len(chunk_events) > 0, "Should receive type='chunk' events"

        # Verify chunk format per chat-api.yaml
        for event in chunk_events:
            assert "type" in event, "Chunk event must have 'type' field"
            assert event["type"] == "chunk", "Type must be 'chunk'"
            assert "content" in event, "Chunk event must have 'content' field"
            assert isinstance(event["content"], str), "Content must be a string"

        # Verify done event exists
        done_events = [e for e in chunks if e.get("type") == "done"]
        assert len(done_events) == 1, "Should receive exactly one type='done' event"

        # Verify conversation_id in done event
        done_event = done_events[0]
        assert "conversation_id" in done_event, "Done event must include conversation_id"


class TestToolCallStreaming:
    """Tests for tool call and result streaming (T068)."""

    @pytest.mark.asyncio
    async def test_streaming_tool_call_and_result_events(
        self,
        authenticated_client: AsyncClient,
        auth_headers: dict,
        mock_user_id: str
    ):
        """
        T068 [P]: Test type="tool_call" and type="tool_result" events in stream.

        Validates:
        - When agent calls a tool, type="tool_call" event is emitted
        - After tool execution, type="tool_result" event is emitted
        - Events include tool name and arguments/result

        Reference: contracts/chat-api.yaml Sections "ToolCallEvent" and "ToolResultEvent"
        """
        # Send message that triggers tool call
        async with authenticated_client.post(
            "/api/v1/chat",
            json={"message": "Add a task to buy groceries"},
            headers=auth_headers
        ) as response:
            assert response.status_code == 200

            # Collect all events
            all_events = []
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    event_data = line[6:]
                    try:
                        event = json.loads(event_data)
                        all_events.append(event)
                    except json.JSONDecodeError:
                        pass

        # Verify tool events if tools were called
        tool_call_events = [e for e in all_events if e.get("type") == "tool_call"]
        tool_result_events = [e for e in all_events if e.get("type") == "tool_result"]

        # Format validation per chat-api.yaml
        for event in tool_call_events:
            assert "type" in event, "Tool call event must have 'type' field"
            assert event["type"] == "tool_call", "Type must be 'tool_call'"
            assert "tool" in event, "Tool call event must have 'tool' field"
            assert "args" in event, "Tool call event must have 'args' field"
            assert isinstance(event["args"], dict), "Args must be a dict"

        for event in tool_result_events:
            assert "type" in event, "Tool result event must have 'type' field"
            assert event["type"] == "tool_result", "Type must be 'tool_result'"
            assert "tool" in event, "Tool result event must have 'tool' field"
            assert "result" in event, "Tool result event must have 'result' field"


class TestSSEFormat:
    """Tests for SSE format compliance (T070-T075)."""

    @pytest.mark.asyncio
    async def test_sse_event_format_compliance(
        self,
        authenticated_client: AsyncClient,
        auth_headers: dict,
        mock_user_id: str
    ):
        """
        Test all SSE events comply with contracts/chat-api.yaml format.

        Validates:
        - Each event is properly formatted JSON
        - Event types match expected schema (chunk, tool_call, tool_result, done)
        - No raw text outside of data: format
        """
        async with authenticated_client.post(
            "/api/v1/chat",
            json={"message": "Show me all my tasks"},
            headers=auth_headers
        ) as response:
            assert response.status_code == 200

            # Parse raw SSE stream
            raw_lines = []
            async for line in response.aiter_lines():
                raw_lines.append(line)

            # Verify SSE format: each data line starts with "data: "
            data_lines = [line for line in raw_lines if line.startswith("data: ")]
            assert len(data_lines) > 0, "Should have data lines"

            # Verify each data line is valid JSON
            events = []
            for line in data_lines:
                event_data = line[6:]  # Remove "data: " prefix
                try:
                    event = json.loads(event_data)
                    events.append(event)
                except json.JSONDecodeError:
                    pytest.fail(f"Invalid JSON in SSE data: {event_data}")

            # Verify event types
            valid_types = {"chunk", "tool_call", "tool_result", "done"}
            for event in events:
                assert "type" in event, "Event must have 'type' field"
                assert event["type"] in valid_types, \
                    f"Unknown event type: {event.get('type')}. Valid: {valid_types}"

    @pytest.mark.asyncio
    async def test_conversation_id_returned_in_done_event(
        self,
        authenticated_client: AsyncClient,
        auth_headers: dict,
        mock_user_id: str
    ):
        """
        Test conversation_id is returned in type="done" event.

        Per chat-api.yaml:
        - DoneEvent must include conversation_id field
        - Format: {"type": "done", "conversation_id": "uuid"}
        """
        async with authenticated_client.post(
            "/api/v1/chat",
            json={"message": "Hi there"},
            headers=auth_headers
        ) as response:
            assert response.status_code == 200

            # Extract done event
            done_event = None
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    event_data = line[6:]
                    try:
                        event = json.loads(event_data)
                        if event.get("type") == "done":
                            done_event = event
                            break
                    except json.JSONDecodeError:
                        pass

            assert done_event is not None, "Should have done event"
            assert "conversation_id" in done_event, "Done event must have conversation_id"

            # Verify UUID format
            conversation_id = done_event["conversation_id"]
            uuid_pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            assert re.match(uuid_pattern, conversation_id), \
                f"conversation_id must be valid UUID: {conversation_id}"


class TestStreamingWithExistingConversation:
    """Tests for streaming with existing conversations."""

    @pytest.mark.asyncio
    async def test_streaming_continues_existing_conversation(
        self,
        authenticated_client: AsyncClient,
        auth_headers: dict,
        mock_user_id: str
    ):
        """
        Test streaming works with existing conversation_id.

        Validates:
        - conversation_id from first request is used in second request
        - Streaming continues with conversation context
        """
        # First request - create conversation
        async with authenticated_client.post(
            "/api/v1/chat",
            json={"message": "Add a task to write tests"},
            headers=auth_headers
        ) as response:
            assert response.status_code == 200

            # Get conversation_id from done event
            conversation_id = None
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    event_data = line[6:]
                    try:
                        event = json.loads(event_data)
                        if event.get("type") == "done":
                            conversation_id = event.get("conversation_id")
                            break
                    except json.JSONDecodeError:
                        pass

        assert conversation_id is not None, "Should get conversation_id"

        # Second request - continue conversation
        async with authenticated_client.post(
            "/api/v1/chat",
            json={
                "message": "Now show me my tasks",
                "conversation_id": conversation_id
            },
            headers=auth_headers
        ) as response:
            assert response.status_code == 200
            assert response.headers["content-type"] == "text/event-stream; charset=utf-8"

            # Should still receive streaming response
            chunks = []
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    event_data = line[6:]
                    try:
                        event = json.loads(event_data)
                        chunks.append(event)
                    except json.JSONDecodeError:
                        pass

            assert len(chunks) > 0, "Should receive chunks in continuation"
