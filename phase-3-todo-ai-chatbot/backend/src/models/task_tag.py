"""
TaskTag junction table for many-to-many relationship between tasks and tags.
Enables tasks to have multiple tags and tags to be applied to multiple tasks.
"""

from sqlmodel import SQLModel, Field, Index
from typing import Optional
import uuid


class TaskTag(SQLModel, table=True):
    """
    Junction table linking tasks to tags in a many-to-many relationship.
    Includes CASCADE delete behavior - when a task or tag is deleted,
    the associations are automatically removed.

    Indexes:
    - Composite primary key on (task_id, tag_id)
    - Index on tag_id for reverse lookups (all tasks with a specific tag)
    """
    __tablename__ = "task_tags"
    __table_args__ = (
        Index("ix_task_tags_tag_id", "tag_id"),
    )

    # Foreign key to tasks table
    task_id: uuid.UUID = Field(
        foreign_key="tasks.id",
        primary_key=True,
        nullable=False,
        description="Reference to task (CASCADE delete)"
    )

    # Foreign key to tags table
    tag_id: uuid.UUID = Field(
        foreign_key="tags.id",
        primary_key=True,
        nullable=False,
        description="Reference to tag (CASCADE delete)"
    )
