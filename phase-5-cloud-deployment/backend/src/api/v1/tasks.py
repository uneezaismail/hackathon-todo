"""
Task API endpoints (v1).

Implements REST API for task operations:
- POST /api/v1/tasks - Create new task
- GET /api/v1/tasks - List user's tasks (for future)
- GET /api/v1/tasks/{task_id} - Get specific task (for future)
- PATCH /api/v1/tasks/{task_id} - Update task (for future)
- DELETE /api/v1/tasks/{task_id} - Delete task (for future)

All endpoints require JWT authentication and enforce user isolation.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Response, Query
from sqlmodel import Session, SQLModel
from typing import Dict, Any, Optional, List
from datetime import date
from uuid import UUID

from ...db.session import get_session
from ...auth.dependencies import get_current_user_id
from ...schemas.task import TaskCreate, TaskResponse, TaskListResponse, TaskUpdate, CompleteTaskResponse
from ...schemas.common import ApiResponse, TaskStatus, SortOrder, SortBy
from ...models.task import Task, TagWithUsage
from ...models.tag import Tag
from ...models.task_tag import TaskTag
from ...services.task_service import TaskService
from ...services.tag_service import TagService
from ...services.recurring_service import RecurringService
from ...services.analytics_service import AnalyticsService
from ...services.exceptions import TaskNotFoundError, UnauthorizedError
import logging

logger = logging.getLogger(__name__)


# Define response model for OpenAPI schema generation
class TaskCreateResponse(ApiResponse[TaskResponse]):
    """Response model for task creation endpoint."""
    pass


class TaskListApiResponse(ApiResponse[TaskListResponse]):
    """Response model for task list endpoint."""
    pass


class TaskGetResponse(ApiResponse[TaskResponse]):
    """Response model for get task by ID endpoint."""
    pass


class TaskUpdateResponse(ApiResponse[TaskResponse]):
    """Response model for task update endpoint."""
    pass


class CompleteTaskApiResponse(ApiResponse[CompleteTaskResponse]):
    """Response model for complete task endpoint (Phase 4)."""
    pass


# Create router for task endpoints
router = APIRouter(
    prefix="/api/{user_id}/tasks",
    tags=["tasks"],
    responses={
        401: {
            "description": "Unauthorized - Missing or invalid JWT token",
            "content": {
                "application/json": {
                    "example": {
                        "data": None,
                        "error": {
                            "message": "Could not validate credentials",
                            "code": "UNAUTHORIZED"
                        }
                    }
                }
            }
        },
        403: {
            "description": "Forbidden - User not authorized for this resource",
            "content": {
                "application/json": {
                    "example": {
                        "data": None,
                        "error": {
                            "message": "Not authorized to access this resource",
                            "code": "UNAUTHORIZED"
                        }
                    }
                }
            }
        }
    }
)


@router.post(
    "",
    response_model=TaskCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new task",
    description="""
    Create a new task for the authenticated user.

    CRITICAL SECURITY:
    - Requires valid JWT token in Authorization header
    - URL user_id must match JWT user_id
    - Task is automatically assigned to the authenticated user

    Request body:
    - title: Required, 1-200 characters
    - description: Optional, max 1000 characters

    Response:
    - 201 Created: Task created successfully
    - 400 Bad Request: Invalid input (validation error)
    - 401 Unauthorized: Missing or invalid JWT token
    - 403 Forbidden: URL user_id does not match token user_id
    - 422 Unprocessable Entity: Validation error
    """,
    responses={
        201: {
            "description": "Task created successfully",
            "content": {
                "application/json": {
                    "example": {
                        "data": {
                            "id": "550e8400-e29b-41d4-a716-446655440000",
                            "user_id": "test-user-123",
                            "title": "Complete project documentation",
                            "description": "Write comprehensive README and API docs",
                            "completed": False,
                            "created_at": "2025-12-11T10:30:00Z",
                            "updated_at": "2025-12-11T10:30:00Z"
                        },
                        "error": None
                    }
                }
            },
            "headers": {
                "Location": {
                    "description": "URL of the created task",
                    "schema": {"type": "string"}
                }
            }
        },
        400: {
            "description": "Bad Request - Invalid input data",
            "content": {
                "application/json": {
                    "example": {
                        "data": None,
                        "error": {
                            "message": "Validation error in title: ensure this value has at least 1 characters",
                            "code": "VALIDATION_ERROR"
                        }
                    }
                }
            }
        }
    }
)
async def create_task(
    user_id: str,
    task_create: TaskCreate,
    response: Response,
    current_user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session)
) -> TaskCreateResponse:
    """
    Create a new task for the authenticated user.

    CRITICAL SECURITY:
    - Validates URL user_id matches JWT user_id
    - Users can ONLY create tasks for themselves

    Args:
        user_id: User ID from URL path
        task_create: Task creation data (title, description)
        response: FastAPI Response object for setting headers
        current_user_id: User ID from JWT token (injected by dependency)
        session: Database session (injected by dependency)

    Returns:
        Dict: Standardized response with created task data

    Raises:
        HTTPException 401: If JWT token is missing or invalid
        HTTPException 403: If URL user_id does not match token user_id
        HTTPException 422: If validation fails
        HTTPException 500: If database operation fails
    """
    try:
        # Validate URL user_id matches token user_id
        if user_id != current_user_id:
            raise UnauthorizedError("Not authorized to access this resource")

        # Create task using service layer
        task = TaskService.create_task(
            session=session,
            user_id=current_user_id,
            task_create=task_create
        )

        # Convert to response model
        task_response = TaskResponse.model_validate(task)

        # Set Location header for REST best practices
        response.headers["Location"] = f"/api/{user_id}/tasks/{task.id}"

        logger.info(f"User {current_user_id} created task {task.id}")

        # Return standardized response format
        return TaskCreateResponse(data=task_response, error=None)

    except Exception as e:
        logger.error(f"Error creating task for user {current_user_id}: {str(e)}", exc_info=True)
        # Re-raise known exceptions
        if isinstance(e, (HTTPException, UnauthorizedError)):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create task"
        )


@router.get(
    "",
    response_model=TaskListApiResponse,
    status_code=status.HTTP_200_OK,
    summary="List all tasks for authenticated user",
    description="""
    List all tasks for the authenticated user with optional filtering, sorting, and pagination.

    CRITICAL SECURITY:
    - Requires valid JWT token in Authorization header
    - URL user_id must match JWT user_id
    - Returns ONLY tasks belonging to the authenticated user

    Query parameters:
    - status: Filter by completion status (Pending/Completed, optional)
    - sort: Sort order (created_at_asc/created_at_desc, default: created_at_desc)
    - limit: Maximum tasks to return (1-100, default 50)
    - offset: Number of tasks to skip for pagination (default 0)

    Response:
    - 200 OK: List of tasks with pagination metadata
    - 401 Unauthorized: Missing or invalid JWT token
    - 403 Forbidden: URL user_id does not match token user_id
    - 422 Unprocessable Entity: Invalid query parameters
    """,
    responses={
        200: {
            "description": "List of tasks retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "data": {
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
                        },
                        "error": None
                    }
                }
            }
        }
    }
)
async def list_tasks(
    user_id: str,
    current_user_id: str = Depends(get_current_user_id),
    search: Optional[str] = Query(
        None,
        description="Search keyword for title and description (case-insensitive)"
    ),
    status_filter: Optional[TaskStatus] = Query(
        None,
        alias="status",
        description="Filter by completion status (Pending=incomplete, Completed=complete)"
    ),
    priority: Optional[str] = Query(
        None,
        description="Filter by priority level (High, Medium, Low)"
    ),
    tags: Optional[List[str]] = Query(
        None,
        description="Filter by tag names (tasks must have ALL specified tags)"
    ),
    sort_by: Optional[SortBy] = Query(
        None,
        description="T076: Sort field (due_date_soonest, created_newest, created_oldest, priority_high_low, alphabetical_az)"
    ),
    sort: SortOrder = Query(
        SortOrder.CREATED_DESC,
        description="Legacy sort order (created_at_asc=oldest first, created_at_desc=newest first). Use sort_by instead."
    ),
    limit: int = Query(
        50,
        ge=1,
        le=100,
        description="Maximum number of tasks to return (1-100)"
    ),
    offset: int = Query(
        0,
        ge=0,
        description="Number of tasks to skip for pagination"
    ),
    session: Session = Depends(get_session)
) -> TaskListApiResponse:
    """
    List all tasks for the authenticated user.

    CRITICAL SECURITY:
    - Validates URL user_id matches JWT user_id
    - Users can ONLY see their own tasks

    Args:
        user_id: User ID from URL path
        current_user_id: User ID from JWT token (injected by dependency)
        status_filter: Optional filter for completion status
        sort: Sort order
        limit: Maximum tasks to return
        offset: Number of tasks to skip
        session: Database session

    Returns:
        Dict: Standardized response with task list and pagination metadata

    Raises:
        HTTPException 401: If JWT token is missing or invalid
        HTTPException 403: If URL user_id does not match token user_id
        HTTPException 422: If query parameters are invalid
        HTTPException 500: If database operation fails
    """
    try:
        # Validate URL user_id matches token user_id
        if user_id != current_user_id:
            raise UnauthorizedError("Not authorized to access this resource")

        # Map status enum to completed boolean for database query
        completed: Optional[bool] = None
        if status_filter == TaskStatus.PENDING:
            completed = False
        elif status_filter == TaskStatus.COMPLETED:
            completed = True

        # Map sort enum to sort_order string for database query
        sort_order = "asc" if sort == SortOrder.CREATED_ASC else "desc"

        # T057: Get tasks for authenticated user with filters (including search)
        # T076: Pass sort_by parameter for new sorting options
        tasks, total = TaskService.get_user_tasks(
            session=session,
            user_id=current_user_id,
            search=search,
            completed=completed,
            priority=priority,
            tags=tags,
            sort_by=sort_by,
            sort_order=sort_order,
            limit=limit,
            offset=offset
        )

        # Tasks already come as TaskResponse from service
        task_responses = tasks

        # Build task list response
        task_list_response = TaskListResponse(
            tasks=task_responses,
            total=total,
            limit=limit,
            offset=offset
        )

        logger.info(
            f"User {current_user_id} retrieved {len(tasks)} tasks "
            f"(total: {total}, status={status_filter}, sort={sort})"
        )

        # Return standardized response format
        return TaskListApiResponse(data=task_list_response, error=None)

    except Exception as e:
        logger.error(f"Error listing tasks for user {current_user_id}: {str(e)}", exc_info=True)
        if isinstance(e, (HTTPException, UnauthorizedError)):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve tasks"
        )


@router.get(
    "/tags",
    response_model=List[TagWithUsage],
    status_code=status.HTTP_200_OK,
    summary="Get user's tags for autocomplete",
    description="""
    Get the user's tags with usage count for autocomplete.
    Returns top 10 most used tags by default.

    Query parameters:
    - search: Optional prefix filter for tag names
    - limit: Maximum tags to return (default 10, max 50)

    Response:
    - 200 OK: List of tags with usage counts
    - 401 Unauthorized: Missing or invalid JWT token
    - 403 Forbidden: URL user_id does not match token user_id
    """
)
async def get_user_tags(
    user_id: str,
    current_user_id: str = Depends(get_current_user_id),
    search: Optional[str] = Query(None, description="Search tag names by prefix"),
    limit: int = Query(10, ge=1, le=50, description="Maximum tags to return"),
    session: Session = Depends(get_session)
) -> List[TagWithUsage]:
    """Get user's tags for autocomplete with usage count."""
    try:
        # Validate URL user_id matches token user_id
        if user_id != current_user_id:
            raise UnauthorizedError("Not authorized to access this resource")

        # Get tags with usage count
        tags = TagService.get_user_tags(
            session=session,
            user_id=current_user_id,
            search=search,
            limit=limit
        )

        logger.info(f"User {current_user_id} retrieved {len(tags)} tags")
        return tags

    except Exception as e:
        logger.error(f"Error retrieving tags for user {current_user_id}: {str(e)}")
        if isinstance(e, (HTTPException, UnauthorizedError)):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve tags"
        )


