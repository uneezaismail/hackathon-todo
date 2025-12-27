"""In-memory implementation of TaskRepository."""

from src.models.enums import TaskStatus
from src.models.task import Task
from src.services.exceptions import InvalidTaskDataError, TaskNotFoundError


class InMemoryTaskRepository:
    """In-memory task storage using a Python list.

    Implements the TaskRepository protocol for Phase I (in-memory).
    Can be swapped with DatabaseTaskRepository in Phase II.
    """

    def __init__(self) -> None:
        """Initialize empty task storage."""
        self._tasks: list[Task] = []
        self._max_id: int = 0

    def add(self, title: str, description: str | None = None) -> Task:
        """Add new task with auto-generated ID.

        Args:
            title: Task title (must be non-empty)
            description: Optional task description

        Returns:
            Newly created Task with generated ID

        Raises:
            InvalidTaskDataError: If title is empty
        """
        if not title.strip():
            raise InvalidTaskDataError("Title cannot be empty")

        # Generate next ID (max + 1, starting from 1)
        next_id = self._max_id + 1
        self._max_id = next_id

        # Create new task
        task = Task(
            id=next_id,
            title=title,
            description=description,
            status=TaskStatus.PENDING,
        )

        self._tasks.append(task)
        return task

    def get_all(self) -> list[Task]:
        """Get all tasks sorted by ID in ascending order.

        Returns:
            List of all tasks sorted by ID
        """
        return sorted(self._tasks, key=lambda t: t.id)

    def get_by_id(self, task_id: int) -> Task | None:
        """Get task by ID.

        Args:
            task_id: Task ID to retrieve

        Returns:
            Task if found, None otherwise
        """
        for task in self._tasks:
            if task.id == task_id:
                return task
        return None

    def update(
        self,
        task_id: int,
        title: str | None = None,
        description: str | None = None,
    ) -> Task:
        """Update task fields (None means no change).

        Args:
            task_id: Task ID to update
            title: New title (None = no change)
            description: New description (None = no change)

        Returns:
            Updated Task

        Raises:
            TaskNotFoundError: If task ID doesn't exist
            InvalidTaskDataError: If title is empty
        """
        task = self.get_by_id(task_id)
        if task is None:
            raise TaskNotFoundError(task_id)

        # Validate new title if provided
        if title is not None and not title.strip():
            raise InvalidTaskDataError("Title cannot be empty")

        # Update fields (None means no change)
        if title is not None:
            task.title = title
        if description is not None:
            task.description = description

        return task

    def delete(self, task_id: int) -> None:
        """Permanently delete task.

        Args:
            task_id: Task ID to delete

        Raises:
            TaskNotFoundError: If task ID doesn't exist
        """
        task = self.get_by_id(task_id)
        if task is None:
            raise TaskNotFoundError(task_id)

        self._tasks.remove(task)
        # Note: _max_id is NOT reset, preserving ID sequence

    def toggle_completion(self, task_id: int) -> Task:
        """Toggle task status between PENDING and COMPLETED.

        Args:
            task_id: Task ID to toggle

        Returns:
            Updated Task with toggled status

        Raises:
            TaskNotFoundError: If task ID doesn't exist
        """
        task = self.get_by_id(task_id)
        if task is None:
            raise TaskNotFoundError(task_id)

        # Toggle status
        if task.status == TaskStatus.PENDING:
            task.status = TaskStatus.COMPLETED
        else:
            task.status = TaskStatus.PENDING

        return task
