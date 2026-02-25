# Priority Detection Tests - Phase 5 User Story 2 (T049-T052)

## Overview

Comprehensive test suite for AI agent automatic priority detection from natural language urgency keywords. Tests follow **Test-Driven Development (TDD)** approach - all tests will **FAIL initially** until implementation in T053-T057.

## Test Organization

### Unit Tests: `tests/unit/test_priority_detection.py`
- **Purpose**: Test priority detection logic in isolation
- **Lines of Code**: 465
- **Test Classes**: 5
- **Total Test Cases**: 30+
- **Status**: ❌ **WILL FAIL** (awaiting implementation)

### Integration Tests: `tests/integration/test_agent_behavior.py`
- **Purpose**: Test end-to-end agent behavior with real MCP tools
- **New Tests Added**: 18 tests (T052)
- **Total Lines**: 963 (integrated with existing agent tests)
- **Status**: ❌ **WILL FAIL** (awaiting implementation)

---

## Unit Test Coverage (T049-T051)

### T049: High Priority Detection (`TestHighPriorityDetection`)

Tests that high priority keywords trigger `priority="high"`:

**Keywords Tested**:
- `urgent`
- `ASAP`
- `critical`
- `emergency`
- `immediately`
- `today`
- `important`
- `must`

**Test Cases**:
1. ✅ `test_high_priority_keywords` - Parametrized test for all 8 keywords
2. ✅ `test_high_priority_in_context` - Keywords in natural sentences
3. ✅ `test_high_priority_case_insensitive` - Case variations (URGENT, urgent, Urgent)
4. ✅ `test_multiple_high_priority_keywords` - Multiple keywords in one message

**Example**:
```python
text = "Add urgent task to fix production bug"
priority = detect_priority_from_text(text)
assert priority == "high"  # WILL FAIL until T053-T057
```

---

### T050: Low Priority Detection (`TestLowPriorityDetection`)

Tests that low priority phrases trigger `priority="low"`:

**Phrases Tested**:
- `when you have time`
- `someday`
- `eventually`
- `low priority`
- `if possible`
- `maybe`

**Test Cases**:
1. ✅ `test_low_priority_keywords` - Parametrized test for all 6 phrases
2. ✅ `test_low_priority_in_context` - Phrases in natural sentences
3. ✅ `test_low_priority_case_insensitive` - Case variations

**Example**:
```python
text = "Add task to clean garage someday"
priority = detect_priority_from_text(text)
assert priority == "low"  # WILL FAIL until T053-T057
```

---

### T051: Medium Priority Default (`TestMediumPriorityDefault`)

Tests that neutral descriptions default to `priority="medium"`:

**Test Cases**:
1. ✅ `test_medium_priority_default` - Common neutral task descriptions
2. ✅ `test_empty_string_defaults_to_medium` - Empty/whitespace handling
3. ✅ `test_medium_priority_with_similar_but_non_matching_words` - False positive prevention

**Example**:
```python
text = "Add task to buy groceries"  # No urgency keywords
priority = detect_priority_from_text(text)
assert priority == "medium"  # WILL FAIL until T053-T057
```

---

### Edge Cases (`TestPriorityDetectionEdgeCases`)

**Test Cases**:
1. ✅ `test_conflicting_keywords_high_wins` - High priority wins over low
2. ✅ `test_special_characters_dont_break_detection` - Punctuation handling
3. ✅ `test_long_text_with_keywords` - Keywords in long passages
4. ✅ `test_numbers_and_dates_dont_interfere` - Numbers/dates don't break detection

---

## Integration Test Coverage (T052)

### High Priority Integration Tests

Tests agent detects high priority keywords and creates tasks with `priority="high"`:

1. ✅ `test_agent_high_priority_urgent_keyword` - "urgent" → high priority
2. ✅ `test_agent_high_priority_asap_keyword` - "ASAP" → high priority
3. ✅ `test_agent_high_priority_critical_keyword` - "critical" → high priority
4. ✅ `test_agent_high_priority_emergency_keyword` - "emergency" → high priority
5. ✅ `test_agent_high_priority_immediately_keyword` - "immediately" → high priority

