"""
Tag model for the Todo application intermediate features.
Defines the database schema for user-defined tags with proper validation.
"""

from sqlmodel import SQLModel, Field, Index
from datetime import datetime
from typing import Optional
import uuid


class Tag(SQLModel, table=True):
    """
    Tag model representing a user-defined category/label for tasks.
    Tags are user-scoped and names must be unique per user.

    Indexes:
    - Primary key on id (UUID)
    - Index on user_id for user-scoped queries
    - Composite index on (user_id, name) for tag lookup and autocomplete
    - Unique constraint on (user_id, name) enforced at database level
    """
    __tablename__ = "tags"
    __table_args__ = (
        Index("ix_tags_user_id", "user_id"),
        Index("ix_tags_user_name", "user_id", "name"),
    )

    # Primary key for the tag (UUID)
    id: Optional[uuid.UUID] = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        description="Unique tag identifier (UUID v4)"
    )

    # User ID from Better Auth - critical for user isolation
    user_id: str = Field(
        nullable=False,
        description="Better Auth user ID - links tag to specific user"
    )

    # Tag name - must be unique per user
    name: str = Field(
        min_length=1,
        max_length=50,
        nullable=False,
        description="Tag name (1-50 characters, unique per user)"
    )

    # Creation timestamp
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        description="Timestamp when tag was created"
    )
