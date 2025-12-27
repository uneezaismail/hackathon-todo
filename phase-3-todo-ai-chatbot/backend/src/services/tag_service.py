"""
Tag service for the Todo application intermediate features.
Handles tag creation, lookup, and autocomplete functionality with user isolation.
"""

from sqlmodel import Session, select, func
from typing import List
import re
import uuid

from ..models.tag import Tag
from ..models.task_tag import TaskTag
from ..models.task import TagWithUsage


class TagService:
    """
    Service class for tag-related operations.
    All methods enforce user isolation - users can only access their own tags.
    """

    @staticmethod
    def get_user_tags(
        session: Session,
        user_id: str,
        search: str | None = None,
        limit: int = 10
    ) -> List[TagWithUsage]:
        """
        Get user's tags with usage count, ordered by most used.

        Args:
            session: Database session
            user_id: Better Auth user ID
            search: Optional search prefix for tag name filtering
            limit: Maximum number of tags to return (default: 10)

        Returns:
            List of TagWithUsage objects with name and usage_count
        """
        # Build query: count tasks per tag for this user
        query = (
            select(
                Tag.name,
                func.count(TaskTag.task_id).label("usage_count")
            )
            .outerjoin(TaskTag, Tag.id == TaskTag.tag_id)
            .where(Tag.user_id == user_id)
            .group_by(Tag.id, Tag.name)
            .order_by(func.count(TaskTag.task_id).desc(), Tag.name)
            .limit(limit)
        )

        # Add search filter if provided (case-insensitive prefix match)
        if search:
            query = query.where(Tag.name.ilike(f"{search}%"))

        results = session.exec(query).all()

        return [
            TagWithUsage(name=name, usage_count=count)
            for name, count in results
        ]

    @staticmethod
    def create_or_get_tag(
        session: Session,
        user_id: str,
        tag_name: str
    ) -> Tag:
        """
        Get existing tag or create new one if it doesn't exist.
        Tag names are case-sensitive and unique per user.

        Args:
            session: Database session
            user_id: Better Auth user ID
            tag_name: Tag name to create or retrieve

        Returns:
            Tag object (existing or newly created)

        Raises:
            ValueError: If tag name validation fails
        """
        # T051: Validate tag name (length 1-50 chars, alphanumeric + spaces/hyphens)
        tag_name = tag_name.strip()

        # Check length
        if not tag_name or len(tag_name) > 50:
            raise ValueError("Tag name must be 1-50 characters")

        # Check allowed characters: alphanumeric, spaces, hyphens, and underscores
        # Pattern: at least one alphanumeric character, can contain spaces/hyphens
        if not re.match(r'^[a-zA-Z0-9][a-zA-Z0-9\s\-_]*$', tag_name):
            raise ValueError("Tag name must contain only alphanumeric characters, spaces, hyphens, and underscores")

        # Try to find existing tag
        statement = select(Tag).where(
            Tag.user_id == user_id,
            Tag.name == tag_name
        )
        existing_tag = session.exec(statement).first()

        if existing_tag:
            return existing_tag

        # Create new tag
        new_tag = Tag(
            user_id=user_id,
            name=tag_name
        )
        session.add(new_tag)
        session.flush()  # Get the ID without committing

        return new_tag
