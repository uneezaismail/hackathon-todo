"""Conversation model for AI chatbot.

This model represents a distinct chat thread between a user and the AI assistant.
Implements stateless conversation persistence with 100-conversation limit per user.

Reference: openai-agents-mcp-integration skill section 5.2
"""
from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .message import Message


class Conversation(SQLModel, table=True):
    """Conversation entity representing a chat thread.

    Attributes:
        id: Unique conversation identifier (UUID)
        user_id: Owner of conversation (references users, indexed for fast lookup)
        thread_id: ChatKit thread ID (unique identifier for ChatKit protocol)
        title: Conversation title (auto-generated from first message or user-set)
        is_active: Whether conversation is still active (for archiving)
        created_at: Conversation creation timestamp
        updated_at: Last message timestamp (updated on new message)
        messages: Related messages (one-to-many relationship)

    Business Rules:
        - Maximum 100 conversations per user (enforced in service layer)
        - FIFO deletion when limit exceeded (delete oldest by created_at)
        - All messages cascade-deleted when conversation deleted

    Indexes:
        - user_id: Fast lookup of user's conversations
        - created_at DESC: Fast FIFO cleanup
        - (user_id, created_at DESC): Optimized sorted user conversation queries
    """
    __tablename__ = "conversations"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: str = Field(nullable=False, index=True)
    thread_id: str = Field(nullable=False, unique=True, index=True)  # ChatKit thread identifier
    title: str = Field(default="New Conversation", max_length=500, nullable=False)  # Conversation title
    is_active: bool = Field(default=True, nullable=False, index=True)  # Active status for archiving
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False, index=True)

    # Relationships
    messages: list["Message"] = Relationship(
        back_populates="conversation",
        sa_relationship_kwargs={
            "lazy": "selectin",
            "cascade": "all, delete-orphan"
        }
    )
