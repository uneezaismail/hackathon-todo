"""
Common Pydantic schemas used across multiple endpoints.

These schemas are reusable components for request/response validation.
"""

from pydantic import BaseModel, Field
from typing import Optional, TypeVar, Generic
from enum import Enum

# Generic type for data in API responses
T = TypeVar('T')


class TaskStatus(str, Enum):
    """
    Task completion status filter enum.

    Used for filtering tasks by their completion status.

    Values:
        PENDING: Tasks that are not yet completed (completed=False)
        COMPLETED: Tasks that have been completed (completed=True)

    Example query:
        GET /api/v1/tasks?status=Pending
        GET /api/v1/tasks?status=Completed
    """
    PENDING = "Pending"
    COMPLETED = "Completed"


class SortOrder(str, Enum):
    """
    Sort order enum for task lists (legacy - kept for backward compatibility).

    Defines the order in which tasks should be returned.

    Values:
        CREATED_ASC: Sort by creation date ascending (oldest first)
        CREATED_DESC: Sort by creation date descending (newest first)

    Example query:
        GET /api/v1/tasks?sort=created_at_asc
        GET /api/v1/tasks?sort=created_at_desc
    """
    CREATED_ASC = "created_at_asc"
    CREATED_DESC = "created_at_desc"


class SortBy(str, Enum):
    """
    T076/T082: Sort options for task lists.

    Defines the field and direction for sorting tasks.

    Values:
        DUE_DATE_SOONEST: Sort by due date ascending (soonest first, nulls last)
        CREATED_NEWEST: Sort by creation date descending (newest first)
        CREATED_OLDEST: Sort by creation date ascending (oldest first)
        PRIORITY_HIGH_LOW: Sort by priority (High -> Medium -> Low)
        ALPHABETICAL_AZ: Sort by title alphabetically (A-Z, case-insensitive)

    Example query:
        GET /api/v1/tasks?sort_by=due_date_soonest
        GET /api/v1/tasks?sort_by=priority_high_low
    """
    DUE_DATE_SOONEST = "due_date_soonest"
    CREATED_NEWEST = "created_newest"
    CREATED_OLDEST = "created_oldest"
    PRIORITY_HIGH_LOW = "priority_high_low"
    ALPHABETICAL_AZ = "alphabetical_az"


class ErrorResponse(BaseModel):
    """
    Standardized error response schema.

    All API errors return this format for consistent error handling.

    Attributes:
        message: Human-readable error description
        code: Machine-readable error code for client handling

    Example:
        {
            "message": "Task not found",
            "code": "NOT_FOUND"
        }
    """

    message: str = Field(..., description="Human-readable error message")
    code: str = Field(..., description="Machine-readable error code")


class PaginationParams(BaseModel):
    """
    Query parameters for paginated list endpoints.

    Provides limit/offset pagination with validation.

    Attributes:
        limit: Maximum number of items to return (1-100)
        offset: Number of items to skip (>= 0)

    Example query:
        GET /api/v1/tasks?limit=20&offset=40
    """

    limit: int = Field(
        default=50,
        ge=1,
        le=100,
        description="Maximum number of items to return (1-100)",
    )
    offset: int = Field(
        default=0,
        ge=0,
        description="Number of items to skip (>= 0)",
    )


class ApiResponse(BaseModel, Generic[T]):
    """
    Standardized API response wrapper.

    All successful API responses use this format:
    {
        "data": <response_data>,
        "error": null
    }

    All error responses use this format:
    {
        "data": null,
        "error": {"message": "...", "code": "..."}
    }
    """
    data: Optional[T] = None
    error: Optional[ErrorResponse] = None
