# Test Suite Summary - Phase 4 User Story 1

## Overview

Comprehensive test suite for Natural Language Task Management (Phase 4 User Story 1) backend implementation.

**Coverage:**
- **T028-T032:** Unit tests for all 5 MCP tools
- **T033-T035:** Integration tests for AI agent behavior

## Files Created

### 1. `/tests/unit/test_mcp_tools.py` (644 lines)

Unit tests for MCP tools with mocked dependencies.

**Test Classes:**
- `TestAddTask` (3 tests)
  - `test_add_task_success` - Validates task creation flow
  - `test_add_task_user_validation` - Validates user_id is required
  - `test_add_task_priority_parameter` - Tests priority normalization (High/Medium/Low)

- `TestListTasks` (4 tests)
  - `test_list_tasks_success` - Validates task listing
  - `test_list_tasks_user_isolation` - Validates user data isolation
  - `test_list_tasks_empty_results` - Tests empty list handling
  - `test_list_tasks_status_filtering` - Tests pending/completed/all filters

- `TestCompleteTask` (3 tests)
  - `test_complete_task_success` - Validates task completion
  - `test_complete_task_not_found` - Tests TaskNotFoundError handling
  - `test_complete_task_already_completed` - Tests idempotent behavior

- `TestDeleteTask` (3 tests)
  - `test_delete_task_success` - Validates task deletion
  - `test_delete_task_permission_denied` - Tests PermissionDeniedError
  - `test_delete_task_not_found` - Tests TaskNotFoundError handling

- `TestUpdateTask` (6 tests)
  - `test_update_task_title` - Tests title updates
  - `test_update_task_description` - Tests description updates
  - `test_update_task_validation_errors` - Tests validation
  - `test_update_task_both_fields` - Tests updating both fields
  - `test_update_task_not_found` - Tests error handling

**Total: 19 unit tests**

### 2. `/tests/integration/test_agent_behavior.py` (479 lines)

Integration tests for AI agent natural language understanding.

**Tests:**
1. `test_agent_creates_task` - Validates agent creates task from "Add a task to buy groceries"
2. `test_agent_lists_tasks` - Validates agent lists tasks from "Show me my tasks"
3. `test_agent_completes_task` - Validates agent completes task with task ID reference
4. `test_agent_priority_detection` - Validates "urgent" keyword → high priority
5. `test_agent_handles_greeting` - Validates warm response to "Hello"
6. `test_agent_handles_off_topic` - Validates polite decline for weather questions
7. `test_agent_multi_turn_conversation` - Validates context retention across turns
8. `test_agent_handles_task_not_found` - Validates graceful error handling
9. `test_agent_delete_task` - Validates task deletion from natural language
10. `test_agent_update_task` - Validates task updates from natural language
11. `test_agent_instructions_loaded` - Validates agent configuration
12. `test_agent_parallel_tool_calls_disabled` - Validates sequential tool execution

**Total: 12 integration tests**

### 3. `/tests/conftest.py` (Updated)

Added `async_session` fixture for Phase 3+ async tests:
- Creates async SQLite in-memory database
- Provides AsyncSession for conversation and agent tests
- Handles automatic cleanup

### 4. `/tests/README.md` (Comprehensive documentation)

Complete testing guide with:
- Test structure and categories
- Running instructions (unit vs integration)
- Environment variable setup
- Fixture documentation
- Writing new tests guide
- Debugging tips
- CI/CD integration examples
- Common issues and solutions

## Test Execution

### Quick Start

```bash
# Run all unit tests (fast, no API calls)
cd backend
uv run pytest tests/unit/test_mcp_tools.py -v

# Run all integration tests (requires OPENAI_API_KEY)
export OPENAI_API_KEY="sk-..."
uv run pytest tests/integration/test_agent_behavior.py -v

# Skip agent tests (no API costs)
export SKIP_AGENT_TESTS=1
uv run pytest tests/integration/ -v
```

### Environment Variables Required

```bash
# Always required
export BETTER_AUTH_SECRET="test-secret-key-for-testing-minimum-32-characters-long"
export DATABASE_URL="sqlite:///:memory:"

# For integration tests only
export OPENAI_API_KEY="sk-..."  # Makes real API calls, costs money
```

## Test Coverage

### Task IDs Covered

**Unit Tests (T028-T032):**
- ✅ T028: test_add_task_success
- ✅ T029: test_add_task_priority_parameter
- ✅ T030: test_list_tasks_status_filtering
- ✅ T031: test_complete_task_success
- ✅ T032: test_update_task_*

**Integration Tests (T033-T035):**
- ✅ T033: test_agent_creates_task
- ✅ T034: test_agent_lists_tasks
- ✅ T035: test_agent_completes_task

