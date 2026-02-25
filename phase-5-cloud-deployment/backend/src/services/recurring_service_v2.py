"""
Recurring Task Service V2 for Phase V (T029).

This is the RRULE-based recurring task service for Phase V.
Uses python-dateutil for RFC 5545 compliant recurrence patterns.

Different from Phase IV RecurringService which uses manual calculation.
Phase V uses RRULE strings (DAILY, WEEKLY, FREQ=DAILY;INTERVAL=2, etc.)

Features:
- Calculate next occurrence using RRULE patterns
- Validate RRULE patterns
- Determine if next instance should be generated
- Create next instance data from parent task

All datetime operations use UTC only.

Usage:
    service = RecurringServiceV2()

    # Calculate next occurrence
    next_dt = service.calculate_next_occurrence(
        recurring_pattern="DAILY",
        current_occurrence=datetime.now(timezone.utc)
    )

    # Check if should generate next
    if service.should_generate_next(task):
        data = service.create_next_instance_data(task, current_occurrence)
"""

import logging
from dataclasses import dataclass
from datetime import datetime, timezone, date, timedelta
from typing import Optional, Any, Protocol
from uuid import UUID

from .rrule_parser import RRuleParser, RRuleParseError

logger = logging.getLogger(__name__)


@dataclass
class RecurringTaskConfig:
    """
    Configuration for recurring task creation.

    Attributes:
        recurring_pattern: RRULE pattern string
        user_id: Owner user ID (required for user isolation)
        recurring_end_date: Optional end date for recurrence
        parent_task_id: Optional parent task UUID
    """
    recurring_pattern: str
    user_id: str
    recurring_end_date: Optional[datetime] = None
    parent_task_id: Optional[UUID] = None


class TaskProtocol(Protocol):
    """Protocol for task objects."""
    id: UUID
    user_id: str
    title: str
    description: Optional[str]
    priority: str
    recurring_pattern: Optional[str]
    recurring_end_date: Optional[datetime | date]
    is_pattern: bool
    completed: bool
    next_occurrence: Optional[datetime]
    due_date: Optional[date]
    tags: list[str]


