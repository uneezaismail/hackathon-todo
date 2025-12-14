"""
Task service for business logic operations.

Provides CRUD operations for tasks with user isolation and validation.
All operations validate that the user_id from JWT matches the operation.

Security:
- CRITICAL: All operations validate user_id to ensure data isolation
- Users can only access/modify their own tasks
- Database queries always filter by user_id
"""

from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime
from uuid import UUID

from ..models.task import Task, TaskCreate, TaskUpdate
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
    ) -> Task:
        """
        Create a new task for a user.

        CRITICAL SECURITY: The user_id parameter MUST come from the JWT token,
        NOT from the request body. This ensures users can only create tasks
        for themselves.

        Args:
            session: Database session
            user_id: User ID from JWT token (authenticated user)
            task_create: Task creation data (title, description)

        Returns:
            Task: Created task with generated id and timestamps

        Raises:
            HTTPException 500: If database operation fails

        Example:
            task = TaskService.create_task(
                session=session,
                user_id="test-user-123",
                task_create=TaskCreate(title="My task", description="Description")
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
                # created_at and updated_at are set automatically by TimestampMixin
            )

            # Add to database session
            session.add(task)
            session.commit()
            session.refresh(task)

            logger.info(f"Created task {task.id} for user {user_id}")
            return task

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
        completed: Optional[bool] = None,
        sort_order: str = "desc",
        limit: int = 50,
        offset: int = 0
    ) -> tuple[List[Task], int]:
        """
        Get all tasks for a user with optional filtering, sorting, and pagination.

        CRITICAL SECURITY: Always filters by user_id to ensure data isolation.
        Users can only see their own tasks.

        Args:
            session: Database session
            user_id: User ID from JWT token (authenticated user)
            completed: Filter by completion status (None = all tasks)
            sort_order: Sort order - "asc" (oldest first) or "desc" (newest first, default)
            limit: Maximum number of tasks to return (default 50, max 100)
            offset: Number of tasks to skip for pagination (default 0)

        Returns:
            tuple[List[Task], int]: Tuple of (tasks list, total count)
                - tasks: List of tasks for this page
                - total: Total number of tasks matching filter (not limited by pagination)

        Example:
            tasks, total = TaskService.get_user_tasks(
                session=session,
                user_id="test-user-123",
                completed=False,
                sort_order="asc",
                limit=10,
                offset=0
            )
        """
        try:
            # Build base query with user_id filter
            base_query = select(Task).where(Task.user_id == user_id)

            # Apply optional completed filter
            if completed is not None:
                base_query = base_query.where(Task.completed == completed)

            # Count total matching tasks (before pagination)
            from sqlmodel import func, col
            count_statement = select(func.count(col(Task.id))).where(Task.user_id == user_id)
            if completed is not None:
                count_statement = count_statement.where(Task.completed == completed)
            total = session.exec(count_statement).one()

            # Apply sorting based on sort_order parameter
            if sort_order == "asc":
                base_query = base_query.order_by(Task.created_at.asc())
            else:  # Default to desc (newest first)
                base_query = base_query.order_by(Task.created_at.desc())

            # Apply pagination
            paginated_query = base_query.offset(offset).limit(limit)
            tasks = session.exec(paginated_query).all()

            logger.info(
                f"Retrieved {len(tasks)} tasks for user {user_id} "
                f"(total: {total}, completed={completed}, sort={sort_order})"
            )
            return list(tasks), total

        except Exception as e:
            logger.error(f"Error retrieving tasks for user {user_id}: {str(e)}")
            raise

    @staticmethod
    def update_task(
        session: Session,
        task_id: UUID,
        user_id: str,
        task_update: TaskUpdate
    ) -> Optional[Task]:
        """
        Update an existing task.

        CRITICAL SECURITY: Validates that the task belongs to the requesting
        user before allowing updates. Returns None if task doesn't exist or
        belongs to another user.

        Args:
            session: Database session
            task_id: Task UUID
            user_id: User ID from JWT token (authenticated user)
            task_update: Task update data (partial updates allowed)

        Returns:
            Task: Updated task if found and belongs to user, None otherwise

        Example:
            task = TaskService.update_task(
                session=session,
                task_id=UUID("550e8400-e29b-41d4-a716-446655440000"),
                user_id="test-user-123",
                task_update=TaskUpdate(completed=True)
            )
        """
        try:
            # Get task and verify ownership
            task = TaskService.get_task_by_id(session, task_id, user_id)
            if not task:
                logger.warning(f"Update attempt for non-existent task {task_id} by user {user_id}")
                return None

            # Update only provided fields
            update_data = task_update.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(task, field, value)

            # Update timestamp
            task.updated_at = datetime.utcnow()

            session.add(task)
            session.commit()
            session.refresh(task)

            logger.info(f"Updated task {task_id} for user {user_id}")
            return task

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
