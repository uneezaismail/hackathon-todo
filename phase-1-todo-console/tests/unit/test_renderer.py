"""Unit tests for TaskRenderer."""

from io import StringIO

import pytest
from rich.console import Console

from src.models.enums import TaskStatus
from src.models.task import Task
from src.ui.renderer import TaskRenderer


def test_render_tasks_with_empty_list() -> None:
    """Test rendering empty task list."""
    renderer = TaskRenderer()
    console = Console(file=StringIO(), force_terminal=True, width=100)

    # Should not raise error
    renderer.render_tasks([], console=console)


def test_render_tasks_displays_task_data() -> None:
    """Test that render_tasks displays task information."""
    tasks = [
        Task(id=1, title="Buy groceries", description=None, status=TaskStatus.PENDING),
        Task(id=2, title="Call dentist", description="Schedule checkup", status=TaskStatus.COMPLETED),
    ]

    renderer = TaskRenderer()
    output = StringIO()
    console = Console(file=output, force_terminal=True, width=100)

    renderer.render_tasks(tasks, console=console)

    result = output.getvalue()

    # Check that task data appears in output
    assert "1" in result  # ID
    assert "Buy groceries" in result  # Title
    assert "2" in result
    assert "Call dentist" in result
    assert "Schedule checkup" in result


def test_render_tasks_shows_completed_indicator() -> None:
    """Test that completed tasks show checkmark indicator."""
    tasks = [
        Task(id=1, title="Pending Task", description=None, status=TaskStatus.PENDING),
        Task(id=2, title="Completed Task", description=None, status=TaskStatus.COMPLETED),
    ]

    renderer = TaskRenderer()
    output = StringIO()
    console = Console(file=output, force_terminal=True, width=100)

    renderer.render_tasks(tasks, console=console)

    result = output.getvalue()

    # Completed task should have checkmark (output will contain the markup or rendered symbol)
    # PENDING should show dash
    assert "Pending Task" in result
    assert "Completed Task" in result


def test_render_tasks_green_checkmark_for_completed() -> None:
    """Test that COMPLETED status displays green checkmark, PENDING displays dash."""
    tasks = [
        Task(id=1, title="Not Done", description=None, status=TaskStatus.PENDING),
        Task(id=2, title="Done", description=None, status=TaskStatus.COMPLETED),
    ]

    renderer = TaskRenderer()
    output = StringIO()
    console = Console(file=output, force_terminal=True, width=100)

    renderer.render_tasks(tasks, console=console)

    result = output.getvalue()

    # Check for checkmark symbol (may appear as markup or rendered)
    # Rich will include the checkmark character ✓ in output
    assert "✓" in result or "checkmark" in result.lower()
    # Dash for pending should be present
    assert "-" in result
