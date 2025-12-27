"""Unit tests for TaskService."""

import pytest

from src.models.enums import TaskStatus
from src.services.exceptions import InvalidTaskDataError
from src.services.task_service import TaskService
from src.storage.in_memory import InMemoryTaskRepository


def test_add_task_with_valid_title() -> None:
    """Test adding task with valid title."""
    repo = InMemoryTaskRepository()
    service = TaskService(repo)

    task = service.add_task("Buy groceries", None)

    assert task.id == 1
    assert task.title == "Buy groceries"
    assert task.description is None
    assert task.status == TaskStatus.PENDING


def test_add_task_with_title_and_description() -> None:
    """Test adding task with title and description."""
    repo = InMemoryTaskRepository()
    service = TaskService(repo)

    task = service.add_task("Call dentist", "Schedule annual checkup")

    assert task.id == 1
    assert task.title == "Call dentist"
    assert task.description == "Schedule annual checkup"


def test_add_task_rejects_empty_title() -> None:
    """Test that adding task with empty title raises error."""
    repo = InMemoryTaskRepository()
    service = TaskService(repo)

    with pytest.raises(InvalidTaskDataError, match="Title cannot be empty"):
        service.add_task("", None)


def test_add_task_rejects_whitespace_only_title() -> None:
    """Test that adding task with whitespace-only title raises error."""
    repo = InMemoryTaskRepository()
    service = TaskService(repo)

    with pytest.raises(InvalidTaskDataError, match="Title cannot be empty"):
        service.add_task("   ", None)


def test_get_all_tasks_returns_empty_list_initially() -> None:
    """Test that get_all_tasks returns empty list initially."""
    repo = InMemoryTaskRepository()
    service = TaskService(repo)

    tasks = service.get_all_tasks()

    assert tasks == []


def test_get_all_tasks_returns_all_tasks_sorted() -> None:
    """Test that get_all_tasks returns all tasks sorted by ID."""
    repo = InMemoryTaskRepository()
    service = TaskService(repo)

    service.add_task("Task 1", None)
    service.add_task("Task 2", None)
    service.add_task("Task 3", None)

    tasks = service.get_all_tasks()

    assert len(tasks) == 3
    assert tasks[0].id == 1
    assert tasks[0].title == "Task 1"
    assert tasks[1].id == 2
    assert tasks[2].id == 3


def test_toggle_task_completion_pending_to_completed() -> None:
    """Test toggling task completion from PENDING to COMPLETED."""
    repo = InMemoryTaskRepository()
    service = TaskService(repo)

    task = service.add_task("Task 1", None)
    assert task.status == TaskStatus.PENDING

    toggled = service.toggle_task_completion(task.id)

    assert toggled.status == TaskStatus.COMPLETED
    assert toggled.id == task.id


def test_toggle_task_completion_completed_to_pending() -> None:
    """Test toggling task completion from COMPLETED back to PENDING."""
    repo = InMemoryTaskRepository()
    service = TaskService(repo)

    task = service.add_task("Task 1", None)
    service.toggle_task_completion(task.id)  # PENDING -> COMPLETED
    toggled = service.toggle_task_completion(task.id)  # COMPLETED -> PENDING

    assert toggled.status == TaskStatus.PENDING


def test_toggle_task_completion_raises_error_for_invalid_id() -> None:
    """Test that toggling non-existent task raises TaskNotFoundError."""
    repo = InMemoryTaskRepository()
    service = TaskService(repo)

    from src.services.exceptions import TaskNotFoundError

    with pytest.raises(TaskNotFoundError, match="Task with ID 999 not found"):
        service.toggle_task_completion(999)


def test_update_task_title_only() -> None:
    """Test updating only task title through service."""
    repo = InMemoryTaskRepository()
    service = TaskService(repo)
    task = service.add_task("Original Title", "Original Desc")

    updated = service.update_task(task.id, title="New Title", description=None)

    assert updated.title == "New Title"
    assert updated.description == "Original Desc"


def test_update_task_description_only() -> None:
    """Test updating only task description through service."""
    repo = InMemoryTaskRepository()
    service = TaskService(repo)
    task = service.add_task("Title", "Original Desc")

    updated = service.update_task(task.id, title=None, description="New Desc")

    assert updated.title == "Title"
    assert updated.description == "New Desc"


def test_update_task_both_title_and_description() -> None:
    """Test updating both title and description through service."""
    repo = InMemoryTaskRepository()
    service = TaskService(repo)
    task = service.add_task("Old Title", "Old Desc")

    updated = service.update_task(task.id, title="New Title", description="New Desc")

    assert updated.title == "New Title"
    assert updated.description == "New Desc"


def test_update_task_rejects_empty_title() -> None:
    """Test that updating with empty title raises InvalidTaskDataError."""
    repo = InMemoryTaskRepository()
    service = TaskService(repo)
    task = service.add_task("Original Title", None)

    with pytest.raises(InvalidTaskDataError, match="Title cannot be empty"):
        service.update_task(task.id, title="", description=None)


def test_update_task_rejects_whitespace_only_title() -> None:
    """Test that updating with whitespace-only title raises error."""
    repo = InMemoryTaskRepository()
    service = TaskService(repo)
    task = service.add_task("Original Title", None)

    with pytest.raises(InvalidTaskDataError, match="Title cannot be empty"):
        service.update_task(task.id, title="   ", description=None)


def test_update_task_not_found() -> None:
    """Test that updating non-existent task raises TaskNotFoundError."""
    repo = InMemoryTaskRepository()
    service = TaskService(repo)

    from src.services.exceptions import TaskNotFoundError

    with pytest.raises(TaskNotFoundError, match="Task with ID 999 not found"):
        service.update_task(999, title="New Title", description=None)


def test_delete_task_removes_task() -> None:
    """Test deleting task through service."""
    repo = InMemoryTaskRepository()
    service = TaskService(repo)
    task1 = service.add_task("Task 1", None)
    task2 = service.add_task("Task 2", None)

    service.delete_task(task1.id)

    tasks = service.get_all_tasks()
    assert len(tasks) == 1
    assert tasks[0].id == task2.id


def test_delete_task_not_found() -> None:
    """Test that deleting non-existent task raises TaskNotFoundError."""
    repo = InMemoryTaskRepository()
    service = TaskService(repo)

    from src.services.exceptions import TaskNotFoundError

    with pytest.raises(TaskNotFoundError, match="Task with ID 999 not found"):
        service.delete_task(999)
