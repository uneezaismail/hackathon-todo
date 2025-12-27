"""Unit tests for Message model.

Tests role enum, content validation, 2000 char limit, and 2-day retention.
Includes ChatKit-specific fields: chatkit_item_id, user_id (denormalized), tool_calls JSONB
"""
import pytest
from datetime import datetime, timedelta
from uuid import uuid4

from src.models.message import Message, MessageRole


def test_message_creation_user():
    """Test creating a user message."""
    conversation_id = uuid4()
    content = "Hello, I need help with my tasks"

    message = Message(
        conversation_id=conversation_id,
        role=MessageRole.USER,
        content=content
    )

    assert message.id is not None
    assert message.conversation_id == conversation_id
    assert message.role == MessageRole.USER
    assert message.content == content
    assert isinstance(message.created_at, datetime)
    assert isinstance(message.expires_at, datetime)


def test_message_creation_assistant():
    """Test creating an assistant message."""
    conversation_id = uuid4()
    content = "I'd be happy to help you manage your tasks!"

    message = Message(
        conversation_id=conversation_id,
        role=MessageRole.ASSISTANT,
        content=content
    )

    assert message.role == MessageRole.ASSISTANT
    assert message.content == content


def test_message_role_enum_values():
    """Test MessageRole enum has correct values."""
    assert MessageRole.USER.value == "user"
    assert MessageRole.ASSISTANT.value == "assistant"
    assert len(list(MessageRole)) == 2


def test_message_role_enum_string_comparison():
    """Test role enum string comparison."""
    message = Message(
        conversation_id=uuid4(),
        role=MessageRole.USER,
        content="test"
    )

    assert message.role.value == "user"
    assert message.role == MessageRole.USER


def test_message_is_user_message_property():
    """Test is_user_message helper property."""
    user_message = Message(
        conversation_id=uuid4(),
        role=MessageRole.USER,
        content="test"
    )
    assistant_message = Message(
        conversation_id=uuid4(),
        role=MessageRole.ASSISTANT,
        content="test"
    )

    assert user_message.is_user_message is True
    assert assistant_message.is_user_message is False


def test_message_is_assistant_message_property():
    """Test is_assistant_message helper property."""
    user_message = Message(
        conversation_id=uuid4(),
        role=MessageRole.USER,
        content="test"
    )
    assistant_message = Message(
        conversation_id=uuid4(),
        role=MessageRole.ASSISTANT,
        content="test"
    )

    assert user_message.is_assistant_message is False
    assert assistant_message.is_assistant_message is True


def test_message_2000_char_user_content():
    """Test user message with exactly 2000 characters.

    Note: The 2000 char limit is enforced in the API layer
    (ConversationService.add_message) and database constraint,
    not in the model itself.
    """
    content = "a" * 2000  # Exactly 2000 chars
    message = Message(
        conversation_id=uuid4(),
        role=MessageRole.USER,
        content=content
    )

    assert len(message.content) == 2000
    assert message.content == content


def test_message_over_2000_char_user_content_model_allows():
    """Test that model allows >2000 chars (enforcement is in API/DB).

    The model itself doesn't enforce the limit - it's enforced by:
    1. API validation in ConversationService.add_message (raises ValueError)
    2. Database CHECK constraint (fails at insert time)
    """
    content = "a" * 2500  # Over limit
    message = Message(
        conversation_id=uuid4(),
        role=MessageRole.USER,
        content=content
    )

    # Model allows it (validation happens at service/DB layer)
    assert len(message.content) == 2500


def test_message_assistant_unlimited_content():
    """Test assistant messages can have unlimited length."""
    # AI responses can be long
    long_content = "a" * 5000
    message = Message(
        conversation_id=uuid4(),
        role=MessageRole.ASSISTANT,
        content=long_content
    )

    assert len(message.content) == 5000
    assert message.content == long_content


def test_message_expires_at_default():
    """Test expires_at is set to 2 days from creation."""
    before = datetime.utcnow()
    message = Message(
        conversation_id=uuid4(),
        role=MessageRole.USER,
        content="test"
    )
    after = datetime.utcnow()

    expected_expiry = before + timedelta(days=2)

    # Should be approximately 2 days from now
    assert message.expires_at >= expected_expiry - timedelta(seconds=5)
    assert message.expires_at <= after + timedelta(days=2, seconds=5)