# NOTE: /recurring must be defined BEFORE /{task_id} routes to avoid route conflicts
@router.get(
    "/recurring",
    response_model=TaskListApiResponse,
    status_code=status.HTTP_200_OK,
    summary="List recurring task patterns (Phase 4)",
    description="""
    List all recurring task patterns for the authenticated user.

    Returns only the parent recurring tasks (is_recurring=true, parent_task_id=null),
    not the individual instances generated from them.

    CRITICAL SECURITY:
    - Requires valid JWT token in Authorization header
    - URL user_id must match JWT user_id
    - Returns ONLY recurring patterns belonging to the authenticated user

    Response:
    - 200 OK: List of recurring task patterns
    - 401 Unauthorized: Missing or invalid JWT token
    - 403 Forbidden: URL user_id does not match token user_id
    """
)
async def list_recurring_tasks(
    user_id: str,
    current_user_id: str = Depends(get_current_user_id),
    limit: int = Query(50, ge=1, le=100, description="Maximum tasks to return"),
    offset: int = Query(0, ge=0, description="Number of tasks to skip"),
    session: Session = Depends(get_session)
) -> TaskListApiResponse:
    """
    List all recurring task patterns for the authenticated user.

    Returns parent recurring tasks only (not generated instances).
    """
    try:
        if user_id != current_user_id:
            raise UnauthorizedError("Not authorized to access this resource")

        # Query for recurring patterns (parent tasks only)
        from sqlmodel import select, func

        base_query = select(Task).where(
            (Task.user_id == current_user_id) &
            (Task.is_recurring == True) &
            (Task.parent_task_id == None)
        )

        # Count total
        count_query = select(func.count()).select_from(base_query.subquery())
        total = session.exec(count_query).one()

        # Get paginated results
        paginated_query = base_query.order_by(Task.created_at.desc()).offset(offset).limit(limit)
        tasks = session.exec(paginated_query).all()

        # Build responses with tags
        task_responses = []
        for task in tasks:
            from sqlmodel import select as sqlmodel_select
            tag_query = (
                sqlmodel_select(Tag.name)
                .join(TaskTag, Tag.id == TaskTag.tag_id)
                .where(TaskTag.task_id == task.id)
            )
            tag_names = list(session.exec(tag_query).all())

            task_responses.append(TaskResponse(
                id=task.id,
                user_id=task.user_id,
                title=task.title,
                description=task.description,
                completed=task.completed,
                priority=task.priority,
                due_date=task.due_date,
                created_at=task.created_at,
                updated_at=task.updated_at,
                tags=tag_names,
                is_recurring=task.is_recurring,
                recurrence_type=task.recurrence_type,
                recurrence_interval=task.recurrence_interval,
                recurrence_days=task.recurrence_days,
                recurrence_end_date=task.recurrence_end_date,
                max_occurrences=task.max_occurrences,
                parent_task_id=task.parent_task_id,
                occurrence_count=task.occurrence_count,
            ))

        task_list_response = TaskListResponse(
            tasks=task_responses,
            total=total,
            limit=limit,
            offset=offset
        )

        logger.info(f"User {current_user_id} retrieved {len(task_responses)} recurring patterns")

        return TaskListApiResponse(data=task_list_response, error=None)

    except Exception as e:
        logger.error(f"Error listing recurring tasks for user {current_user_id}: {str(e)}", exc_info=True)
        if isinstance(e, (HTTPException, UnauthorizedError)):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve recurring tasks"
        )


