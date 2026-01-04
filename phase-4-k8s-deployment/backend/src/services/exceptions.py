"""
Custom exception classes for the Todo application.

These exceptions are raised by service layer and handled by
global exception handlers in main.py to return standardized
error responses.
"""


class TaskNotFoundError(Exception):
    """
    Exception raised when a task cannot be found.

    Used for HTTP 404 Not Found responses.

    Args:
        task_id: The ID of the task that was not found

    Example:
        raise TaskNotFoundError(task_id="123")
    """

    def __init__(self, task_id: str):
        self.task_id = task_id
        super().__init__(f"Task with ID '{task_id}' not found")


class UnauthorizedError(Exception):
    """
    Exception raised when a user is not authorized to access a resource.

    Used for HTTP 403 Forbidden responses when user_id validation fails.

    Args:
        message: Human-readable description of the authorization failure

    Example:
        raise UnauthorizedError("Not authorized to access this task")
    """

    def __init__(self, message: str):
        self.message = message
        super().__init__(message)
