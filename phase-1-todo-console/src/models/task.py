"""Task domain model."""

from dataclasses import dataclass

from .enums import TaskStatus


@dataclass
class Task:
    """Represents a single todo item.

    Attributes:
        id: Unique auto-generated task identifier (positive integer)
        title: Task title (required, non-empty after stripping)
        description: Optional task details (can be None or empty string)
        status: Current completion status (PENDING or COMPLETED)
    """

    id: int
    title: str
    description: str | None
    status: TaskStatus

    def __post_init__(self) -> None:
        """Validate task data after initialization.

        Raises:
            ValueError: If title is empty or ID is not positive
        """
        if not self.title.strip():
            raise ValueError("Title cannot be empty")
        if self.id <= 0:
            raise ValueError("ID must be positive")
