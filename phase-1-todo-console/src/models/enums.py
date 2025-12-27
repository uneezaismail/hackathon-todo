"""Task status enumeration."""

from enum import Enum


class TaskStatus(Enum):
    """Enumeration for task completion status."""

    PENDING = "pending"
    COMPLETED = "completed"
