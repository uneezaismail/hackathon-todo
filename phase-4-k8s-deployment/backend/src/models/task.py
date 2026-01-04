"""
Task model for the Todo application Phase 2.
Defines the database schema for tasks with user isolation and proper validation.
"""

from sqlmodel import SQLModel, Field, Index, Relationship
from sqlalchemy import Column, String, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
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


# Enum class for Recurrence types (Phase 4)
class RecurrenceType(str, Enum):
    """Recurrence pattern types for recurring tasks"""
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"
    yearly = "yearly"


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
    - Index on parent_task_id for recurring task instance lookups
    """
    __tablename__ = "tasks"
    __table_args__ = (
        Index("ix_tasks_user_id_completed", "user_id", "completed"),
        Index("ix_tasks_parent_task_id", "parent_task_id"),
        Index("ix_tasks_user_id_is_recurring", "user_id", "is_recurring"),
        Index("ix_tasks_is_pattern", "is_pattern", "user_id"),
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

    # Phase 4: Recurring task fields
    is_recurring: bool = Field(
        default=False,
        description="Whether this task repeats on a schedule"
    )
    is_pattern: bool = Field(
        default=False,
        index=True,
        description="Whether this is a recurring pattern (template) or an instance. Patterns don't get completed, only instances do."
    )
    recurrence_type: Optional[RecurrenceType] = Field(
        default=None,
        description="Recurrence pattern type: daily, weekly, monthly, yearly"
    )
    recurrence_interval: int = Field(
        default=1,
        ge=1,
        le=365,
        description="Interval between occurrences (e.g., every 2 weeks)"
    )
    recurrence_days: Optional[str] = Field(
        default=None,
        max_length=27,
        description="Days for weekly recurrence: 'mon,wed,fri' (comma-separated)"
    )
    recurrence_end_date: Optional[date] = Field(
        default=None,
        description="Optional end date for recurrence"
    )
    max_occurrences: Optional[int] = Field(
        default=None,
        ge=1,
        description="Optional maximum number of occurrences"
    )
    parent_task_id: Optional[uuid.UUID] = Field(
        default=None,
        sa_column_kwargs={"nullable": True},
        description="Links generated instances to original recurring task (self-reference)"
    )
    occurrence_count: int = Field(
        default=0,
        ge=0,
        description="Number of occurrences generated from this pattern"
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
    Phase 4: Includes recurrence fields for recurring tasks.
    """
    tags: List[str] = Field(
        default_factory=list,
        description="List of tag names to associate with the task"
    )
    # Phase 4: Recurrence fields
    is_recurring: bool = Field(
        default=False,
        description="Whether this task repeats on a schedule"
    )
    recurrence_type: Optional[RecurrenceType] = Field(
        default=None,
        description="Recurrence pattern type: daily, weekly, monthly, yearly"
    )
    recurrence_interval: int = Field(
        default=1,
        ge=1,
        le=365,
        description="Interval between occurrences"
    )
    recurrence_days: Optional[str] = Field(
        default=None,
        description="Days for weekly recurrence: 'mon,wed,fri'"
    )
    recurrence_end_date: Optional[date] = Field(
        default=None,
        description="Optional end date for recurrence"
    )
    max_occurrences: Optional[int] = Field(
        default=None,
        ge=1,
        description="Optional maximum number of occurrences"
    )


class TaskUpdate(SQLModel):
    """
    Schema for updating existing tasks.
    All fields are optional to allow partial updates.
    Phase 4: Includes recurrence fields for updating recurring tasks.
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
    # Phase 4: Recurrence fields
    is_recurring: Optional[bool] = Field(
        default=None,
        description="Whether this task repeats on a schedule"
    )
    recurrence_type: Optional[RecurrenceType] = Field(
        default=None,
        description="Recurrence pattern type: daily, weekly, monthly, yearly"
    )
    recurrence_interval: Optional[int] = Field(
        default=None,
        ge=1,
        le=365,
        description="Interval between occurrences"
    )
    recurrence_days: Optional[str] = Field(
        default=None,
        description="Days for weekly recurrence: 'mon,wed,fri'"
    )
    recurrence_end_date: Optional[date] = Field(
        default=None,
        description="Optional end date for recurrence"
    )
    max_occurrences: Optional[int] = Field(
        default=None,
        ge=1,
        description="Optional maximum number of occurrences"
    )


class TaskResponse(TaskBase):
    """
    Schema for API responses.
    Includes all fields that should be returned to clients.
    Phase 4: Includes recurrence fields for recurring tasks.
    """
    id: uuid.UUID
    user_id: str
    created_at: datetime
    updated_at: datetime
    tags: List[str] = Field(
        default_factory=list,
        description="List of tag names associated with this task"
    )
    # Phase 4: Recurrence fields
    is_recurring: bool = Field(
        default=False,
        description="Whether this task repeats on a schedule"
    )
    is_pattern: bool = Field(
        default=False,
        description="Whether this is a recurring pattern (template) or an instance"
    )
    recurrence_type: Optional[RecurrenceType] = Field(
        default=None,
        description="Recurrence pattern type"
    )
    recurrence_interval: int = Field(
        default=1,
        description="Interval between occurrences"
    )
    recurrence_days: Optional[str] = Field(
        default=None,
        description="Days for weekly recurrence"
    )
    recurrence_end_date: Optional[date] = Field(
        default=None,
        description="End date for recurrence"
    )
    max_occurrences: Optional[int] = Field(
        default=None,
        description="Maximum number of occurrences"
    )
    parent_task_id: Optional[uuid.UUID] = Field(
        default=None,
        description="Parent recurring task ID (for instances)"
    )
    occurrence_count: int = Field(
        default=0,
        description="Number of occurrences generated"
    )


class TagWithUsage(SQLModel):
    """
    Schema for tag autocomplete responses.
    Shows tag name and how many times it's been used by the user.
    """
    name: str = Field(description="Tag name")
    usage_count: int = Field(description="Number of tasks using this tag")