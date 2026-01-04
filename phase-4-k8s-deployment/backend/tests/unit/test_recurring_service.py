"""
Unit tests for RecurringService (Phase 4).

Tests all recurrence calculation logic:
- Daily recurrence
- Weekly recurrence with specific days
- Monthly recurrence
- Yearly recurrence
- Interval > 1 (every 2 weeks, etc.)
- End date boundary
- Max occurrences limit
"""

import pytest
from datetime import date, timedelta
from unittest.mock import MagicMock, patch
import uuid

from src.services.recurring_service import RecurringService
from src.models.task import Task, RecurrenceType


class TestParseRecurrenceDays:
    """Test recurrence_days string parsing."""

    def test_parse_empty_string(self):
        """Empty string returns empty list."""
        result = RecurringService.parse_recurrence_days("")
        assert result == []

    def test_parse_none(self):
        """None returns empty list."""
        result = RecurringService.parse_recurrence_days(None)
        assert result == []

    def test_parse_single_day(self):
        """Single day is parsed correctly."""
        result = RecurringService.parse_recurrence_days("mon")
        assert result == [0]  # Monday = 0

    def test_parse_multiple_days(self):
        """Multiple days are parsed and sorted."""
        result = RecurringService.parse_recurrence_days("wed,mon,fri")
        assert result == [0, 2, 4]  # Monday, Wednesday, Friday

    def test_parse_full_day_names(self):
        """Full day names are supported."""
        result = RecurringService.parse_recurrence_days("monday,wednesday,friday")
        assert result == [0, 2, 4]

    def test_parse_mixed_case(self):
        """Day names are case-insensitive."""
        result = RecurringService.parse_recurrence_days("MON,Wed,FRIDAY")
        assert result == [0, 2, 4]

    def test_parse_with_spaces(self):
        """Spaces around day names are trimmed."""
        result = RecurringService.parse_recurrence_days("mon , wed , fri")
        assert result == [0, 2, 4]

    def test_parse_weekend(self):
        """Weekend days are parsed correctly."""
        result = RecurringService.parse_recurrence_days("sat,sun")
        assert result == [5, 6]


