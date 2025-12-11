"""
Pydantic schemas for Task API requests and responses.

Defines schemas for:
- TaskCreate: Request body for creating new tasks
- TaskResponse: Response body for task operations
- TaskUpdate: Request body for updating existing tasks (for future use)

All schemas include validation rules for field constraints.
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID


class TaskCreate(BaseModel):
    """
    Schema for creating a new task.

    Validates:
    - title: Required, 1-200 characters
    - description: Optional, max 1000 characters
    - completed: Defaults to False (not in request body, set by backend)

    Example:
        {
            "title": "Complete project documentation",
            "description": "Write comprehensive README and API docs"
        }
    """
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "Complete project documentation",
                "description": "Write comprehensive README and API documentation for the project"
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


class TaskResponse(BaseModel):
    """
    Schema for task API responses.

    Returns all task fields including system-generated values:
    - id: UUID assigned by database
    - user_id: User ID from JWT token
    - title, description, completed: User-provided or default values
    - created_at, updated_at: Timestamps managed by database

    Example:
        {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "user_id": "test-user-123",
            "title": "Complete project documentation",
            "description": "Write comprehensive README and API docs",
            "completed": false,
            "created_at": "2025-12-11T10:30:00Z",
            "updated_at": "2025-12-11T10:30:00Z"
        }
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
    created_at: datetime = Field(
        ...,
        description="Timestamp when task was created (UTC)"
    )
    updated_at: datetime = Field(
        ...,
        description="Timestamp when task was last updated (UTC)"
    )


class TaskUpdate(BaseModel):
    """
    Schema for updating an existing task.

    All fields are optional to allow partial updates.
    Used for future PATCH/PUT endpoints.

    Example:
        {
            "title": "Updated task title",
            "completed": true
        }
    """
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "Updated task title",
                "description": "Updated description",
                "completed": True
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