**Validation Points**:
- ✅ Agent calls `add_task` tool with correct priority parameter
- ✅ Task created in database with correct priority
- ✅ Response is natural language (not technical)
- ✅ MCP server connection works correctly

---

### Low Priority Integration Tests

Tests agent detects low priority phrases and creates tasks with `priority="low"`:

1. ✅ `test_agent_low_priority_someday_keyword` - "someday" → low priority
2. ✅ `test_agent_low_priority_when_you_have_time` - "when you have time" → low priority
3. ✅ `test_agent_low_priority_eventually_keyword` - "eventually" → low priority
4. ✅ `test_agent_low_priority_maybe_keyword` - "maybe" → low priority

**Validation Points**:
- ✅ Agent analyzes multi-word phrases correctly
- ✅ Phrases work anywhere in sentence (start, middle, end)
- ✅ Database task has `priority="low"`

---

### Medium Priority Integration Tests

Tests agent defaults to medium priority when no keywords present:

1. ✅ `test_agent_medium_priority_default` - Neutral description → medium priority
2. ✅ `test_agent_medium_priority_neutral_description` - Multiple neutral examples

**Validation Points**:
- ✅ No keywords = medium priority
- ✅ Common task descriptions work correctly
- ✅ Consistency across multiple test cases

---

### Edge Case Integration Tests

Tests complex scenarios with real agent:

1. ✅ `test_agent_priority_multiple_high_keywords` - Multiple high keywords → still high
2. ✅ `test_agent_priority_conflicting_keywords_high_wins` - High wins over low
3. ✅ `test_agent_priority_case_insensitive` - URGENT, urgent, Urgent all work
4. ✅ `test_agent_priority_with_special_characters` - Punctuation doesn't break detection

---

## Test Execution

### Prerequisites

```bash
# Environment variables required
export OPENAI_API_KEY="sk-..."          # Required for agent tests
export BETTER_AUTH_SECRET="test-secret" # Required for JWT
export DATABASE_URL="sqlite:///:memory:" # Test database
```

### Run Unit Tests (T049-T051)

```bash
cd backend
uv run pytest tests/unit/test_priority_detection.py -v
```

**Expected Output** (before implementation):
```
FAILED tests/unit/test_priority_detection.py::TestHighPriorityDetection::test_high_priority_keywords[urgent] - NotImplementedError: Priority detection logic not yet implemented
FAILED tests/unit/test_priority_detection.py::TestHighPriorityDetection::test_high_priority_keywords[ASAP] - NotImplementedError: Priority detection logic not yet implemented
...
```

---

### Run Integration Tests (T052)

```bash
cd backend
uv run pytest tests/integration/test_agent_behavior.py::test_agent_high_priority_urgent_keyword -v
```

**Expected Output** (before implementation):
```
FAILED - AssertionError: Task should have high priority due to 'urgent' keyword
```

---

### Skip Agent Tests (if no API key)

```bash
export SKIP_AGENT_TESTS=1
uv run pytest tests/integration/test_agent_behavior.py -v
```

---

## Implementation Checklist

### Phase 5 User Story 2 - Implementation Tasks

- [ ] **T049** ✅ Unit tests for high priority detection created (DONE)
- [ ] **T050** ✅ Unit tests for low priority detection created (DONE)
- [ ] **T051** ✅ Unit tests for medium priority default created (DONE)
- [ ] **T052** ✅ Integration tests for agent priority detection created (DONE)
- [ ] **T053** ⏳ Implement `detect_priority_from_text()` function (PENDING)
- [ ] **T054** ⏳ Update agent instructions for priority detection (PENDING)
- [ ] **T055** ⏳ Integrate priority detection with MCP `add_task` tool (PENDING)
- [ ] **T056** ⏳ Add priority detection to agent message processing (PENDING)
- [ ] **T057** ⏳ Verify all tests pass after implementation (PENDING)