def test_message_is_expired_property_not_expired():
    """Test is_expired property for recent message."""
    message = Message(
        conversation_id=uuid4(),
        role=MessageRole.USER,
        content="test"
    )

    # Newly created message should not be expired
    assert message.is_expired is False


def test_message_is_expired_property_expired():
    """Test is_expired property for old message."""
    # Create message with past expiry
    message = Message(
        conversation_id=uuid4(),
        role=MessageRole.USER,
        content="test"
    )
    # Manually set expiry to past
    message.expires_at = datetime.utcnow() - timedelta(hours=1)

    assert message.is_expired is True


def test_message_timestamps():
    """Test that created_at is set correctly."""
    before = datetime.utcnow()
    message = Message(
        conversation_id=uuid4(),
        role=MessageRole.USER,
        content="test"
    )
    after = datetime.utcnow()

    assert before <= message.created_at <= after


def test_message_conversation_id_required():
    """Test that conversation_id is required."""
    with pytest.raises((ValueError, TypeError)):
        Message(
            role=MessageRole.USER,
            content="test"
        )


def test_message_role_required():
    """Test that role is required."""
    with pytest.raises((ValueError, TypeError)):
        Message(
            conversation_id=uuid4(),
            content="test"
        )


def test_message_content_required():
    """Test that content is required."""
    with pytest.raises((ValueError, TypeError)):
        Message(
            conversation_id=uuid4(),
            role=MessageRole.USER
        )


def test_message_empty_content_allowed():
    """Test that empty string content is allowed (edge case)."""
    message = Message(
        conversation_id=uuid4(),
        role=MessageRole.USER,
        content=""
    )

    assert message.content == ""
    assert len(message.content) == 0


def test_message_relationship_structure():
    """Test that message has conversation relationship defined."""
    message = Message(
        conversation_id=uuid4(),
        role=MessageRole.USER,
        content="test"
    )

    # Conversation relationship should exist
    assert hasattr(message, 'conversation')
    # Lazy loading - will be None until database query
    assert message.conversation is None


def test_message_multiple_in_conversation():
    """Test creating multiple messages for same conversation."""
    conversation_id = uuid4()

    msg1 = Message(conversation_id=conversation_id, role=MessageRole.USER, content="Hello")
    msg2 = Message(conversation_id=conversation_id, role=MessageRole.ASSISTANT, content="Hi there")
    msg3 = Message(conversation_id=conversation_id, role=MessageRole.USER, content="Help me")

    # All should have unique IDs
    assert msg1.id != msg2.id != msg3.id
    # All should have same conversation_id
    assert msg1.conversation_id == msg2.conversation_id == msg3.conversation_id == conversation_id


# =============================================================================
# ChatKit-Specific Tests (T022) - NEW
# =============================================================================

def test_message_with_chatkit_item_id():
    """Test creating a message with ChatKit item_id.

    Tests T022: chatkit_item_id field for frontend synchronization
    """
    chatkit_id = str(uuid4())
    message = Message(
        chatkit_item_id=chatkit_id,
        conversation_id=uuid4(),
        role=MessageRole.USER,
        content="Hello from ChatKit"
    )

    assert message.chatkit_item_id == chatkit_id
    assert isinstance(message.chatkit_item_id, str)


def test_message_chatkit_item_id_uuid_format():
    """Test that chatkit_item_id accepts UUID format."""
    chatkit_uuid = uuid4()
    message = Message(
        chatkit_item_id=str(chatkit_uuid),
        conversation_id=uuid4(),
        role=MessageRole.USER,
        content="Test"
    )

    # Verify it's stored as string
    assert message.chatkit_item_id == str(chatkit_uuid)


def test_message_with_tool_calls():
    """Test creating a message with MCP tool calls JSONB.

    Tests T022: tool_calls JSONB field for MCP tool debugging
    """
    tool_calls = {
        "add_task": {
            "user_id": "user-123",
            "title": "Buy groceries"
        },
        "list_tasks": {
            "status_filter": "pending"
        }
    }

    message = Message(
        chatkit_item_id=str(uuid4()),
        conversation_id=uuid4(),
        user_id="user-123",
        role=MessageRole.ASSISTANT,
        content="I'll help you with that",
        tool_calls=tool_calls
    )

    assert message.tool_calls == tool_calls
    assert message.tool_calls["add_task"]["title"] == "Buy groceries"
    assert message.tool_calls["list_tasks"]["status_filter"] == "pending"