# Analytics response models (defined here, before the /analytics route that uses them)
class AnalyticsResponse(SQLModel):
    """Response model for analytics endpoint."""
    completion_stats: Dict[str, Any]
    priority_distribution: Dict[str, Any]
    recurring_stats: Optional[Dict[str, Any]] = None
    heatmap_data: Optional[List[Dict[str, Any]]] = None


class AnalyticsApiResponse(ApiResponse[AnalyticsResponse]):
    """Response model for analytics endpoint."""
    pass


# NOTE: /analytics must be defined BEFORE /{task_id} routes to avoid route conflicts
@router.get(
    "/analytics",
    response_model=AnalyticsApiResponse,
    status_code=status.HTTP_200_OK,
    summary="Get analytics data (Phase 4)",
    description="""
    Get analytics data for the authenticated user.

    CRITICAL SECURITY:
    - Requires valid JWT token in Authorization header
    - URL user_id must match JWT user_id
    - Returns ONLY analytics for the authenticated user

    Query parameters:
    - start_date: Optional start date for filtering (YYYY-MM-DD)
    - end_date: Optional end date for filtering (YYYY-MM-DD)
    - include_heatmap: Whether to include full year heatmap data (default: false)
    - year: Year for heatmap data (default: current year)

    Response:
    - 200 OK: Analytics data
    - 401 Unauthorized: Missing or invalid JWT token
    - 403 Forbidden: URL user_id does not match token user_id
    """
)
async def get_analytics(
    user_id: str,
    current_user_id: str = Depends(get_current_user_id),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    include_heatmap: bool = Query(False, description="Include heatmap data"),
    year: Optional[int] = Query(None, description="Year for heatmap data"),
    session: Session = Depends(get_session)
) -> AnalyticsApiResponse:
    """
    Get analytics data for the authenticated user.
    """
    from datetime import datetime, date as date_type

    try:
        if user_id != current_user_id:
            raise UnauthorizedError("Not authorized to access this resource")

        # Parse date strings
        parsed_start_date = None
        parsed_end_date = None
        if start_date:
            parsed_start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
        if end_date:
            parsed_end_date = datetime.strptime(end_date, "%Y-%m-%d").date()

        # Get completion stats
        completion_stats = AnalyticsService.get_completion_stats(
            session=session,
            user_id=current_user_id,
            start_date=parsed_start_date,
            end_date=parsed_end_date
        )

        # Get priority distribution
        priority_distribution = AnalyticsService.get_priority_distribution(
            session=session,
            user_id=current_user_id,
            start_date=parsed_start_date,
            end_date=parsed_end_date
        )

        # Get recurring stats
        recurring_stats = AnalyticsService.get_recurring_stats(
            session=session,
            user_id=current_user_id
        )

        # Optionally include heatmap data
        heatmap_data = None
        if include_heatmap:
            heatmap_year = year if year else date_type.today().year
            heatmap_data = AnalyticsService.get_heatmap_data(
                session=session,
                user_id=current_user_id,
                year=heatmap_year
            )

        analytics_response = AnalyticsResponse(
            completion_stats=completion_stats,
            priority_distribution=priority_distribution,
            recurring_stats=recurring_stats,
            heatmap_data=heatmap_data
        )

        logger.info(f"User {current_user_id} retrieved analytics data")

        return AnalyticsApiResponse(data=analytics_response, error=None)

    except Exception as e:
        logger.error(f"Error getting analytics for user {current_user_id}: {str(e)}", exc_info=True)
        if isinstance(e, (HTTPException, UnauthorizedError)):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve analytics"
        )


