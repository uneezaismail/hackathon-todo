"""Task repository protocol (interface)."""

from typing import Protocol

from src.models.task import Task


class TaskRepository(Protocol):
    """Abstract interface for task storage operations.

    This protocol enables storage implementation swapping (e.g., in-memory → database).
    """

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
        ...

    def get_all(self) -> list[Task]:
        """Get all tasks sorted by ID in ascending order.

        Returns:
            List of all tasks sorted by ID
        """
        ...

    def get_by_id(self, task_id: int) -> Task | None:
        """Get task by ID.

        Args:
            task_id: Task ID to retrieve

        Returns:
            Task if found, None otherwise
        """
        ...

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
        ...

    def delete(self, task_id: int) -> None:
        """Permanently delete task.

        Args:
            task_id: Task ID to delete

        Raises:
            TaskNotFoundError: If task ID doesn't exist
        """
        ...

    def toggle_completion(self, task_id: int) -> Task:
        """Toggle task status between PENDING and COMPLETED.

        Args:
            task_id: Task ID to toggle

        Returns:
            Updated Task with toggled status

        Raises:
            TaskNotFoundError: If task ID doesn't exist
        """
        ...
