"""
Unit tests for RRULE parser service (Phase V - T025).

Tests RRULE pattern parsing and validation:
- DAILY patterns
- WEEKLY patterns with BYDAY
- MONTHLY patterns
- YEARLY patterns
- Custom BYDAY patterns (MO,WE,FR)
- UTC-only timestamp handling
- Leap year edge cases
- Pattern validation

Uses python-dateutil rrule under the hood.
All datetime operations use UTC timezone only.
"""

import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import patch

# Import will work after T028 implementation
# For TDD, we define the expected interface
from src.services.rrule_parser import (
    RRuleParser,
    RRuleParseError,
    SIMPLIFIED_PATTERNS,
)


class TestRRuleParserInit:
    """Test RRuleParser initialization and configuration."""

    def test_parser_initialization(self):
        """Parser can be instantiated."""
        parser = RRuleParser()
        assert parser is not None

    def test_simplified_patterns_available(self):
        """Simplified patterns constant is available."""
        assert "DAILY" in SIMPLIFIED_PATTERNS
        assert "WEEKLY" in SIMPLIFIED_PATTERNS
        assert "MONTHLY" in SIMPLIFIED_PATTERNS
        assert "YEARLY" in SIMPLIFIED_PATTERNS


class TestDailyPatterns:
    """Test DAILY recurrence pattern parsing."""

    def test_parse_daily_simplified(self):
        """Parse simplified 'DAILY' pattern."""
        parser = RRuleParser()
        result = parser.parse_pattern("DAILY")
        assert result is not None
        assert result.frequency == "DAILY"
        assert result.interval == 1

    def test_parse_daily_full_rrule(self):
        """Parse full RRULE string FREQ=DAILY."""
        parser = RRuleParser()
        result = parser.parse_pattern("FREQ=DAILY")
        assert result is not None
        assert result.frequency == "DAILY"
        assert result.interval == 1

    def test_parse_daily_with_interval(self):
        """Parse DAILY pattern with interval > 1."""
        parser = RRuleParser()
        result = parser.parse_pattern("FREQ=DAILY;INTERVAL=3")
        assert result.frequency == "DAILY"
        assert result.interval == 3

    def test_daily_next_occurrence(self):
        """Calculate next occurrence for daily pattern."""
        parser = RRuleParser()
        dtstart = datetime(2025, 1, 15, 10, 0, 0, tzinfo=timezone.utc)

        next_dt = parser.calculate_next_occurrence("DAILY", dtstart)

        assert next_dt is not None
        assert next_dt.tzinfo == timezone.utc
        assert next_dt == datetime(2025, 1, 16, 10, 0, 0, tzinfo=timezone.utc)

    def test_daily_interval_2_next_occurrence(self):
        """Calculate next occurrence for every 2 days pattern."""
        parser = RRuleParser()
        dtstart = datetime(2025, 1, 15, 10, 0, 0, tzinfo=timezone.utc)

        next_dt = parser.calculate_next_occurrence("FREQ=DAILY;INTERVAL=2", dtstart)

        assert next_dt == datetime(2025, 1, 17, 10, 0, 0, tzinfo=timezone.utc)


class TestWeeklyPatterns:
    """Test WEEKLY recurrence pattern parsing."""

    def test_parse_weekly_simplified(self):
        """Parse simplified 'WEEKLY' pattern."""
        parser = RRuleParser()
        result = parser.parse_pattern("WEEKLY")
        assert result is not None
        assert result.frequency == "WEEKLY"
        assert result.interval == 1

    def test_parse_weekly_full_rrule(self):
        """Parse full RRULE string FREQ=WEEKLY."""
        parser = RRuleParser()
        result = parser.parse_pattern("FREQ=WEEKLY")
        assert result.frequency == "WEEKLY"

    def test_parse_weekly_with_byday(self):
        """Parse WEEKLY pattern with BYDAY specification."""
        parser = RRuleParser()
        result = parser.parse_pattern("FREQ=WEEKLY;BYDAY=MO,WE,FR")
        assert result.frequency == "WEEKLY"
        assert "MO" in result.byweekday or result.byweekday is not None

    def test_weekly_next_occurrence(self):
        """Calculate next occurrence for weekly pattern."""
        parser = RRuleParser()
        # Start on a Monday (Jan 13, 2025)
        dtstart = datetime(2025, 1, 13, 10, 0, 0, tzinfo=timezone.utc)

        next_dt = parser.calculate_next_occurrence("WEEKLY", dtstart)

        assert next_dt is not None
        assert next_dt.tzinfo == timezone.utc
        # Next occurrence should be 7 days later
        assert next_dt == datetime(2025, 1, 20, 10, 0, 0, tzinfo=timezone.utc)

    def test_weekly_byday_next_occurrence(self):
        """Calculate next occurrence for weekly pattern with BYDAY."""
        parser = RRuleParser()
        # Start on Monday Jan 13, 2025
        dtstart = datetime(2025, 1, 13, 10, 0, 0, tzinfo=timezone.utc)

        # Weekly on Monday, Wednesday, Friday
        next_dt = parser.calculate_next_occurrence(
            "FREQ=WEEKLY;BYDAY=MO,WE,FR",
            dtstart
        )

        assert next_dt is not None
        assert next_dt.tzinfo == timezone.utc
        # Next should be Wednesday Jan 15
        assert next_dt == datetime(2025, 1, 15, 10, 0, 0, tzinfo=timezone.utc)