class TestCalculateNextDueDate:
    """Test next due date calculation for different recurrence types."""

    def create_task(
        self,
        due_date: date,
        recurrence_type: RecurrenceType,
        interval: int = 1,
        days: str = None,
        end_date: date = None,
    ) -> Task:
        """Helper to create a mock task with recurrence config."""
        task = MagicMock(spec=Task)
        task.id = uuid.uuid4()
        task.is_recurring = True
        task.due_date = due_date
        task.recurrence_type = recurrence_type
        task.recurrence_interval = interval
        task.recurrence_days = days
        task.recurrence_end_date = end_date
        task.max_occurrences = None
        task.occurrence_count = 0
        task.parent_task_id = None
        return task

    # Daily Recurrence Tests

    def test_daily_recurrence(self):
        """Daily recurrence adds 1 day."""
        task = self.create_task(
            due_date=date(2025, 1, 1),
            recurrence_type=RecurrenceType.daily,
        )
        result = RecurringService.calculate_next_due_date(task)
        assert result == date(2025, 1, 2)

    def test_daily_recurrence_interval_3(self):
        """Daily recurrence with interval 3 adds 3 days."""
        task = self.create_task(
            due_date=date(2025, 1, 1),
            recurrence_type=RecurrenceType.daily,
            interval=3,
        )
        result = RecurringService.calculate_next_due_date(task)
        assert result == date(2025, 1, 4)

    def test_daily_recurrence_crosses_month(self):
        """Daily recurrence correctly crosses month boundary."""
        task = self.create_task(
            due_date=date(2025, 1, 31),
            recurrence_type=RecurrenceType.daily,
        )
        result = RecurringService.calculate_next_due_date(task)
        assert result == date(2025, 2, 1)

    # Weekly Recurrence Tests

    def test_weekly_recurrence_no_days(self):
        """Weekly recurrence without specific days adds 1 week."""
        task = self.create_task(
            due_date=date(2025, 1, 6),  # Monday
            recurrence_type=RecurrenceType.weekly,
        )
        result = RecurringService.calculate_next_due_date(task)
        assert result == date(2025, 1, 13)  # Next Monday

    def test_weekly_recurrence_same_day_later_in_week(self):
        """Weekly recurrence finds next day in same week."""
        task = self.create_task(
            due_date=date(2025, 1, 6),  # Monday
            recurrence_type=RecurrenceType.weekly,
            days="wed,fri",  # Wednesday and Friday
        )
        result = RecurringService.calculate_next_due_date(task)
        assert result == date(2025, 1, 8)  # Wednesday

    def test_weekly_recurrence_next_week(self):
        """Weekly recurrence goes to next week when past all days."""
        task = self.create_task(
            due_date=date(2025, 1, 10),  # Friday
            recurrence_type=RecurrenceType.weekly,
            days="mon,wed",  # Monday and Wednesday
        )
        result = RecurringService.calculate_next_due_date(task)
        assert result == date(2025, 1, 13)  # Next Monday

    def test_weekly_recurrence_interval_2(self):
        """Weekly recurrence with interval 2 skips a week."""
        task = self.create_task(
            due_date=date(2025, 1, 6),  # Monday
            recurrence_type=RecurrenceType.weekly,
            interval=2,
        )
        result = RecurringService.calculate_next_due_date(task)
        assert result == date(2025, 1, 20)  # Monday in 2 weeks

    # Monthly Recurrence Tests

    def test_monthly_recurrence(self):
        """Monthly recurrence adds 1 month."""
        task = self.create_task(
            due_date=date(2025, 1, 15),
            recurrence_type=RecurrenceType.monthly,
        )
        result = RecurringService.calculate_next_due_date(task)
        assert result == date(2025, 2, 15)

    def test_monthly_recurrence_end_of_month(self):
        """Monthly recurrence handles month-end correctly."""
        task = self.create_task(
            due_date=date(2025, 1, 31),
            recurrence_type=RecurrenceType.monthly,
        )
        result = RecurringService.calculate_next_due_date(task)
        assert result == date(2025, 2, 28)  # Feb 28 (not 31)

    def test_monthly_recurrence_interval_3(self):
        """Monthly recurrence with interval 3 adds 3 months."""
        task = self.create_task(
            due_date=date(2025, 1, 15),
            recurrence_type=RecurrenceType.monthly,
            interval=3,
        )
        result = RecurringService.calculate_next_due_date(task)
        assert result == date(2025, 4, 15)

    def test_monthly_recurrence_crosses_year(self):
        """Monthly recurrence correctly crosses year boundary."""
        task = self.create_task(
            due_date=date(2025, 12, 15),
            recurrence_type=RecurrenceType.monthly,
        )
        result = RecurringService.calculate_next_due_date(task)
        assert result == date(2026, 1, 15)

    # Yearly Recurrence Tests

    def test_yearly_recurrence(self):
        """Yearly recurrence adds 1 year."""
        task = self.create_task(
            due_date=date(2025, 3, 15),
            recurrence_type=RecurrenceType.yearly,
        )
        result = RecurringService.calculate_next_due_date(task)
        assert result == date(2026, 3, 15)

    def test_yearly_recurrence_leap_year(self):
        """Yearly recurrence handles Feb 29 on non-leap year."""
        task = self.create_task(
            due_date=date(2024, 2, 29),  # Leap year
            recurrence_type=RecurrenceType.yearly,
        )
        result = RecurringService.calculate_next_due_date(task)
        assert result == date(2025, 2, 28)  # Feb 28 (2025 not a leap year)

    def test_yearly_recurrence_interval_2(self):
        """Yearly recurrence with interval 2 adds 2 years."""
        task = self.create_task(
            due_date=date(2025, 3, 15),
            recurrence_type=RecurrenceType.yearly,
            interval=2,
        )
        result = RecurringService.calculate_next_due_date(task)
        assert result == date(2027, 3, 15)

    # End Date Boundary Tests

    def test_end_date_allows_next(self):
        """Next occurrence within end date is allowed."""
        task = self.create_task(
            due_date=date(2025, 1, 1),
            recurrence_type=RecurrenceType.daily,
            end_date=date(2025, 1, 10),
        )
        result = RecurringService.calculate_next_due_date(task)
        assert result == date(2025, 1, 2)

    def test_end_date_blocks_next(self):
        """Next occurrence past end date returns None."""
        task = self.create_task(
            due_date=date(2025, 1, 9),
            recurrence_type=RecurrenceType.daily,
            end_date=date(2025, 1, 9),  # End on same day
        )
        result = RecurringService.calculate_next_due_date(task)
        assert result is None

    # Non-Recurring Task Tests

    def test_non_recurring_task(self):
        """Non-recurring task returns None."""
        task = MagicMock(spec=Task)
        task.is_recurring = False
        result = RecurringService.calculate_next_due_date(task)
        assert result is None

    def test_no_recurrence_type(self):
        """Recurring task without type returns None."""
        task = MagicMock(spec=Task)
        task.is_recurring = True
        task.recurrence_type = None
        result = RecurringService.calculate_next_due_date(task)
        assert result is None


