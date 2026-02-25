"""
RRULE Parser Service for Phase V (T028).

Parses RRULE patterns and calculates next occurrence dates using python-dateutil.
Supports both simplified patterns (DAILY, WEEKLY, MONTHLY, YEARLY) and full
RFC 5545 RRULE strings (FREQ=DAILY;INTERVAL=2;BYDAY=MO,WE,FR).

CRITICAL: All datetime operations use UTC only. Non-UTC timezones will raise ValueError.

Usage:
    parser = RRuleParser()

    # Validate pattern
    if parser.validate_pattern("DAILY"):
        result = parser.parse_pattern("DAILY")
        print(result.frequency)  # "DAILY"

    # Calculate next occurrence
    next_dt = parser.calculate_next_occurrence(
        pattern="FREQ=WEEKLY;BYDAY=MO,WE,FR",
        dtstart=datetime(2025, 1, 15, 10, 0, 0, tzinfo=timezone.utc),
        end_date=datetime(2025, 12, 31, 23, 59, 59, tzinfo=timezone.utc)
    )
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone, date
from typing import Optional, List

from dateutil.rrule import rrule, rrulestr, DAILY, WEEKLY, MONTHLY, YEARLY
from dateutil.rrule import MO, TU, WE, TH, FR, SA, SU

logger = logging.getLogger(__name__)


# Simplified pattern constants
SIMPLIFIED_PATTERNS = {
    "DAILY": DAILY,
    "WEEKLY": WEEKLY,
    "MONTHLY": MONTHLY,
    "YEARLY": YEARLY,
}

# Weekday mapping
WEEKDAY_MAP = {
    "MO": MO,
    "TU": TU,
    "WE": WE,
    "TH": TH,
    "FR": FR,
    "SA": SA,
    "SU": SU,
}


class RRuleParseError(Exception):
    """Exception raised when RRULE pattern parsing fails."""
    pass


@dataclass
class ParsedPattern:
    """
    Represents a parsed RRULE pattern.

    Attributes:
        frequency: Frequency type (DAILY, WEEKLY, MONTHLY, YEARLY)
        interval: Interval between occurrences (default: 1)
        byweekday: List of weekday codes for BYDAY (e.g., [MO, WE, FR])
        byhour: List of hours for BYHOUR
        original_pattern: Original pattern string
    """
    frequency: str
    interval: int = 1
    byweekday: Optional[List[str]] = None
    byhour: Optional[List[int]] = None
    original_pattern: str = ""

    def to_rrule_string(self) -> str:
        """Convert parsed pattern back to RRULE string."""
        parts = [f"FREQ={self.frequency}"]

        if self.interval != 1:
            parts.append(f"INTERVAL={self.interval}")

        if self.byweekday:
            parts.append(f"BYDAY={','.join(self.byweekday)}")

        if self.byhour:
            parts.append(f"BYHOUR={','.join(map(str, self.byhour))}")

        return ";".join(parts)


class RRuleParser:
    """
    Parse RRULE patterns and calculate next occurrence dates.

    Supports:
    - Simplified patterns: DAILY, WEEKLY, MONTHLY, YEARLY
    - Full RRULE strings: FREQ=DAILY;INTERVAL=2;BYDAY=MO,WE,FR

    All datetime operations use UTC only.
    """

    def __init__(self):
        """Initialize the RRULE parser."""
        self._simplified_patterns = SIMPLIFIED_PATTERNS

    def validate_pattern(self, pattern: str | None) -> bool:
        """
        Validate an RRULE pattern.

        Args:
            pattern: RRULE pattern string to validate

        Returns:
            True if pattern is valid, False otherwise
        """
        if not pattern or not pattern.strip():
            return False

        try:
            self.parse_pattern(pattern)
            return True
        except (RRuleParseError, ValueError, TypeError):
            return False

    def parse_pattern(self, pattern: str) -> ParsedPattern:
        """
        Parse an RRULE pattern into structured components.

        Args:
            pattern: RRULE pattern string (simplified or full)

        Returns:
            ParsedPattern with frequency, interval, and other components

        Raises:
            RRuleParseError: If pattern is invalid
        """
        if pattern is None:
            raise RRuleParseError("Pattern cannot be None")

        if not pattern or not pattern.strip():
            raise RRuleParseError("Pattern cannot be empty")

        pattern = pattern.strip()
        pattern_upper = pattern.upper()

        # Check if it's a simplified pattern
        if pattern_upper in self._simplified_patterns:
            return ParsedPattern(
                frequency=pattern_upper,
                interval=1,
                original_pattern=pattern_upper
            )

        # Try to parse as full RRULE string
        try:
            return self._parse_full_rrule(pattern_upper)
        except Exception as e:
            logger.warning(f"Failed to parse RRULE pattern '{pattern}': {e}")
            raise RRuleParseError(f"Invalid RRULE pattern: {pattern}") from e

    def _parse_full_rrule(self, pattern: str) -> ParsedPattern:
        """
        Parse a full RRULE string (FREQ=DAILY;INTERVAL=2;BYDAY=MO,WE,FR).

        Args:
            pattern: Full RRULE string (uppercase)

        Returns:
            ParsedPattern object
        """
        # Remove RRULE: prefix if present
        if pattern.startswith("RRULE:"):
            pattern = pattern[6:]

        # Parse key-value pairs
        parts = pattern.split(";")
        params = {}
        for part in parts:
            if "=" in part:
                key, value = part.split("=", 1)
                params[key.strip()] = value.strip()

        # Extract frequency
        freq_str = params.get("FREQ")
        if not freq_str or freq_str not in self._simplified_patterns:
            raise RRuleParseError(f"Invalid or missing FREQ in pattern: {pattern}")

        # Extract interval
        interval = int(params.get("INTERVAL", "1"))

        # Extract BYDAY
        byweekday = None
        byday_str = params.get("BYDAY")
        if byday_str:
            byweekday = [day.strip() for day in byday_str.split(",")]
            # Validate weekday codes
            for day in byweekday:
                # Handle numeric prefixes like "1MO" (first Monday)
                day_code = day.lstrip("-0123456789")
                if day_code not in WEEKDAY_MAP:
                    raise RRuleParseError(f"Invalid weekday in BYDAY: {day}")

        # Extract BYHOUR
        byhour = None
        byhour_str = params.get("BYHOUR")
        if byhour_str:
            byhour = [int(h.strip()) for h in byhour_str.split(",")]

        return ParsedPattern(
            frequency=freq_str,
            interval=interval,
            byweekday=byweekday,
            byhour=byhour,
            original_pattern=pattern
        )

    def calculate_next_occurrence(
        self,
        pattern: str,
        dtstart: datetime,
        end_date: Optional[datetime | date] = None,
    ) -> Optional[datetime]:
        """
        Calculate the next occurrence after dtstart based on the RRULE pattern.

        Args:
            pattern: RRULE pattern string
            dtstart: Starting datetime (MUST be UTC)
            end_date: Optional end date (recurrence stops after this)

        Returns:
            Next occurrence datetime (UTC), or None if recurrence ended

        Raises:
            ValueError: If dtstart is not UTC timezone
        """
        # Validate UTC timezone
        self._validate_utc(dtstart)

        # Convert end_date to datetime if it's a date
        end_datetime = None
        if end_date:
            if isinstance(end_date, date) and not isinstance(end_date, datetime):
                # Convert date to datetime at end of day
                end_datetime = datetime.combine(
                    end_date,
                    datetime.max.time(),
                    tzinfo=timezone.utc
                )
            else:
                end_datetime = end_date
                self._validate_utc(end_datetime)

        # Parse the pattern
        parsed = self.parse_pattern(pattern)

        # Build rrule object
        rule = self._build_rrule(parsed, dtstart)

        # Get next occurrence after dtstart
        next_dt = rule.after(dtstart, inc=False)

        if next_dt is None:
            return None

        # Ensure UTC timezone
        if next_dt.tzinfo is None:
            next_dt = next_dt.replace(tzinfo=timezone.utc)

        # Check if past end date
        if end_datetime and next_dt > end_datetime:
            return None

        return next_dt

    def _validate_utc(self, dt: datetime) -> None:
        """
        Validate that datetime is UTC timezone.

        Args:
            dt: Datetime to validate

        Raises:
            ValueError: If not UTC timezone
        """
        if dt.tzinfo is None:
            raise ValueError("Datetime must have UTC timezone, got naive datetime")

        # Check if it's actually UTC
        if dt.tzinfo != timezone.utc:
            # Check if offset is 0 (could be a different UTC-equivalent timezone)
            offset = dt.utcoffset()
            if offset is None or offset.total_seconds() != 0:
                raise ValueError(
                    f"Datetime must be UTC timezone, got {dt.tzinfo}"
                )

    def _build_rrule(self, parsed: ParsedPattern, dtstart: datetime) -> rrule:
        """
        Build dateutil rrule object from parsed pattern.

        Args:
            parsed: ParsedPattern object
            dtstart: Start datetime

        Returns:
            dateutil rrule object
        """
        freq = self._simplified_patterns[parsed.frequency]

        # Build byweekday parameter
        byweekday = None
        if parsed.byweekday:
            byweekday = []
            for day_str in parsed.byweekday:
                # Handle numeric prefixes like "1MO" (first Monday of month)
                prefix = ""
                day_code = day_str
                for i, char in enumerate(day_str):
                    if char.isalpha():
                        prefix = day_str[:i]
                        day_code = day_str[i:]
                        break

                weekday = WEEKDAY_MAP.get(day_code)
                if weekday:
                    if prefix and prefix != "-":
                        # Nth occurrence (e.g., 1MO = first Monday)
                        n = int(prefix)
                        byweekday.append(weekday(n))
                    elif prefix == "-":
                        # Last occurrence
                        byweekday.append(weekday(-1))
                    else:
                        byweekday.append(weekday)

        # Build rrule
        rule_kwargs = {
            "freq": freq,
            "dtstart": dtstart,
            "interval": parsed.interval,
        }

        if byweekday:
            rule_kwargs["byweekday"] = byweekday

        if parsed.byhour:
            rule_kwargs["byhour"] = parsed.byhour

        return rrule(**rule_kwargs)
