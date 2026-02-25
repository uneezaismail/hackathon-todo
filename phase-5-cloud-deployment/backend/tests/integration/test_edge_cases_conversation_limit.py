"""
Integration tests for FR-035: 100-conversation limit with FIFO deletion.

Tests verify that users can have maximum 100 active conversations,
and oldest conversations are automatically deleted (FIFO) when limit exceeded.

Test Coverage:
- T101: Create 101 conversations, verify oldest deleted automatically
- Verify FIFO deletion order
- Verify limit enforcement across users (isolated)
- Verify manual conversation deletion still works

Reference: specs/006-ai-chatbot/spec.md FR-035
Reference: data-model.md (Conversation entity constraints)
"""
import pytest
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from src.models.conversation import Conversation
from src.services.conversation_service import ConversationService


@pytest.mark.asyncio
async def test_conversation_limit_100_with_fifo_deletion(
    async_session: AsyncSession,
    test_user_id: str,
):
    """
    T101: Integration test for 100-conversation limit with FIFO.

    Flow:
    1. Create 100 conversations for user (at limit)
    2. Create 101st conversation
    3. Verify oldest conversation automatically deleted
    4. Verify user still has exactly 100 conversations
    5. Verify FIFO order maintained
    """
    # Clean up any existing conversations for test user
    stmt = select(Conversation).where(Conversation.user_id == test_user_id)
    result = await async_session.execute(stmt)
    existing_conversations = result.scalars().all()
    for conv in existing_conversations:
        await async_session.delete(conv)
    await async_session.commit()

    # Create 100 conversations with distinct timestamps
    created_conversations = []
    base_time = datetime.utcnow() - timedelta(hours=100)

    for i in range(100):
        conversation = Conversation(
            user_id=test_user_id,
            created_at=base_time + timedelta(hours=i),  # Chronological order
            updated_at=base_time + timedelta(hours=i)
        )
        async_session.add(conversation)
        created_conversations.append(conversation)

    await async_session.commit()

    # Refresh all to get IDs
    for conv in created_conversations:
        await async_session.refresh(conv)

    # Store oldest conversation ID for verification
    oldest_conversation_id = created_conversations[0].id

    # Verify we have exactly 100 conversations
    count_stmt = select(func.count()).select_from(Conversation).where(
        Conversation.user_id == test_user_id
    )
    count_result = await async_session.execute(count_stmt)
    count = count_result.scalar()
    assert count == 100, f"Should have exactly 100 conversations, got {count}"

    # Create 101st conversation (should trigger FIFO deletion)
    new_conversation = await ConversationService.get_or_create_conversation(
        async_session,
        test_user_id,
        None  # Create new
    )

    # Verify total count still 100 (oldest deleted)
    count_result = await async_session.execute(count_stmt)
    count_after = count_result.scalar()
    assert count_after == 100, \
        f"Should still have exactly 100 conversations after adding 101st, got {count_after}"

    # Verify oldest conversation was deleted
    oldest_stmt = select(Conversation).where(Conversation.id == oldest_conversation_id)
    oldest_result = await async_session.execute(oldest_stmt)
    oldest_exists = oldest_result.scalar_one_or_none()
    assert oldest_exists is None, \
        f"Oldest conversation (ID={oldest_conversation_id}) should have been deleted"

    # Verify newest conversation exists
    newest_stmt = select(Conversation).where(Conversation.id == new_conversation.id)
    newest_result = await async_session.execute(newest_stmt)
    newest_exists = newest_result.scalar_one_or_none()
    assert newest_exists is not None, "Newest conversation should exist"


@pytest.mark.asyncio
async def test_conversation_limit_fifo_order_maintained(
    async_session: AsyncSession,
    test_user_id: str,
):
    """
    T101 (FIFO verification): Verify FIFO deletion order is correct.

    Tests that when limit exceeded multiple times,
    conversations are deleted in creation order (oldest first).
    """
    # Clean up
    stmt = select(Conversation).where(Conversation.user_id == test_user_id)
    result = await async_session.execute(stmt)
    existing = result.scalars().all()
    for conv in existing:
        await async_session.delete(conv)
    await async_session.commit()

    # Create 100 conversations with explicit timestamps
    conversation_ids_in_order = []
    base_time = datetime.utcnow() - timedelta(days=100)

    for i in range(100):
        conv = Conversation(
            user_id=test_user_id,
            created_at=base_time + timedelta(days=i),
            updated_at=base_time + timedelta(days=i)
        )
        async_session.add(conv)
        await async_session.flush()  # Get ID
        conversation_ids_in_order.append(conv.id)

    await async_session.commit()

    # Add 5 more conversations (should delete 5 oldest)
    for i in range(5):
        await ConversationService.get_or_create_conversation(
            async_session,
            test_user_id,
            None
        )

    # Verify first 5 conversations deleted
    for i in range(5):
        stmt = select(Conversation).where(Conversation.id == conversation_ids_in_order[i])
        result = await async_session.execute(stmt)
        conv = result.scalar_one_or_none()
        assert conv is None, f"Conversation {i+1} (oldest) should be deleted"

    # Verify conversations 6-100 still exist
    for i in range(5, 100):
        stmt = select(Conversation).where(Conversation.id == conversation_ids_in_order[i])
        result = await async_session.execute(stmt)
        conv = result.scalar_one_or_none()
        assert conv is not None, f"Conversation {i+1} should still exist"