class TestShouldGenerateNext:
    """Test should_generate_next logic."""

    def create_task(
        self,
        is_recurring: bool = True,
        recurrence_type: RecurrenceType = RecurrenceType.daily,
        due_date: date = None,
        max_occurrences: int = None,
        occurrence_count: int = 0,
        end_date: date = None,
    ) -> Task:
        """Helper to create a mock task."""
        task = MagicMock(spec=Task)
        task.id = uuid.uuid4()
        task.is_recurring = is_recurring
        task.recurrence_type = recurrence_type
        task.due_date = due_date or date.today()
        task.recurrence_interval = 1
        task.recurrence_days = None
        task.recurrence_end_date = end_date
        task.max_occurrences = max_occurrences
        task.occurrence_count = occurrence_count
        task.parent_task_id = None
        return task

    def test_should_generate_normal(self):
        """Normal recurring task should generate."""
        task = self.create_task()
        assert RecurringService.should_generate_next(task) is True

    def test_non_recurring_should_not_generate(self):
        """Non-recurring task should not generate."""
        task = self.create_task(is_recurring=False)
        assert RecurringService.should_generate_next(task) is False

    def test_max_occurrences_not_reached(self):
        """Should generate when below max occurrences."""
        task = self.create_task(max_occurrences=10, occurrence_count=5)
        assert RecurringService.should_generate_next(task) is True

    def test_max_occurrences_reached(self):
        """Should not generate when max occurrences reached."""
        task = self.create_task(max_occurrences=10, occurrence_count=10)
        assert RecurringService.should_generate_next(task) is False

    def test_end_date_not_reached(self):
        """Should generate when before end date."""
        task = self.create_task(
            due_date=date(2025, 1, 1),
            end_date=date(2025, 12, 31),
        )
        assert RecurringService.should_generate_next(task) is True

    def test_end_date_reached(self):
        """Should not generate when next date exceeds end date."""
        task = self.create_task(
            due_date=date(2025, 12, 31),
            end_date=date(2025, 12, 31),
        )
        assert RecurringService.should_generate_next(task) is False


class TestAddMonths:
    """Test month arithmetic edge cases."""

    def test_add_one_month(self):
        """Adding 1 month works normally."""
        result = RecurringService._add_months(date(2025, 1, 15), 1)
        assert result == date(2025, 2, 15)

    def test_add_months_jan31_to_feb(self):
        """Jan 31 + 1 month = Feb 28 (not leap year)."""
        result = RecurringService._add_months(date(2025, 1, 31), 1)
        assert result == date(2025, 2, 28)

    def test_add_months_jan31_to_feb_leap(self):
        """Jan 31 + 1 month = Feb 29 (leap year)."""
        result = RecurringService._add_months(date(2024, 1, 31), 1)
        assert result == date(2024, 2, 29)

    def test_add_12_months(self):
        """Adding 12 months equals 1 year."""
        result = RecurringService._add_months(date(2025, 3, 15), 12)
        assert result == date(2026, 3, 15)


class TestAddYears:
    """Test year arithmetic edge cases."""

    def test_add_one_year(self):
        """Adding 1 year works normally."""
        result = RecurringService._add_years(date(2025, 3, 15), 1)
        assert result == date(2026, 3, 15)

    def test_add_year_feb29_to_non_leap(self):
        """Feb 29 + 1 year = Feb 28 (non-leap year)."""
        result = RecurringService._add_years(date(2024, 2, 29), 1)
        assert result == date(2025, 2, 28)

    def test_add_year_feb29_to_leap(self):
        """Feb 29 + 4 years = Feb 29 (next leap year)."""
        result = RecurringService._add_years(date(2024, 2, 29), 4)
        assert result == date(2028, 2, 29)