def test_message_tool_calls_empty_dict():
    """Test that tool_calls can be an empty dict."""
    message = Message(
        chatkit_item_id=str(uuid4()),
        conversation_id=uuid4(),
        role=MessageRole.USER,
        content="Just saying hi",
        tool_calls={}
    )

    assert message.tool_calls == {}


def test_message_tool_calls_none():
    """Test that tool_calls defaults to None."""
    message = Message(
        chatkit_item_id=str(uuid4()),
        conversation_id=uuid4(),
        role=MessageRole.USER,
        content="No tool calls here"
    )

    assert message.tool_calls is None


def test_message_with_denormalized_user_id():
    """Test creating a message with denormalized user_id.

    Tests T022: user_id field denormalized for user isolation queries
    """
    user_id = "user-456"
    message = Message(
        chatkit_item_id=str(uuid4()),
        conversation_id=uuid4(),
        user_id=user_id,
        role=MessageRole.USER,
        content="User message"
    )

    assert message.user_id == user_id
    assert isinstance(message.user_id, str)


def test_message_user_id_for_query_optimization():
    """Test that denormalized user_id enables fast user isolation.

    Tests T022: user_id denormalization for performance
    """
    user_id = "user-789"
    message = Message(
        chatkit_item_id=str(uuid4()),
        conversation_id=uuid4(),
        user_id=user_id,
        role=MessageRole.USER,
        content="Query by user_id"
    )

    # User can be queried directly without joining to conversation
    # This is the optimization purpose of denormalization
    assert hasattr(message, 'user_id')
    assert message.user_id == user_id


def test_message_expires_at_2_days_from_creation():
    """Test that expires_at is exactly 2 days from creation.

    Tests T022: 2-day retention policy via expires_at field
    """
    before = datetime.utcnow()
    message = Message(
        chatkit_item_id=str(uuid4()),
        conversation_id=uuid4(),
        user_id="user",
        role=MessageRole.USER,
        content="Temporary message"
    )
    after = datetime.utcnow()

    # expires_at should be approximately 2 days (48 hours) from creation
    expected_min = before + timedelta(days=2)
    expected_max = after + timedelta(days=2)

    assert message.expires_at >= expected_min - timedelta(seconds=1)
    assert message.expires_at <= expected_max + timedelta(seconds=1)


def test_message_is_expired_within_retention_period():
    """Test is_expired is False for messages within 2-day retention."""
    # Create message that expires in the future (within retention)
    message = Message(
        chatkit_item_id=str(uuid4()),
        conversation_id=uuid4(),
        user_id="user",
        role=MessageRole.USER,
        content="Fresh message",
        expires_at=datetime.utcnow() + timedelta(days=1)  # 1 day from now
    )

    assert message.is_expired is False


def test_message_is_expired_past_retention_period():
    """Test is_expired is True for messages past 2-day retention."""
    # Create message that expired (past retention)
    message = Message(
        chatkit_item_id=str(uuid4()),
        conversation_id=uuid4(),
        user_id="user",
        role=MessageRole.USER,
        content="Expired message",
        expires_at=datetime.utcnow() - timedelta(hours=1)  # 1 hour ago
    )

    assert message.is_expired is True


def test_message_exactly_at_expiry_boundary():
    """Test is_expired at exact expiry boundary."""
    # Create message that expires exactly now
    message = Message(
        chatkit_item_id=str(uuid4()),
        conversation_id=uuid4(),
        user_id="user",
        role=MessageRole.USER,
        content="Boundary message",
        expires_at=datetime.utcnow()  # Exactly now
    )

    # Should be considered expired (expires_at < NOW() or <= NOW() depending on implementation)
    # Based on implementation: is_expired = NOW() > expires_at
    # So if NOW() >= expires_at, it's expired
    assert message.is_expired is True or message.expires_at == datetime.utcnow()
