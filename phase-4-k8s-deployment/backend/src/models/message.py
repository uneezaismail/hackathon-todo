"""Message model for AI chatbot.

This model represents individual chat messages within a conversation.
Implements 2-day retention policy and user message length validation.

Reference: openai-agents-mcp-integration skill section 5.2
"""
from datetime import datetime, timedelta
from typing import TYPE_CHECKING, Optional
from uuid import UUID, uuid4

from enum import Enum
from sqlalchemy import JSON, Column
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .conversation import Conversation


class MessageRole(str, Enum):
    """Message sender roles."""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class Message(SQLModel, table=True):
    """Message entity representing a chat message within a conversation.

    Attributes:
        id: Database primary key (auto-generated UUID, NOT the ChatKit item ID)
        chatkit_item_id: Original ChatKit item ID (preserved for frontend consistency)
        conversation_id: Parent conversation (foreign key, indexed)
        user_id: Message owner (denormalized for user isolation queries)
        role: Message sender role ("user", "assistant", or "system" string)
        content: Message text content (max 2000 chars for user, unlimited for assistant)
        tool_calls: JSON array of MCP tool invocations (assistant messages only, for debugging/replay)
        created_at: Message creation timestamp (indexed for retention cleanup)
        expires_at: Expiration timestamp (2 days from creation, for retention policy)
        conversation: Related conversation (many-to-one relationship)

    Business Rules:
        - User messages limited to 2000 characters (validated in API layer)
        - Assistant messages unlimited (AI may generate long explanations)
        - Messages expire after 2 days (expires_at field)
        - Cascade-deleted when parent conversation deleted
        - role is a string (not enum) matching database schema
        - chatkit_item_id preserves the original ChatKit item ID for frontend consistency

    Indexes:
        - conversation_id: Fast filtering by conversation
        - created_at: Fast retention cleanup
        - (conversation_id, created_at): Optimized chronological loading (most common query)
    """
    __tablename__ = "messages"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    chatkit_item_id: str = Field(
        nullable=False,
        index=True,
        description="Original ChatKit item ID (preserved for frontend message consistency)"
    )
    conversation_id: UUID = Field(
        foreign_key="conversations.id",
        nullable=False,
        index=True
    )
    user_id: str = Field(nullable=False, index=True)  # User isolation field
    role: str = Field(nullable=False)  # "user" | "assistant" | "system" (string, not enum)
    content: str = Field(nullable=False)
    tool_calls: Optional[dict] = Field(default=None, sa_column=Column(JSON))  # MCP tool invocations (assistant only)
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        index=True
    )
    expires_at: datetime = Field(
        default_factory=lambda: datetime.utcnow() + timedelta(days=2),
        nullable=False,
        index=True
    )

    # Relationships
    conversation: "Conversation" = Relationship(back_populates="messages")

    @property
    def is_user_message(self) -> bool:
        """Check if message is from user."""
        return self.role == "user"

    @property
    def is_assistant_message(self) -> bool:
        """Check if message is from assistant."""
        return self.role == "assistant"

    @property
    def is_expired(self) -> bool:
        """Check if message has expired (older than 2 days)."""
        return datetime.utcnow() > self.expires_at
