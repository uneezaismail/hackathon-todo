"""Unit tests for TaskStatus enum."""

import pytest

from src.models.enums import TaskStatus


def test_task_status_has_pending_value() -> None:
    """Test that TaskStatus has PENDING value."""
    assert TaskStatus.PENDING.value == "pending"


def test_task_status_has_completed_value() -> None:
    """Test that TaskStatus has COMPLETED value."""
    assert TaskStatus.COMPLETED.value == "completed"


def test_task_status_enum_members() -> None:
    """Test that TaskStatus has exactly two members."""
    assert len(TaskStatus) == 2
    assert TaskStatus.PENDING in TaskStatus
    assert TaskStatus.COMPLETED in TaskStatus
