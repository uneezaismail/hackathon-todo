# Phase 6 User Story 3 Integration Tests Verification Checklist

**Status**: ✅ COMPLETE (T058-T061)
**Date**: 2025-12-23
**Engineer**: ChatKit Backend Engineer

---

## Test Implementation Checklist

### T058 [P] - Greeting Handling Test

**File**: `tests/integration/test_agent_behavior.py:969-1011`

- [x] Test function created: `test_agent_greeting_response`
- [x] Uses `@pytest.mark.asyncio` decorator
- [x] Uses correct fixtures: `agent`, `test_user_id`
- [x] Sends "hello" message to agent
- [x] Validates warm greeting response (hi/hello/hey)
- [x] Validates offer to help
- [x] Validates NO tool calls made
- [x] Comprehensive docstring with T058 reference
- [x] Follows existing test patterns from file

**Test Assertions**:
```python
✅ len(response_text) > 0
✅ any(greeting in response_text.lower() for greeting in ["hi", "hello", "hey"])
✅ "help" in response_text.lower()
✅ not tool_calls_made
```

---

### T059 [P] - Gratitude Acknowledgment Test

**File**: `tests/integration/test_agent_behavior.py:1014-1077`

- [x] Test function created: `test_agent_gratitude_acknowledgment`
- [x] Uses `@pytest.mark.asyncio` decorator
- [x] Uses correct fixtures: `agent`, `session`, `test_user_id`
- [x] Multi-turn conversation pattern implemented
- [x] Turn 1: Creates and completes a task (context)
- [x] Turn 2: User says "thank you"
- [x] Validates polite acknowledgment (welcome/happy/glad)
- [x] Validates NO tool calls for gratitude
- [x] Comprehensive docstring with T059 reference
- [x] Follows existing multi-turn patterns

**Test Assertions**:
```python
✅ len(response_text) > 0
✅ any(phrase in response_text.lower() for phrase in ["welcome", "happy to help", "glad"])
✅ not tool_calls_made (only for new messages after history)
```

---

### T060 [P] - Off-Topic Decline Test

**File**: `tests/integration/test_agent_behavior.py:1080-1128`