class RecurringServiceV2:
    """
    RRULE-based recurring task service for Phase V.

    Handles:
    - Next occurrence calculation using RRULE patterns
    - Pattern validation
    - Decision logic for generating next instances
    - Creating next instance data from parent task
    """

    def __init__(self):
        """Initialize the recurring service with RRULE parser."""
        self.parser = RRuleParser()

    def calculate_next_occurrence(
        self,
        recurring_pattern: str,
        current_occurrence: datetime,
        recurring_end_date: Optional[datetime | date] = None,
    ) -> Optional[datetime]:
        """
        Calculate the next occurrence based on RRULE pattern.

        Args:
            recurring_pattern: RRULE pattern string (DAILY, WEEKLY, etc.)
            current_occurrence: Current occurrence datetime (UTC)
            recurring_end_date: Optional end date for recurrence

        Returns:
            Next occurrence datetime (UTC), or None if recurrence ended

        Raises:
            ValueError: If current_occurrence is not UTC
            RRuleParseError: If pattern is invalid
        """
        if not recurring_pattern:
            return None

        # Convert end_date to datetime if needed
        end_datetime = None
        if recurring_end_date:
            if isinstance(recurring_end_date, date) and not isinstance(recurring_end_date, datetime):
                end_datetime = datetime.combine(
                    recurring_end_date,
                    datetime.max.time(),
                    tzinfo=timezone.utc
                )
            else:
                end_datetime = recurring_end_date

        return self.parser.calculate_next_occurrence(
            pattern=recurring_pattern,
            dtstart=current_occurrence,
            end_date=end_datetime
        )

    def validate_pattern(self, pattern: Optional[str]) -> bool:
        """
        Validate a recurring pattern.

        Args:
            pattern: RRULE pattern string to validate

        Returns:
            True if valid, False otherwise
        """
        if not pattern:
            return False
        return self.parser.validate_pattern(pattern)

    def should_generate_next(self, task: Any) -> bool:
        """
        Determine if next instance should be generated for a task.

        Checks:
        - Task has recurring_pattern
        - Task is not past end_date
        - Task is a pattern or recurring instance

        Args:
            task: Task object (any object with required attributes)

        Returns:
            True if next instance should be generated
        """
        # Must have recurring pattern
        recurring_pattern = getattr(task, "recurring_pattern", None)
        if not recurring_pattern:
            return False

        # Check end date
        recurring_end_date = getattr(task, "recurring_end_date", None)
        if recurring_end_date:
            # Convert to datetime if date
            if isinstance(recurring_end_date, date) and not isinstance(recurring_end_date, datetime):
                end_dt = datetime.combine(
                    recurring_end_date,
                    datetime.max.time(),
                    tzinfo=timezone.utc
                )
            else:
                end_dt = recurring_end_date
                if end_dt.tzinfo is None:
                    end_dt = end_dt.replace(tzinfo=timezone.utc)

            # Check if past end date
            if datetime.now(timezone.utc) > end_dt:
                return False

        return True

    def create_next_instance_data(
        self,
        parent_task: Any,
        current_occurrence: datetime,
    ) -> Optional[dict[str, Any]]:
        """
        Create data dict for the next task instance.

        Args:
            parent_task: Parent task object to copy from
            current_occurrence: Current occurrence datetime (UTC)

        Returns:
            Dict with next instance data, or None if recurrence ended
        """
        recurring_pattern = getattr(parent_task, "recurring_pattern", None)
        if not recurring_pattern:
            return None

        # Get end date
        recurring_end_date = getattr(parent_task, "recurring_end_date", None)

        # Calculate next occurrence
        next_occurrence = self.calculate_next_occurrence(
            recurring_pattern=recurring_pattern,
            current_occurrence=current_occurrence,
            recurring_end_date=recurring_end_date
        )

        if next_occurrence is None:
            # Recurrence ended
            return None

        # Calculate due_date from next_occurrence
        due_date = next_occurrence.date() if next_occurrence else None

        # Get tags (handle both list and relationship)
        tags = getattr(parent_task, "tags", [])
        if not isinstance(tags, list):
            try:
                tags = list(tags)
            except TypeError:
                tags = []

        # Build instance data
        return {
            "title": parent_task.title,
            "description": getattr(parent_task, "description", None),
            "priority": getattr(parent_task, "priority", "Medium"),
            "user_id": parent_task.user_id,
            "recurring_pattern": recurring_pattern,
            "recurring_end_date": recurring_end_date,
            "next_occurrence": next_occurrence,
            "due_date": due_date,
            "parent_task_id": parent_task.id,
            "is_pattern": False,  # Instances are not patterns
            "completed": False,
            "tags": tags,
        }

    def calculate_initial_next_occurrence(
        self,
        recurring_pattern: str,
        due_date: Optional[date] = None,
        recurring_end_date: Optional[date | datetime] = None,
    ) -> Optional[datetime]:
        """
        Calculate initial next_occurrence when creating a new recurring task.

        Args:
            recurring_pattern: RRULE pattern string
            due_date: Optional due date for the task
            recurring_end_date: Optional end date for recurrence

        Returns:
            Initial next_occurrence datetime (UTC)
        """
        if not recurring_pattern:
            return None

        # Use due_date or today as base
        if due_date:
            base_date = due_date
        else:
            base_date = date.today()

        # Create datetime from date at start of day (UTC)
        base_datetime = datetime.combine(
            base_date,
            datetime.min.time(),
            tzinfo=timezone.utc
        )

        return self.calculate_next_occurrence(
            recurring_pattern=recurring_pattern,
            current_occurrence=base_datetime,
            recurring_end_date=recurring_end_date
        )

    @staticmethod
    def convert_legacy_pattern(
        recurrence_type: Optional[str],
        recurrence_interval: int = 1,
        recurrence_days: Optional[str] = None,
    ) -> Optional[str]:
        """
        Convert legacy Phase IV recurrence fields to RRULE pattern.

        Args:
            recurrence_type: Legacy type (daily, weekly, monthly, yearly)
            recurrence_interval: Interval between occurrences
            recurrence_days: For weekly: comma-separated days (mon,wed,fri)

        Returns:
            RRULE pattern string, or None if no recurrence
        """
        if not recurrence_type:
            return None

        # Map legacy types to RRULE frequency
        type_map = {
            "daily": "DAILY",
            "weekly": "WEEKLY",
            "monthly": "MONTHLY",
            "yearly": "YEARLY",
        }

        freq = type_map.get(recurrence_type.lower())
        if not freq:
            return None

        # Build RRULE string
        parts = [f"FREQ={freq}"]

        if recurrence_interval > 1:
            parts.append(f"INTERVAL={recurrence_interval}")

        # Convert recurrence_days for weekly pattern
        if freq == "WEEKLY" and recurrence_days:
            # Convert day names to RRULE format
            day_map = {
                "mon": "MO", "monday": "MO",
                "tue": "TU", "tuesday": "TU",
                "wed": "WE", "wednesday": "WE",
                "thu": "TH", "thursday": "TH",
                "fri": "FR", "friday": "FR",
                "sat": "SA", "saturday": "SA",
                "sun": "SU", "sunday": "SU",
            }

            rrule_days = []
            for day in recurrence_days.lower().split(","):
                day = day.strip()
                if day in day_map:
                    rrule_days.append(day_map[day])

            if rrule_days:
                parts.append(f"BYDAY={','.join(rrule_days)}")

        return ";".join(parts)
