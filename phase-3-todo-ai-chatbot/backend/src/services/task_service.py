"""
Task service for business logic operations.

Provides CRUD operations for tasks with user isolation and validation.
All operations validate that the user_id from JWT matches the operation.

Security:
- CRITICAL: All operations validate user_id to ensure data isolation
- Users can only access/modify their own tasks
- Database queries always filter by user_id
"""

from sqlmodel import Session, select, func, col
from sqlalchemy import case, nulls_last
from typing import List, Optional
from datetime import datetime
from uuid import UUID

from ..models.task import Task, TaskCreate, TaskUpdate, TaskResponse, PriorityType
from ..models.tag import Tag
from ..models.task_tag import TaskTag
from ..schemas.common import SortBy
from .tag_service import TagService
from .exceptions import TaskNotFoundError, UnauthorizedError
import logging

logger = logging.getLogger(__name__)


class TaskService:
    """
    Service class for task business logic operations.

    Provides methods for:
    - Creating tasks for authenticated users
    - Retrieving tasks with user isolation
    - Updating tasks (for future use)
    - Deleting tasks (for future use)

    All methods enforce user isolation - users can only access their own tasks.
    """

    @staticmethod
    def create_task(
        session: Session,
        user_id: str,
        task_create: TaskCreate
    ) -> TaskResponse:
        """
        Create a new task for a user with priority, due_date, and tags.

        CRITICAL SECURITY: The user_id parameter MUST come from the JWT token,
        NOT from the request body. This ensures users can only create tasks
        for themselves.

        Args:
            session: Database session
            user_id: User ID from JWT token (authenticated user)
            task_create: Task creation data (title, description, priority, due_date, tags)

        Returns:
            TaskResponse: Created task with generated id, timestamps, and tags

        Raises:
            HTTPException 500: If database operation fails

        Example:
            task = TaskService.create_task(
                session=session,
                user_id="test-user-123",
                task_create=TaskCreate(
                    title="My task",
                    description="Description",
                    priority="High",
                    due_date=date(2025, 12, 31),
                    tags=["work", "urgent"]
                )
            )
        """
        try:
            # Create task instance from request data
            # CRITICAL: Set user_id from JWT token, NOT from request body
            task = Task(
                user_id=user_id,  # From JWT token
                title=task_create.title,
                description=task_create.description,
                completed=False,  # Default to not completed
                priority=task_create.priority,
                due_date=task_create.due_date,
                # created_at and updated_at are set automatically by TimestampMixin
            )

            # Add to database session
            session.add(task)
            session.flush()  # Get task.id without committing

            # Handle tags if provided
            tag_names = []
            if task_create.tags:
                for tag_name in task_create.tags:
                    # Create or get tag
                    tag = TagService.create_or_get_tag(session, user_id, tag_name)
                    tag_names.append(tag.name)

                    # Create task-tag association
                    task_tag = TaskTag(task_id=task.id, tag_id=tag.id)
                    session.add(task_tag)

            session.commit()
            session.refresh(task)

            logger.info(f"Created task {task.id} for user {user_id} with tags: {tag_names}")

            # Build response with tags
            return TaskResponse(
                id=task.id,
                user_id=task.user_id,
                title=task.title,
                description=task.description,
                completed=task.completed,
                priority=task.priority,
                due_date=task.due_date,
                created_at=task.created_at,
                updated_at=task.updated_at,
                tags=tag_names
            )

        except Exception as e:
            session.rollback()
            logger.error(f"Error creating task for user {user_id}: {str(e)}", exc_info=True)
            raise

    @staticmethod
    def get_task_by_id(
        session: Session,
        task_id: UUID,
        user_id: str
    ) -> Optional[Task]:
        """
        Get a specific task by ID for a user.

        CRITICAL SECURITY: Always validates that the task belongs to the
        requesting user. Returns None if task doesn't exist or belongs to
        another user.

        Args:
            session: Database session
            task_id: Task UUID
            user_id: User ID from JWT token (authenticated user)

        Returns:
            Task: Task if found and belongs to user, None otherwise

        Example:
            task = TaskService.get_task_by_id(
                session=session,
                task_id=UUID("550e8400-e29b-41d4-a716-446655440000"),
                user_id="test-user-123"
            )
        """
        try:
            statement = select(Task).where(
                (Task.id == task_id) & (Task.user_id == user_id)
            )
            task = session.exec(statement).first()

            if task:
                logger.info(f"Retrieved task {task_id} for user {user_id}")
            else:
                logger.info(f"Task {task_id} not found for user {user_id}")

            return task

        except Exception as e:
            logger.error(f"Error retrieving task {task_id} for user {user_id}: {str(e)}")
            raise

    @staticmethod
    def get_user_tasks(
        session: Session,
        user_id: str,
        search: Optional[str] = None,
        completed: Optional[bool] = None,
        priority: Optional[str] = None,
        tags: Optional[List[str]] = None,
        sort_by: Optional[SortBy] = None,
        sort_order: str = "desc",
        limit: int = 50,
        offset: int = 0
    ) -> tuple[List[TaskResponse], int]:
        """
        Get all tasks for a user with optional filtering, sorting, and pagination.

        CRITICAL SECURITY: Always filters by user_id to ensure data isolation.
        Users can only see their own tasks.

        Args:
            session: Database session
            user_id: User ID from JWT token (authenticated user)
            search: Search keyword for title and description (case-insensitive)
            completed: Filter by completion status (None = all tasks)
            priority: Filter by priority level (High, Medium, Low)
            tags: Filter by tag names (tasks must have ALL specified tags)
            sort_by: T076 - Sort field (due_date_soonest, created_newest, etc.)
            sort_order: Legacy sort order - "asc" (oldest first) or "desc" (newest first, default)
            limit: Maximum number of tasks to return (default 50, max 100)
            offset: Number of tasks to skip for pagination (default 0)

        Returns:
            tuple[List[TaskResponse], int]: Tuple of (tasks list with tags, total count)
                - tasks: List of TaskResponse objects for this page (includes tags)
                - total: Total number of tasks matching filter (not limited by pagination)

        Example:
            tasks, total = TaskService.get_user_tasks(
                session=session,
                user_id="test-user-123",
                search="meeting",
                completed=False,
                priority="High",
                tags=["work", "urgent"],
                sort_by=SortBy.DUE_DATE_SOONEST,
                limit=10,
                offset=0
            )
        """
        try:
            # Build base query with user_id filter
            base_query = select(Task).where(Task.user_id == user_id)

            # T057-T060: Apply search filter (case-insensitive keyword search on title and description)
            if search:
                search_pattern = f"%{search}%"
                base_query = base_query.where(
                    (Task.title.ilike(search_pattern)) |
                    (Task.description.ilike(search_pattern))
                )

            # T061: Apply optional completed filter
            if completed is not None:
                base_query = base_query.where(Task.completed == completed)

            # T062: Apply priority filter
            if priority:
                base_query = base_query.where(Task.priority == priority)

            # Apply tags filter (tasks must have ALL specified tags)
            if tags:
                for tag_name in tags:
                    # Subquery to check if task has this tag
                    subquery = (
                        select(TaskTag.task_id)
                        .join(Tag, Tag.id == TaskTag.tag_id)
                        .where(Tag.user_id == user_id)
                        .where(Tag.name == tag_name)
                    )
                    base_query = base_query.where(Task.id.in_(subquery))

            # Count total matching tasks (before pagination)
            count_query = select(func.count()).select_from(base_query.subquery())
            total = session.exec(count_query).one()

            # T077-T081: Apply sorting based on sort_by parameter
            if sort_by == SortBy.DUE_DATE_SOONEST:
                # T077: Sort by due date ascending, nulls last
                base_query = base_query.order_by(
                    nulls_last(Task.due_date.asc())
                )
            elif sort_by == SortBy.CREATED_NEWEST:
                # T078: Sort by creation date descending (newest first)
                base_query = base_query.order_by(Task.created_at.desc())
            elif sort_by == SortBy.CREATED_OLDEST:
                # T079: Sort by creation date ascending (oldest first)
                base_query = base_query.order_by(Task.created_at.asc())
            elif sort_by == SortBy.PRIORITY_HIGH_LOW:
                # T080: Sort by priority (High -> Medium -> Low)
                # Use case() for custom ordering
                priority_order = case(
                    (Task.priority == PriorityType.High, 1),
                    (Task.priority == PriorityType.Medium, 2),
                    (Task.priority == PriorityType.Low, 3),
                    else_=4
                )
                base_query = base_query.order_by(priority_order)
            elif sort_by == SortBy.ALPHABETICAL_AZ:
                # T081: Sort by title alphabetically (A-Z, case-insensitive)
                base_query = base_query.order_by(func.lower(Task.title).asc())
            else:
                # Legacy fallback: sort by created_at based on sort_order parameter
                if sort_order == "asc":
                    base_query = base_query.order_by(Task.created_at.asc())
                else:  # Default to desc (newest first)
                    base_query = base_query.order_by(Task.created_at.desc())

            # Apply pagination
            paginated_query = base_query.offset(offset).limit(limit)
            tasks = session.exec(paginated_query).all()

            # Build TaskResponse objects with tags
            task_responses = []
            for task in tasks:
                # Get tags for this task
                tag_query = (
                    select(Tag.name)
                    .join(TaskTag, Tag.id == TaskTag.tag_id)
                    .where(TaskTag.task_id == task.id)
                )
                task_tag_names = list(session.exec(tag_query).all())

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
                    tags=task_tag_names
                ))

            logger.info(
                f"Retrieved {len(task_responses)} tasks for user {user_id} "
                f"(total: {total}, completed={completed}, priority={priority}, "
                f"tags={tags}, sort={sort_order})"
            )
            return task_responses, total

        except Exception as e:
            logger.error(f"Error retrieving tasks for user {user_id}: {str(e)}")
            raise

    @staticmethod
    def update_task(
        session: Session,
        task_id: UUID,
        user_id: str,
        task_update: TaskUpdate
    ) -> Optional[TaskResponse]:
        """
        Update an existing task including priority, due_date, and tags.

        CRITICAL SECURITY: Validates that the task belongs to the requesting
        user before allowing updates. Returns None if task doesn't exist or
        belongs to another user.

        Args:
            session: Database session
            task_id: Task UUID
            user_id: User ID from JWT token (authenticated user)
            task_update: Task update data (partial updates allowed, including tags)

        Returns:
            TaskResponse: Updated task if found and belongs to user, None otherwise

        Example:
            task = TaskService.update_task(
                session=session,
                task_id=UUID("550e8400-e29b-41d4-a716-446655440000"),
                user_id="test-user-123",
                task_update=TaskUpdate(
                    completed=True,
                    priority="High",
                    tags=["work", "done"]
                )
            )
        """
        try:
            # Get task and verify ownership
            task = TaskService.get_task_by_id(session, task_id, user_id)
            if not task:
                logger.warning(f"Update attempt for non-existent task {task_id} by user {user_id}")
                return None

            # Update only provided fields (except tags, which we handle separately)
            update_data = task_update.model_dump(exclude_unset=True, exclude={"tags"})
            for field, value in update_data.items():
                setattr(task, field, value)

            # Handle tags update if provided
            tag_names = []
            if task_update.tags is not None:  # Explicitly checking for None to allow empty list
                # Delete existing tag associations
                delete_stmt = select(TaskTag).where(TaskTag.task_id == task_id)
                existing_task_tags = session.exec(delete_stmt).all()
                for task_tag in existing_task_tags:
                    session.delete(task_tag)

                # Create new tag associations
                for tag_name in task_update.tags:
                    tag = TagService.create_or_get_tag(session, user_id, tag_name)
                    tag_names.append(tag.name)
                    task_tag = TaskTag(task_id=task_id, tag_id=tag.id)
                    session.add(task_tag)
            else:
                # Tags not being updated, get existing tags
                tag_query = (
                    select(Tag.name)
                    .join(TaskTag, Tag.id == TaskTag.tag_id)
                    .where(TaskTag.task_id == task_id)
                )
                tag_names = list(session.exec(tag_query).all())

            # Update timestamp
            task.updated_at = datetime.utcnow()

            session.add(task)
            session.commit()
            session.refresh(task)

            logger.info(f"Updated task {task_id} for user {user_id} with tags: {tag_names}")

            # Return TaskResponse with tags
            return TaskResponse(
                id=task.id,
                user_id=task.user_id,
                title=task.title,
                description=task.description,
                completed=task.completed,
                priority=task.priority,
                due_date=task.due_date,
                created_at=task.created_at,
                updated_at=task.updated_at,
                tags=tag_names
            )

        except Exception as e:
            session.rollback()
            logger.error(f"Error updating task {task_id} for user {user_id}: {str(e)}")
            raise

    @staticmethod
    def delete_task(
        session: Session,
        task_id: UUID,
        user_id: str
    ) -> bool:
        """
        Delete a task.

        CRITICAL SECURITY: Validates that the task belongs to the requesting
        user before allowing deletion. Returns False if task doesn't exist or
        belongs to another user.

        Args:
            session: Database session
            task_id: Task UUID
            user_id: User ID from JWT token (authenticated user)

        Returns:
            bool: True if task was deleted, False if not found or not owned by user

        Example:
            deleted = TaskService.delete_task(
                session=session,
                task_id=UUID("550e8400-e29b-41d4-a716-446655440000"),
                user_id="test-user-123"
            )
        """
        try:
            # Get task and verify ownership
            task = TaskService.get_task_by_id(session, task_id, user_id)
            if not task:
                logger.warning(f"Delete attempt for non-existent task {task_id} by user {user_id}")
                return False

            session.delete(task)
            session.commit()

            logger.info(f"Deleted task {task_id} for user {user_id}")
            return True

        except Exception as e:
            session.rollback()
            logger.error(f"Error deleting task {task_id} for user {user_id}: {str(e)}")
            raise