class TestMonthlyPatterns:
    """Test MONTHLY recurrence pattern parsing."""

    def test_parse_monthly_simplified(self):
        """Parse simplified 'MONTHLY' pattern."""
        parser = RRuleParser()
        result = parser.parse_pattern("MONTHLY")
        assert result.frequency == "MONTHLY"
        assert result.interval == 1

    def test_parse_monthly_full_rrule(self):
        """Parse full RRULE string FREQ=MONTHLY."""
        parser = RRuleParser()
        result = parser.parse_pattern("FREQ=MONTHLY")
        assert result.frequency == "MONTHLY"

    def test_parse_monthly_with_interval(self):
        """Parse MONTHLY pattern with interval."""
        parser = RRuleParser()
        result = parser.parse_pattern("FREQ=MONTHLY;INTERVAL=2")
        assert result.frequency == "MONTHLY"
        assert result.interval == 2

    def test_monthly_next_occurrence(self):
        """Calculate next occurrence for monthly pattern."""
        parser = RRuleParser()
        dtstart = datetime(2025, 1, 15, 10, 0, 0, tzinfo=timezone.utc)

        next_dt = parser.calculate_next_occurrence("MONTHLY", dtstart)

        assert next_dt is not None
        assert next_dt.tzinfo == timezone.utc
        assert next_dt == datetime(2025, 2, 15, 10, 0, 0, tzinfo=timezone.utc)

    def test_monthly_end_of_month(self):
        """Calculate next occurrence for monthly pattern at end of month."""
        parser = RRuleParser()
        # Jan 31st - Feb doesn't have 31 days
        dtstart = datetime(2025, 1, 31, 10, 0, 0, tzinfo=timezone.utc)

        next_dt = parser.calculate_next_occurrence("MONTHLY", dtstart)

        assert next_dt is not None
        # Should roll to Feb 28 (or handle gracefully)
        assert next_dt.month == 2
        assert next_dt.day <= 28


class TestYearlyPatterns:
    """Test YEARLY recurrence pattern parsing."""

    def test_parse_yearly_simplified(self):
        """Parse simplified 'YEARLY' pattern."""
        parser = RRuleParser()
        result = parser.parse_pattern("YEARLY")
        assert result.frequency == "YEARLY"
        assert result.interval == 1

    def test_parse_yearly_full_rrule(self):
        """Parse full RRULE string FREQ=YEARLY."""
        parser = RRuleParser()
        result = parser.parse_pattern("FREQ=YEARLY")
        assert result.frequency == "YEARLY"

    def test_yearly_next_occurrence(self):
        """Calculate next occurrence for yearly pattern."""
        parser = RRuleParser()
        dtstart = datetime(2025, 3, 15, 10, 0, 0, tzinfo=timezone.utc)

        next_dt = parser.calculate_next_occurrence("YEARLY", dtstart)

        assert next_dt is not None
        assert next_dt.tzinfo == timezone.utc
        assert next_dt == datetime(2026, 3, 15, 10, 0, 0, tzinfo=timezone.utc)


class TestCustomBYDAYPatterns:
    """Test custom BYDAY patterns (MO,WE,FR etc.)."""

    def test_byday_monday_only(self):
        """BYDAY=MO pattern - only Mondays."""
        parser = RRuleParser()
        result = parser.parse_pattern("FREQ=WEEKLY;BYDAY=MO")
        assert result is not None

    def test_byday_weekend(self):
        """BYDAY=SA,SU pattern - weekends only."""
        parser = RRuleParser()
        result = parser.parse_pattern("FREQ=WEEKLY;BYDAY=SA,SU")
        assert result is not None

    def test_byday_weekdays(self):
        """BYDAY=MO,TU,WE,TH,FR pattern - weekdays only."""
        parser = RRuleParser()
        result = parser.parse_pattern("FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR")
        assert result is not None

    def test_byday_with_byhour(self):
        """Pattern with both BYDAY and BYHOUR."""
        parser = RRuleParser()
        # This is a more complex pattern
        result = parser.parse_pattern("FREQ=WEEKLY;BYDAY=MO,WE,FR;BYHOUR=9")
        assert result is not None