@router.get(
    "/{task_id}",
    response_model=TaskGetResponse,
    status_code=status.HTTP_200_OK,
    summary="Get a specific task by ID",
    description="""
    Get a specific task by ID for the authenticated user.

    CRITICAL SECURITY:
    - Requires valid JWT token in Authorization header
    - URL user_id must match JWT user_id
    - Task must belong to the authenticated user
    - Returns 403 Forbidden if task belongs to different user (not 404, to prevent info leakage)
    - Returns 404 Not Found if task doesn't exist

    Response:
    - 200 OK: Task retrieved successfully
    - 401 Unauthorized: Missing or invalid JWT token
    - 403 Forbidden: Task belongs to different user OR URL user_id mismatch
    - 404 Not Found: Task doesn't exist
    """,
    responses={
        200: {
            "description": "Task retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "data": {
                            "id": "550e8400-e29b-41d4-a716-446655440000",
                            "user_id": "test-user-123",
                            "title": "Complete project documentation",
                            "description": "Write comprehensive README",
                            "completed": False,
                            "created_at": "2025-12-11T10:30:00Z",
                            "updated_at": "2025-12-11T10:30:00Z"
                        },
                        "error": None
                    }
                }
            }
        },
        403: {
            "description": "Forbidden - Task belongs to different user or URL mismatch",
            "content": {
                "application/json": {
                    "example": {
                        "data": None,
                        "error": {
                            "message": "Not authorized to access this task",
                            "code": "UNAUTHORIZED"
                        }
                    }
                }
            }
        },
        404: {
            "description": "Not Found - Task doesn't exist",
            "content": {
                "application/json": {
                    "example": {
                        "data": None,
                        "error": {
                            "message": "Task not found",
                            "code": "NOT_FOUND"
                        }
                    }
                }
            }
        }
    }
)
async def get_task(
    user_id: str,
    task_id: UUID,
    current_user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session)
) -> TaskGetResponse:
    """
    Get a specific task by ID for the authenticated user.

    CRITICAL SECURITY:
    - Validates URL user_id matches JWT user_id
    - TaskService validates task belongs to user

    Args:
        user_id: User ID from URL path
        task_id: Task UUID
        current_user_id: User ID from JWT token (injected by dependency)
        session: Database session (injected by dependency)

    Returns:
        Dict: Standardized response with task data

    Raises:
        HTTPException 401: If JWT token is missing or invalid
        HTTPException 403: If URL user_id mismatch or task belongs to different user
        HTTPException 404: If task doesn't exist
        HTTPException 500: If database operation fails
    """
    try:
        # Validate URL user_id matches token user_id
        if user_id != current_user_id:
            raise UnauthorizedError("Not authorized to access this resource")

        # Get task with user_id validation
        task = TaskService.get_task_by_id(
            session=session,
            task_id=task_id,
            user_id=current_user_id
        )

        if task is None:
            logger.warning(f"User {current_user_id} attempted to access task {task_id} (not found)")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )

        # Convert to response model
        task_response = TaskResponse.model_validate(task)

        logger.info(f"User {current_user_id} retrieved task {task_id}")

        # Return standardized response format
        return TaskGetResponse(data=task_response, error=None)

    except Exception as e:
        logger.error(f"Error retrieving task {task_id} for user {current_user_id}: {str(e)}", exc_info=True)
        if isinstance(e, (HTTPException, UnauthorizedError)):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve task"
        )


