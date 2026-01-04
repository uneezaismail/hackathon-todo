"""Integration tests for conversation persistence.

Tests ConversationService with actual async database operations.
Requires database connection and async test support.
"""
import pytest
from datetime import datetime
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from src.models.conversation import Conversation
from src.models.message import Message, MessageRole
from src.services.conversation_service import ConversationService


@pytest.mark.asyncio
async def test_create_new_conversation(async_session: AsyncSession):
    """Test creating a new conversation."""
    user_id = f"test-user-{uuid4()}"

    conversation = await ConversationService.get_or_create_conversation(
        async_session, user_id, None
    )

    assert conversation.id is not None
    assert conversation.user_id == user_id
    assert isinstance(conversation.created_at, datetime)
    assert isinstance(conversation.updated_at, datetime)


@pytest.mark.asyncio
async def test_get_existing_conversation(async_session: AsyncSession):
    """Test retrieving an existing conversation."""
    user_id = f"test-user-{uuid4()}"

    # Create first
    conv1 = await ConversationService.get_or_create_conversation(
        async_session, user_id, None
    )

    # Retrieve same conversation
    conv2 = await ConversationService.get_or_create_conversation(
        async_session, user_id, conv1.id
    )

    assert conv1.id == conv2.id
    assert conv1.user_id == conv2.user_id


@pytest.mark.asyncio
async def test_add_message_to_conversation(async_session: AsyncSession):
    """Test adding messages to a conversation."""
    user_id = f"test-user-{uuid4()}"

    # Create conversation
    conversation = await ConversationService.get_or_create_conversation(
        async_session, user_id, None
    )

    # Add user message
    msg1 = await ConversationService.add_message(
        async_session,
        user_id,
        conversation.id,
        MessageRole.USER,
        "Hello, I need help"
    )

    assert msg1.id is not None
    assert msg1.conversation_id == conversation.id
    assert msg1.role == MessageRole.USER
    assert msg1.content == "Hello, I need help"

    # Add assistant message
    msg2 = await ConversationService.add_message(
        async_session,
        user_id,
        conversation.id,
        MessageRole.ASSISTANT,
        "I'm happy to help you!"
    )

    assert msg2.conversation_id == conversation.id
    assert msg2.role == MessageRole.ASSISTANT


@pytest.mark.asyncio
async def test_get_conversation_history_chronological(async_session: AsyncSession):
    """Test retrieving conversation history in chronological order."""
    user_id = f"test-user-{uuid4()}"

    # Create conversation
    conversation = await ConversationService.get_or_create_conversation(
        async_session, user_id, None
    )

    # Add multiple messages
    await ConversationService.add_message(
        async_session, user_id, conversation.id, MessageRole.USER, "Message 1"
    )
    await ConversationService.add_message(
        async_session, user_id, conversation.id, MessageRole.ASSISTANT, "Response 1"
    )
    await ConversationService.add_message(
        async_session, user_id, conversation.id, MessageRole.USER, "Message 2"
    )
    await ConversationService.add_message(
        async_session, user_id, conversation.id, MessageRole.ASSISTANT, "Response 2"
    )

    # Get history
    history = await ConversationService.get_conversation_history(
        async_session, conversation.id, user_id, limit=500
    )

    # Verify chronological order
    assert len(history) == 4
    assert history[0]["role"] == "user"
    assert history[0]["content"] == "Message 1"
    assert history[1]["role"] == "assistant"
    assert history[1]["content"] == "Response 1"
    assert history[2]["role"] == "user"
    assert history[2]["content"] == "Message 2"
    assert history[3]["role"] == "assistant"
    assert history[3]["content"] == "Response 2"


@pytest.mark.asyncio
async def test_get_conversation_history_openai_format(async_session: AsyncSession):
    """Test that history is returned in OpenAI-compatible format."""
    user_id = f"test-user-{uuid4()}"

    conversation = await ConversationService.get_or_create_conversation(
        async_session, user_id, None
    )

    await ConversationService.add_message(
        async_session, user_id, conversation.id, MessageRole.USER, "Test message"
    )

    history = await ConversationService.get_conversation_history(
        async_session, conversation.id, user_id
    )

    # Check OpenAI format
    assert len(history) == 1
    assert "role" in history[0]
    assert "content" in history[0]
    assert history[0]["role"] == "user"  # String, not enum
    assert history[0]["content"] == "Test message"


@pytest.mark.asyncio
async def test_user_isolation_get_conversation(async_session: AsyncSession):
    """Test that users cannot access other users' conversations."""
    user1_id = f"test-user-{uuid4()}"
    user2_id = f"test-user-{uuid4()}"

    # User 1 creates conversation
    conv1 = await ConversationService.get_or_create_conversation(
        async_session, user1_id, None
    )

    # User 2 tries to access User 1's conversation
    with pytest.raises(PermissionError, match="not found or access denied"):
        await ConversationService.get_or_create_conversation(
            async_session, user2_id, conv1.id
        )


