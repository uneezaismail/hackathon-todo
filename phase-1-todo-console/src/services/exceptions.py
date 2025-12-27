"""Custom exceptions for the todo application."""


class TodoAppError(Exception):
    """Base exception for all application errors."""

    pass


class TaskNotFoundError(TodoAppError):
    """Raised when task ID doesn't exist."""

    def __init__(self, task_id: int) -> None:
        """Initialize with task ID.

        Args:
            task_id: The ID that was not found
        """
        self.task_id = task_id
        super().__init__(f"Task with ID {task_id} not found")


class InvalidTaskDataError(TodoAppError):
    """Raised when task data validation fails."""

    pass