@router.patch(
    "/{task_id}",
    response_model=TaskUpdateResponse,
    status_code=status.HTTP_200_OK,
    summary="Update a task",
    description="""
    Update an existing task for the authenticated user.

    CRITICAL SECURITY:
    - Requires valid JWT token in Authorization header
    - URL user_id must match JWT user_id
    - Task must belong to the authenticated user
    - Returns 404 Not Found if task doesn't exist or belongs to different user

    Query parameters:
    - update_series: If true, updates all future instances of a recurring task series
      (default: false, updates only this instance)

    Response:
    - 200 OK: Task updated successfully
    - 401 Unauthorized: Missing or invalid JWT token
    - 403 Forbidden: URL user_id does not match token user_id
    - 404 Not Found: Task doesn't exist or belongs to different user
    - 422 Unprocessable Entity: Validation error
    """,
    responses={
        200: {
            "description": "Task updated successfully",
            "content": {
                "application/json": {
                    "example": {
                        "data": {
                            "id": "550e8400-e29b-41d4-a716-446655440000",
                            "user_id": "test-user-123",
                            "title": "Updated task title",
                            "description": "Updated description",
                            "completed": True,
                            "created_at": "2025-12-11T10:30:00Z",
                            "updated_at": "2025-12-11T11:00:00Z"
                        },
                        "error": None
                    }
                }
            }
        },
        404: {
            "description": "Not Found - Task doesn't exist or belongs to different user",
            "content": {
                "application/json": {
                    "example": {
                        "data": None,
                        "error": {
                            "message": "Task not found",
                            "code": "NOT_FOUND"
                        }
                    }
                }
            }
        }
    }
)
async def update_task(
    user_id: str,
    task_id: UUID,
    task_update: TaskUpdate,
    update_series: bool = Query(
        False,
        description="If true, updates all future instances of a recurring task series"
    ),
    current_user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session)
) -> TaskUpdateResponse:
    """
    Update an existing task for the authenticated user.

    CRITICAL SECURITY:
    - Validates URL user_id matches JWT user_id
    - TaskService validates task belongs to user before update

    Args:
        user_id: User ID from URL path
        task_id: Task UUID
        task_update: Task update data
        update_series: If true, updates all future instances of recurring task series
        current_user_id: User ID from JWT token (injected by dependency)
        session: Database session (injected by dependency)

    Returns:
        Dict: Standardized response with updated task data

    Raises:
        HTTPException 401: If JWT token is missing or invalid
        HTTPException 403: If URL user_id does not match token user_id
        HTTPException 404: If task doesn't exist
        HTTPException 422: If validation fails
        HTTPException 500: If database operation fails
    """
    try:
        # Validate URL user_id matches token user_id
        if user_id != current_user_id:
            raise UnauthorizedError("Not authorized to access this resource")

        # Check if we need to update the series
        if update_series:
            # Get the task first to check if it's recurring
            task = TaskService.get_task_by_id(
                session=session,
                task_id=task_id,
                user_id=current_user_id
            )

            if task is None:
                logger.warning(f"User {current_user_id} attempted to update task {task_id} (not found)")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Task not found"
                )

            # Use RecurringService to update series if task is recurring
            if task.is_recurring:
                updated_task = RecurringService.update_series(
                    session=session,
                    task=task,
                    task_update=task_update,
                    user_id=current_user_id
                )
                logger.info(f"User {current_user_id} updated task series for {task_id}")
                return TaskUpdateResponse(data=updated_task, error=None)

        # Standard single task update
        task = TaskService.update_task(
            session=session,
            task_id=task_id,
            user_id=current_user_id,
            task_update=task_update
        )

        if task is None:
            logger.warning(f"User {current_user_id} attempted to update task {task_id} (not found)")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )

        # Convert to response model
        task_response = TaskResponse.model_validate(task)

        logger.info(f"User {current_user_id} updated task {task_id}")

        # Return standardized response format
        return TaskUpdateResponse(data=task_response, error=None)

    except Exception as e:
        logger.error(f"Error updating task {task_id} for user {current_user_id}: {str(e)}", exc_info=True)
        if isinstance(e, (HTTPException, UnauthorizedError)):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update task"
        )


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a task",
    description="""
    Delete a task for the authenticated user.

    CRITICAL SECURITY:
    - Requires valid JWT token in Authorization header
    - URL user_id must match JWT user_id
    - Task must belong to the authenticated user
    - Returns 404 Not Found if task doesn't exist or belongs to different user

    Response:
    - 204 No Content: Task deleted successfully (empty response body)
    - 401 Unauthorized: Missing or invalid JWT token
    - 403 Forbidden: URL user_id does not match token user_id
    - 404 Not Found: Task doesn't exist or belongs to different user
    """,
    responses={
        204: {
            "description": "Task deleted successfully (empty response body)"
        },
        404: {
            "description": "Not Found - Task doesn't exist or belongs to different user",
            "content": {
                "application/json": {
                    "example": {
                        "data": None,
                        "error": {
                            "message": "Task not found",
                            "code": "NOT_FOUND"
                        }
                    }
                }
            }
        }
    }
)
async def delete_task(
    user_id: str,
    task_id: UUID,
    current_user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session)
) -> Response:
    """
    Delete a task for the authenticated user.

    CRITICAL SECURITY:
    - Validates URL user_id matches JWT user_id
    - TaskService validates task belongs to user before deletion

    Args:
        user_id: User ID from URL path
        task_id: Task UUID
        current_user_id: User ID from JWT token (injected by dependency)
        session: Database session (injected by dependency)

    Returns:
        Response: Empty response with 204 No Content status

    Raises:
        HTTPException 401: If JWT token is missing or invalid
        HTTPException 403: If URL user_id does not match token user_id
        HTTPException 404: If task doesn't exist
        HTTPException 500: If database operation fails
    """
    try:
        # Validate URL user_id matches token user_id
        if user_id != current_user_id:
            raise UnauthorizedError("Not authorized to access this resource")

        # Delete task with user_id validation
        deleted = TaskService.delete_task(
            session=session,
            task_id=task_id,
            user_id=current_user_id
        )

        if not deleted:
            logger.warning(f"User {current_user_id} attempted to delete task {task_id} (not found)")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )

        logger.info(f"User {current_user_id} deleted task {task_id}")

        # Return 204 No Content (empty response body)
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    except Exception as e:
        logger.error(f"Error deleting task {task_id} for user {current_user_id}: {str(e)}", exc_info=True)
        if isinstance(e, (HTTPException, UnauthorizedError)):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete task"
        )


