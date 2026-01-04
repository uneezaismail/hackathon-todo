"""
Pydantic schemas for Task API requests and responses.

Defines schemas for:
- TaskCreate: Request body for creating new tasks
- TaskResponse: Response body for task operations
- TaskUpdate: Request body for updating existing tasks (for future use)

All schemas include validation rules for field constraints.
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Literal
from datetime import datetime, date
from uuid import UUID

# Priority Enum Type
PriorityType = Literal["High", "Medium", "Low"]

# Recurrence Type for Phase 4
RecurrenceTypeStr = Literal["daily", "weekly", "monthly", "yearly"]


class TaskCreate(BaseModel):
    """
    Schema for creating a new task.
    """
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "Complete project documentation",
                "description": "Write comprehensive README and API docs",
                "priority": "High",
                "tags": ["documentation", "urgent"]
            }
        }
    )

    title: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Task title (1-200 characters)",
        examples=["Complete project documentation"]
    )
    description: Optional[str] = Field(
        default=None,
        max_length=1000,
        description="Optional task description (max 1000 characters)",
        examples=["Write comprehensive README and API documentation for the project"]
    )
    priority: PriorityType = Field(
        default="Medium",
        description="Task priority level (High, Medium, Low)"
    )
    due_date: Optional[date] = Field(
        default=None,
        description="Optional task due date"
    )
    tags: List[str] = Field(
        default_factory=list,
        description="List of tags associated with the task"
    )
    # Phase 4: Recurrence fields
    is_recurring: bool = Field(
        default=False,
        description="Whether this task repeats on a schedule"
    )
    recurrence_type: Optional[RecurrenceTypeStr] = Field(
        default=None,
        description="Recurrence pattern: daily, weekly, monthly, yearly"
    )
    recurrence_interval: int = Field(
        default=1,
        ge=1,
        le=365,
        description="Interval between occurrences (e.g., every 2 weeks)"
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


class TaskResponse(BaseModel):
    """
    Schema for task API responses.
    """
    model_config = ConfigDict(
        from_attributes=True,  # Enable ORM mode for SQLModel compatibility
        json_schema_extra={
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "user_id": "test-user-123",
                "title": "Complete project documentation",
                "description": "Write comprehensive README and API documentation",
                "completed": False,
                "priority": "High",
                "tags": ["documentation"],
                "created_at": "2025-12-11T10:30:00Z",
                "updated_at": "2025-12-11T10:30:00Z"
            }
        }
    )

    id: UUID = Field(
        ...,
        description="Unique task identifier (UUID v4)"
    )
    user_id: str = Field(
        ...,
        description="Better Auth user ID - owner of this task"
    )
    title: str = Field(
        ...,
        description="Task title"
    )
    description: Optional[str] = Field(
        default=None,
        description="Task description (optional)"
    )
    completed: bool = Field(
        ...,
        description="Task completion status"
    )
    priority: PriorityType = Field(
        default="Medium",
        description="Task priority level"
    )
    due_date: Optional[date] = Field(
        default=None,
        description="Task due date"
    )
    tags: List[str] = Field(
        default_factory=list,
        description="List of tags associated with the task"
    )
    created_at: datetime = Field(
        ...,
        description="Timestamp when task was created (UTC)"
    )
    updated_at: datetime = Field(
        ...,
        description="Timestamp when task was last updated (UTC)"
    )
    # Phase 4: Recurrence fields
    is_recurring: bool = Field(
        default=False,
        description="Whether this task repeats on a schedule"
    )
    recurrence_type: Optional[RecurrenceTypeStr] = Field(
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
    parent_task_id: Optional[UUID] = Field(
        default=None,
        description="Parent recurring task ID (for instances)"
    )
    occurrence_count: int = Field(
        default=0,
        description="Number of occurrences generated"
    )


class TaskUpdate(BaseModel):
    """
    Schema for updating an existing task.
    """
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "Updated task title",
                "description": "Updated description",
                "completed": True,
                "priority": "Low",
                "tags": ["updated"]
            }
        }
    )

    title: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=200,
        description="Updated task title (1-200 characters)"
    )
    description: Optional[str] = Field(
        default=None,
        max_length=1000,
        description="Updated task description (max 1000 characters)"
    )
    completed: Optional[bool] = Field(
        default=None,
        description="Updated completion status"
    )
    priority: Optional[PriorityType] = Field(
        default=None,
        description="Updated priority level"
    )
    due_date: Optional[date] = Field(
        default=None,
        description="Updated due date"
    )
    tags: Optional[List[str]] = Field(
        default=None,
        description="Updated list of tags"
    )
    # Phase 4: Recurrence fields
    is_recurring: Optional[bool] = Field(
        default=None,
        description="Whether this task repeats on a schedule"
    )
    recurrence_type: Optional[RecurrenceTypeStr] = Field(
        default=None,
        description="Recurrence pattern type"
    )
    recurrence_interval: Optional[int] = Field(
        default=None,
        ge=1,
        le=365,
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
        ge=1,
        description="Maximum number of occurrences"
    )


class TaskListResponse(BaseModel):
    """
    Schema for paginated task list responses.

    Returns a list of tasks with pagination metadata.

    Attributes:
        tasks: List of tasks (array of TaskResponse)
        total: Total number of tasks matching the filter
        limit: Maximum number of tasks returned in this response
        offset: Number of tasks skipped (for pagination)

    Example:
        {
            "tasks": [
                {
                    "id": "550e8400-e29b-41d4-a716-446655440000",
                    "user_id": "test-user-123",
                    "title": "Task 1",
                    "description": "Description 1",
                    "completed": false,
                    "created_at": "2025-12-11T10:30:00Z",
                    "updated_at": "2025-12-11T10:30:00Z"
                }
            ],
            "total": 10,
            "limit": 50,
            "offset": 0
        }
    """
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "tasks": [
                    {
                        "id": "550e8400-e29b-41d4-a716-446655440000",
                        "user_id": "test-user-123",
                        "title": "Complete project documentation",
                        "description": "Write comprehensive README",
                        "completed": False,
                        "created_at": "2025-12-11T10:30:00Z",
                        "updated_at": "2025-12-11T10:30:00Z"
                    }
                ],
                "total": 10,
                "limit": 50,
                "offset": 0
            }
        }
    )

    tasks: list[TaskResponse] = Field(
        ...,
        description="List of tasks for the user"
    )
    total: int = Field(
        ...,
        ge=0,
        description="Total number of tasks matching the filter (not limited by pagination)"
    )
    limit: int = Field(
        ...,
        ge=1,
        le=100,
        description="Maximum number of tasks in this response"
    )
    offset: int = Field(
        ...,
        ge=0,
        description="Number of tasks skipped for pagination"
    )


class CompleteTaskResponse(BaseModel):
    """
    Schema for completing a recurring task.
    Returns the completed task and optionally the next occurrence.
    """
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "completed_task": {
                    "id": "550e8400-e29b-41d4-a716-446655440000",
                    "title": "Weekly meeting",
                    "completed": True,
                    "is_recurring": True
                },
                "next_occurrence": {
                    "id": "660e8400-e29b-41d4-a716-446655440001",
                    "title": "Weekly meeting",
                    "completed": False,
                    "due_date": "2025-01-10"
                }
            }
        }
    )

    completed_task: TaskResponse = Field(
        ...,
        description="The task that was marked as completed"
    )
    next_occurrence: Optional[TaskResponse] = Field(
        default=None,
        description="The next occurrence of the recurring task (if applicable)"
    )
