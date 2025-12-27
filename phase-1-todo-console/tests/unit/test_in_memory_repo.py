"""Unit tests for InMemoryTaskRepository."""

import pytest

from src.models.enums import TaskStatus
from src.models.task import Task
from src.services.exceptions import TaskNotFoundError
from src.storage.in_memory import InMemoryTaskRepository


def test_add_first_task_generates_id_1() -> None:
    """Test that first task gets ID 1."""
    repo = InMemoryTaskRepository()
    task = repo.add("First Task", None)

    assert task.id == 1
    assert task.title == "First Task"
    assert task.description is None
    assert task.status == TaskStatus.PENDING


def test_add_multiple_tasks_increments_id() -> None:
    """Test that IDs increment correctly (max + 1)."""
    repo = InMemoryTaskRepository()

    task1 = repo.add("Task 1", None)
    task2 = repo.add("Task 2", "Description 2")
    task3 = repo.add("Task 3", None)

    assert task1.id == 1
    assert task2.id == 2
    assert task3.id == 3


def test_add_task_with_description() -> None:
    """Test adding task with description."""
    repo = InMemoryTaskRepository()
    task = repo.add("Task Title", "Task Description")

    assert task.description == "Task Description"


def test_get_all_returns_empty_list_initially() -> None:
    """Test that get_all returns empty list for new repository."""
    repo = InMemoryTaskRepository()
    tasks = repo.get_all()

    assert tasks == []


def test_get_all_returns_tasks_sorted_by_id() -> None:
    """Test that get_all returns tasks sorted by ID."""
    repo = InMemoryTaskRepository()

    repo.add("Task 1", None)
    repo.add("Task 2", None)
    repo.add("Task 3", None)

    tasks = repo.get_all()

    assert len(tasks) == 3
    assert tasks[0].id == 1
    assert tasks[1].id == 2
    assert tasks[2].id == 3


def test_id_sequence_preserved_after_deletion() -> None:
    """Test that ID sequence continues from max historical ID after deletion."""
    repo = InMemoryTaskRepository()

    repo.add("Task 1", None)
    repo.add("Task 2", None)
    repo.add("Task 3", None)

    # Delete task 2
    repo.delete(2)

    # Next task should be ID 4, not 2
    task4 = repo.add("Task 4", None)
    assert task4.id == 4


def test_toggle_completion_pending_to_completed() -> None:
    """Test toggling task from PENDING to COMPLETED."""
    repo = InMemoryTaskRepository()
    task = repo.add("Task 1", None)

    assert task.status == TaskStatus.PENDING

    toggled = repo.toggle_completion(task.id)

    assert toggled.status == TaskStatus.COMPLETED
    assert toggled.id == task.id
    assert toggled.title == task.title


def test_toggle_completion_completed_to_pending() -> None:
    """Test toggling task from COMPLETED back to PENDING."""
    repo = InMemoryTaskRepository()
    task = repo.add("Task 1", None)

    # Toggle to COMPLETED
    repo.toggle_completion(task.id)
    # Toggle back to PENDING
    toggled = repo.toggle_completion(task.id)

    assert toggled.status == TaskStatus.PENDING


def test_toggle_completion_task_not_found() -> None:
    """Test toggling non-existent task raises TaskNotFoundError."""
    repo = InMemoryTaskRepository()

    with pytest.raises(TaskNotFoundError, match="Task with ID 999 not found"):
        repo.toggle_completion(999)


def test_update_task_title_only() -> None:
    """Test updating only task title."""
    repo = InMemoryTaskRepository()
    task = repo.add("Original Title", "Original Description")

    updated = repo.update(task.id, title="New Title", description=None)

    assert updated.id == task.id
    assert updated.title == "New Title"
    assert updated.description == "Original Description"
    assert updated.status == task.status


def test_update_task_description_only() -> None:
    """Test updating only task description."""
    repo = InMemoryTaskRepository()
    task = repo.add("Title", "Original Desc")

    updated = repo.update(task.id, title=None, description="New Desc")

    assert updated.title == "Title"
    assert updated.description == "New Desc"


def test_update_task_both_fields() -> None:
    """Test updating both title and description."""
    repo = InMemoryTaskRepository()
    task = repo.add("Old Title", "Old Desc")

    updated = repo.update(task.id, title="New Title", description="New Desc")

    assert updated.title == "New Title"
    assert updated.description == "New Desc"


def test_update_task_preserves_id_and_status() -> None:
    """Test that update preserves task ID and status."""
    repo = InMemoryTaskRepository()
    task = repo.add("Title", None)
    repo.toggle_completion(task.id)  # Make it COMPLETED

    updated = repo.update(task.id, title="Updated Title", description=None)

    assert updated.id == task.id
    assert updated.status == TaskStatus.COMPLETED  # Status preserved


def test_update_task_not_found() -> None:
    """Test updating non-existent task raises TaskNotFoundError."""
    repo = InMemoryTaskRepository()

    with pytest.raises(TaskNotFoundError, match="Task with ID 999 not found"):
        repo.update(999, title="New Title", description=None)


def test_delete_task_removes_from_list() -> None:
    """Test deleting task removes it from the list."""
    repo = InMemoryTaskRepository()
    task1 = repo.add("Task 1", None)
    task2 = repo.add("Task 2", None)
    task3 = repo.add("Task 3", None)

    repo.delete(task2.id)

    tasks = repo.get_all()
    assert len(tasks) == 2
    assert task1.id in [t.id for t in tasks]
    assert task3.id in [t.id for t in tasks]
    assert task2.id not in [t.id for t in tasks]


def test_delete_task_preserves_id_sequence() -> None:
    """Test that deleting task preserves ID sequence for future adds."""
    repo = InMemoryTaskRepository()
    repo.add("Task 1", None)
    repo.add("Task 2", None)
    repo.add("Task 3", None)

    # Delete task 2
    repo.delete(2)

    # Next added task should get ID 4, not 2
    task4 = repo.add("Task 4", None)
    assert task4.id == 4


def test_delete_task_not_found() -> None:
    """Test deleting non-existent task raises TaskNotFoundError."""
    repo = InMemoryTaskRepository()

    with pytest.raises(TaskNotFoundError, match="Task with ID 999 not found"):
        repo.delete(999)
