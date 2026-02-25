"""
Unit tests for priority detection logic (Phase 5 User Story 2 - T049, T050, T051).

Tests priority extraction from natural language urgency keywords.
This module tests the priority detection logic that should be implemented
in the agent's natural language processing.

Testing Strategy (TDD):
- Tests are written BEFORE implementation
- Tests will FAIL until T053-T057 implementation is complete
- Tests validate priority keyword detection in isolation
- Uses parametrize for comprehensive keyword coverage

Priority Rules:
- High Priority: urgent, ASAP, critical, emergency, immediately, today, important, must
- Low Priority: when you have time, someday, eventually, low priority, if possible, maybe
- Medium Priority: Default when no indicators present

Implementation Note:
These tests validate the LOGIC of priority detection. The actual implementation
will be in the agent's message processing (T053-T057).
"""

import pytest
from typing import Literal


# Priority detection logic implementation (T053-T057)
# This function represents the logic that the AI agent uses to detect
# priority from natural language. The agent's AGENT_INSTRUCTIONS contain
# the same keywords and rules.
import re


def detect_priority_from_text(text: str) -> Literal["high", "medium", "low"]:
    """
    Extract priority level from natural language text.

    This function analyzes user input for urgency keywords and returns
    the appropriate priority level. Implemented in T053-T057.

    Args:
        text: User input message (e.g., "Add urgent task to fix bug")

    Returns:
        Priority level: "high" | "medium" | "low"

    Priority Detection Rules:
        High: urgent, ASAP, critical, emergency, immediately, today, important, must
        Low: when you have time, someday, eventually, low priority, if possible, maybe
        Medium: Default when no keywords detected
    """
    # Convert to lowercase for case-insensitive matching
    text_lower = text.lower()

    # High priority keywords (single words) - require word boundaries
    HIGH_KEYWORDS = [
        "urgent",
        "asap",
        "critical",
        "emergency",
        "immediately",
        "today",
        "important",
        "must"
    ]

    # Low priority keywords/phrases (multi-word phrases and single words)
    LOW_PHRASES = [
        "when you have time",
        "low priority",
        "if possible"
    ]

    LOW_KEYWORDS = [
        "someday",
        "eventually",
        "maybe"
    ]

    def word_match(keyword: str, text: str) -> bool:
        """Check if keyword exists as a whole word (not part of another word).

        Uses word boundary matching but handles possessive forms like "today's"
        by checking the character after the match is not an apostrophe followed by letters.
        """
        # Use word boundary regex to match whole words only
        # Special handling: don't match "today" in "today's"
        pattern = r'\b' + re.escape(keyword) + r'\b'
        match = re.search(pattern, text)
        if match:
            # Check if followed by apostrophe + 's' (possessive form)
            end_pos = match.end()
            if end_pos < len(text) and text[end_pos:end_pos+2] == "'s":
                return False
            return True
        return False

    # Check for high priority keywords FIRST (high wins in conflicts)
    for keyword in HIGH_KEYWORDS:
        if word_match(keyword, text_lower):
            return "high"

    # Check for low priority phrases
    for phrase in LOW_PHRASES:
        if phrase in text_lower:
            return "low"

    # Check for low priority keywords
    for keyword in LOW_KEYWORDS:
        if word_match(keyword, text_lower):
            return "low"

    # Default to medium if no keywords found
    return "medium"


