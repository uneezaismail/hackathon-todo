"""
Unit tests for RecurringServiceV2 (Phase V - T026).

Tests RRULE-based recurring task service:
- Next occurrence calculation using RRULE patterns
- End date handling (recurring_end_date)
- Pattern validation
- should_generate_next logic
- Instance creation from parent task

This is the Phase V service that uses python-dateutil RRULE,
different from Phase IV RecurringService which uses manual calculation.
"""

import pytest
from datetime import datetime, timezone, date, timedelta
from unittest.mock import MagicMock, patch, AsyncMock
from uuid import uuid4

# Import will work after T029 implementation
from src.services.recurring_service_v2 import (
    RecurringServiceV2,
    RecurringTaskConfig,
)
from src.services.rrule_parser import RRuleParser


class TestRecurringServiceV2Init:
    """Test RecurringServiceV2 initialization."""

    def test_service_initialization(self):
        """Service can be instantiated."""
        service = RecurringServiceV2()
        assert service is not None

    def test_service_has_rrule_parser(self):
        """Service has RRuleParser instance."""
        service = RecurringServiceV2()
        assert hasattr(service, "parser")
        assert isinstance(service.parser, RRuleParser)


class TestCalculateNextOccurrence:
    """Test next occurrence calculation."""

    def test_daily_next_occurrence(self):
        """Calculate next daily occurrence."""
        service = RecurringServiceV2()
        current = datetime(2025, 1, 15, 10, 0, 0, tzinfo=timezone.utc)

        next_occurrence = service.calculate_next_occurrence(
            recurring_pattern="DAILY",
            current_occurrence=current
        )

        assert next_occurrence is not None
        assert next_occurrence == datetime(2025, 1, 16, 10, 0, 0, tzinfo=timezone.utc)

    def test_weekly_next_occurrence(self):
        """Calculate next weekly occurrence."""
        service = RecurringServiceV2()
        current = datetime(2025, 1, 15, 10, 0, 0, tzinfo=timezone.utc)  # Wednesday

        next_occurrence = service.calculate_next_occurrence(
            recurring_pattern="WEEKLY",
            current_occurrence=current
        )

        assert next_occurrence is not None
        # 7 days later
        assert next_occurrence == datetime(2025, 1, 22, 10, 0, 0, tzinfo=timezone.utc)

    def test_monthly_next_occurrence(self):
        """Calculate next monthly occurrence."""
        service = RecurringServiceV2()
        current = datetime(2025, 1, 15, 10, 0, 0, tzinfo=timezone.utc)

        next_occurrence = service.calculate_next_occurrence(
            recurring_pattern="MONTHLY",
            current_occurrence=current
        )

        assert next_occurrence is not None
        assert next_occurrence == datetime(2025, 2, 15, 10, 0, 0, tzinfo=timezone.utc)

    def test_yearly_next_occurrence(self):
        """Calculate next yearly occurrence."""
        service = RecurringServiceV2()
        current = datetime(2025, 1, 15, 10, 0, 0, tzinfo=timezone.utc)

        next_occurrence = service.calculate_next_occurrence(
            recurring_pattern="YEARLY",
            current_occurrence=current
        )

        assert next_occurrence is not None
        assert next_occurrence == datetime(2026, 1, 15, 10, 0, 0, tzinfo=timezone.utc)

    def test_custom_interval_next_occurrence(self):
        """Calculate next occurrence with custom interval."""
        service = RecurringServiceV2()
        current = datetime(2025, 1, 15, 10, 0, 0, tzinfo=timezone.utc)

        next_occurrence = service.calculate_next_occurrence(
            recurring_pattern="FREQ=DAILY;INTERVAL=3",
            current_occurrence=current
        )

        assert next_occurrence == datetime(2025, 1, 18, 10, 0, 0, tzinfo=timezone.utc)

    def test_weekly_byday_next_occurrence(self):
        """Calculate next occurrence for weekly with BYDAY."""
        service = RecurringServiceV2()
        # Monday Jan 13, 2025
        current = datetime(2025, 1, 13, 10, 0, 0, tzinfo=timezone.utc)

        # MO, WE, FR pattern
        next_occurrence = service.calculate_next_occurrence(
            recurring_pattern="FREQ=WEEKLY;BYDAY=MO,WE,FR",
            current_occurrence=current
        )

        # Should be Wednesday Jan 15
        assert next_occurrence == datetime(2025, 1, 15, 10, 0, 0, tzinfo=timezone.utc)


