"""Business logic layer for task operations."""

from src.models.task import Task
from src.services.exceptions import InvalidTaskDataError, TaskNotFoundError
from src.storage.repository import TaskRepository


class TaskService:
    """Business logic for task management.

    Coordinates between CLI and repository, handles validation and error handling.
    """

    def __init__(self, repository: TaskRepository) -> None:
        """Initialize service with repository.

        Args:
            repository: Task storage implementation (injected)
        """
        self._repository = repository

    def add_task(self, title: str, description: str | None = None) -> Task:
        """Add new task with validation.

        Args:
            title: Task title (must be non-empty)
            description: Optional task description

        Returns:
            Newly created Task

        Raises:
            InvalidTaskDataError: If title is empty
        """
        # Validate title
        if not title.strip():
            raise InvalidTaskDataError("Title cannot be empty")

        # Delegate to repository
        return self._repository.add(title, description)

    def get_all_tasks(self) -> list[Task]:
        """Get all tasks sorted by ID.

        Returns:
            List of all tasks sorted by ID
        """
        return self._repository.get_all()

    def update_task(
        self,
        task_id: int,
        title: str | None = None,
        description: str | None = None,
    ) -> Task:
        """Update task fields.

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
        return self._repository.update(task_id, title, description)

    def delete_task(self, task_id: int) -> None:
        """Delete task permanently.

        Args:
            task_id: Task ID to delete

        Raises:
            TaskNotFoundError: If task ID doesn't exist
        """
        self._repository.delete(task_id)

    def toggle_task_completion(self, task_id: int) -> Task:
        """Toggle task completion status.

        Args:
            task_id: Task ID to toggle

        Returns:
            Updated Task

        Raises:
            TaskNotFoundError: If task ID doesn't exist
        """
        return self._repository.toggle_completion(task_id)
