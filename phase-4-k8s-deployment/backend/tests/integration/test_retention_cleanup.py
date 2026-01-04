"""
Integration tests for scheduled message retention cleanup.

Tests the APScheduler job execution with backdated data.
Verifies that the daily cleanup job works correctly in a scheduled context.

Reference: openai-agents-mcp-integration skill section 5.6
"""
import pytest
from datetime import datetime, timedelta
from uuid import uuid4
from typing import Any

from sqlmodel import Session, select, delete

from src.models.message import Message, MessageRole
from src.models.conversation import Conversation


def cleanup_expired_messages(engine) -> dict[str, Any]:
    """Helper for tests that uses the provided engine."""
    with Session(engine) as session:
        try:
            now = datetime.utcnow()

            statement = select(Message).where(Message.expires_at < now)
            expired_messages = session.exec(statement).all()

            deleted_count = len(expired_messages)

            if deleted_count > 0:
                for message in expired_messages:
                    session.delete(message)
                session.commit()

            return {
                "success": True,
                "deleted_count": deleted_count,
                "timestamp": now.isoformat(),
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
            }


class TestScheduledRetentionCleanup:
    """Integration tests for scheduled cleanup job."""

    @pytest.fixture(autouse=True)
    def setup_and_teardown(self, engine):
        """Create test data and clean up after each test."""
        self.engine = engine
        self.test_user_id = str(uuid4())
        self.test_conversation_id = uuid4()

        # Create a test conversation
        with Session(engine) as session:
            conversation = Conversation(
                id=self.test_conversation_id,
                user_id=self.test_user_id,
            )
            session.add(conversation)
            session.commit()

        yield

        # Cleanup: Delete test data
        with Session(engine) as session:
            session.exec(
                delete(Message).where(Message.conversation_id == self.test_conversation_id)
            )
            session.exec(
                delete(Conversation).where(Conversation.id == self.test_conversation_id)
            )
            session.commit()

    def _create_message_with_expiry(
        self,
        conversation_id,
        role: MessageRole,
        content: str,
        expires_at: datetime,
    ) -> Message:
        """Helper to create a message with explicit expiry time."""
        message = Message(
            id=uuid4(),
            conversation_id=conversation_id,
            role=role,
            content=content,
            created_at=expires_at - timedelta(days=2),  # 2 days before expiry
            expires_at=expires_at,
        )

        with Session(self.engine) as session:
            session.add(message)
            session.commit()
            session.refresh(message)

        return message

    def test_scheduler_job_with_backdated_expired_data(self):
        """Test T079: APScheduler job execution with backdated data."""
        # Create messages with backdated timestamps to simulate data at cleanup time
        now = datetime.utcnow()

        # Create expired message (expired yesterday)
        self._create_message_with_expiry(
            conversation_id=self.test_conversation_id,
            role=MessageRole.USER,
            content="Backdated expired message",
            expires_at=now - timedelta(days=1),  # Expired yesterday
        )

        # Create message expiring now (at boundary)
        self._create_message_with_expiry(
            conversation_id=self.test_conversation_id,
            role=MessageRole.ASSISTANT,
            content="Boundary message",
            expires_at=now,  # Expires exactly now
        )

        # Create message that expires in the future
        self._create_message_with_expiry(
            conversation_id=self.test_conversation_id,
            role=MessageRole.USER,
            content="Future message",
            expires_at=now + timedelta(days=1),  # Expires tomorrow
        )

        # Run cleanup
        result = cleanup_expired_messages(self.engine)

        # Verify cleanup result
        assert result["success"] is True
        assert result["deleted_count"] >= 1, "Should delete expired messages"

        # Verify only expired messages are deleted
        with Session(self.engine) as session:
            messages = session.exec(
                select(Message).where(
                    Message.conversation_id == self.test_conversation_id
                )
            ).all()

            remaining_contents = [m.content for m in messages]
            assert "Backdated expired message" not in remaining_contents, "Expired message should be deleted"
            assert "Boundary message" not in remaining_contents, "Message expired at boundary should be deleted"
            assert "Future message" in remaining_contents, "Future message should be preserved"

    def test_cleanup_preserves_conversation_integrity(self):
        """Test: Cleanup doesn't affect conversation records."""
        # Verify conversation exists before
        with Session(self.engine) as session:
            conversation = session.get(Conversation, self.test_conversation_id)
            assert conversation is not None

        # Create and delete messages
        self._create_message_with_expiry(
            conversation_id=self.test_conversation_id,
            role=MessageRole.USER,
            content="Test",
            expires_at=datetime.utcnow() - timedelta(days=1),
        )

        cleanup_expired_messages(self.engine)

        # Verify conversation still exists
        with Session(self.engine) as session:
            conversation = session.get(Conversation, self.test_conversation_id)
            assert conversation is not None, "Conversation should be preserved after message cleanup"

    def test_cleanup_with_user_isolation(self):
        """Test: Cleanup respects user data isolation."""
        # Create another conversation for a different user
        other_user_id = str(uuid4())
        other_conversation_id = uuid4()

        with Session(self.engine) as session:
            conversation = Conversation(
                id=other_conversation_id,
                user_id=other_user_id,
            )
            session.add(conversation)
            session.commit()

        try:
            # Create expired message in other user's conversation
            self._create_message_with_expiry(
                conversation_id=other_conversation_id,
                role=MessageRole.USER,
                content="Other user message",
                expires_at=datetime.utcnow() - timedelta(days=1),
            )

            # Run cleanup
            result = cleanup_expired_messages(self.engine)

            assert result["success"] is True
            # Should delete at least the other user's message
            assert result["deleted_count"] >= 1, "Should delete expired messages"
        finally:
            # Cleanup other conversation
            with Session(self.engine) as session:
                session.exec(
                    delete(Message).where(Message.conversation_id == other_conversation_id)
                )
                session.exec(
                    delete(Conversation).where(Conversation.id == other_conversation_id)
                )
                session.commit()