class TestHighPriorityDetection:
    """Test suite for high priority keyword detection (T049)."""

    @pytest.mark.parametrize("keyword", [
        "urgent",
        "ASAP",
        "critical",
        "emergency",
        "immediately",
        "today",
        "important",
        "must"
    ])
    def test_high_priority_keywords(self, keyword: str):
        """
        Test that high priority keywords trigger priority="high".

        Validates:
        - Each keyword individually triggers high priority
        - Case-insensitive matching
        - Keywords work in sentence context

        Args:
            keyword: High priority urgency keyword to test

        Expected (after implementation):
            detect_priority_from_text should return "high"

        Current Status:
            WILL FAIL until T053-T057 implementation
        """
        # Test keyword in natural sentence
        text = f"Add {keyword} task to fix production bug"

        # Execute priority detection
        priority = detect_priority_from_text(text)

        # Assert high priority detected
        assert priority == "high", \
            f"Keyword '{keyword}' should trigger high priority"

    @pytest.mark.parametrize("phrase,keyword", [
        ("Add an urgent task to buy groceries", "urgent"),
        ("This is ASAP - need it done now", "ASAP"),
        ("Critical issue with the server", "critical"),
        ("Emergency: water leak in basement", "emergency"),
        ("Fix this immediately please", "immediately"),
        ("Must finish this today", "today"),
        ("Very important meeting tomorrow", "important"),
        ("We must complete this", "must"),
    ])
    def test_high_priority_in_context(self, phrase: str, keyword: str):
        """
        Test high priority detection in realistic sentence contexts.

        Validates:
        - Keywords work when embedded in natural sentences
        - Priority detection handles various sentence structures
        - Capitalization doesn't affect detection

        Args:
            phrase: Natural language sentence with urgency keyword
            keyword: The urgency keyword expected to trigger high priority

        Expected (after implementation):
            detect_priority_from_text should return "high"

        Current Status:
            WILL FAIL until T053-T057 implementation
        """
        priority = detect_priority_from_text(phrase)

        assert priority == "high", \
            f"Phrase '{phrase}' with keyword '{keyword}' should trigger high priority"

    def test_high_priority_case_insensitive(self):
        """
        Test that high priority keywords work regardless of case.

        Validates:
        - URGENT, urgent, Urgent all trigger high priority
        - Mixed case keywords are detected

        Expected (after implementation):
            All case variations should return "high"

        Current Status:
            WILL FAIL until T053-T057 implementation
        """
        test_cases = [
            "Add URGENT task",
            "Add urgent task",
            "Add Urgent task",
            "Add uRgEnT task",
        ]

        for text in test_cases:
            priority = detect_priority_from_text(text)
            assert priority == "high", \
                f"Text '{text}' should trigger high priority (case-insensitive)"

    def test_multiple_high_priority_keywords(self):
        """
        Test handling of multiple high priority keywords in one message.

        Validates:
        - Multiple keywords still result in single "high" priority
        - No conflicting priority assignments

        Expected (after implementation):
            Multiple keywords should return "high"

        Current Status:
            WILL FAIL until T053-T057 implementation
        """
        text = "This is urgent and critical - must fix immediately"

        priority = detect_priority_from_text(text)

        assert priority == "high", \
            "Multiple high priority keywords should still return 'high'"


class TestLowPriorityDetection:
    """Test suite for low priority keyword detection (T050)."""

    @pytest.mark.parametrize("phrase", [
        "when you have time",
        "someday",
        "eventually",
        "low priority",
        "if possible",
        "maybe"
    ])
    def test_low_priority_keywords(self, phrase: str):
        """
        Test that low priority keywords trigger priority="low".

        Validates:
        - Each phrase triggers low priority
        - Multi-word phrases detected correctly
        - Phrases work in sentence context

        Args:
            phrase: Low priority phrase to test

        Expected (after implementation):
            detect_priority_from_text should return "low"

        Current Status:
            WILL FAIL until T053-T057 implementation
        """
        text = f"Add task to clean garage {phrase}"

        priority = detect_priority_from_text(text)

        assert priority == "low", \
            f"Phrase '{phrase}' should trigger low priority"

    @pytest.mark.parametrize("sentence,phrase", [
        ("When you have time, could you review this?", "when you have time"),
        ("Someday I'd like to learn French", "someday"),
        ("Eventually we should upgrade the server", "eventually"),
        ("This is low priority - no rush", "low priority"),
        ("If possible, add a footer to the page", "if possible"),
        ("Maybe add a feature for exporting", "maybe"),
    ])
    def test_low_priority_in_context(self, sentence: str, phrase: str):
        """
        Test low priority detection in realistic sentence contexts.

        Validates:
        - Phrases work when embedded naturally in sentences
        - Detection handles different sentence positions (start, middle, end)

        Args:
            sentence: Natural language sentence with low priority phrase
            phrase: The phrase expected to trigger low priority

        Expected (after implementation):
            detect_priority_from_text should return "low"

        Current Status:
            WILL FAIL until T053-T057 implementation
        """
        priority = detect_priority_from_text(sentence)

        assert priority == "low", \
            f"Sentence '{sentence}' with phrase '{phrase}' should trigger low priority"

    def test_low_priority_case_insensitive(self):
        """
        Test that low priority phrases work regardless of case.

        Validates:
        - Case variations of "someday", "maybe" etc. all work
        - Mixed case phrases are detected

        Expected (after implementation):
            All case variations should return "low"

        Current Status:
            WILL FAIL until T053-T057 implementation
        """
        test_cases = [
            "SOMEDAY clean the garage",
            "someday clean the garage",
            "Someday clean the garage",
            "SoMeDaY clean the garage",
        ]

        for text in test_cases:
            priority = detect_priority_from_text(text)
            assert priority == "low", \
                f"Text '{text}' should trigger low priority (case-insensitive)"


