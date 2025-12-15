"""
Task model for the Todo application Phase 2.
Defines the database schema for tasks with user isolation and proper validation.
"""

from sqlmodel import SQLModel, Field, Index, Relationship
from sqlalchemy import Column, String, Boolean
from datetime import datetime, date
from typing import Optional, List, TYPE_CHECKING
from enum import Enum
from .base import TimestampMixin
import uuid

if TYPE_CHECKING:
    from .tag import Tag


# Enum class for Priority levels (SQLModel-compatible)
# Using values that match database constraint: 'High', 'Medium', 'Low'
class PriorityType(str, Enum):
    """Priority levels for tasks"""
    High = "High"
    Medium = "Medium"
    Low = "Low"


class TaskBase(SQLModel):
    """
    Base class containing common fields for Task operations.
    Used as a foundation for creating, updating, and responding to API requests.
    """
    title: str = Field(
        min_length=1,
        max_length=200,
        description="Task title (1-200 characters)"
    )
    description: Optional[str] = Field(
        default=None,
        max_length=1000,
        description="Optional task description (max 1000 characters)"
    )
    completed: bool = Field(
        default=False,
        description="Task completion status (default: False)"
    )
    # T014: Add priority field with default
    priority: PriorityType = Field(
        default=PriorityType.Medium,
        description="Task priority level: High, Medium, or Low (default: Medium)"
    )
    # T015: Add due_date field (optional)
    due_date: Optional[date] = Field(
        default=None,
        description="Optional task due date (ISO 8601 format: YYYY-MM-DD)"
    )


class Task(TaskBase, TimestampMixin, table=True):
    """
    Task model representing a single todo item in the database.
    Includes user_id foreign key for proper user isolation and security.

    Indexes:
    - Primary key on id (UUID)
    - Index on user_id for user-scoped queries
    - Index on created_at for sorting operations
    - Composite index on (user_id, completed) for filtered queries
    """
    __tablename__ = "tasks"
    __table_args__ = (
        Index("ix_tasks_user_id_completed", "user_id", "completed"),
    )

    # Primary key for the task (UUID)
    id: Optional[uuid.UUID] = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        description="Unique task identifier (UUID v4)"
    )

    # User ID from Better Auth - critical for user isolation
    user_id: str = Field(
        index=True,  # Index for performance when filtering by user
        nullable=False,
        description="Better Auth user ID - links task to specific user"
    )

    # T016: Many-to-many relationship with tags through task_tags junction table
    # This will be populated via joins in service layer
    # Note: For proper many-to-many, we'll handle this in the service layer with explicit joins

    # created_at and updated_at inherited from TimestampMixin
    # created_at is indexed for efficient sorting operations
    # updated_at is auto-updated on every modification via onupdate


class TaskCreate(TaskBase):
    """
    Schema for creating new tasks.
    Excludes id, user_id, and timestamp fields since they're set by the system.
    T017: Includes priority, due_date (from TaskBase), and tags list.
    """
    tags: List[str] = Field(
        default_factory=list,
        description="List of tag names to associate with the task"
    )


class TaskUpdate(SQLModel):
    """
    Schema for updating existing tasks.
    All fields are optional to allow partial updates.
    """
    title: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=200
    )
    description: Optional[str] = Field(
        default=None,
        max_length=1000
    )
    completed: Optional[bool] = None
    priority: Optional[PriorityType] = Field(
        default=None,
        description="Task priority level: High, Medium, or Low"
    )
    due_date: Optional[date] = Field(
        default=None,
        description="Task due date (ISO 8601 format: YYYY-MM-DD)"
    )
    tags: Optional[List[str]] = Field(
        default=None,
        description="List of tag names (replaces existing tags)"
    )


class TaskResponse(TaskBase):
    """
    Schema for API responses.
    Includes all fields that should be returned to clients.
    """
    id: uuid.UUID
    user_id: str
    created_at: datetime
    updated_at: datetime
    tags: List[str] = Field(
        default_factory=list,
        description="List of tag names associated with this task"
    )


class TagWithUsage(SQLModel):
    """
    Schema for tag autocomplete responses.
    Shows tag name and how many times it's been used by the user.
    """
    name: str = Field(description="Tag name")
    usage_count: int = Field(description="Number of tasks using this tag")