# NOTE: AnalyticsResponse and AnalyticsApiResponse classes are defined earlier in the file
# (before the /analytics route which uses them)


@router.post(
    "/{task_id}/complete",
    response_model=CompleteTaskApiResponse,
    status_code=status.HTTP_200_OK,
    summary="Complete a task (Phase 4)",
    description="""
    Complete a task and generate the next occurrence if it's a recurring task.

    CRITICAL SECURITY:
    - Requires valid JWT token in Authorization header
    - URL user_id must match JWT user_id
    - Task must belong to the authenticated user

    For recurring tasks:
    - Marks the current task as completed
    - Automatically generates the next occurrence based on recurrence pattern
    - Returns both the completed task and the new occurrence

    For non-recurring tasks:
    - Simply marks the task as completed
    - Returns only the completed task (next_occurrence will be null)

    Response:
    - 200 OK: Task completed successfully
    - 401 Unauthorized: Missing or invalid JWT token
    - 403 Forbidden: URL user_id does not match token user_id
    - 404 Not Found: Task doesn't exist
    """,
    responses={
        200: {
            "description": "Task completed successfully",
            "content": {
                "application/json": {
                    "example": {
                        "data": {
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
                        },
                        "error": None
                    }
                }
            }
        },
        404: {
            "description": "Not Found - Task doesn't exist",
            "content": {
                "application/json": {
                    "example": {
                        "data": None,
                        "error": {
                            "message": "Task not found",
                            "code": "NOT_FOUND"
                        }
                    }
                }
            }
        }
    }
)
async def complete_task(
    user_id: str,
    task_id: UUID,
    current_user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session)
) -> CompleteTaskApiResponse:
    """
    Complete a task and generate the next occurrence for recurring tasks.

    CRITICAL SECURITY:
    - Validates URL user_id matches JWT user_id
    - TaskService validates task belongs to user

    Args:
        user_id: User ID from URL path
        task_id: Task UUID
        current_user_id: User ID from JWT token (injected by dependency)
        session: Database session (injected by dependency)

    Returns:
        CompleteTaskApiResponse: Completed task and optional next occurrence

    Raises:
        HTTPException 401: If JWT token is missing or invalid
        HTTPException 403: If URL user_id does not match token user_id
        HTTPException 404: If task doesn't exist
        HTTPException 500: If database operation fails
    """
    try:
        # Validate URL user_id matches token user_id
        if user_id != current_user_id:
            raise UnauthorizedError("Not authorized to access this resource")

        # Get task with user_id validation
        task = TaskService.get_task_by_id(
            session=session,
            task_id=task_id,
            user_id=current_user_id
        )

        if task is None:
            logger.warning(f"User {current_user_id} attempted to complete task {task_id} (not found)")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )

        # Use RecurringService to complete the task and generate next occurrence
        completed_task, next_occurrence = RecurringService.complete_recurring_task(
            session=session,
            task=task,
            user_id=current_user_id
        )

        # Build response
        complete_response = CompleteTaskResponse(
            completed_task=completed_task,
            next_occurrence=next_occurrence
        )

        if next_occurrence:
            logger.info(
                f"User {current_user_id} completed recurring task {task_id}, "
                f"generated next occurrence {next_occurrence.id}"
            )
        else:
            logger.info(f"User {current_user_id} completed task {task_id}")

        return CompleteTaskApiResponse(data=complete_response, error=None)

    except Exception as e:
        logger.error(f"Error completing task {task_id} for user {current_user_id}: {str(e)}", exc_info=True)
        if isinstance(e, (HTTPException, UnauthorizedError)):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to complete task"
        )