@pytest.mark.asyncio
async def test_conversation_limit_user_isolation(
    async_session: AsyncSession,
):
    """
    T101 (user isolation): Verify 100-limit enforced per user, not globally.

    Tests that User A having 100 conversations doesn't affect User B.
    """
    user_a = "user_a_test"
    user_b = "user_b_test"

    # Clean up both users
    for user_id in [user_a, user_b]:
        stmt = select(Conversation).where(Conversation.user_id == user_id)
        result = await async_session.execute(stmt)
        existing = result.scalars().all()
        for conv in existing:
            await async_session.delete(conv)
    await async_session.commit()

    # Create 100 conversations for User A
    for i in range(100):
        conv = Conversation(
            user_id=user_a,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        async_session.add(conv)
    await async_session.commit()

    # Verify User A has 100
    count_a_stmt = select(func.count()).select_from(Conversation).where(
        Conversation.user_id == user_a
    )
    count_a = (await async_session.execute(count_a_stmt)).scalar()
    assert count_a == 100, f"User A should have 100 conversations, got {count_a}"

    # Create 50 conversations for User B (under limit)
    for i in range(50):
        conv = Conversation(
            user_id=user_b,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        async_session.add(conv)
    await async_session.commit()

    # Verify User B has 50 (not affected by User A's limit)
    count_b_stmt = select(func.count()).select_from(Conversation).where(
        Conversation.user_id == user_b
    )
    count_b = (await async_session.execute(count_b_stmt)).scalar()
    assert count_b == 50, f"User B should have 50 conversations, got {count_b}"

    # User A creates one more (should trigger deletion for User A only)
    await ConversationService.get_or_create_conversation(
        async_session,
        user_a,
        None
    )

    # Verify User A still has 100
    count_a_after = (await async_session.execute(count_a_stmt)).scalar()
    assert count_a_after == 100, f"User A should still have 100, got {count_a_after}"

    # Verify User B still has 50 (unaffected)
    count_b_after = (await async_session.execute(count_b_stmt)).scalar()
    assert count_b_after == 50, f"User B should still have 50, got {count_b_after}"


@pytest.mark.asyncio
async def test_conversation_limit_manual_deletion_works(
    async_session: AsyncSession,
    test_user_id: str,
):
    """
    T101 (manual deletion): Verify manual conversation deletion still works.

    Tests that users can manually delete conversations,
    and this is independent of automatic FIFO cleanup.
    """
    # Clean up
    stmt = select(Conversation).where(Conversation.user_id == test_user_id)
    result = await async_session.execute(stmt)
    existing = result.scalars().all()
    for conv in existing:
        await async_session.delete(conv)
    await async_session.commit()

    # Create 10 conversations
    created_ids = []
    for i in range(10):
        conv = Conversation(
            user_id=test_user_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        async_session.add(conv)
        await async_session.flush()
        created_ids.append(conv.id)
    await async_session.commit()

    # Manually delete conversation 5
    stmt = select(Conversation).where(Conversation.id == created_ids[4])
    result = await async_session.execute(stmt)
    conv_to_delete = result.scalar_one()
    await async_session.delete(conv_to_delete)
    await async_session.commit()

    # Verify count is now 9
    count_stmt = select(func.count()).select_from(Conversation).where(
        Conversation.user_id == test_user_id
    )
    count = (await async_session.execute(count_stmt)).scalar()
    assert count == 9, f"Should have 9 conversations after manual deletion, got {count}"

    # Verify specific conversation deleted
    check_stmt = select(Conversation).where(Conversation.id == created_ids[4])
    check_result = await async_session.execute(check_stmt)
    deleted_conv = check_result.scalar_one_or_none()
    assert deleted_conv is None, "Manually deleted conversation should not exist"


@pytest.mark.asyncio
async def test_conversation_limit_under_100_no_deletion(
    async_session: AsyncSession,
    test_user_id: str,
):
    """
    T101 (baseline): Verify no deletion when under 100 conversations.

    Tests that automatic FIFO deletion only occurs when limit exceeded.
    """
    # Clean up
    stmt = select(Conversation).where(Conversation.user_id == test_user_id)
    result = await async_session.execute(stmt)
    existing = result.scalars().all()
    for conv in existing:
        await async_session.delete(conv)
    await async_session.commit()

    # Create 50 conversations (under limit)
    created_ids = []
    for i in range(50):
        conv = Conversation(
            user_id=test_user_id,
            created_at=datetime.utcnow() - timedelta(hours=50-i),
            updated_at=datetime.utcnow() - timedelta(hours=50-i)
        )
        async_session.add(conv)
        await async_session.flush()
        created_ids.append(conv.id)
    await async_session.commit()

    # Create 10 more (still under 100)
    for i in range(10):
        await ConversationService.get_or_create_conversation(
            async_session,
            test_user_id,
            None
        )

    # Verify all 60 conversations exist
    count_stmt = select(func.count()).select_from(Conversation).where(
        Conversation.user_id == test_user_id
    )
    count = (await async_session.execute(count_stmt)).scalar()
    assert count == 60, f"Should have 60 conversations, got {count}"

    # Verify oldest conversation still exists (no automatic deletion)
    oldest_stmt = select(Conversation).where(Conversation.id == created_ids[0])
    oldest_result = await async_session.execute(oldest_stmt)
    oldest_conv = oldest_result.scalar_one_or_none()
    assert oldest_conv is not None, "Oldest conversation should still exist (under limit)"