- [x] Test function created: `test_agent_off_topic_decline`
- [x] Uses `@pytest.mark.asyncio` decorator
- [x] Uses correct fixtures: `agent`, `test_user_id`
- [x] Sends off-topic request: "what's the weather?"
- [x] Validates polite decline (sorry/can't/cannot/specialize)
- [x] Validates mentions task management specialization
- [x] Validates redirects to capabilities
- [x] Validates NO tool calls for off-topic
- [x] Comprehensive docstring with T060 reference
- [x] Follows existing test patterns

**Test Assertions**:
```python
✅ len(response_text) > 0
✅ any(word in response_text.lower() for word in ["sorry", "can't", "cannot", "specialize"])
✅ "task" in response_text.lower()
✅ any(word in response_text.lower() for word in ["help", "can", "manage", "create", "view"])
✅ not tool_calls_made
```

---

### T061 - Capabilities Explanation Test

**File**: `tests/integration/test_agent_behavior.py:1131-1196`

- [x] Test function created: `test_agent_capabilities_explanation`
- [x] Uses `@pytest.mark.asyncio` decorator
- [x] Uses correct fixtures: `agent`, `test_user_id`
- [x] Sends capabilities query: "what can you do?"
- [x] Validates mentions 5 operations:
  - [x] Add/Create tasks (add/create/new)
  - [x] List/View tasks (list/show/view/see)
  - [x] Complete tasks (complete/done/finish)
  - [x] Delete tasks (delete/remove)
  - [x] Update tasks (update/modify/change)
- [x] Validates NO tool calls for capabilities
- [x] Comprehensive docstring with T061 reference
- [x] Follows existing test patterns

**Test Assertions**:
```python
✅ len(response_text) > 0
✅ any(word in response_text.lower() for word in ["add", "create", "new"])
✅ any(word in response_text.lower() for word in ["list", "show", "view", "see"])
✅ any(word in response_text.lower() for word in ["complete", "done", "finish"])
✅ any(word in response_text.lower() for word in ["delete", "remove"])
✅ any(word in response_text.lower() for word in ["update", "modify", "change"])
✅ not tool_calls_made
```

---

## Code Quality Verification

- [x] Python syntax validation passed (py_compile)
- [x] All tests follow async pattern with `@pytest.mark.asyncio`
- [x] All tests use MCP server context manager: `async with agent.mcp_server:`
- [x] All tests use `Runner.run()` for agent execution
- [x] All tests extract response: `result.messages[-1].content`
- [x] All tests validate tool calls: `hasattr(msg, "tool_calls") and msg.tool_calls`
- [x] Consistent assertion patterns across all tests
- [x] Clear, descriptive assertion messages
- [x] Comprehensive docstrings with references to specs

---

## Test Coverage Against Spec

**Reference**: `specs/006-ai-chatbot/contracts/agent-prompt.md`

- [x] T058 covers "Handling Greetings & Social Interactions" → Greetings
- [x] T059 covers "Handling Greetings & Social Interactions" → Gratitude
- [x] T060 covers "Handling Off-Topic Requests"
- [x] T061 covers "Your Capabilities" (5 operations)

**Alignment Score**: 100% ✅

---

## TDD Verification

- [x] Tests written BEFORE implementation (T062-T066)
- [x] Tests are expected to FAIL until agent prompt updated
- [x] Tests validate behavioral requirements, not implementation details
- [x] Tests are independent and can run in any order
- [x] Tests use proper fixtures for isolation
- [x] Tests clean up resources (via fixtures)

---

## Integration with Existing Tests

- [x] Tests added to existing `test_agent_behavior.py` file
- [x] Tests follow Phase 5 patterns (priority detection tests)
- [x] Tests use same fixtures as Phase 4/5 tests
- [x] Tests documented with phase/story references
- [x] Tests marked with [P] for parallel execution
- [x] Total test count: 31 functions (27 existing + 4 new)

---

## Files Modified

1. ✅ `tests/integration/test_agent_behavior.py` (4 new tests, 238 lines added)
2. ✅ `specs/006-ai-chatbot/tasks.md` (T058-T061 marked complete)
3. ✅ `specs/006-ai-chatbot/checklists/phase6-tests-verification.md` (this file)

---

## Success Criteria

✅ **All 4 tests implemented following TDD approach**
✅ **All tests will FAIL until personality implementation (T062-T066)**
✅ **Tests validate agent-prompt.md contract requirements**
✅ **Tests follow project patterns and conventions**
✅ **Tests use proper async patterns with OpenAI Agents SDK**
✅ **Tests validate both response content AND tool call behavior**

---

## Next Steps

1. **T062-T066**: Implement personality guidelines in agent system prompt
   - Update `AGENT_INSTRUCTIONS` in `src/services/chat_service.py`
   - Add greeting handling logic
   - Add gratitude handling logic
   - Add off-topic decline logic
   - Add capabilities explanation logic

2. **Validation**: Run tests to verify they now PASS
   ```bash
   cd phase-3-todo-ai-chatbot/backend
   uv run pytest tests/integration/test_agent_behavior.py::test_agent_greeting_response -v
   uv run pytest tests/integration/test_agent_behavior.py::test_agent_gratitude_acknowledgment -v
   uv run pytest tests/integration/test_agent_behavior.py::test_agent_off_topic_decline -v
   uv run pytest tests/integration/test_agent_behavior.py::test_agent_capabilities_explanation -v
   ```

3. **Manual Testing**: Test via chat interface
   - Send "hello" → Expect warm greeting
   - Complete task, send "thank you" → Expect acknowledgment
   - Send "what's the weather?" → Expect polite decline + redirect
   - Send "what can you do?" → Expect list of 5 operations

4. **Mark Complete**: Update tasks.md when all tests pass

---

## Sign-Off

**Implementation**: ✅ COMPLETE (2025-12-23)
**Engineer**: ChatKit Backend Engineer
**Quality**: All tests follow TDD, align with specs, use proper patterns
**Ready for**: Implementation phase (T062-T066)

---
