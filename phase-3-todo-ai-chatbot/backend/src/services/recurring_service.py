"""
Recurring Task Service for Phase 4.

Provides functionality for managing recurring tasks:
- Calculate next due date based on recurrence pattern
- Generate next occurrence when task is completed
- Validate recurrence rules (end date, max occurrences)

Recurrence patterns supported:
- daily: Every N days
- weekly: Every N weeks on specific days (mon, tue, wed, etc.)
- monthly: Every N months on the same day
- yearly: Every N years on the same day
"""

from datetime import date, timedelta
from typing import Optional, Tuple
from sqlmodel import Session
import uuid
import logging

from ..models.task import Task, TaskCreate, TaskUpdate, TaskResponse, RecurrenceType
from ..models.tag import Tag
from ..models.task_tag import TaskTag
from .tag_service import TagService

logger = logging.getLogger(__name__)


# Day name to weekday number mapping (Monday=0, Sunday=6)
DAY_TO_WEEKDAY = {
    "mon": 0, "monday": 0,
    "tue": 1, "tuesday": 1,
    "wed": 2, "wednesday": 2,
    "thu": 3, "thursday": 3,
    "fri": 4, "friday": 4,
    "sat": 5, "saturday": 5,
    "sun": 6, "sunday": 6,
}


class RecurringService:
    """
    Service class for recurring task operations.

    Handles calculation of next due dates and generation of recurring task instances.
    All methods are stateless and work with task data passed as parameters.
    """

    @staticmethod
    def parse_recurrence_days(days_str: Optional[str]) -> list[int]:
        """
        Parse recurrence_days string to list of weekday numbers.

        Args:
            days_str: Comma-separated day names (e.g., "mon,wed,fri")

        Returns:
            List of weekday numbers (0=Monday, 6=Sunday), sorted
        """
        if not days_str:
            return []

        weekdays = []
        for day in days_str.lower().split(","):
            day = day.strip()
            if day in DAY_TO_WEEKDAY:
                weekdays.append(DAY_TO_WEEKDAY[day])

        return sorted(set(weekdays))

    @staticmethod
    def calculate_next_due_date(task: Task) -> Optional[date]:
        """
        Calculate the next due date based on recurrence pattern.

        Args:
            task: Task with recurrence configuration

        Returns:
            Next due date, or None if recurrence should stop
        """
        if not task.is_recurring or not task.recurrence_type:
            return None

        if not task.due_date:
            # No current due date, start from today
            current_date = date.today()
        else:
            current_date = task.due_date

        interval = task.recurrence_interval or 1
        recurrence_type = task.recurrence_type

        next_date: Optional[date] = None

        if recurrence_type == RecurrenceType.daily:
            # Daily: Add N days
            next_date = current_date + timedelta(days=interval)

        elif recurrence_type == RecurrenceType.weekly:
            # Weekly: Add N weeks, or find next specified day
            recurrence_days = RecurringService.parse_recurrence_days(task.recurrence_days)

            if not recurrence_days:
                # No specific days, just add N weeks
                next_date = current_date + timedelta(weeks=interval)
            else:
                # Find the next occurrence day
                next_date = RecurringService._find_next_weekly_date(
                    current_date, recurrence_days, interval
                )

        elif recurrence_type == RecurrenceType.monthly:
            # Monthly: Same day, N months later
            next_date = RecurringService._add_months(current_date, interval)

        elif recurrence_type == RecurrenceType.yearly:
            # Yearly: Same day, N years later
            next_date = RecurringService._add_years(current_date, interval)

        # Check if next date exceeds end date
        if next_date and task.recurrence_end_date:
            if next_date > task.recurrence_end_date:
                logger.info(
                    f"Task {task.id}: Next date {next_date} exceeds end date {task.recurrence_end_date}"
                )
                return None

        return next_date

    @staticmethod
    def _find_next_weekly_date(
        current_date: date,
        recurrence_days: list[int],
        interval: int
    ) -> date:
        """
        Find the next occurrence date for weekly recurrence with specific days.

        Args:
            current_date: Current due date
            recurrence_days: List of weekday numbers (0=Monday)
            interval: Number of weeks between occurrences

        Returns:
            Next occurrence date
        """
        current_weekday = current_date.weekday()

        # First, check if there's a later day in the same week
        for day in recurrence_days:
            if day > current_weekday:
                return current_date + timedelta(days=(day - current_weekday))

        # Otherwise, go to the first day of the next interval week
        days_to_next_monday = 7 - current_weekday
        days_to_skip = days_to_next_monday + (interval - 1) * 7
        next_week_start = current_date + timedelta(days=days_to_skip)

        # Find the first recurrence day in that week
        first_day = min(recurrence_days)
        return next_week_start + timedelta(days=first_day)

    @staticmethod
    def _add_months(d: date, months: int) -> date:
        """
        Add N months to a date, handling month-end edge cases.

        Args:
            d: Starting date
            months: Number of months to add

        Returns:
            New date N months later
        """
        new_month = d.month + months
        new_year = d.year + (new_month - 1) // 12
        new_month = (new_month - 1) % 12 + 1

        # Handle day overflow (e.g., Jan 31 + 1 month)
        import calendar
        max_day = calendar.monthrange(new_year, new_month)[1]
        new_day = min(d.day, max_day)

        return date(new_year, new_month, new_day)

    @staticmethod
    def _add_years(d: date, years: int) -> date:
        """
        Add N years to a date, handling leap year edge cases.

        Args:
            d: Starting date
            years: Number of years to add

        Returns:
            New date N years later
        """
        new_year = d.year + years

        # Handle Feb 29 on non-leap years
        import calendar
        if d.month == 2 and d.day == 29:
            if not calendar.isleap(new_year):
                return date(new_year, 2, 28)

        return date(new_year, d.month, d.day)

    @staticmethod
    def should_generate_next(task: Task, session: Optional[Session] = None) -> bool:
        """
        Check if the next occurrence should be generated.

        Args:
            task: Task to check
            session: Database session (needed to check parent's occurrence_count)

        Returns:
            True if next occurrence should be generated
        """
        if not task.is_recurring or not task.recurrence_type:
            return False

        # Check max_occurrences limit
        # max_occurrences = total number of tasks (original + generated instances)
        # occurrence_count = number of times we've generated a new instance
        # So if max_occurrences=3, we want: original + 2 generated = 3 total
        # We should stop when occurrence_count >= max_occurrences - 1
        if task.max_occurrences is not None:
            # Get the actual occurrence count from the parent task
            # If this is an instance, get from parent; if this is parent, use own count
            occurrence_count = task.occurrence_count
            if task.parent_task_id and session:
                parent_task = session.get(Task, task.parent_task_id)
                if parent_task:
                    occurrence_count = parent_task.occurrence_count

            # Stop if we've already generated (max_occurrences - 1) instances
            # because original + (max-1) generated = max total tasks
            if occurrence_count >= task.max_occurrences - 1:
                logger.info(
                    f"Task {task.id}: Max occurrences ({task.max_occurrences}) reached "
                    f"(generated count: {occurrence_count}, max-1={task.max_occurrences - 1})"
                )
                return False

        # Check end date
        next_date = RecurringService.calculate_next_due_date(task)
        if next_date is None:
            return False

        return True

    @staticmethod
    def generate_next_occurrence(
        session: Session,
        task: Task,
        user_id: str
    ) -> Optional[TaskResponse]:
        """
        Generate the next occurrence of a recurring task.

        Creates a new task with:
        - Same title, description, priority, tags
        - New due date calculated from recurrence pattern
        - Reference to parent task (original recurring pattern)
        - Incremented occurrence count on parent

        Args:
            session: Database session
            task: Completed recurring task
            user_id: User ID for security validation

        Returns:
            New TaskResponse if generated, None if recurrence complete
        """
        if not RecurringService.should_generate_next(task, session):
            return None

        next_due_date = RecurringService.calculate_next_due_date(task)
        if not next_due_date:
            return None

        try:
            # Determine parent task ID
            # If this task has a parent, use that; otherwise this is the parent
            parent_id = task.parent_task_id if task.parent_task_id else task.id

            # Create new task instance
            new_task = Task(
                user_id=user_id,
                title=task.title,
                description=task.description,
                completed=False,
                priority=task.priority,
                due_date=next_due_date,
                # Copy recurrence configuration
                is_recurring=True,
                is_pattern=False,  # Instances are never patterns
                recurrence_type=task.recurrence_type,
                recurrence_interval=task.recurrence_interval,
                recurrence_days=task.recurrence_days,
                recurrence_end_date=task.recurrence_end_date,
                max_occurrences=task.max_occurrences,
                parent_task_id=parent_id,
                occurrence_count=0,  # Instance count, not pattern count
            )

            session.add(new_task)
            session.flush()  # Get new_task.id

            # Copy tags from original task
            tag_query = (
                session.query(Tag.id, Tag.name)
                .join(TaskTag, Tag.id == TaskTag.tag_id)
                .filter(TaskTag.task_id == task.id)
            )
            tag_names = []
            for tag_id, tag_name in tag_query.all():
                task_tag = TaskTag(task_id=new_task.id, tag_id=tag_id)
                session.add(task_tag)
                tag_names.append(tag_name)

            # Increment occurrence count on the parent task
            if task.parent_task_id:
                # This is an instance, update the parent
                parent_task = session.get(Task, task.parent_task_id)
                if parent_task:
                    parent_task.occurrence_count += 1
                    session.add(parent_task)
            else:
                # This is the parent itself
                task.occurrence_count += 1
                session.add(task)

            session.commit()
            session.refresh(new_task)

            logger.info(
                f"Generated next occurrence for task {task.id}: "
                f"new task {new_task.id} with due date {next_due_date}"
            )

            # Build response
            return TaskResponse(
                id=new_task.id,
                user_id=new_task.user_id,
                title=new_task.title,
                description=new_task.description,
                completed=new_task.completed,
                priority=new_task.priority,
                due_date=new_task.due_date,
                created_at=new_task.created_at,
                updated_at=new_task.updated_at,
                tags=tag_names,
                is_recurring=new_task.is_recurring,
                is_pattern=new_task.is_pattern,
                recurrence_type=new_task.recurrence_type,
                recurrence_interval=new_task.recurrence_interval,
                recurrence_days=new_task.recurrence_days,
                recurrence_end_date=new_task.recurrence_end_date,
                max_occurrences=new_task.max_occurrences,
                parent_task_id=new_task.parent_task_id,
                occurrence_count=new_task.occurrence_count,
            )

        except Exception as e:
            session.rollback()
            logger.error(f"Error generating next occurrence for task {task.id}: {e}")
            raise

    @staticmethod
    def complete_recurring_task(
        session: Session,
        task: Task,
        user_id: str
    ) -> Tuple[TaskResponse, Optional[TaskResponse]]:
        """
        Complete a recurring task using Todoist-style approach.

        TODOIST-STYLE MODEL:
        - Single task with shifting due_date
        - When completed: reset completed=false, shift due_date to next occurrence
        - Same task continues forever (no new instances created)
        - Increment occurrence_count to track completions

        Args:
            session: Database session
            task: Task to complete
            user_id: User ID for security validation

        Returns:
            Tuple of (completed task response, next occurrence response or None)
            Note: In Todoist-style, both responses refer to the SAME task
        """
        from sqlmodel import select
        from datetime import datetime

        try:
            # Get tags for the task
            tag_query = (
                select(Tag.name)
                .join(TaskTag, Tag.id == TaskTag.tag_id)
                .where(TaskTag.task_id == task.id)
            )
            tag_names = list(session.exec(tag_query).all())

            if task.is_recurring:
                # TODOIST-STYLE: Shift due_date instead of creating new instance
                logger.info(f"Todoist-style: Completing recurring task {task.id}, shifting due_date")

                # Calculate next due date
                next_due_date = RecurringService.calculate_next_due_date(task)

                # Check if we should continue recurring
                should_continue = RecurringService.should_generate_next(task, session)

                if should_continue and next_due_date:
                    # Shift due_date to next occurrence (keep task active)
                    old_due_date = task.due_date
                    task.due_date = next_due_date
                    task.completed = False  # Reset to pending for next occurrence
                    task.occurrence_count += 1  # Track total completions
                    task.updated_at = datetime.utcnow()
                    session.add(task)
                    session.commit()
                    session.refresh(task)

                    logger.info(
                        f"Task {task.id}: Shifted due_date from {old_due_date} to {next_due_date}, "
                        f"occurrence #{task.occurrence_count}"
                    )

                    # Build response - same task with new due_date
                    task_response = TaskResponse(
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

                    # Return same task for both (Todoist-style: single task model)
                    return task_response, task_response

                else:
                    # Recurrence ended (max_occurrences or end_date reached)
                    # Mark as completed and stop recurrence
                    logger.info(f"Task {task.id}: Recurrence ended, marking as completed")
                    task.completed = True
                    task.is_recurring = False  # Stop future recurrence
                    task.occurrence_count += 1
                    task.updated_at = datetime.utcnow()
                    session.add(task)
                    session.commit()
                    session.refresh(task)

                    completed_response = TaskResponse(
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

                    return completed_response, None

            else:
                # Non-recurring task: just mark as completed
                logger.info(f"Completing non-recurring task {task.id}")
                task.completed = True
                task.updated_at = datetime.utcnow()
                session.add(task)
                session.commit()
                session.refresh(task)

                completed_response = TaskResponse(
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

                return completed_response, None

        except Exception as e:
            session.rollback()
            logger.error(f"Error completing recurring task {task.id}: {e}")
            raise

    @staticmethod
    def skip_occurrence(
        session: Session,
        task: Task,
        user_id: str
    ) -> Tuple[TaskResponse, Optional[TaskResponse]]:
        """
        Skip the current occurrence using Todoist-style approach.

        TODOIST-STYLE: Shift due_date to next occurrence without marking as "completed".
        The task stays pending but moves to the next date.

        Args:
            session: Database session
            task: Task to skip
            user_id: User ID for security validation

        Returns:
            Tuple of (skipped task response, next occurrence response or None)
        """
        from sqlmodel import select
        from datetime import datetime

        try:
            # Get tags for the task
            tag_query = (
                select(Tag.name)
                .join(TaskTag, Tag.id == TaskTag.tag_id)
                .where(TaskTag.task_id == task.id)
            )
            tag_names = list(session.exec(tag_query).all())

            if task.is_recurring:
                # TODOIST-STYLE: Just shift due_date (don't mark completed)
                next_due_date = RecurringService.calculate_next_due_date(task)
                should_continue = RecurringService.should_generate_next(task, session)

                if should_continue and next_due_date:
                    old_due_date = task.due_date
                    task.due_date = next_due_date
                    # Don't increment occurrence_count for skips (wasn't completed)
                    task.updated_at = datetime.utcnow()
                    session.add(task)
                    session.commit()
                    session.refresh(task)

                    logger.info(f"Skipped task {task.id}: shifted due_date from {old_due_date} to {next_due_date}")

                    task_response = TaskResponse(
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

                    return task_response, task_response
                else:
                    # Recurrence ended
                    logger.info(f"Skip: Task {task.id} recurrence ended")
                    task.completed = True
                    task.is_recurring = False
                    task.updated_at = datetime.utcnow()
                    session.add(task)
                    session.commit()
                    session.refresh(task)

                    task_response = TaskResponse(
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

                    return task_response, None
            else:
                # Non-recurring task: just mark as completed
                task.completed = True
                task.updated_at = datetime.utcnow()
                session.add(task)
                session.commit()
                session.refresh(task)

                task_response = TaskResponse(
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

                return task_response, None

        except Exception as e:
            session.rollback()
            logger.error(f"Error skipping task {task.id}: {e}")
            raise

    @staticmethod
    def stop_recurrence(
        session: Session,
        task: Task,
        user_id: str
    ) -> TaskResponse:
        """
        Stop recurrence for a task, preserving the task and history.

        Sets is_recurring=False to prevent future occurrence generation.
        The task and all existing occurrences are preserved.

        Args:
            session: Database session
            task: Task to stop recurrence for
            user_id: User ID for security validation

        Returns:
            Updated TaskResponse with is_recurring=False
        """
        from sqlmodel import select

        try:
            # Stop recurrence
            task.is_recurring = False
            session.add(task)

            # Get tags for the task
            tag_query = (
                select(Tag.name)
                .join(TaskTag, Tag.id == TaskTag.tag_id)
                .where(TaskTag.task_id == task.id)
            )
            tag_names = list(session.exec(tag_query).all())

            session.commit()
            session.refresh(task)

            logger.info(f"Stopped recurrence for task {task.id}")

            # Build response
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
            logger.error(f"Error stopping recurrence for task {task.id}: {e}")
            raise

    @staticmethod
    def update_series(
        session: Session,
        task: Task,
        task_update: TaskUpdate,
        user_id: str
    ) -> TaskResponse:
        """
        Update all future instances of a recurring task series.

        Updates:
        - The current task
        - All future (uncompleted) instances with the same parent_task_id
        - The parent task if this is an instance

        Only updates non-completed tasks to preserve history.

        Args:
            session: Database session
            task: Task to update (can be parent or instance)
            task_update: Fields to update
            user_id: User ID for security validation

        Returns:
            TaskResponse of the updated task
        """
        from sqlmodel import select
        from datetime import datetime

        try:
            # Determine the parent task ID for finding all instances
            if task.parent_task_id:
                # This is an instance, get the parent
                parent_id = task.parent_task_id
            else:
                # This is the parent
                parent_id = task.id

            # Get all uncompleted tasks in the series (parent + instances)
            series_query = select(Task).where(
                (Task.user_id == user_id) &
                (Task.completed == False) &
                (
                    (Task.id == parent_id) |
                    (Task.parent_task_id == parent_id)
                )
            )
            series_tasks = list(session.exec(series_query).all())

            # Prepare update data (exclude tags which need special handling)
            update_data = task_update.model_dump(exclude_unset=True, exclude={"tags"})

            # Update all tasks in series
            for series_task in series_tasks:
                for field, value in update_data.items():
                    setattr(series_task, field, value)
                series_task.updated_at = datetime.utcnow()
                session.add(series_task)

            # Handle tags update if provided
            tag_names = []
            if task_update.tags is not None:
                for series_task in series_tasks:
                    # Delete existing tag associations
                    delete_stmt = select(TaskTag).where(TaskTag.task_id == series_task.id)
                    existing_task_tags = session.exec(delete_stmt).all()
                    for task_tag in existing_task_tags:
                        session.delete(task_tag)

                    # Create new tag associations
                    for tag_name in task_update.tags:
                        tag = TagService.create_or_get_tag(session, user_id, tag_name)
                        if series_task.id == task.id:
                            tag_names.append(tag.name)
                        task_tag = TaskTag(task_id=series_task.id, tag_id=tag.id)
                        session.add(task_tag)
            else:
                # Tags not being updated, get existing tags for response
                tag_query = (
                    select(Tag.name)
                    .join(TaskTag, Tag.id == TaskTag.tag_id)
                    .where(TaskTag.task_id == task.id)
                )
                tag_names = list(session.exec(tag_query).all())

            session.commit()
            session.refresh(task)

            logger.info(
                f"Updated {len(series_tasks)} tasks in series for parent {parent_id}"
            )

            # Build response for the originally requested task
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
            logger.error(f"Error updating series for task {task.id}: {e}")
            raise