@pytest.mark.asyncio
async def test_user_isolation_add_message(async_session: AsyncSession):
    """Test that users cannot add messages to other users' conversations."""
    user1_id = f"test-user-{uuid4()}"
    user2_id = f"test-user-{uuid4()}"

    # User 1 creates conversation
    conv1 = await ConversationService.get_or_create_conversation(
        async_session, user1_id, None
    )

    # User 2 tries to add message to User 1's conversation
    with pytest.raises(PermissionError):
        await ConversationService.add_message(
            async_session, user2_id, conv1.id, MessageRole.USER, "Unauthorized"
        )


@pytest.mark.asyncio
async def test_user_isolation_get_history(async_session: AsyncSession):
    """Test that users cannot view other users' conversation history."""
    user1_id = f"test-user-{uuid4()}"
    user2_id = f"test-user-{uuid4()}"

    # User 1 creates conversation with messages
    conv1 = await ConversationService.get_or_create_conversation(
        async_session, user1_id, None
    )
    await ConversationService.add_message(
        async_session, user1_id, conv1.id, MessageRole.USER, "Secret message"
    )

    # User 2 tries to view User 1's history
    with pytest.raises(PermissionError):
        await ConversationService.get_conversation_history(
            async_session, conv1.id, user2_id
        )


@pytest.mark.asyncio
async def test_conversation_timestamp_update_on_new_message(async_session: AsyncSession):
    """Test that conversation.updated_at is updated when messages are added."""
    user_id = f"test-user-{uuid4()}"

    # Create conversation
    conversation = await ConversationService.get_or_create_conversation(
        async_session, user_id, None
    )

    original_updated_at = conversation.updated_at

    # Add message (should update conversation.updated_at)
    await ConversationService.add_message(
        async_session, user_id, conversation.id, MessageRole.USER, "New message"
    )

    # Retrieve conversation again
    updated_conversation = await ConversationService.get_or_create_conversation(
        async_session, user_id, conversation.id
    )

    # updated_at should be newer
    assert updated_conversation.updated_at >= original_updated_at


@pytest.mark.asyncio
async def test_user_message_2000_char_limit_enforcement(async_session: AsyncSession):
    """Test that user messages exceeding 2000 chars are rejected."""
    user_id = f"test-user-{uuid4()}"

    conversation = await ConversationService.get_or_create_conversation(
        async_session, user_id, None
    )

    # Try to add message with 2001 characters
    long_content = "a" * 2001

    with pytest.raises(ValueError, match="exceeds 2000 character limit"):
        await ConversationService.add_message(
            async_session, user_id, conversation.id, MessageRole.USER, long_content
        )


@pytest.mark.asyncio
async def test_assistant_message_no_length_limit(async_session: AsyncSession):
    """Test that assistant messages can exceed 2000 chars."""
    user_id = f"test-user-{uuid4()}"

    conversation = await ConversationService.get_or_create_conversation(
        async_session, user_id, None
    )

    # AI can generate long responses
    long_content = "a" * 5000

    msg = await ConversationService.add_message(
        async_session, user_id, conversation.id, MessageRole.ASSISTANT, long_content
    )

    assert len(msg.content) == 5000


@pytest.mark.asyncio
async def test_get_user_conversations_sorted_by_recent(async_session: AsyncSession):
    """Test getting user's conversations sorted by most recent."""
    user_id = f"test-user-{uuid4()}"

    # Create multiple conversations
    conv1 = await ConversationService.get_or_create_conversation(
        async_session, user_id, None
    )
    conv2 = await ConversationService.get_or_create_conversation(
        async_session, user_id, None
    )
    conv3 = await ConversationService.get_or_create_conversation(
        async_session, user_id, None
    )

    # Add message to conv2 (should become most recent)
    await ConversationService.add_message(
        async_session, user_id, conv2.id, MessageRole.USER, "Latest message"
    )

    # Get user's conversations
    conversations = await ConversationService.get_user_conversations(
        async_session, user_id, limit=100
    )

    assert len(conversations) >= 3
    # Most recent should be first (conv2)
    assert conversations[0].id == conv2.id


@pytest.mark.asyncio
async def test_conversation_limit_enforcement_fifo(async_session: AsyncSession):
    """Test that oldest conversation is deleted when limit (100) is reached."""
    user_id = f"test-user-{uuid4()}"

    # Create exactly 100 conversations
    for _ in range(100):
        await ConversationService.get_or_create_conversation(
            async_session, user_id, None
        )

    # Verify user has 100 conversations
    conversations_before = await ConversationService.get_user_conversations(
        async_session, user_id, limit=200
    )
    assert len(conversations_before) == 100

    # Store the oldest conversation ID
    oldest_conv_id = conversations_before[-1].id  # Last in list (sorted by updated_at DESC)

    # Create 101st conversation (should trigger FIFO deletion)
    new_conv = await ConversationService.get_or_create_conversation(
        async_session, user_id, None
    )

    # Verify still 100 conversations
    conversations_after = await ConversationService.get_user_conversations(
        async_session, user_id, limit=200
    )
    assert len(conversations_after) == 100

    # Verify oldest was deleted and new one exists
    conv_ids = [c.id for c in conversations_after]
    assert oldest_conv_id not in conv_ids
    assert new_conv.id in conv_ids
