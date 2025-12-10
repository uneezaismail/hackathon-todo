"""Pytest fixtures for testing."""

import pytest

from src.models.enums import TaskStatus
from src.models.task import Task
from src.services.task_service import TaskService
from src.storage.in_memory import InMemoryTaskRepository


@pytest.fixture
def sample_tasks() -> list[Task]:
    """Fixture providing sample tasks for testing.

    Returns:
        List of sample Task objects
    """
    return [
        Task(id=1, title="Buy groceries", description="Milk, eggs, bread", status=TaskStatus.PENDING),
        Task(id=2, title="Call dentist", description=None, status=TaskStatus.COMPLETED),
        Task(id=3, title="Review PR", description="Check code quality", status=TaskStatus.PENDING),
    ]


@pytest.fixture
def in_memory_repo() -> InMemoryTaskRepository:
    """Fixture providing fresh InMemoryTaskRepository instance.

    Returns:
        Empty InMemoryTaskRepository
    """
    return InMemoryTaskRepository()


@pytest.fixture
def task_service(in_memory_repo: InMemoryTaskRepository) -> TaskService:
    """Fixture providing TaskService with fresh repository.

    Args:
        in_memory_repo: Fresh repository from fixture

    Returns:
        TaskService instance
    """
    return TaskService(in_memory_repo)
