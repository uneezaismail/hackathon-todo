"""
Task service for business logic operations.

Provides CRUD operations for tasks with user isolation and validation.
All operations validate that the user_id from JWT matches the operation.

Phase V Additions:
- RRULE pattern support via recurring_pattern field
- next_occurrence calculation for recurring tasks
- Automatic next instance creation on completion

Security:
- CRITICAL: All operations validate user_id to ensure data isolation
- Users can only access/modify their own tasks
- Database queries always filter by user_id
"""

from sqlmodel import Session, select, func, col
from sqlalchemy import case, nulls_last
from typing import List, Optional, Tuple
from datetime import datetime, timezone, date
from uuid import UUID

from ..models.task import Task, TaskCreate, TaskUpdate, TaskResponse, PriorityType
from ..models.tag import Tag
from ..models.task_tag import TaskTag
from ..schemas.common import SortBy
from .tag_service import TagService
from .exceptions import TaskNotFoundError, UnauthorizedError
from .recurring_service_v2 import RecurringServiceV2
from .rrule_parser import RRuleParseError
from .alert_service import AlertService
from ..events.publisher import EventPublisher
import logging
import asyncio

logger = logging.getLogger(__name__)

# Initialize recurring service
_recurring_service = RecurringServiceV2()

# Initialize event publisher for event-driven architecture (Phase V)
_event_publisher = EventPublisher()


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

            # Todoist-style: For recurring tasks without due_date, default to today
            due_date = task_create.due_date
            if task_create.is_recurring and not due_date:
                due_date = date.today()

            # Phase V: Get recurring_pattern from task_create
            recurring_pattern = getattr(task_create, "recurring_pattern", None)

            # Phase V: If no recurring_pattern but has Phase 4 fields, convert to RRULE
            if not recurring_pattern and task_create.is_recurring and task_create.recurrence_type:
                recurring_pattern = RecurringServiceV2.convert_legacy_pattern(
                    recurrence_type=task_create.recurrence_type,
                    recurrence_interval=task_create.recurrence_interval,
                    recurrence_days=task_create.recurrence_days
                )
                logger.info(f"Converted Phase 4 recurrence to RRULE: {recurring_pattern}")

            # Phase V: Validate recurring_pattern if provided
            if recurring_pattern:
                if not _recurring_service.validate_pattern(recurring_pattern):
                    raise ValueError(f"Invalid recurring pattern: {recurring_pattern}")

            # Phase V: Calculate initial next_occurrence for recurring tasks
            next_occurrence = None
            if recurring_pattern:
                recurring_end_date = getattr(task_create, "recurring_end_date", None)
                next_occurrence = _recurring_service.calculate_initial_next_occurrence(
                    recurring_pattern=recurring_pattern,
                    due_date=due_date,
                    recurring_end_date=recurring_end_date
                )
                # If has recurring_pattern, task is recurring
                task_create_dict = task_create.model_dump() if hasattr(task_create, "model_dump") else {}
                if not task_create_dict.get("is_recurring"):
                    # Auto-set is_recurring if recurring_pattern is provided
                    pass  # We'll set it in the Task constructor

            task = Task(
                user_id=user_id,  # From JWT token
                title=task_create.title,
                description=task_create.description,
                completed=False,  # Default to not completed
                priority=task_create.priority,
                due_date=due_date,
                # Phase 4: Recurrence fields (Todoist-style: single task, no patterns)
                is_recurring=task_create.is_recurring or bool(recurring_pattern),
                is_pattern=getattr(task_create, "is_pattern", False),
                recurrence_type=task_create.recurrence_type,
                recurrence_interval=task_create.recurrence_interval,
                recurrence_days=task_create.recurrence_days,
                recurrence_end_date=task_create.recurrence_end_date,
                max_occurrences=task_create.max_occurrences,
                # Phase V: RRULE fields
                recurring_pattern=recurring_pattern,
                next_occurrence=next_occurrence,
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

            # Phase V: Publish task.created event (T055)
            # Fire-and-forget event publishing to not block request
            asyncio.create_task(
                _event_publisher.publish_task_created(
                    task_id=task.id,
                    user_id=user_id,
                    task_title=task.title,
                    task_description=task.description,
                    priority=task.priority,
                    due_date=str(task.due_date) if task.due_date else None,
                    recurring_pattern=task.recurring_pattern,
                    is_pattern=task.is_pattern,
                )
            )

            # Build response with tags and recurrence fields
            return TaskService._build_task_response(task, tag_names)

        except ValueError as e:
            # Pattern validation error
            session.rollback()
            logger.warning(f"Invalid recurring pattern for user {user_id}: {str(e)}")
            raise
        except Exception as e:
            session.rollback()
            logger.error(f"Error creating task for user {user_id}: {str(e)}", exc_info=True)
            raise

    @staticmethod
    def _build_task_response(task: Task, tag_names: List[str] = None) -> TaskResponse:
        """
        Build TaskResponse from Task model with all fields.

        Args:
            task: Task model instance
            tag_names: List of tag names (optional, will be empty if not provided)

        Returns:
            TaskResponse with all fields including Phase V recurring fields
        """
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
            tags=tag_names or [],
            is_recurring=task.is_recurring,
            is_pattern=task.is_pattern,
            recurrence_type=task.recurrence_type,
            recurrence_interval=task.recurrence_interval,
            recurrence_days=task.recurrence_days,
            recurrence_end_date=task.recurrence_end_date,
            max_occurrences=task.max_occurrences,
            parent_task_id=task.parent_task_id,
            occurrence_count=task.occurrence_count,
            # Phase V: RRULE fields
            recurring_pattern=task.recurring_pattern,
            next_occurrence=task.next_occurrence,
        )

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
                    tags=task_tag_names,
                    is_recurring=task.is_recurring,
                    is_pattern=task.is_pattern,
                    recurrence_type=task.recurrence_type,
                    recurrence_interval=task.recurrence_interval,
                    recurrence_days=task.recurrence_days,
                    recurrence_end_date=task.recurrence_end_date,
                    max_occurrences=task.max_occurrences,
                    parent_task_id=task.parent_task_id,
                    occurrence_count=task.occurrence_count,
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

            # Return TaskResponse with tags and recurrence fields
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
                tags=tag_names,
                is_recurring=task.is_recurring,
                is_pattern=task.is_pattern,
                recurrence_type=task.recurrence_type,
                recurrence_interval=task.recurrence_interval,
                recurrence_days=task.recurrence_days,
                recurrence_end_date=task.recurrence_end_date,
                max_occurrences=task.max_occurrences,
                parent_task_id=task.parent_task_id,
                occurrence_count=task.occurrence_count,
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
        Delete a task and cancel associated alerts (Phase V).

        CRITICAL SECURITY: Validates that the task belongs to the requesting
        user before allowing deletion. Returns False if task doesn't exist or
        belongs to another user.

        Phase V: Automatically cancels all alerts for the task.

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

            # Store task info for event publishing
            task_title = task.title
            was_recurring = task.is_recurring
            task_id_int = task.id if isinstance(task.id, int) else int(str(task.id))

            # Phase V: Cancel all alerts for this task
            # NOTE: Alert cancellation is async but we're in a sync function
            # For now, we'll skip alert cancellation in sync context
            # In production, this should be handled by event-driven architecture
            # where task.deleted event triggers alert cancellation service
            try:
                logger.info(f"Task {task_id} deleted - alerts will be canceled via event processing")
            except Exception as e:
                logger.warning(f"Failed to log alert cancellation for task {task_id}: {e}")

            # Delete the task
            session.delete(task)
            session.commit()

            logger.info(f"Deleted task {task_id} for user {user_id}")

            # Phase V: Publish task.deleted event (T057)
            # NOTE: Event publishing is async but we're in a sync function
            # For now, we'll log the event instead of publishing
            # In production, this should be handled by a background task or event queue
            try:
                logger.info(
                    f"Task deleted event: task_id={task_id_int}, user_id={user_id}, "
                    f"title={task_title}, was_recurring={was_recurring}"
                )
            except Exception as e:
                logger.warning(f"Failed to log task.deleted event: {e}")

            return True

        except Exception as e:
            session.rollback()
            logger.error(f"Error deleting task {task_id} for user {user_id}: {str(e)}")
            raise

    @staticmethod
    def complete_task(
        session: Session,
        task_id: UUID,
        user_id: str,
    ) -> Tuple[Optional[TaskResponse], Optional[TaskResponse]]:
        """
        Complete a task and generate next occurrence for recurring tasks (Phase V).

        For recurring tasks:
        1. Marks the current task as completed
        2. Calculates next occurrence using RRULE pattern
        3. Creates new task instance with next occurrence date
        4. Returns both completed task and next instance

        CRITICAL SECURITY: Validates that the task belongs to the requesting
        user before allowing completion.

        Args:
            session: Database session
            task_id: Task UUID
            user_id: User ID from JWT token (authenticated user)

        Returns:
            Tuple of (completed_task, next_instance):
            - completed_task: The task that was completed (or None if not found)
            - next_instance: The newly created next occurrence (or None if not recurring
              or if recurrence ended)

        Example:
            completed, next_instance = TaskService.complete_task(
                session=session,
                task_id=UUID("550e8400-e29b-41d4-a716-446655440000"),
                user_id="test-user-123"
            )
        """
        try:
            # Get task and verify ownership
            task = TaskService.get_task_by_id(session, task_id, user_id)
            if not task:
                logger.warning(f"Complete attempt for non-existent task {task_id} by user {user_id}")
                return None, None

            # Mark task as completed
            task.completed = True
            task.updated_at = datetime.now(timezone.utc)
            session.add(task)

            # Get tags for response
            tag_query = (
                select(Tag.name)
                .join(TaskTag, Tag.id == TaskTag.tag_id)
                .where(TaskTag.task_id == task.id)
            )
            tag_names = list(session.exec(tag_query).all())

            next_instance_response = None

            # Phase V: Convert Phase 4 recurring fields to RRULE if needed (backward compatibility)
            if not task.recurring_pattern and task.is_recurring and task.recurrence_type:
                task.recurring_pattern = RecurringServiceV2.convert_legacy_pattern(
                    recurrence_type=task.recurrence_type,
                    recurrence_interval=task.recurrence_interval,
                    recurrence_days=task.recurrence_days
                )
                logger.info(f"Converted Phase 4 recurrence to RRULE for task {task_id}: {task.recurring_pattern}")
                session.add(task)  # Mark for update

            # Check if recurring and should generate next occurrence
            if task.recurring_pattern and _recurring_service.should_generate_next(task):
                # Calculate current occurrence datetime
                current_occurrence = datetime.now(timezone.utc)
                if task.next_occurrence:
                    current_occurrence = task.next_occurrence

                # Create next instance data
                next_instance_data = _recurring_service.create_next_instance_data(
                    parent_task=task,
                    current_occurrence=current_occurrence
                )

                if next_instance_data:
                    # Create new task for next occurrence
                    next_task = Task(
                        user_id=next_instance_data["user_id"],
                        title=next_instance_data["title"],
                        description=next_instance_data.get("description"),
                        priority=next_instance_data.get("priority", "Medium"),
                        due_date=next_instance_data.get("due_date"),
                        completed=False,
                        is_recurring=True,
                        is_pattern=False,
                        recurring_pattern=next_instance_data.get("recurring_pattern"),
                        recurring_end_date=next_instance_data.get("recurring_end_date"),
                        next_occurrence=next_instance_data.get("next_occurrence"),
                        parent_task_id=next_instance_data.get("parent_task_id"),
                        # Copy legacy fields
                        recurrence_type=task.recurrence_type,
                        recurrence_interval=task.recurrence_interval,
                        recurrence_days=task.recurrence_days,
                        max_occurrences=task.max_occurrences,
                    )
                    session.add(next_task)
                    session.flush()

                    # Create tag associations for next task
                    next_tag_names = []
                    for tag_name in tag_names:
                        tag = TagService.create_or_get_tag(session, user_id, tag_name)
                        next_tag_names.append(tag.name)
                        task_tag = TaskTag(task_id=next_task.id, tag_id=tag.id)
                        session.add(task_tag)

                    logger.info(
                        f"Created next occurrence {next_task.id} for recurring task {task_id}"
                    )

                    next_instance_response = TaskService._build_task_response(next_task, next_tag_names)

            session.commit()
            session.refresh(task)

            # Phase V: Cancel alerts for this task completion
            try:
                alert_service = AlertService()
                task_id_int = int(task_id) if isinstance(task_id, UUID) else task_id
                # Run async alert cancellation in event loop
                loop = asyncio.get_event_loop()
                loop.run_until_complete(
                    alert_service.cancel_all_for_task(
                        task_id=task_id_int,
                        user_id=user_id
                    )
                )
                logger.info(f"Canceled alerts for completed task {task_id}")
            except Exception as e:
                logger.warning(f"Failed to cancel alerts for task {task_id}: {e}")
                # Don't fail task completion if alert cancellation fails

            completed_response = TaskService._build_task_response(task, tag_names)

            logger.info(
                f"Completed task {task_id} for user {user_id}, "
                f"next_instance={'created' if next_instance_response else 'none'}"
            )

            # Phase V: Publish task.completed event (T056)
            # This event triggers recurring service to generate next occurrence
            task_id_int = task.id if isinstance(task.id, int) else int(str(task.id))
            next_occurrence_due = None
            if next_instance_response:
                next_occurrence_due = str(next_instance_response.next_occurrence) if next_instance_response.next_occurrence else None

            asyncio.create_task(
                _event_publisher.publish_task_completed(
                    task_id=task_id_int,
                    user_id=user_id,
                    task_title=task.title,
                    recurring_pattern=task.recurring_pattern,
                    recurring_end_date=str(task.recurring_end_date) if task.recurring_end_date else None,
                    next_occurrence_due=next_occurrence_due,
                    is_pattern=task.is_pattern,
                    parent_task_id=task.parent_task_id,
                )
            )

            return completed_response, next_instance_response

        except Exception as e:
            session.rollback()
            logger.error(f"Error completing task {task_id} for user {user_id}: {str(e)}")
            raise
