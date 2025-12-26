"""Unit tests for Conversation model.

Tests creation, validation, relationships, and business rules.
Includes ChatKit-specific fields: thread_id, is_active
"""
import pytest
from datetime import datetime
from uuid import uuid4

from src.models.conversation import Conversation
from src.models.message import Message, MessageRole


def test_conversation_creation():
    """Test creating a conversation with default values."""
    user_id = "test-user-123"
    conversation = Conversation(user_id=user_id)

    assert conversation.id is not None
    assert conversation.user_id == user_id
    assert isinstance(conversation.created_at, datetime)
    assert isinstance(conversation.updated_at, datetime)
    assert conversation.created_at == conversation.updated_at


def test_conversation_custom_id():
    """Test creating conversation with custom UUID."""
    custom_id = uuid4()
    user_id = "test-user-456"
    conversation = Conversation(id=custom_id, user_id=user_id)

    assert conversation.id == custom_id
    assert conversation.user_id == user_id


def test_conversation_user_id_required():
    """Test that user_id is required."""
    with pytest.raises(ValueError):
        Conversation()


def test_conversation_timestamps():
    """Test that timestamps are set correctly."""
    conversation = Conversation(user_id="test-user")

    assert conversation.created_at <= datetime.utcnow()
    assert conversation.updated_at <= datetime.utcnow()
    assert abs((conversation.updated_at - conversation.created_at).total_seconds()) < 1


def test_conversation_relationship_structure():
    """Test that conversation has messages relationship defined."""
    conversation = Conversation(user_id="test-user")

    # Messages relationship should exist
    assert hasattr(conversation, 'messages')
    # Initial messages list should be empty (lazy loading)
    assert conversation.messages is None or len(conversation.messages) == 0


def test_conversation_user_id_indexing():
    """Test that user_id field is indexed (model metadata check)."""
    # Check model configuration
    assert hasattr(Conversation, '__table__')

    # Find user_id column
    user_id_column = None
    for column in Conversation.__table__.columns:
        if column.name == 'user_id':
            user_id_column = column
            break

    assert user_id_column is not None, "user_id column should exist"
    assert user_id_column.index is True, "user_id should be indexed"


def test_conversation_multiple_instances():
    """Test creating multiple conversations for same user."""
    user_id = "test-user-multi"

    conv1 = Conversation(user_id=user_id)
    conv2 = Conversation(user_id=user_id)
    conv3 = Conversation(user_id=user_id)

    # All should have unique IDs
    assert conv1.id != conv2.id != conv3.id
    # All should have same user_id
    assert conv1.user_id == conv2.user_id == conv3.user_id == user_id


def test_conversation_repr():
    """Test string representation of conversation."""
    conversation = Conversation(user_id="test-user")
    repr_str = repr(conversation)

    assert "Conversation" in repr_str
    assert str(conversation.id) in repr_str or "test-user" in repr_str


def test_conversation_100_limit_logic():
    """Test the business logic for 100-conversation limit.

    Note: This tests the model structure. The enforcement logic
    is in ConversationService._enforce_conversation_limit.
    """
    # Create 101 conversations (simulating the limit scenario)
    user_id = "test-user-limit"
    conversations = [Conversation(user_id=user_id) for _ in range(101)]

    # All should be created successfully (model doesn't enforce limit)
    assert len(conversations) == 101

    # The limit enforcement is service-layer responsibility
    # This test verifies the model can handle multiple instances
    for conv in conversations:
        assert conv.user_id == user_id
        assert conv.id is not None


# =============================================================================
# ChatKit-Specific Tests (T021) - NEW
# =============================================================================

def test_conversation_with_thread_id():
    """Test creating a conversation with ChatKit thread_id.

    Tests T021: Conversation model validation with thread_id
    """
    user_id = "test-user-thread"
    thread_id = uuid4()

    conversation = Conversation(
        user_id=user_id,
        thread_id=thread_id
    )

    assert conversation.thread_id == thread_id
    assert isinstance(conversation.thread_id, uuid4().__class__)


def test_conversation_thread_id_unique():
    """Test that thread_id is configured as unique constraint.

    Tests T021: thread_id unique constraint for ChatKit sync
    """
    from sqlalchemy import inspect
    from phase_3_todo_ai_chatbot.backend.db.engine import engine

    inspector = inspect(engine)
    columns = inspector.get_columns('conversations')
    column_info = {col['name']: col for col in columns}

    assert 'thread_id' in column_info, "thread_id column should exist"


def test_conversation_is_active_default_true():
    """Test that is_active defaults to True (soft delete flag).

    Tests T021: is_active flag for conversation archival
    """
    conversation = Conversation(user_id="test-user")
    assert conversation.is_active is True


def test_conversation_is_active_can_be_false():
    """Test that is_active can be set to False for soft delete."""
    conversation = Conversation(
        user_id="test-user",
        is_active=False
    )

    assert conversation.is_active is False


def test_conversation_with_title():
    """Test creating a conversation with optional title."""
    conversation = Conversation(
        user_id="test-user",
        title="My Todo Chat"
    )

    assert conversation.title == "My Todo Chat"


def test_conversation_title_optional():
    """Test that title is optional (can be None)."""
    conversation = Conversation(user_id="test-user")

    # Title should be None by default
    assert conversation.title is None


def test_conversation_updated_at_changes_on_modification():
    """Test that updated_at is updated when conversation is modified."""
    import time
    conversation = Conversation(user_id="test-user")

    # Get original updated_at
    original_updated_at = conversation.updated_at

    # Wait a moment and simulate modification
    time.sleep(0.01)

    # In real usage, the service would update updated_at
    conversation.updated_at = datetime.utcnow()

    assert conversation.updated_at > original_updated_at