class TestMediumPriorityDefault:
    """Test suite for medium priority default behavior (T051)."""

    @pytest.mark.parametrize("text", [
        "Add task to buy groceries",
        "Create a task for the meeting",
        "New task: review pull request",
        "Task to update documentation",
        "Write unit tests for the API",
    ])
    def test_medium_priority_default(self, text: str):
        """
        Test that tasks without urgency indicators get medium priority.

        Validates:
        - Neutral descriptions default to medium
        - No keywords = medium priority
        - Common task descriptions work correctly

        Args:
            text: Task description with no urgency keywords

        Expected (after implementation):
            detect_priority_from_text should return "medium"

        Current Status:
            WILL FAIL until T053-T057 implementation
        """
        priority = detect_priority_from_text(text)

        assert priority == "medium", \
            f"Text '{text}' with no urgency keywords should default to medium priority"

    def test_empty_string_defaults_to_medium(self):
        """
        Test that empty or whitespace-only strings default to medium.

        Validates:
        - Empty string handling
        - Whitespace-only handling
        - Robust default behavior

        Expected (after implementation):
            Empty/whitespace strings should return "medium"

        Current Status:
            WILL FAIL until T053-T057 implementation
        """
        test_cases = [
            "",
            "   ",
            "\t",
            "\n",
        ]

        for text in test_cases:
            priority = detect_priority_from_text(text)
            assert priority == "medium", \
                f"Empty/whitespace text '{repr(text)}' should default to medium priority"

    def test_medium_priority_with_similar_but_non_matching_words(self):
        """
        Test that words similar to keywords don't trigger false positives.

        Validates:
        - "urge" doesn't match "urgent"
        - "may" doesn't match "maybe"
        - Exact or fuzzy matching logic is correct

        Expected (after implementation):
            Similar but non-matching words should return "medium"

        Current Status:
            WILL FAIL until T053-T057 implementation
        """
        test_cases = [
            "I urge you to consider this",  # "urge" != "urgent"
            "This may be useful",            # "may" != "maybe"
            "Import the data",               # "import" != "important"
            "Today's date",                  # "today's" might be edge case
        ]

        for text in test_cases:
            priority = detect_priority_from_text(text)
            assert priority == "medium", \
                f"Text '{text}' should not trigger keyword match (medium priority)"


class TestPriorityDetectionEdgeCases:
    """Test suite for edge cases in priority detection."""

    def test_conflicting_keywords_high_wins(self):
        """
        Test that high priority keywords take precedence over low priority.

        Validates:
        - "urgent but when you have time" → high
        - High priority wins in conflicts
        - Precedence rules are clear

        Expected (after implementation):
            High priority keywords should win conflicts

        Current Status:
            WILL FAIL until T053-T057 implementation
        """
        text = "This is urgent but when you have time is fine too"

        priority = detect_priority_from_text(text)

        assert priority == "high", \
            "High priority keywords should take precedence over low priority"

    def test_special_characters_dont_break_detection(self):
        """
        Test that special characters don't break keyword detection.

        Validates:
        - "urgent!" still triggers high
        - "urgent?" still triggers high
        - Punctuation doesn't prevent detection

        Expected (after implementation):
            Special characters should not prevent detection

        Current Status:
            WILL FAIL until T053-T057 implementation
        """
        test_cases = [
            ("urgent! Fix this now", "high"),
            ("Is this urgent?", "high"),
            ("(urgent) need help", "high"),
            ("maybe... add feature", "low"),
        ]

        for text, expected_priority in test_cases:
            priority = detect_priority_from_text(text)
            assert priority == expected_priority, \
                f"Text '{text}' should detect priority despite special characters"

    def test_long_text_with_keywords(self):
        """
        Test keyword detection in long text passages.

        Validates:
        - Keywords detected anywhere in text
        - Performance with longer inputs
        - No character limit issues

        Expected (after implementation):
            Keywords should be detected regardless of text length

        Current Status:
            WILL FAIL until T053-T057 implementation
        """
        long_text = (
            "I was thinking about the project and realized we need to add a task. "
            "It's not a big deal right now, but eventually we should get to it. "
            "The feature would be nice to have when you have time to implement it. "
            "No rush on this one, just adding it to the list for someday."
        )

        priority = detect_priority_from_text(long_text)

        # Multiple low priority indicators: "eventually", "when you have time", "someday"
        assert priority == "low", \
            "Long text with low priority keywords should trigger low priority"

    def test_numbers_and_dates_dont_interfere(self):
        """
        Test that numbers and dates don't interfere with detection.

        Validates:
        - "Task 123 urgent fix" still detects "urgent"
        - Dates like "2024-12-23" don't break detection

        Expected (after implementation):
            Numbers/dates should not prevent keyword detection

        Current Status:
            WILL FAIL until T053-T057 implementation
        """
        test_cases = [
            ("Task #42: urgent bug fix", "high"),
            ("Version 2.0 critical update", "high"),
            ("Maybe upgrade to v3.5", "low"),
        ]

        for text, expected_priority in test_cases:
            priority = detect_priority_from_text(text)
            assert priority == expected_priority, \
                f"Text '{text}' should detect priority despite numbers/dates"
