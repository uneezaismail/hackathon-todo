# Backend Tests - Phase 4 User Story 1

Comprehensive test suite for AI chatbot Phase III with natural language task management.

## Test Structure

```
tests/
├── unit/                           # Unit tests (fast, mocked dependencies)
│   └── test_mcp_tools.py          # MCP tool tests with mocked TaskService
├── integration/                    # Integration tests (real database, slower)
│   └── test_agent_behavior.py     # Agent behavior with actual execution
├── conftest.py                     # Shared pytest fixtures
└── README.md                       # This file
```

## Test Categories

### Unit Tests (`tests/unit/`)

Fast tests with mocked dependencies. Run these frequently during development.

**test_mcp_tools.py** - Tests for all 5 MCP tools:
- `add_task` - Task creation with priority normalization
- `list_tasks` - Task listing with status filtering
- `complete_task` - Task completion with error handling
- `delete_task` - Task deletion with permission validation
- `update_task` - Task updates with validation

**Coverage:**
- T028-T032: All MCP tool scenarios
- User isolation and validation
- Error handling (TaskNotFoundError, PermissionDeniedError)
- Response structure validation

### Integration Tests (`tests/integration/`)

Slower tests with actual database and agent execution. Run before committing.

**test_agent_behavior.py** - Tests for AI agent natural language understanding:
- Task creation from natural language
- Task listing and filtering
- Task completion and deletion
- Priority detection from keywords (urgent → high)
- Greeting and off-topic handling
- Multi-turn conversation context

**Coverage:**
- T033-T035: Agent behavior scenarios
- Actual OpenAI API calls (requires OPENAI_API_KEY)
- Real MCP server execution
- Database operations

## Running Tests

### Prerequisites

```bash
# Install dependencies
uv sync

# Set environment variables
export BETTER_AUTH_SECRET="test-secret-key-for-testing-minimum-32-characters-long"
export DATABASE_URL="sqlite:///:memory:"

# For integration tests (requires OpenAI API key and incurs costs)
export OPENAI_API_KEY="sk-..."

# Skip integration tests to avoid API costs
export SKIP_AGENT_TESTS=1
```

### Run All Tests

```bash
# Run everything (unit + integration)
uv run pytest

# Run with verbose output
uv run pytest -v

# Run with coverage report
uv run pytest --cov=src --cov-report=term-missing
```

### Run Unit Tests Only

```bash
# Fast - no API calls, no real database operations
uv run pytest tests/unit/ -v
```

### Run Integration Tests Only

```bash
# Slow - makes OpenAI API calls, costs money
uv run pytest tests/integration/ -v

# Skip agent tests (don't call OpenAI API)
SKIP_AGENT_TESTS=1 uv run pytest tests/integration/ -v
```

### Run Specific Test Files

```bash
# MCP tools only
uv run pytest tests/unit/test_mcp_tools.py -v

# Agent behavior only (requires OPENAI_API_KEY)
uv run pytest tests/integration/test_agent_behavior.py -v

# Specific test case
uv run pytest tests/unit/test_mcp_tools.py::TestAddTask::test_add_task_success -v
```

## Test Fixtures

### Shared Fixtures (`conftest.py`)

**Database Fixtures:**
- `engine` - SQLite in-memory engine
- `session` - Sync database session (for unit tests)
- `async_session` - Async database session (for integration tests)

**Mock Fixtures:**
- `mock_user_id` - Test user ID ("test-user-123")
- `mock_user_id_2` - Second user for isolation tests
- `mock_jwt_payload` - JWT token payload

**API Fixtures:**
- `client` - FastAPI TestClient
- `authenticated_client` - Client with mocked JWT auth

**Agent Fixtures:**
- `agent` - TodoAgent instance (for integration tests)
- `test_user_id` - Unique user ID per test

## Writing Tests

### Unit Test Example

```python
@patch("mcp_server.tools.get_session_context")
@patch("mcp_server.tools.TaskService.create_task")
def test_add_task_success(self, mock_create_task, mock_session_context):
    """Test successful task creation."""
    # Setup mocks
    mock_task = Mock(id=uuid4(), title="Test", priority="high")
    mock_create_task.return_value = mock_task

    # Execute
    result = add_task(user_id="user-1", title="Test", priority="High")

    # Verify
    assert result["task_id"] == str(mock_task.id)
    assert result["status"] == "created"
```

### Integration Test Example

```python
@pytest.mark.asyncio
async def test_agent_creates_task(agent: TodoAgent, session: Session, test_user_id: str):
    """Test agent creates task from natural language."""
    async with agent.mcp_server:
        result = Runner.run(
            agent=agent.get_agent(),
            messages=[{"role": "user", "content": "Add a task to buy groceries"}],
            context_variables={"user_id": test_user_id}
        )

        # Verify natural language response
        response = result.messages[-1].content
        assert "added" in response.lower()

    # Verify database state
    tasks = TaskService.get_user_tasks(session, test_user_id)
    assert tasks[1] >= 1
```