---

## Priority Detection Rules (Requirements)

### High Priority Keywords
Trigger when user message contains:
- `urgent`
- `ASAP`
- `critical`
- `emergency`
- `immediately`
- `today`
- `important`
- `must`

**Result**: `priority="high"`

---

### Low Priority Phrases
Trigger when user message contains:
- `when you have time`
- `someday`
- `eventually`
- `low priority`
- `if possible`
- `maybe`

**Result**: `priority="low"`

---

### Medium Priority (Default)
Trigger when:
- No high or low priority keywords detected
- Empty or whitespace-only input
- Neutral task descriptions

**Result**: `priority="medium"`

---

### Conflict Resolution
When both high and low priority indicators present:
- **High priority ALWAYS wins**
- Example: "This is urgent but maybe later" → `priority="high"`

---

## Test File Structure

```
phase-3-todo-ai-chatbot/backend/tests/
├── unit/
│   └── test_priority_detection.py          # T049, T050, T051 (465 lines)
│       ├── TestHighPriorityDetection        # 4 test methods
│       ├── TestLowPriorityDetection         # 3 test methods
│       ├── TestMediumPriorityDefault        # 3 test methods
│       └── TestPriorityDetectionEdgeCases   # 4 test methods
│
└── integration/
    └── test_agent_behavior.py               # T052 (963 lines total)
        ├── [Existing Phase 4 tests]
        └── [NEW: 18 priority detection tests]
```

---

## Success Criteria

### Unit Tests (T049-T051)
✅ All 30+ unit tests pass after implementation
✅ 100% keyword coverage (high, low, medium)
✅ Edge cases handled correctly
✅ No false positives/negatives

### Integration Tests (T052)
✅ All 18 integration tests pass
✅ Agent correctly interprets urgency keywords
✅ MCP `add_task` tool receives correct priority parameter
✅ Database tasks have correct priority values
✅ Natural language responses maintained

---

## Related Files

### Implementation Files (T053-T057)
- `/mnt/d/hackathon-todo/phase-3-todo-ai-chatbot/backend/src/services/chat_service.py`
  - Update `AGENT_INSTRUCTIONS` with priority detection rules
  - Add `detect_priority_from_text()` function

- `/mnt/d/hackathon-todo/phase-3-todo-ai-chatbot/backend/mcp_server/tools.py`
  - Update `add_task` tool to handle priority parameter
  - Ensure priority normalization (lowercase)

---

## Notes for Implementation (T053-T057)

1. **Keyword Matching**:
   - Must be case-insensitive
   - Handle punctuation (urgent!, urgent?, etc.)
   - Support multi-word phrases ("when you have time")

2. **Priority Precedence**:
   - High > Low > Medium
   - Multiple high keywords → still high
   - Conflicting keywords → high wins

3. **Integration Points**:
   - Agent analyzes user message before tool call
   - Priority passed to `add_task` MCP tool
   - Database validates priority enum: High, Medium, Low

4. **Testing Strategy**:
   - Run unit tests after implementing `detect_priority_from_text()`
   - Run integration tests after updating agent instructions
   - Verify no regression in existing agent behavior tests

---

## Test Statistics

| Metric | Value |
|--------|-------|
| Total Test Files | 2 |
| Unit Tests Created | 14 test methods |
| Integration Tests Created | 18 test methods |
| Total Test Cases | 32+ (with parametrize) |
| Lines of Test Code | 1,428 |
| Keywords Tested | 14 unique keywords/phrases |
| Edge Cases Covered | 8 scenarios |

---

## Contact & Questions

- **Test Coverage**: Both unit and integration tests comprehensive
- **TDD Approach**: Tests written BEFORE implementation (will fail initially)
- **Next Steps**: Proceed to T053-T057 for implementation
- **Expected Timeline**: Tests should pass after T053-T057 complete

---

**Status**: ✅ **T049-T052 COMPLETE** (Tests created, awaiting implementation)
**Next**: T053-T057 (Implement priority detection logic)