@router.post(
    "/{task_id}/skip",
    response_model=CompleteTaskApiResponse,
    status_code=status.HTTP_200_OK,
    summary="Skip a recurring task occurrence (Phase 4)",
    description="""
    Skip the current occurrence of a recurring task and generate the next one.

    CRITICAL SECURITY:
    - Requires valid JWT token in Authorization header
    - URL user_id must match JWT user_id
    - Task must belong to the authenticated user

    Response:
    - 200 OK: Task skipped successfully
    - 401 Unauthorized: Missing or invalid JWT token
    - 403 Forbidden: URL user_id does not match token user_id
    - 404 Not Found: Task doesn't exist
    """
)
async def skip_task(
    user_id: str,
    task_id: UUID,
    current_user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session)
) -> CompleteTaskApiResponse:
    """Skip a recurring task occurrence."""
    try:
        if user_id != current_user_id:
            raise UnauthorizedError("Not authorized to access this resource")

        task = TaskService.get_task_by_id(
            session=session,
            task_id=task_id,
            user_id=current_user_id
        )

        if task is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )

        skipped_task, next_occurrence = RecurringService.skip_occurrence(
            session=session,
            task=task,
            user_id=current_user_id
        )

        complete_response = CompleteTaskResponse(
            completed_task=skipped_task,
            next_occurrence=next_occurrence
        )

        logger.info(f"User {current_user_id} skipped task {task_id}")

        return CompleteTaskApiResponse(data=complete_response, error=None)

    except Exception as e:
        logger.error(f"Error skipping task {task_id} for user {current_user_id}: {str(e)}", exc_info=True)
        if isinstance(e, (HTTPException, UnauthorizedError)):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to skip task"
        )