class TestUTCOnlyHandling:
    """Test that all datetime operations use UTC only."""

    def test_next_occurrence_returns_utc(self):
        """Next occurrence always returns UTC timezone."""
        parser = RRuleParser()
        dtstart = datetime(2025, 1, 15, 10, 0, 0, tzinfo=timezone.utc)

        next_dt = parser.calculate_next_occurrence("DAILY", dtstart)

        assert next_dt.tzinfo == timezone.utc

    def test_naive_datetime_raises_error(self):
        """Naive datetime (no timezone) raises error."""
        parser = RRuleParser()
        dtstart = datetime(2025, 1, 15, 10, 0, 0)  # No timezone!

        with pytest.raises(ValueError, match="UTC"):
            parser.calculate_next_occurrence("DAILY", dtstart)

    def test_non_utc_timezone_raises_error(self):
        """Non-UTC timezone raises error."""
        parser = RRuleParser()
        # Create a non-UTC timezone
        from datetime import timedelta

        class EST(timezone):
            def __init__(self):
                super().__init__(timedelta(hours=-5))

        dtstart = datetime(2025, 1, 15, 10, 0, 0, tzinfo=EST())

        with pytest.raises(ValueError, match="UTC"):
            parser.calculate_next_occurrence("DAILY", dtstart)

    def test_utc_timestamp_format(self):
        """Timestamps are formatted correctly with Z suffix."""
        parser = RRuleParser()
        dtstart = datetime(2025, 1, 15, 10, 0, 0, tzinfo=timezone.utc)

        next_dt = parser.calculate_next_occurrence("DAILY", dtstart)

        # Format should work with ISO format
        formatted = next_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        assert formatted.endswith("Z")


class TestLeapYearEdgeCases:
    """Test leap year handling."""

    def test_leap_year_feb_28_to_29(self):
        """Feb 28 in leap year to Feb 29 (daily)."""
        parser = RRuleParser()
        # 2024 is a leap year
        dtstart = datetime(2024, 2, 28, 10, 0, 0, tzinfo=timezone.utc)

        next_dt = parser.calculate_next_occurrence("DAILY", dtstart)

        assert next_dt == datetime(2024, 2, 29, 10, 0, 0, tzinfo=timezone.utc)

    def test_leap_year_feb_29_to_march_1(self):
        """Feb 29 in leap year to March 1 (daily)."""
        parser = RRuleParser()
        dtstart = datetime(2024, 2, 29, 10, 0, 0, tzinfo=timezone.utc)

        next_dt = parser.calculate_next_occurrence("DAILY", dtstart)

        assert next_dt == datetime(2024, 3, 1, 10, 0, 0, tzinfo=timezone.utc)

    def test_non_leap_year_feb_28_to_march_1(self):
        """Feb 28 in non-leap year to March 1 (daily)."""
        parser = RRuleParser()
        # 2025 is NOT a leap year
        dtstart = datetime(2025, 2, 28, 10, 0, 0, tzinfo=timezone.utc)

        next_dt = parser.calculate_next_occurrence("DAILY", dtstart)

        assert next_dt == datetime(2025, 3, 1, 10, 0, 0, tzinfo=timezone.utc)

    def test_yearly_feb_29_leap_to_non_leap(self):
        """Yearly recurrence on Feb 29 from leap to non-leap year."""
        parser = RRuleParser()
        # 2024 leap year, 2025 non-leap year
        dtstart = datetime(2024, 2, 29, 10, 0, 0, tzinfo=timezone.utc)

        next_dt = parser.calculate_next_occurrence("YEARLY", dtstart)

        # Should be Feb 28 in 2025 (or March 1 depending on implementation)
        assert next_dt.year == 2025
        assert next_dt.month in [2, 3]  # Either Feb 28 or March 1 is acceptable


class TestPatternValidation:
    """Test pattern validation and error handling."""

    def test_valid_simplified_patterns(self):
        """All simplified patterns are valid."""
        parser = RRuleParser()

        for pattern in ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]:
            assert parser.validate_pattern(pattern) is True

    def test_valid_full_rrule_patterns(self):
        """Full RRULE patterns are valid."""
        parser = RRuleParser()

        valid_patterns = [
            "FREQ=DAILY",
            "FREQ=WEEKLY",
            "FREQ=MONTHLY",
            "FREQ=YEARLY",
            "FREQ=DAILY;INTERVAL=2",
            "FREQ=WEEKLY;BYDAY=MO,WE,FR",
        ]

        for pattern in valid_patterns:
            assert parser.validate_pattern(pattern) is True, f"Pattern should be valid: {pattern}"

    def test_invalid_pattern_returns_false(self):
        """Invalid patterns return False from validate_pattern."""
        parser = RRuleParser()

        invalid_patterns = [
            "INVALID",
            "FREQ=INVALID",
            "",
            "   ",
            "HOURLY",  # Not supported in our simplified set
        ]

        for pattern in invalid_patterns:
            assert parser.validate_pattern(pattern) is False, f"Pattern should be invalid: {pattern}"

    def test_parse_invalid_pattern_raises_error(self):
        """Parsing invalid pattern raises RRuleParseError."""
        parser = RRuleParser()

        with pytest.raises(RRuleParseError):
            parser.parse_pattern("INVALID_PATTERN")

    def test_empty_pattern_raises_error(self):
        """Empty pattern raises RRuleParseError."""
        parser = RRuleParser()

        with pytest.raises(RRuleParseError):
            parser.parse_pattern("")

    def test_none_pattern_raises_error(self):
        """None pattern raises RRuleParseError."""
        parser = RRuleParser()

        with pytest.raises((RRuleParseError, TypeError)):
            parser.parse_pattern(None)


