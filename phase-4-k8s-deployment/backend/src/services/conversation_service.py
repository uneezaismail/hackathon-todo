"""
Conversation Service for managing chat conversations and messages.

Handles conversation creation, message persistence, history loading, and 100-conversation limit enforcement.
Implements stateless architecture with complete user isolation.

Reference: openai-agents-mcp-integration skill section 5.3
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import NoResultFound

from ..models.conversation import Conversation
from ..models.message import Message


class ConversationService:
    """Service for managing conversations and messages with user isolation."""

    @staticmethod
    async def get_or_create_conversation(
        session: AsyncSession,
        user_id: str,
        conversation_id: Optional[UUID] = None
    ) -> Conversation:
        """
        Get existing conversation or create new one.

        If conversation_id provided: fetch and verify ownership, update timestamp
        If conversation_id is None: create new conversation

        Args:
            session: Async database session
            user_id: Authenticated user ID from JWT
            conversation_id: Optional existing conversation ID

        Returns:
            Conversation object

        Raises:
            PermissionError: If conversation exists but user_id doesn't match
            NoResultFound: If conversation_id provided but doesn't exist
        """
        if conversation_id is not None:
            # Fetch existing conversation and verify ownership
            result = await session.execute(
                select(Conversation).where(
                    Conversation.id == conversation_id,
                    Conversation.user_id == user_id
                )
            )
            conversation = result.scalar_one_or_none()

            if not conversation:
                raise PermissionError(
                    f"Conversation {conversation_id} not found or access denied"
                )

            # Update timestamp
            conversation.updated_at = datetime.utcnow()
            session.add(conversation)
            await session.commit()
            await session.refresh(conversation)
            return conversation
        else:
            # Create new conversation
            # First check 100-conversation limit
            await ConversationService._enforce_conversation_limit(session, user_id)

            new_conversation = Conversation(user_id=user_id)
            session.add(new_conversation)
            await session.commit()
            await session.refresh(new_conversation)
            return new_conversation

    @staticmethod
    async def _enforce_conversation_limit(
        session: AsyncSession,
        user_id: str,
        limit: int = 100
    ) -> None:
        """
        Enforce maximum conversation limit per user (FIFO deletion).

        If user has >= limit conversations, delete oldest conversation before creating new one.

        Args:
            session: Async database session
            user_id: User ID to check
            limit: Maximum conversations allowed (default: 100)
        """
        # Count user's conversations
        count_result = await session.execute(
            select(func.count()).select_from(Conversation).where(
                Conversation.user_id == user_id
            )
        )
        count = count_result.scalar()

        if count >= limit:
            # Delete oldest conversation (FIFO)
            oldest_result = await session.execute(
                select(Conversation)
                .where(Conversation.user_id == user_id)
                .order_by(Conversation.created_at.asc())
                .limit(1)
            )
            oldest = oldest_result.scalar_one()

            await session.delete(oldest)
            await session.commit()

    @staticmethod
    async def add_message(
        session: AsyncSession,
        user_id: str,
        conversation_id: UUID,
        role: str,
        content: str
    ) -> Message:
        """
        Add a new message to conversation.

        Args:
            session: Async database session
            user_id: User ID (for verification)
            conversation_id: Conversation to add message to
            role: Message role ("user" or "assistant")
            content: Message content

        Returns:
            Created Message object

        Raises:
            PermissionError: If user doesn't own the conversation
            ValueError: If content exceeds 2000 chars for user messages or invalid role
        """
        # Validate role
        if role not in ("user", "assistant"):
            raise ValueError(f"Invalid role: {role}. Must be 'user' or 'assistant'")

        # Verify user owns conversation
        conversation = await ConversationService.get_or_create_conversation(
            session, user_id, conversation_id
        )

        # Validate user message length
        if role == "user" and len(content) > 2000:
            raise ValueError(
                f"User message exceeds 2000 character limit (got {len(content)} chars)"
            )

        # Create message
        message = Message(
            conversation_id=conversation.id,
            user_id=user_id,  # Add user_id for user isolation
            role=role,
            content=content,
            created_at=datetime.utcnow()
        )
        session.add(message)

        # Update conversation timestamp
        conversation.updated_at = datetime.utcnow()
        session.add(conversation)

        await session.commit()
        await session.refresh(message)
        return message

    @staticmethod
    async def get_conversation_history(
        session: AsyncSession,
        conversation_id: UUID,
        user_id: str,
        limit: int = 500
    ) -> list[dict]:
        """
        Load conversation history in chronological order.

        Loads all messages for stateless conversation loading.
        Returns OpenAI-compatible message format.

        Args:
            session: Async database session
            conversation_id: Conversation ID
            user_id: User ID for ownership verification
            limit: Maximum messages to load (default: 500)

        Returns:
            List of messages in OpenAI format: [{"role": "user", "content": "..."}]

        Raises:
            PermissionError: If user doesn't own conversation
        """
        # Verify ownership
        await ConversationService.get_or_create_conversation(
            session, user_id, conversation_id
        )

        # Load messages in chronological order
        result = await session.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
            .limit(limit)
        )
        messages = result.scalars().all()

        # Convert to OpenAI format
        return [
            {
                "role": msg.role,  # Already a string, no .value needed
                "content": msg.content
            }
            for msg in messages
        ]

    @staticmethod
    async def get_user_conversations(
        session: AsyncSession,
        user_id: str,
        limit: int = 100
    ) -> list[Conversation]:
        """
        Get all conversations for a user, sorted by most recent.

        Args:
            session: Async database session
            user_id: User ID
            limit: Maximum conversations to return (default: 100)

        Returns:
            List of Conversation objects sorted by updated_at DESC
        """
        result = await session.execute(
            select(Conversation)
            .where(Conversation.user_id == user_id)
            .order_by(Conversation.updated_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())