**Additional Coverage:**
- User isolation validation
- Error handling (TaskNotFoundError, PermissionDeniedError)
- Edge cases (empty results, already completed, validation errors)
- Agent personality (greetings, off-topic, error messages)
- Multi-turn conversation context
- Priority detection from keywords

## Test Patterns

### Unit Test Pattern (Mocked)

```python
@patch("mcp_server.tools.get_session_context")
@patch("mcp_server.tools.TaskService.create_task")
def test_add_task_success(self, mock_create_task, mock_session_context):
    """Test with mocked dependencies for fast, isolated execution."""
    # Setup mocks
    mock_task = Mock(id=uuid4(), title="Test", priority="high")
    mock_create_task.return_value = mock_task

    # Execute tool
    result = add_task(user_id="user-1", title="Test", priority="High")

    # Verify behavior
    assert result["status"] == "created"
    assert result["priority"] == "high"  # Normalized to lowercase
```

### Integration Test Pattern (Real Agent)

```python
@pytest.mark.asyncio
async def test_agent_creates_task(agent: TodoAgent, session: Session, test_user_id: str):
    """Test with actual agent execution and database operations."""
    async with agent.mcp_server:
        result = Runner.run(
            agent=agent.get_agent(),
            messages=[{"role": "user", "content": "Add a task to buy groceries"}],
            context_variables={"user_id": test_user_id}
        )

        # Verify natural language response
        response = result.messages[-1].content
        assert "added" in response.lower()
        assert "groceries" in response.lower()

    # Verify database state
    tasks = TaskService.get_user_tasks(session, test_user_id)
    assert tasks[1] >= 1  # At least 1 task created
```

## Validation Criteria

### Unit Tests Validate:
- ✅ Correct parameters passed to TaskService
- ✅ User ID is propagated correctly
- ✅ Priority normalization (High → high)
- ✅ Error handling (graceful degradation)
- ✅ Response structure matches MCP contract
- ✅ Session commit/refresh called
- ✅ User isolation enforced

### Integration Tests Validate:
- ✅ Agent understands natural language
- ✅ Correct tools are invoked
- ✅ Database operations succeed
- ✅ Responses are conversational (not technical)
- ✅ No internal IDs exposed
- ✅ Priority detection from keywords
- ✅ Multi-turn context retention
- ✅ Graceful handling of greetings and off-topic requests

## Dependencies

### Test Dependencies (already in pyproject.toml)
```toml
[project.optional-dependencies]
dev = [
    "pytest>=8.3.0",
    "pytest-asyncio>=0.24.0",
    "pytest-cov>=6.0.0",
    "httpx>=0.27.0",
]
```

### Additional Dependencies Added
- `aiosqlite>=0.22.0` - Async SQLite support for async_session fixture

## Known Limitations

### Unit Tests
- Mock-based: Don't catch integration issues
- Don't test actual database operations
- Don't validate MCP server configuration

### Integration Tests
- **Require OPENAI_API_KEY** - Makes real API calls
- **Cost money** - Each test makes OpenAI API requests
- Slower execution (~30-60 seconds)
- Non-deterministic responses (agent behavior varies)
- Can be skipped with `SKIP_AGENT_TESTS=1`

## Best Practices Followed

✅ **Test Organization:**
- Clear separation: unit vs integration
- Descriptive test names
- Comprehensive docstrings

✅ **Mocking Strategy:**
- Mock external dependencies in unit tests
- Use real implementations in integration tests
- Mock session context for database isolation

✅ **Assertions:**
- Natural language validation (not exact matches)
- Database state verification
- Error message validation
- Response structure validation

✅ **Fixtures:**
- Reusable user_id generation
- Shared agent instance
- Isolated database sessions

✅ **Documentation:**
- Test docstrings explain what is validated
- README with comprehensive running instructions
- Examples for common patterns

## Next Steps

1. **Run Unit Tests:**
   ```bash
   uv run pytest tests/unit/test_mcp_tools.py -v
   ```

2. **Run Integration Tests (if you have API key):**
   ```bash
   export OPENAI_API_KEY="sk-..."
   uv run pytest tests/integration/test_agent_behavior.py -v
   ```

3. **Check Coverage:**
   ```bash
   uv run pytest --cov=src --cov-report=term-missing
   ```

4. **Fix Any Failures:**
   - Read test docstrings for expected behavior
   - Check error messages for specific issues
   - Verify environment variables are set

5. **Add to CI/CD:**
   - Run unit tests on every commit
   - Run integration tests on main branch only
   - Skip agent tests by default to save costs

## Questions?

See `/tests/README.md` for comprehensive documentation on:
- Running specific tests
- Debugging failures
- Writing new tests
- Common issues and solutions
- CI/CD integration