## Test Assertions

### MCP Tool Tests

✅ **DO** - Test with mocked dependencies:
```python
@patch("mcp_server.tools.TaskService.create_task")
def test_add_task(self, mock_create_task):
    # Fast, isolated, deterministic
    pass
```

❌ **DON'T** - Call real database in unit tests:
```python
def test_add_task(self):
    task = TaskService.create_task(...)  # Too slow for unit test
```

### Agent Behavior Tests

✅ **DO** - Use skipif for expensive tests:
```python
@pytest.mark.skipif(
    not os.getenv("OPENAI_API_KEY"),
    reason="Requires OPENAI_API_KEY"
)
async def test_agent_behavior():
    pass
```

✅ **DO** - Verify natural language responses:
```python
assert "added" in response.lower()  # Conversational
assert "buy groceries" in response.lower()  # Task mentioned
```

❌ **DON'T** - Expect exact text (agent responses vary):
```python
assert response == "I've added the task."  # Too strict
```

## Debugging Tests

### Verbose Output

```bash
# Show full assertion details
uv run pytest -vv

# Show print statements
uv run pytest -s

# Stop on first failure
uv run pytest -x
```

### Debug Specific Test

```bash
# Add breakpoint in test
def test_example():
    breakpoint()  # Drops into debugger
    assert True

# Run with pdb
uv run pytest --pdb
```

### View Coverage

```bash
# Generate HTML coverage report
uv run pytest --cov=src --cov-report=html

# Open in browser
open htmlcov/index.html
```

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run unit tests
  run: uv run pytest tests/unit/ -v --cov=src

- name: Run integration tests (with API key)
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  run: uv run pytest tests/integration/ -v
```

### Skip Expensive Tests in CI

```bash
# Skip agent tests by default
SKIP_AGENT_TESTS=1 uv run pytest

# Run all tests (including agent) on main branch only
if [ "$GITHUB_REF" == "refs/heads/main" ]; then
    uv run pytest
else
    SKIP_AGENT_TESTS=1 uv run pytest
fi
```

## Common Issues

### Issue: `OPENAI_API_KEY` not set

**Solution:** Set environment variable or skip agent tests:
```bash
export SKIP_AGENT_TESTS=1
uv run pytest
```

### Issue: `ModuleNotFoundError: No module named 'mcp_server'`

**Solution:** Ensure mcp_server is in PYTHONPATH:
```bash
cd backend
uv run pytest  # Runs from project root
```

### Issue: Database locked errors

**Solution:** Agent tests use `parallel_tool_calls=False` to prevent this.
Verify in `src/services/chat_service.py`:
```python
model_settings=ModelSettings(parallel_tool_calls=False)
```

### Issue: Tests pass locally but fail in CI

**Solution:** Check environment variables are set in CI:
```yaml
env:
  BETTER_AUTH_SECRET: ${{ secrets.BETTER_AUTH_SECRET }}
  DATABASE_URL: "sqlite:///:memory:"
```

## Test Maintenance

### Adding New Tests

1. **Unit tests** - Add to `tests/unit/test_mcp_tools.py`
2. **Integration tests** - Add to `tests/integration/test_agent_behavior.py`
3. **New fixtures** - Add to `tests/conftest.py`

### Updating Tests After Changes

- MCP tool signature changed → Update unit test mocks
- Agent instructions changed → Update agent behavior assertions
- New tool added → Add test class in `test_mcp_tools.py`

### Best Practices

✅ **DO:**
- Use descriptive test names (`test_add_task_success`)
- Add docstrings explaining what is validated
- Use fixtures for common setup
- Mock external dependencies in unit tests
- Test both success and error paths

❌ **DON'T:**
- Test implementation details
- Depend on test execution order
- Share state between tests
- Make real API calls in unit tests
- Use hardcoded IDs (use uuid4() instead)

## Performance

### Test Execution Times

- **Unit tests:** ~5 seconds (mocked, fast)
- **Integration tests:** ~30-60 seconds (real API calls)
- **Full suite:** ~60-90 seconds

### Optimization Tips

1. Run unit tests during development
2. Run integration tests before committing
3. Skip agent tests locally to save API costs
4. Use `-x` flag to stop on first failure
5. Run specific test files when debugging

## Coverage Goals

- **Unit tests:** 90%+ coverage of MCP tools
- **Integration tests:** All agent scenarios covered
- **Overall:** 85%+ code coverage

Check coverage:
```bash
uv run pytest --cov=src --cov-report=term-missing
```

## Questions?

- Check test docstrings for detailed explanations
- Review `conftest.py` for available fixtures
- See existing tests for patterns and examples
- Consult Phase 4 User Story 1 specification