class TestEndDateHandling:
    """Test recurring_end_date boundary handling."""

    def test_next_occurrence_before_end_date(self):
        """Next occurrence returned when before end date."""
        service = RecurringServiceV2()
        current = datetime(2025, 1, 15, 10, 0, 0, tzinfo=timezone.utc)
        end_date = datetime(2025, 12, 31, 23, 59, 59, tzinfo=timezone.utc)

        next_occurrence = service.calculate_next_occurrence(
            recurring_pattern="DAILY",
            current_occurrence=current,
            recurring_end_date=end_date
        )

        assert next_occurrence is not None
        assert next_occurrence < end_date

    def test_next_occurrence_after_end_date_returns_none(self):
        """Returns None when next occurrence would be after end date."""
        service = RecurringServiceV2()
        current = datetime(2025, 12, 31, 10, 0, 0, tzinfo=timezone.utc)
        end_date = datetime(2025, 12, 31, 23, 59, 59, tzinfo=timezone.utc)

        next_occurrence = service.calculate_next_occurrence(
            recurring_pattern="DAILY",
            current_occurrence=current,
            recurring_end_date=end_date
        )

        # Next occurrence would be Jan 1, 2026, which is after end_date
        assert next_occurrence is None

    def test_end_date_as_date_object(self):
        """Handle end_date as date object (no time)."""
        service = RecurringServiceV2()
        current = datetime(2025, 1, 15, 10, 0, 0, tzinfo=timezone.utc)
        end_date = date(2025, 12, 31)  # date, not datetime

        next_occurrence = service.calculate_next_occurrence(
            recurring_pattern="DAILY",
            current_occurrence=current,
            recurring_end_date=end_date
        )

        assert next_occurrence is not None

    def test_none_end_date_infinite_recurrence(self):
        """None end_date means infinite recurrence."""
        service = RecurringServiceV2()
        current = datetime(2025, 1, 15, 10, 0, 0, tzinfo=timezone.utc)

        next_occurrence = service.calculate_next_occurrence(
            recurring_pattern="DAILY",
            current_occurrence=current,
            recurring_end_date=None
        )

        assert next_occurrence is not None


class TestPatternValidation:
    """Test pattern validation."""

    def test_validate_valid_pattern(self):
        """Valid pattern returns True."""
        service = RecurringServiceV2()

        assert service.validate_pattern("DAILY") is True
        assert service.validate_pattern("WEEKLY") is True
        assert service.validate_pattern("MONTHLY") is True
        assert service.validate_pattern("YEARLY") is True
        assert service.validate_pattern("FREQ=DAILY;INTERVAL=2") is True

    def test_validate_invalid_pattern(self):
        """Invalid pattern returns False."""
        service = RecurringServiceV2()

        assert service.validate_pattern("INVALID") is False
        assert service.validate_pattern("") is False
        assert service.validate_pattern(None) is False


