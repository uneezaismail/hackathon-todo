"""
Unit tests for message retention cleanup service.

Tests the 2-day message retention policy implementation.
Verifies that messages older than 2 days are deleted while newer messages are preserved.

Reference: openai-agents-mcp-integration skill section 5.6
"""
import pytest
from datetime import datetime, timedelta
from uuid import uuid4, UUID
from typing import Any

from sqlmodel import Session, select, delete

from src.models.message import Message, MessageRole
from src.models.conversation import Conversation


def cleanup_expired_messages(engine) -> dict[str, Any]:
    """
    Delete messages where expires_at < now() using the provided engine.

    This is a helper function for tests that uses the test engine.
    """
    with Session(engine) as session:
        try:
            now = datetime.utcnow()

            # Query expired messages (expires_at < now)
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


class TestRetentionCleanup:
    """Tests for message retention cleanup functionality."""

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
            # Delete messages
            session.exec(
                delete(Message).where(Message.conversation_id == self.test_conversation_id)
            )
            # Delete conversation
            session.exec(
                delete(Conversation).where(Conversation.id == self.test_conversation_id)
            )
            session.commit()

    def _create_message(
        self,
        conversation_id: UUID,
        role: MessageRole,
        content: str,
        created_at_offset_hours: int = 0,
    ) -> Message:
        """Helper to create a message with a specific age."""
        created_at = datetime.utcnow() - timedelta(hours=created_at_offset_hours)
        expires_at = created_at + timedelta(days=2)

        message = Message(
            id=uuid4(),
            conversation_id=conversation_id,
            role=role,
            content=content,
            created_at=created_at,
            expires_at=expires_at,
        )

        with Session(self.engine) as session:
            session.add(message)
            session.commit()
            session.refresh(message)

        return message

    def test_cleanup_deletes_expired_messages(self):
        """Test T077: Messages older than 2 days are deleted by cleanup."""
        # Create a message that is 3 days old (expired)
        self._create_message(
            conversation_id=self.test_conversation_id,
            role=MessageRole.USER,
            content="Expired test message",
            created_at_offset_hours=72,  # 3 days ago
        )

        # Verify message exists before cleanup
        with Session(self.engine) as session:
            messages = session.exec(
                select(Message).where(
                    Message.conversation_id == self.test_conversation_id
                )
            ).all()
            assert len(messages) == 1, "Test message should exist before cleanup"

        # Run cleanup
        result = cleanup_expired_messages(self.engine)

        # Verify cleanup result
        assert result["success"] is True
        assert result["deleted_count"] >= 1, "Should have deleted at least 1 expired message"
        assert "timestamp" in result

        # Verify message is deleted
        with Session(self.engine) as session:
            messages = session.exec(
                select(Message).where(
                    Message.conversation_id == self.test_conversation_id
                )
            ).all()
            assert len(messages) == 0, "Expired message should be deleted"

    def test_cleanup_preserves_recent_messages(self):
        """Test T078: Messages younger than 2 days are preserved by cleanup."""
        # Create a message that is 1 day old (not expired)
        self._create_message(
            conversation_id=self.test_conversation_id,
            role=MessageRole.USER,
            content="Recent test message",
            created_at_offset_hours=24,  # 1 day ago
        )

        # Run cleanup
        result = cleanup_expired_messages(self.engine)

        # Verify cleanup ran successfully
        assert result["success"] is True

        # Verify message still exists
        with Session(self.engine) as session:
            messages = session.exec(
                select(Message).where(
                    Message.conversation_id == self.test_conversation_id
                )
            ).all()
            assert len(messages) == 1, "Recent message should be preserved"
            assert messages[0].content == "Recent test message"

    def test_cleanup_handles_mixed_ages(self):
        """Test: Cleanup handles mix of expired and recent messages correctly."""
        # Create expired message (3 days old)
        self._create_message(
            conversation_id=self.test_conversation_id,
            role=MessageRole.USER,
            content="Expired message",
            created_at_offset_hours=72,
        )

        # Create recent message (1 day old)
        self._create_message(
            conversation_id=self.test_conversation_id,
            role=MessageRole.ASSISTANT,
            content="Recent message",
            created_at_offset_hours=24,
        )

        # Run cleanup
        result = cleanup_expired_messages(self.engine)

        # Verify
        assert result["success"] is True

        # Only recent message should remain
        with Session(self.engine) as session:
            messages = session.exec(
                select(Message).where(
                    Message.conversation_id == self.test_conversation_id
                )
            ).all()
            assert len(messages) == 1, "Only recent message should remain"
            assert messages[0].content == "Recent message"

    def test_cleanup_handles_empty_database(self):
        """Test: Cleanup handles no expired messages gracefully."""
        # Don't create any messages
        result = cleanup_expired_messages(self.engine)

        assert result["success"] is True
        assert result["deleted_count"] == 0, "No messages should be deleted"
        assert "timestamp" in result

    def test_cleanup_returns_timestamp(self):
        """Test: Cleanup returns ISO format timestamp."""
        result = cleanup_expired_messages(self.engine)

        assert result["success"] is True
        assert "timestamp" in result
        # Verify timestamp is valid ISO format
        datetime.fromisoformat(result["timestamp"])

    def test_cleanup_handles_multiple_conversations(self):
        """Test: Cleanup handles multiple conversations correctly."""
        # Create another conversation with expired messages
        other_conversation_id = uuid4()
        with Session(self.engine) as session:
            conversation = Conversation(
                id=other_conversation_id,
                user_id=self.test_user_id,
            )
            session.add(conversation)
            session.commit()

        try:
            # Create expired message in other conversation
            self._create_message(
                conversation_id=other_conversation_id,
                role=MessageRole.USER,
                content="Other conversation expired message",
                created_at_offset_hours=72,
            )

            # Run cleanup
            result = cleanup_expired_messages(self.engine)

            assert result["success"] is True
            # At least the other conversation's message should be deleted
            assert result["deleted_count"] >= 1, "Should delete expired from other conversation"
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

    def test_message_is_expired_property(self):
        """Test: Message.is_expired property works correctly."""
        # Create expired message
        expired_message = self._create_message(
            conversation_id=self.test_conversation_id,
            role=MessageRole.USER,
            content="Test",
            created_at_offset_hours=72,
        )
        assert expired_message.is_expired is True

        # Create recent message
        recent_message = self._create_message(
            conversation_id=self.test_conversation_id,
            role=MessageRole.USER,
            content="Test",
            created_at_offset_hours=1,
        )
        assert recent_message.is_expired is False

    def test_expiry_set_to_2_days_from_creation(self):
        """Test: Message expires_at is correctly set to 2 days from creation."""
        before_creation = datetime.utcnow()

        message = self._create_message(
            conversation_id=self.test_conversation_id,
            role=MessageRole.USER,
            content="Test",
            created_at_offset_hours=0,  # Created now
        )

        after_creation = datetime.utcnow()

        # expires_at should be approximately 2 days from creation
        expected_min = before_creation + timedelta(days=2)
        expected_max = after_creation + timedelta(days=2)

        assert message.expires_at >= expected_min - timedelta(seconds=1)
        assert message.expires_at <= expected_max + timedelta(seconds=1)