@router.post(
    "/{task_id}/stop-recurrence",
    response_model=TaskUpdateResponse,
    status_code=status.HTTP_200_OK,
    summary="Stop recurrence for a recurring task (Phase 4)",
    description="""
    Stop recurrence for a task, preserving the task and its history.

    CRITICAL SECURITY:
    - Requires valid JWT token in Authorization header
    - URL user_id must match JWT user_id
    - Task must belong to the authenticated user

    Response:
    - 200 OK: Recurrence stopped successfully
    - 401 Unauthorized: Missing or invalid JWT token
    - 403 Forbidden: URL user_id does not match token user_id
    - 404 Not Found: Task doesn't exist
    """
)
async def stop_task_recurrence(
    user_id: str,
    task_id: UUID,
    current_user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session)
) -> TaskUpdateResponse:
    """Stop recurrence for a recurring task."""
    try:
        if user_id != current_user_id:
            raise UnauthorizedError("Not authorized to access this resource")

        task = TaskService.get_task_by_id(
            session=session,
            task_id=task_id,
            user_id=current_user_id
        )

        if task is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )

        updated_task = RecurringService.stop_recurrence(
            session=session,
            task=task,
            user_id=current_user_id
        )

        logger.info(f"User {current_user_id} stopped recurrence for task {task_id}")

        return TaskUpdateResponse(data=updated_task, error=None)

    except Exception as e:
        logger.error(f"Error stopping recurrence for task {task_id} for user {current_user_id}: {str(e)}", exc_info=True)
        if isinstance(e, (HTTPException, UnauthorizedError)):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to stop recurrence"
        )