class TestShouldGenerateNext:
    """Test should_generate_next decision logic."""

    def create_mock_task(
        self,
        recurring_pattern: str = "DAILY",
        recurring_end_date: datetime = None,
        is_pattern: bool = True,
        completed: bool = False,
        next_occurrence: datetime = None,
    ):
        """Create a mock task for testing."""
        task = MagicMock()
        task.id = uuid4()
        task.recurring_pattern = recurring_pattern
        task.recurring_end_date = recurring_end_date
        task.is_pattern = is_pattern
        task.completed = completed
        task.next_occurrence = next_occurrence
        task.user_id = "test-user-123"
        return task

    def test_should_generate_for_recurring_task(self):
        """Should generate next for active recurring task."""
        service = RecurringServiceV2()
        task = self.create_mock_task(
            recurring_pattern="DAILY",
            is_pattern=True,
            completed=False
        )

        result = service.should_generate_next(task)

        assert result is True

    def test_should_not_generate_for_non_recurring(self):
        """Should not generate for non-recurring task."""
        service = RecurringServiceV2()
        task = self.create_mock_task(recurring_pattern=None)

        result = service.should_generate_next(task)

        assert result is False

    def test_should_not_generate_past_end_date(self):
        """Should not generate when past end date."""
        service = RecurringServiceV2()
        # End date in the past
        task = self.create_mock_task(
            recurring_pattern="DAILY",
            recurring_end_date=datetime(2024, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
        )

        result = service.should_generate_next(task)

        assert result is False

    def test_should_generate_before_end_date(self):
        """Should generate when before end date."""
        service = RecurringServiceV2()
        # End date in the future
        task = self.create_mock_task(
            recurring_pattern="DAILY",
            recurring_end_date=datetime(2030, 12, 31, 23, 59, 59, tzinfo=timezone.utc)
        )

        result = service.should_generate_next(task)

        assert result is True


class TestRecurringTaskConfig:
    """Test RecurringTaskConfig data class."""

    def test_config_creation(self):
        """Config can be created with all fields."""
        config = RecurringTaskConfig(
            recurring_pattern="DAILY",
            recurring_end_date=datetime(2025, 12, 31, 23, 59, 59, tzinfo=timezone.utc),
            user_id="test-user-123",
            parent_task_id=uuid4()
        )

        assert config.recurring_pattern == "DAILY"
        assert config.user_id == "test-user-123"

    def test_config_optional_fields(self):
        """Config works with optional fields."""
        config = RecurringTaskConfig(
            recurring_pattern="WEEKLY",
            user_id="test-user-123"
        )

        assert config.recurring_end_date is None
        assert config.parent_task_id is None


class TestCreateNextInstance:
    """Test creating next task instance."""

    def test_create_next_instance_returns_dict(self):
        """create_next_instance returns task creation dict."""
        service = RecurringServiceV2()
        current = datetime(2025, 1, 15, 10, 0, 0, tzinfo=timezone.utc)

        parent_task = MagicMock()
        parent_task.id = uuid4()
        parent_task.user_id = "test-user-123"
        parent_task.title = "Daily standup"
        parent_task.description = "Morning team sync"
        parent_task.priority = "High"
        parent_task.recurring_pattern = "DAILY"
        parent_task.recurring_end_date = None
        parent_task.tags = ["work"]

        result = service.create_next_instance_data(
            parent_task=parent_task,
            current_occurrence=current
        )

        assert result is not None
        assert result["title"] == "Daily standup"
        assert result["user_id"] == "test-user-123"
        assert result["recurring_pattern"] == "DAILY"
        assert result["parent_task_id"] == parent_task.id

    def test_create_next_instance_calculates_next_occurrence(self):
        """Next instance has calculated next_occurrence."""
        service = RecurringServiceV2()
        current = datetime(2025, 1, 15, 10, 0, 0, tzinfo=timezone.utc)

        parent_task = MagicMock()
        parent_task.id = uuid4()
        parent_task.user_id = "test-user-123"
        parent_task.title = "Weekly review"
        parent_task.description = None
        parent_task.priority = "Medium"
        parent_task.recurring_pattern = "WEEKLY"
        parent_task.recurring_end_date = None
        parent_task.tags = []

        result = service.create_next_instance_data(
            parent_task=parent_task,
            current_occurrence=current
        )

        # next_occurrence should be set for the new instance
        assert "next_occurrence" in result
        expected_next = datetime(2025, 1, 22, 10, 0, 0, tzinfo=timezone.utc)
        assert result["next_occurrence"] == expected_next

    def test_create_next_instance_none_when_past_end_date(self):
        """Returns None when past end date."""
        service = RecurringServiceV2()
        current = datetime(2025, 12, 31, 10, 0, 0, tzinfo=timezone.utc)

        parent_task = MagicMock()
        parent_task.id = uuid4()
        parent_task.user_id = "test-user-123"
        parent_task.title = "Limited task"
        parent_task.description = None
        parent_task.priority = "Low"
        parent_task.recurring_pattern = "DAILY"
        parent_task.recurring_end_date = datetime(2025, 12, 31, 23, 59, 59, tzinfo=timezone.utc)
        parent_task.tags = []

        result = service.create_next_instance_data(
            parent_task=parent_task,
            current_occurrence=current
        )

        # Should be None since next occurrence would be after end date
        assert result is None


class TestDueDateCalculation:
    """Test due_date calculation from next_occurrence."""

    def test_due_date_from_next_occurrence(self):
        """Due date is extracted from next_occurrence datetime."""
        service = RecurringServiceV2()
        current = datetime(2025, 1, 15, 10, 0, 0, tzinfo=timezone.utc)

        parent_task = MagicMock()
        parent_task.id = uuid4()
        parent_task.user_id = "test-user-123"
        parent_task.title = "Task"
        parent_task.description = None
        parent_task.priority = "Medium"
        parent_task.recurring_pattern = "DAILY"
        parent_task.recurring_end_date = None
        parent_task.due_date = date(2025, 1, 15)
        parent_task.tags = []

        result = service.create_next_instance_data(
            parent_task=parent_task,
            current_occurrence=current
        )

        # due_date should be the date part of next_occurrence
        assert result is not None
        assert "due_date" in result
        assert result["due_date"] == date(2025, 1, 16)


class TestUserIdIsolation:
    """Test user_id is properly propagated."""

    def test_user_id_in_next_instance(self):
        """User ID is included in next instance data."""
        service = RecurringServiceV2()
        current = datetime(2025, 1, 15, 10, 0, 0, tzinfo=timezone.utc)

        parent_task = MagicMock()
        parent_task.id = uuid4()
        parent_task.user_id = "specific-user-456"
        parent_task.title = "User task"
        parent_task.description = None
        parent_task.priority = "Medium"
        parent_task.recurring_pattern = "DAILY"
        parent_task.recurring_end_date = None
        parent_task.tags = []

        result = service.create_next_instance_data(
            parent_task=parent_task,
            current_occurrence=current
        )

        assert result["user_id"] == "specific-user-456"

    def test_different_users_get_different_tasks(self):
        """Different users' tasks are isolated."""
        service = RecurringServiceV2()
        current = datetime(2025, 1, 15, 10, 0, 0, tzinfo=timezone.utc)

        # User 1's task
        task1 = MagicMock()
        task1.id = uuid4()
        task1.user_id = "user-1"
        task1.title = "Task 1"
        task1.description = None
        task1.priority = "Medium"
        task1.recurring_pattern = "DAILY"
        task1.recurring_end_date = None
        task1.tags = []

        # User 2's task
        task2 = MagicMock()
        task2.id = uuid4()
        task2.user_id = "user-2"
        task2.title = "Task 2"
        task2.description = None
        task2.priority = "Medium"
        task2.recurring_pattern = "DAILY"
        task2.recurring_end_date = None
        task2.tags = []

        result1 = service.create_next_instance_data(parent_task=task1, current_occurrence=current)
        result2 = service.create_next_instance_data(parent_task=task2, current_occurrence=current)

        assert result1["user_id"] != result2["user_id"]
        assert result1["user_id"] == "user-1"
        assert result2["user_id"] == "user-2"


class TestIsPatternFlag:
    """Test is_pattern flag handling."""

    def test_new_instance_is_not_pattern(self):
        """New instances have is_pattern=False."""
        service = RecurringServiceV2()
        current = datetime(2025, 1, 15, 10, 0, 0, tzinfo=timezone.utc)

        parent_task = MagicMock()
        parent_task.id = uuid4()
        parent_task.user_id = "test-user-123"
        parent_task.title = "Pattern task"
        parent_task.description = None
        parent_task.priority = "Medium"
        parent_task.recurring_pattern = "DAILY"
        parent_task.recurring_end_date = None
        parent_task.is_pattern = True  # Parent is a pattern
        parent_task.tags = []

        result = service.create_next_instance_data(
            parent_task=parent_task,
            current_occurrence=current
        )

        # Instance should not be a pattern
        assert result["is_pattern"] is False

    def test_pattern_retains_recurring_info(self):
        """Instance retains recurring_pattern for future use."""
        service = RecurringServiceV2()
        current = datetime(2025, 1, 15, 10, 0, 0, tzinfo=timezone.utc)

        parent_task = MagicMock()
        parent_task.id = uuid4()
        parent_task.user_id = "test-user-123"
        parent_task.title = "Recurring task"
        parent_task.description = None
        parent_task.priority = "Medium"
        parent_task.recurring_pattern = "WEEKLY"
        parent_task.recurring_end_date = None
        parent_task.tags = []

        result = service.create_next_instance_data(
            parent_task=parent_task,
            current_occurrence=current
        )

        # Instance should keep recurring_pattern for when it's completed
        assert result["recurring_pattern"] == "WEEKLY"
