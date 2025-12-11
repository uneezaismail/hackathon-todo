"""Unit tests for Task dataclass."""

import pytest

from src.models.enums import TaskStatus
from src.models.task import Task


def test_task_creation_with_valid_data() -> None:
    """Test creating a task with valid data."""
    task = Task(id=1, title="Test Task", description="Test Description", status=TaskStatus.PENDING)

    assert task.id == 1
    assert task.title == "Test Task"
    assert task.description == "Test Description"
    assert task.status == TaskStatus.PENDING


def test_task_creation_with_none_description() -> None:
    """Test creating a task with None description."""
    task = Task(id=2, title="Task Without Description", description=None, status=TaskStatus.PENDING)

    assert task.id == 2
    assert task.title == "Task Without Description"
    assert task.description is None
    assert task.status == TaskStatus.PENDING


def test_task_rejects_empty_title() -> None:
    """Test that task creation raises ValueError for empty title."""
    with pytest.raises(ValueError, match="Title cannot be empty"):
        Task(id=1, title="", description=None, status=TaskStatus.PENDING)


def test_task_rejects_whitespace_only_title() -> None:
    """Test that task creation raises ValueError for whitespace-only title."""
    with pytest.raises(ValueError, match="Title cannot be empty"):
        Task(id=1, title="   ", description=None, status=TaskStatus.PENDING)


def test_task_rejects_zero_id() -> None:
    """Test that task creation raises ValueError for ID of 0."""
    with pytest.raises(ValueError, match="ID must be positive"):
        Task(id=0, title="Valid Title", description=None, status=TaskStatus.PENDING)


def test_task_rejects_negative_id() -> None:
    """Test that task creation raises ValueError for negative ID."""
    with pytest.raises(ValueError, match="ID must be positive"):
        Task(id=-1, title="Valid Title", description=None, status=TaskStatus.PENDING)