class TestEndDateHandling:
    """Test end date boundary handling."""

    def test_next_occurrence_before_end_date(self):
        """Next occurrence returned when before end date."""
        parser = RRuleParser()
        dtstart = datetime(2025, 1, 15, 10, 0, 0, tzinfo=timezone.utc)
        end_date = datetime(2025, 12, 31, 23, 59, 59, tzinfo=timezone.utc)

        next_dt = parser.calculate_next_occurrence("DAILY", dtstart, end_date=end_date)

        assert next_dt is not None
        assert next_dt < end_date

    def test_next_occurrence_after_end_date_returns_none(self):
        """Returns None when next occurrence would be after end date."""
        parser = RRuleParser()
        dtstart = datetime(2025, 12, 31, 10, 0, 0, tzinfo=timezone.utc)
        end_date = datetime(2025, 12, 31, 23, 59, 59, tzinfo=timezone.utc)

        next_dt = parser.calculate_next_occurrence("DAILY", dtstart, end_date=end_date)

        # Next occurrence would be Jan 1, 2026, which is after end_date
        assert next_dt is None

    def test_next_occurrence_exactly_at_end_date(self):
        """Edge case: next occurrence exactly at end date."""
        parser = RRuleParser()
        dtstart = datetime(2025, 12, 30, 10, 0, 0, tzinfo=timezone.utc)
        end_date = datetime(2025, 12, 31, 10, 0, 0, tzinfo=timezone.utc)

        next_dt = parser.calculate_next_occurrence("DAILY", dtstart, end_date=end_date)

        # Should return the occurrence at exactly end_date
        assert next_dt == end_date


class TestCaseInsensitivity:
    """Test that pattern parsing is case-insensitive."""

    def test_lowercase_simplified_patterns(self):
        """Lowercase simplified patterns are valid."""
        parser = RRuleParser()

        for pattern in ["daily", "weekly", "monthly", "yearly"]:
            assert parser.validate_pattern(pattern) is True

    def test_mixed_case_simplified_patterns(self):
        """Mixed case simplified patterns are valid."""
        parser = RRuleParser()

        for pattern in ["Daily", "WeEkLy", "MONTHLY", "YeArLy"]:
            assert parser.validate_pattern(pattern) is True

    def test_lowercase_freq(self):
        """Lowercase FREQ is valid."""
        parser = RRuleParser()
        assert parser.validate_pattern("freq=daily") is True


class TestParsedPatternObject:
    """Test the ParsedPattern return object."""

    def test_parsed_pattern_has_frequency(self):
        """Parsed pattern has frequency attribute."""
        parser = RRuleParser()
        result = parser.parse_pattern("DAILY")
        assert hasattr(result, "frequency")
        assert result.frequency == "DAILY"

    def test_parsed_pattern_has_interval(self):
        """Parsed pattern has interval attribute."""
        parser = RRuleParser()
        result = parser.parse_pattern("FREQ=DAILY;INTERVAL=3")
        assert hasattr(result, "interval")
        assert result.interval == 3

    def test_parsed_pattern_default_interval(self):
        """Parsed pattern has default interval of 1."""
        parser = RRuleParser()
        result = parser.parse_pattern("DAILY")
        assert result.interval == 1

    def test_parsed_pattern_has_byweekday(self):
        """Parsed pattern has byweekday attribute."""
        parser = RRuleParser()
        result = parser.parse_pattern("FREQ=WEEKLY;BYDAY=MO,WE,FR")
        assert hasattr(result, "byweekday")

    def test_parsed_pattern_to_rrule_string(self):
        """Parsed pattern can be converted to RRULE string."""
        parser = RRuleParser()
        result = parser.parse_pattern("FREQ=DAILY;INTERVAL=2")

        # Should have a method to convert back to string
        assert hasattr(result, "to_rrule_string")
        rrule_str = result.to_rrule_string()
        assert "FREQ=DAILY" in rrule_str
        assert "INTERVAL=2" in rrule_str
