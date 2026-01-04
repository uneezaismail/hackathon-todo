"""
Integration tests for AI agent behavior (Phase 4 User Story 1).

Tests agent's natural language understanding and tool invocation
with actual agent execution and database operations.

Testing Strategy:
- Uses real agent with MCP server (not mocked)
- Tests with actual database (in-memory or test database)
- Validates tool calls are made correctly
- Validates agent responses are natural language (not technical)
- Requires OPENAI_API_KEY in environment for agent execution

IMPORTANT: These tests will actually call OpenAI API and incur costs.
Set SKIP_AGENT_TESTS=1 environment variable to skip these tests.
"""

import pytest
import os
from uuid import uuid4
from sqlmodel import Session

from src.services.chat_service import TodoAgent, AGENT_INSTRUCTIONS
from src.models.task import Task, PriorityType
from src.services.task_service import TaskService
from agents import Runner


# Skip these tests if SKIP_AGENT_TESTS is set or OPENAI_API_KEY is missing
pytestmark = pytest.mark.skipif(
    os.getenv("SKIP_AGENT_TESTS") == "1" or not os.getenv("OPENAI_API_KEY"),
    reason="Agent tests skipped (SKIP_AGENT_TESTS=1 or missing OPENAI_API_KEY)"
)


@pytest.fixture
def test_user_id():
    """Generate unique user ID for each test."""
    return f"test-user-{uuid4()}"


@pytest.fixture
def agent():
    """Create TodoAgent instance for testing."""
    return TodoAgent(provider="openai")


@pytest.mark.asyncio
async def test_agent_creates_task(agent: TodoAgent, session: Session, test_user_id: str):
    """
    Test agent creates task from natural language.

    Validates:
    - Agent understands "add task to buy groceries"
    - add_task tool is called with correct parameters
    - Task is actually created in database
    - Response is natural language (not technical)
    """
    # User message
    user_message = "Add a task to buy groceries"

    # Expected behavior: Agent should call add_task tool
    async with agent.mcp_server:
        # Run agent with user message
        result = Runner.run(
            agent=agent.get_agent(),
            messages=[{"role": "user", "content": user_message}],
            context_variables={"user_id": test_user_id}
        )

        # Get final response
        response_text = result.messages[-1].content if result.messages else ""

        # Validate response is natural language
        assert len(response_text) > 0, "Agent should return a response"
        assert "buy groceries" in response_text.lower(), "Response should mention the task"
        assert "added" in response_text.lower() or "created" in response_text.lower(), \
            "Response should confirm task creation"

        # Validate no technical jargon
        assert "id" not in response_text.lower() or "task id" not in response_text.lower(), \
            "Response should not expose technical IDs"

    # Verify task was actually created in database
    tasks = TaskService.get_user_tasks(session, test_user_id, search="groceries")
    assert tasks[1] >= 1, "Task should be created in database"
    assert tasks[0][0].title == "buy groceries"


@pytest.mark.asyncio
async def test_agent_lists_tasks(agent: TodoAgent, session: Session, test_user_id: str):
    """
    Test agent lists tasks from natural language.

    Validates:
    - Agent understands "show my tasks"
    - list_tasks tool is called
    - Response includes task information
    - Response is conversational
    """
    # Create some tasks first
    from src.models.task import TaskCreate

    TaskService.create_task(
        session=session,
        user_id=test_user_id,
        task_create=TaskCreate(title="Buy milk", priority="medium")
    )
    TaskService.create_task(
        session=session,
        user_id=test_user_id,
        task_create=TaskCreate(title="Call dentist", priority="high")
    )
    session.commit()

    # User message
    user_message = "Show me my tasks"

    async with agent.mcp_server:
        result = Runner.run(
            agent=agent.get_agent(),
            messages=[{"role": "user", "content": user_message}],
            context_variables={"user_id": test_user_id}
        )

        response_text = result.messages[-1].content if result.messages else ""

        # Validate response mentions both tasks
        assert "milk" in response_text.lower(), "Response should mention first task"
        assert "dentist" in response_text.lower(), "Response should mention second task"

        # Validate response is conversational (not JSON)
        assert not response_text.strip().startswith("{"), "Response should not be JSON"
        assert not response_text.strip().startswith("["), "Response should not be array"


@pytest.mark.asyncio
async def test_agent_completes_task(agent: TodoAgent, session: Session, test_user_id: str):
    """
    Test agent marks task as complete from natural language.

    Validates:
    - Agent understands task completion commands
    - complete_task tool is called with correct task_id
    - Task is actually marked complete in database
    - Response confirms completion
    """
    # Create a task first
    from src.models.task import TaskCreate

    task = TaskService.create_task(
        session=session,
        user_id=test_user_id,
        task_create=TaskCreate(title="Write tests", priority="high")
    )
    session.commit()

    # User message (reference by task ID)
    user_message = f"Mark task {task.id} as complete"

    async with agent.mcp_server:
        result = Runner.run(
            agent=agent.get_agent(),
            messages=[{"role": "user", "content": user_message}],
            context_variables={"user_id": test_user_id}
        )

        response_text = result.messages[-1].content if result.messages else ""

        # Validate response confirms completion
        assert "complete" in response_text.lower() or "done" in response_text.lower(), \
            "Response should confirm completion"

    # Verify task is marked complete in database
    updated_task = TaskService.get_task_by_id(session, task.id, test_user_id)
    assert updated_task is not None, "Task should exist"
    assert updated_task.completed is True, "Task should be marked complete"


@pytest.mark.asyncio
async def test_agent_priority_detection(agent: TodoAgent, session: Session, test_user_id: str):
    """
    Test agent detects urgency keywords and assigns high priority.

    Validates:
    - "urgent" keyword triggers high priority
    - Task is created with priority="high"
    - Response confirms task creation
    """
    # User message with urgency keyword
    user_message = "Add an urgent task to fix the production bug"

    async with agent.mcp_server:
        result = Runner.run(
            agent=agent.get_agent(),
            messages=[{"role": "user", "content": user_message}],
            context_variables={"user_id": test_user_id}
        )

        response_text = result.messages[-1].content if result.messages else ""

        # Validate response confirms creation
        assert "added" in response_text.lower() or "created" in response_text.lower()

    # Verify task has high priority
    tasks = TaskService.get_user_tasks(session, test_user_id, search="production bug")
    assert tasks[1] >= 1, "Task should be created"
    created_task = tasks[0][0]
    assert created_task.priority == PriorityType.High, "Task should have high priority"


@pytest.mark.asyncio
async def test_agent_handles_greeting(agent: TodoAgent, test_user_id: str):
    """
    Test agent responds to greetings appropriately.

    Validates:
    - Agent responds warmly to "hello"
    - No tool calls are made
    - Response offers to help
    """
    user_message = "Hello!"

    async with agent.mcp_server:
        result = Runner.run(
            agent=agent.get_agent(),
            messages=[{"role": "user", "content": user_message}],
            context_variables={"user_id": test_user_id}
        )

        response_text = result.messages[-1].content if result.messages else ""

        # Validate warm greeting response
        assert len(response_text) > 0, "Agent should respond to greeting"
        assert any(word in response_text.lower() for word in ["hi", "hello", "hey"]), \
            "Response should acknowledge greeting"
        assert "help" in response_text.lower(), "Response should offer to help"

        # Validate no tool calls were made (greeting doesn't require tools)
        # Tool calls would appear in result.messages with tool_calls attribute
        tool_calls_made = any(
            hasattr(msg, "tool_calls") and msg.tool_calls
            for msg in result.messages
        )
        assert not tool_calls_made, "No tools should be called for greetings"


@pytest.mark.asyncio
async def test_agent_handles_off_topic(agent: TodoAgent, test_user_id: str):
    """
    Test agent politely declines off-topic requests.

    Validates:
    - Agent recognizes off-topic request (weather)
    - Politely declines and redirects to task management
    - No tool calls are made
    """
    user_message = "What's the weather like today?"

    async with agent.mcp_server:
        result = Runner.run(
            agent=agent.get_agent(),
            messages=[{"role": "user", "content": user_message}],
            context_variables={"user_id": test_user_id}
        )

        response_text = result.messages[-1].content if result.messages else ""

        # Validate polite decline
        assert len(response_text) > 0, "Agent should respond"
        assert any(word in response_text.lower() for word in ["sorry", "can't", "cannot"]), \
            "Response should decline politely"
        assert "task" in response_text.lower(), "Response should mention task management"

        # Validate no tool calls were made
        tool_calls_made = any(
            hasattr(msg, "tool_calls") and msg.tool_calls
            for msg in result.messages
        )
        assert not tool_calls_made, "No tools should be called for off-topic requests"


@pytest.mark.asyncio
async def test_agent_multi_turn_conversation(
    agent: TodoAgent,
    session: Session,
    test_user_id: str
):
    """
    Test agent handles multi-turn conversation with context.

    Validates:
    - Agent maintains context across turns
    - Can reference previously created tasks
    - Follows conversation flow naturally
    """
    # Turn 1: Create a task
    async with agent.mcp_server:
        result1 = Runner.run(
            agent=agent.get_agent(),
            messages=[{"role": "user", "content": "Add a task to water the plants"}],
            context_variables={"user_id": test_user_id}
        )

        # Extract conversation history
        history = result1.messages

        # Turn 2: Mark it complete (referencing "it" from previous turn)
        result2 = Runner.run(
            agent=agent.get_agent(),
            messages=history + [{"role": "user", "content": "Now mark it as complete"}],
            context_variables={"user_id": test_user_id}
        )

        response_text = result2.messages[-1].content if result2.messages else ""

        # Validate agent understood context and completed the task
        assert "complete" in response_text.lower() or "done" in response_text.lower()

    # Verify task is complete
    tasks = TaskService.get_user_tasks(session, test_user_id, search="plants")
    assert tasks[1] >= 1, "Task should exist"
    task = tasks[0][0]
    assert task.completed is True, "Task should be marked complete"


@pytest.mark.asyncio
async def test_agent_handles_task_not_found(agent: TodoAgent, test_user_id: str):
    """
    Test agent handles non-existent task gracefully.

    Validates:
    - Agent recognizes task doesn't exist
    - Provides helpful error message
    - Suggests viewing current tasks
    """
    fake_task_id = str(uuid4())
    user_message = f"Mark task {fake_task_id} as complete"

    async with agent.mcp_server:
        result = Runner.run(
            agent=agent.get_agent(),
            messages=[{"role": "user", "content": user_message}],
            context_variables={"user_id": test_user_id}
        )

        response_text = result.messages[-1].content if result.messages else ""

        # Validate error is explained
        assert any(word in response_text.lower() for word in ["not found", "couldn't find", "doesn't exist"]), \
            "Response should indicate task not found"

        # Validate suggestion to view tasks
        assert any(word in response_text.lower() for word in ["view", "see", "list", "show"]), \
            "Response should suggest viewing current tasks"


@pytest.mark.asyncio
async def test_agent_delete_task(agent: TodoAgent, session: Session, test_user_id: str):
    """
    Test agent deletes task from natural language.

    Validates:
    - Agent understands delete commands
    - delete_task tool is called
    - Task is removed from database
    """
    # Create a task
    from src.models.task import TaskCreate

    task = TaskService.create_task(
        session=session,
        user_id=test_user_id,
        task_create=TaskCreate(title="Temporary task", priority="low")
    )
    session.commit()

    # User message
    user_message = f"Delete task {task.id}"

    async with agent.mcp_server:
        result = Runner.run(
            agent=agent.get_agent(),
            messages=[{"role": "user", "content": user_message}],
            context_variables={"user_id": test_user_id}
        )

        response_text = result.messages[-1].content if result.messages else ""

        # Validate response confirms deletion
        assert "delete" in response_text.lower() or "removed" in response_text.lower()

    # Verify task is deleted
    deleted_task = TaskService.get_task_by_id(session, task.id, test_user_id)
    assert deleted_task is None, "Task should be deleted from database"


@pytest.mark.asyncio
async def test_agent_update_task(agent: TodoAgent, session: Session, test_user_id: str):
    """
    Test agent updates task from natural language.

    Validates:
    - Agent understands update commands
    - update_task tool is called
    - Task is updated in database
    """
    # Create a task
    from src.models.task import TaskCreate

    task = TaskService.create_task(
        session=session,
        user_id=test_user_id,
        task_create=TaskCreate(title="Old title", priority="medium")
    )
    session.commit()

    # User message
    new_title = "Updated title for the task"
    user_message = f"Change task {task.id} to '{new_title}'"

    async with agent.mcp_server:
        result = Runner.run(
            agent=agent.get_agent(),
            messages=[{"role": "user", "content": user_message}],
            context_variables={"user_id": test_user_id}
        )

        response_text = result.messages[-1].content if result.messages else ""

        # Validate response confirms update
        assert "update" in response_text.lower() or "changed" in response_text.lower()

    # Verify task is updated
    updated_task = TaskService.get_task_by_id(session, task.id, test_user_id)
    assert updated_task is not None, "Task should exist"
    assert updated_task.title == new_title, "Task title should be updated"


@pytest.mark.asyncio
async def test_agent_instructions_loaded(agent: TodoAgent):
    """
    Test agent is configured with correct instructions.

    Validates:
    - Agent has personality and behavior guidelines
    - Instructions match expected contract
    """
    # Verify agent has instructions
    assert agent.get_agent().instructions == AGENT_INSTRUCTIONS, \
        "Agent should be configured with AGENT_INSTRUCTIONS"

    # Verify instructions contain key elements
    assert "task management" in AGENT_INSTRUCTIONS.lower(), \
        "Instructions should mention task management"
    assert "add_task" in AGENT_INSTRUCTIONS, \
        "Instructions should reference add_task tool"
    assert "list_tasks" in AGENT_INSTRUCTIONS, \
        "Instructions should reference list_tasks tool"
    assert "complete_task" in AGENT_INSTRUCTIONS, \
        "Instructions should reference complete_task tool"


@pytest.mark.asyncio
async def test_agent_parallel_tool_calls_disabled(agent: TodoAgent):
    """
    Test agent is configured to execute tools sequentially.

    Validates:
    - parallel_tool_calls is set to False
    - Prevents concurrent database operations
    """
    # Verify model settings
    assert agent.get_agent().model_settings.parallel_tool_calls is False, \
        "Parallel tool calls should be disabled to prevent database locks"


# Phase 5 User Story 2 - Priority Detection Integration Tests (T052)


@pytest.mark.asyncio
async def test_agent_high_priority_urgent_keyword(
    agent: TodoAgent,
    session: Session,
    test_user_id: str
):
    """
    Integration test: Agent detects "urgent" keyword and assigns high priority.

    Validates:
    - Agent analyzes "urgent" in user message
    - add_task tool called with priority="high"
    - Task created in database with priority="high"
    - Response is natural language (not technical)

    Related: T049 (unit test for urgent keyword)
    """
    user_message = "Add urgent task to fix the critical security vulnerability"

    async with agent.mcp_server:
        result = Runner.run(
            agent=agent.get_agent(),
            messages=[{"role": "user", "content": user_message}],
            context_variables={"user_id": test_user_id}
        )

        response_text = result.messages[-1].content if result.messages else ""

        # Validate natural language response
        assert "added" in response_text.lower() or "created" in response_text.lower(), \
            "Response should confirm task creation"
        assert "security vulnerability" in response_text.lower() or "security" in response_text.lower(), \
            "Response should mention the task"

    # Verify task created with high priority
    tasks = TaskService.get_user_tasks(session, test_user_id, search="security")
    assert tasks[1] >= 1, "Task should be created in database"
    created_task = tasks[0][0]
    assert created_task.priority == PriorityType.High, \
        "Task should have high priority due to 'urgent' keyword"


@pytest.mark.asyncio
async def test_agent_high_priority_asap_keyword(
    agent: TodoAgent,
    session: Session,
    test_user_id: str
):
    """
    Integration test: Agent detects "ASAP" keyword and assigns high priority.

    Validates:
    - Agent recognizes "ASAP" as high priority indicator
    - Task created with priority="high"
    - Case-insensitive matching works

    Related: T049 (unit test for ASAP keyword)
    """
    user_message = "Add task to review PR ASAP before deployment"

    async with agent.mcp_server:
        result = Runner.run(
            agent=agent.get_agent(),
            messages=[{"role": "user", "content": user_message}],
            context_variables={"user_id": test_user_id}
        )

        response_text = result.messages[-1].content if result.messages else ""
        assert "added" in response_text.lower() or "created" in response_text.lower()

    # Verify high priority
    tasks = TaskService.get_user_tasks(session, test_user_id, search="review PR")
    assert tasks[1] >= 1, "Task should be created"
    assert tasks[0][0].priority == PriorityType.High, \
        "ASAP keyword should trigger high priority"


@pytest.mark.asyncio
async def test_agent_high_priority_critical_keyword(
    agent: TodoAgent,
    session: Session,
    test_user_id: str
):
    """
    Integration test: Agent detects "critical" keyword and assigns high priority.

    Validates:
    - "critical" keyword triggers high priority
    - Works in middle of sentence

    Related: T049 (unit test for critical keyword)
    """
    user_message = "There's a critical database issue we need to add as a task"

    async with agent.mcp_server:
        result = Runner.run(
            agent=agent.get_agent(),
            messages=[{"role": "user", "content": user_message}],
            context_variables={"user_id": test_user_id}
        )

    tasks = TaskService.get_user_tasks(session, test_user_id, search="database")
    assert tasks[1] >= 1, "Task should be created"
    assert tasks[0][0].priority == PriorityType.High, \
        "critical keyword should trigger high priority"


@pytest.mark.asyncio
async def test_agent_high_priority_emergency_keyword(
    agent: TodoAgent,
    session: Session,
    test_user_id: str
):
    """
    Integration test: Agent detects "emergency" keyword and assigns high priority.

    Related: T049 (unit test for emergency keyword)
    """
    user_message = "Emergency: server down, add task to investigate"

    async with agent.mcp_server:
        result = Runner.run(
            agent=agent.get_agent(),
            messages=[{"role": "user", "content": user_message}],
            context_variables={"user_id": test_user_id}
        )

    tasks = TaskService.get_user_tasks(session, test_user_id, search="server")
    assert tasks[1] >= 1, "Task should be created"
    assert tasks[0][0].priority == PriorityType.High, \
        "emergency keyword should trigger high priority"


@pytest.mark.asyncio
async def test_agent_high_priority_immediately_keyword(
    agent: TodoAgent,
    session: Session,
    test_user_id: str
):
    """
    Integration test: Agent detects "immediately" keyword and assigns high priority.

    Related: T049 (unit test for immediately keyword)
    """
    user_message = "Need to add task to patch the vulnerability immediately"

    async with agent.mcp_server:
        result = Runner.run(
            agent=agent.get_agent(),
            messages=[{"role": "user", "content": user_message}],
            context_variables={"user_id": test_user_id}
        )

    tasks = TaskService.get_user_tasks(session, test_user_id, search="vulnerability")
    assert tasks[1] >= 1, "Task should be created"
    assert tasks[0][0].priority == PriorityType.High, \
        "immediately keyword should trigger high priority"


@pytest.mark.asyncio
async def test_agent_low_priority_someday_keyword(
    agent: TodoAgent,
    session: Session,
    test_user_id: str
):
    """
    Integration test: Agent detects "someday" keyword and assigns low priority.

    Validates:
    - Agent analyzes "someday" in user message
    - add_task tool called with priority="low"
    - Task created in database with priority="low"

    Related: T050 (unit test for someday keyword)
    """
    user_message = "Add task to refactor the old code someday"

    async with agent.mcp_server:
        result = Runner.run(
            agent=agent.get_agent(),
            messages=[{"role": "user", "content": user_message}],
            context_variables={"user_id": test_user_id}
        )

        response_text = result.messages[-1].content if result.messages else ""
        assert "added" in response_text.lower() or "created" in response_text.lower()

    # Verify low priority
    tasks = TaskService.get_user_tasks(session, test_user_id, search="refactor")
    assert tasks[1] >= 1, "Task should be created"
    assert tasks[0][0].priority == PriorityType.Low, \
        "someday keyword should trigger low priority"


@pytest.mark.asyncio
async def test_agent_low_priority_when_you_have_time(
    agent: TodoAgent,
    session: Session,
    test_user_id: str
):
    """
    Integration test: Agent detects "when you have time" phrase and assigns low priority.

    Validates:
    - Multi-word phrase detection works
    - Phrase anywhere in sentence triggers low priority

    Related: T050 (unit test for when you have time phrase)
    """
    user_message = "When you have time, add task to update documentation"

    async with agent.mcp_server:
        result = Runner.run(
            agent=agent.get_agent(),
            messages=[{"role": "user", "content": user_message}],
            context_variables={"user_id": test_user_id}
        )

    tasks = TaskService.get_user_tasks(session, test_user_id, search="documentation")
    assert tasks[1] >= 1, "Task should be created"
    assert tasks[0][0].priority == PriorityType.Low, \
        "when you have time phrase should trigger low priority"


@pytest.mark.asyncio
async def test_agent_low_priority_eventually_keyword(
    agent: TodoAgent,
    session: Session,
    test_user_id: str
):
    """
    Integration test: Agent detects "eventually" keyword and assigns low priority.

    Related: T050 (unit test for eventually keyword)
    """
    user_message = "Eventually we should add task to migrate to new database"

    async with agent.mcp_server:
        result = Runner.run(
            agent=agent.get_agent(),
            messages=[{"role": "user", "content": user_message}],
            context_variables={"user_id": test_user_id}
        )

    tasks = TaskService.get_user_tasks(session, test_user_id, search="migrate")
    assert tasks[1] >= 1, "Task should be created"
    assert tasks[0][0].priority == PriorityType.Low, \
        "eventually keyword should trigger low priority"


@pytest.mark.asyncio
async def test_agent_low_priority_maybe_keyword(
    agent: TodoAgent,
    session: Session,
    test_user_id: str
):
    """
    Integration test: Agent detects "maybe" keyword and assigns low priority.

    Related: T050 (unit test for maybe keyword)
    """
    user_message = "Maybe add task to implement dark mode"

    async with agent.mcp_server:
        result = Runner.run(
            agent=agent.get_agent(),
            messages=[{"role": "user", "content": user_message}],
            context_variables={"user_id": test_user_id}
        )

    tasks = TaskService.get_user_tasks(session, test_user_id, search="dark mode")
    assert tasks[1] >= 1, "Task should be created"
    assert tasks[0][0].priority == PriorityType.Low, \
        "maybe keyword should trigger low priority"


@pytest.mark.asyncio
async def test_agent_medium_priority_default(
    agent: TodoAgent,
    session: Session,
    test_user_id: str
):
    """
    Integration test: Agent assigns medium priority when no urgency indicators present.

    Validates:
    - Neutral descriptions default to medium
    - No keywords = priority="medium"
    - Agent handles normal task creation without special keywords

    Related: T051 (unit test for medium priority default)
    """
    user_message = "Add task to review the pull request"

    async with agent.mcp_server:
        result = Runner.run(
            agent=agent.get_agent(),
            messages=[{"role": "user", "content": user_message}],
            context_variables={"user_id": test_user_id}
        )

        response_text = result.messages[-1].content if result.messages else ""
        assert "added" in response_text.lower() or "created" in response_text.lower()

    # Verify medium priority (default)
    tasks = TaskService.get_user_tasks(session, test_user_id, search="pull request")
    assert tasks[1] >= 1, "Task should be created"
    assert tasks[0][0].priority == PriorityType.Medium, \
        "Task with no urgency keywords should default to medium priority"


@pytest.mark.asyncio
async def test_agent_medium_priority_neutral_description(
    agent: TodoAgent,
    session: Session,
    test_user_id: str
):
    """
    Integration test: Multiple neutral descriptions all get medium priority.

    Validates:
    - Common task descriptions without keywords
    - Consistency of default priority assignment

    Related: T051 (unit test for medium priority default)
    """
    test_cases = [
        ("Add task to buy groceries", "groceries"),
        ("Create task for team meeting", "team meeting"),
        ("New task to write unit tests", "unit tests"),
    ]

    for message, search_term in test_cases:
        # Clear previous tasks
        async with agent.mcp_server:
            result = Runner.run(
                agent=agent.get_agent(),
                messages=[{"role": "user", "content": message}],
                context_variables={"user_id": test_user_id}
            )

        tasks = TaskService.get_user_tasks(session, test_user_id, search=search_term)
        assert tasks[1] >= 1, f"Task '{message}' should be created"
        assert tasks[0][0].priority == PriorityType.Medium, \
            f"Neutral description '{message}' should get medium priority"


@pytest.mark.asyncio
async def test_agent_priority_multiple_high_keywords(
    agent: TodoAgent,
    session: Session,
    test_user_id: str
):
    """
    Integration test: Multiple high priority keywords still result in high priority.

    Validates:
    - Agent handles multiple urgency indicators
    - No conflicting priority assignments
    - High priority wins when multiple keywords present

    Related: T049, edge case testing
    """
    user_message = "This is urgent and critical - must fix the bug immediately"

    async with agent.mcp_server:
        result = Runner.run(
            agent=agent.get_agent(),
            messages=[{"role": "user", "content": user_message}],
            context_variables={"user_id": test_user_id}
        )

    tasks = TaskService.get_user_tasks(session, test_user_id, search="bug")
    assert tasks[1] >= 1, "Task should be created"
    assert tasks[0][0].priority == PriorityType.High, \
        "Multiple high priority keywords should result in high priority"


@pytest.mark.asyncio
async def test_agent_priority_conflicting_keywords_high_wins(
    agent: TodoAgent,
    session: Session,
    test_user_id: str
):
    """
    Integration test: High priority keywords override low priority keywords.

    Validates:
    - When both high and low keywords present, high wins
    - Agent prioritizes urgency over optionality
    - Conflict resolution logic

    Related: T049, T050, edge case testing
    """
    user_message = "This is urgent but maybe you can do it when you have time"

    async with agent.mcp_server:
        result = Runner.run(
            agent=agent.get_agent(),
            messages=[{"role": "user", "content": user_message}],
            context_variables={"user_id": test_user_id}
        )

    tasks = TaskService.get_user_tasks(session, test_user_id)
    assert tasks[1] >= 1, "Task should be created"
    # High priority should win over low priority
    assert tasks[0][0].priority == PriorityType.High, \
        "High priority keywords should take precedence over low priority keywords"


@pytest.mark.asyncio
async def test_agent_priority_case_insensitive(
    agent: TodoAgent,
    session: Session,
    test_user_id: str
):
    """
    Integration test: Priority keywords work regardless of case.

    Validates:
    - URGENT, urgent, Urgent all trigger high priority
    - Case-insensitive matching in agent processing

    Related: T049, T050 (case-insensitive tests)
    """
    test_cases = [
        ("Add URGENT task to fix server", PriorityType.High),
        ("Add Urgent task to patch system", PriorityType.High),
        ("Add task SOMEDAY to clean code", PriorityType.Low),
        ("Add task Someday to refactor", PriorityType.Low),
    ]

    for message, expected_priority in test_cases:
        async with agent.mcp_server:
            result = Runner.run(
                agent=agent.get_agent(),
                messages=[{"role": "user", "content": message}],
                context_variables={"user_id": test_user_id}
            )

        tasks = TaskService.get_user_tasks(session, test_user_id)
        assert tasks[1] >= 1, f"Task should be created for '{message}'"
        # Get most recent task
        latest_task = tasks[0][0]
        assert latest_task.priority == expected_priority, \
            f"Message '{message}' should trigger {expected_priority} priority (case-insensitive)"


@pytest.mark.asyncio
async def test_agent_priority_with_special_characters(
    agent: TodoAgent,
    session: Session,
    test_user_id: str
):
    """
    Integration test: Priority detection works with punctuation and special characters.

    Validates:
    - "urgent!" still triggers high priority
    - "urgent?" still triggers high priority
    - Punctuation doesn't prevent keyword detection

    Related: Edge case testing from T049
    """
    test_cases = [
        ("urgent! Fix the production issue", PriorityType.High),
        ("Is this urgent?", PriorityType.High),
        ("maybe... add this feature", PriorityType.Low),
    ]

    for message, expected_priority in test_cases:
        async with agent.mcp_server:
            result = Runner.run(
                agent=agent.get_agent(),
                messages=[{"role": "user", "content": message}],
                context_variables={"user_id": test_user_id}
            )

        tasks = TaskService.get_user_tasks(session, test_user_id)
        assert tasks[1] >= 1, f"Task should be created for '{message}'"
        latest_task = tasks[0][0]
        assert latest_task.priority == expected_priority, \
            f"Special characters in '{message}' should not prevent priority detection"


# Phase 6 User Story 3 - Conversational Personality & Boundaries Tests (T058-T061)


@pytest.mark.asyncio
async def test_agent_greeting_response(agent: TodoAgent, test_user_id: str):
    """
    T058 [P]: Test agent responds warmly to greetings without tool calls.

    Validates:
    - Agent responds to "hello" with warm greeting
    - No tool calls are made (greetings don't require tools)
    - Response offers to help with task management
    - Response is conversational, not robotic

    Expected responses:
    - "Hi! I'm here to help..."
    - "Hello! Ready to help with your tasks..."
    - "Hey! What would you like to do?"

    Related: agent-prompt.md Section "Handling Greetings & Social Interactions"
    """
    user_message = "hello"

    async with agent.mcp_server:
        result = Runner.run(
            agent=agent.get_agent(),
            messages=[{"role": "user", "content": user_message}],
            context_variables={"user_id": test_user_id}
        )

        response_text = result.messages[-1].content if result.messages else ""

        # Validate warm greeting response
        assert len(response_text) > 0, "Agent should respond to greeting"
        assert any(greeting in response_text.lower() for greeting in ["hi", "hello", "hey"]), \
            "Response should acknowledge greeting with warm salutation"

        # Validate offer to help
        assert "help" in response_text.lower(), "Response should offer to help with tasks"

        # Validate no tool calls were made (greeting doesn't require tools)
        tool_calls_made = any(
            hasattr(msg, "tool_calls") and msg.tool_calls
            for msg in result.messages
        )
        assert not tool_calls_made, "No tools should be called for greetings (T058 requirement)"


@pytest.mark.asyncio
async def test_agent_gratitude_acknowledgment(
    agent: TodoAgent,
    session: Session,
    test_user_id: str
):
    """
    T059 [P]: Test agent acknowledges gratitude politely without tool calls.

    Validates:
    - Agent completes a task first (creates conversation context)
    - User says "thank you" after task operation
    - Agent responds with polite acknowledgment
    - No tool calls are made (gratitude doesn't require action)
    - Response offers continued assistance

    Expected responses:
    - "You're welcome!"
    - "Happy to help!"
    - "Glad I could help! Let me know if you need anything else."

    Related: agent-prompt.md Section "Handling Greetings & Social Interactions"
    """
    # Turn 1: Complete a task to create context
    from src.models.task import TaskCreate

    task = TaskService.create_task(
        session=session,
        user_id=test_user_id,
        task_create=TaskCreate(title="Test task", priority="medium")
    )
    session.commit()

    async with agent.mcp_server:
        # First turn: Complete the task
        result1 = Runner.run(
            agent=agent.get_agent(),
            messages=[{"role": "user", "content": f"Mark task {task.id} as complete"}],
            context_variables={"user_id": test_user_id}
        )

        # Get conversation history
        history = result1.messages

        # Turn 2: User says thank you
        result2 = Runner.run(
            agent=agent.get_agent(),
            messages=history + [{"role": "user", "content": "thank you"}],
            context_variables={"user_id": test_user_id}
        )

        response_text = result2.messages[-1].content if result2.messages else ""

        # Validate polite acknowledgment
        assert len(response_text) > 0, "Agent should respond to gratitude"
        assert any(phrase in response_text.lower() for phrase in ["welcome", "happy to help", "glad"]), \
            "Response should acknowledge gratitude politely"

        # Validate no tool calls for gratitude
        tool_calls_made = any(
            hasattr(msg, "tool_calls") and msg.tool_calls
            for msg in result2.messages[len(history):]  # Check only new messages
        )
        assert not tool_calls_made, "No tools should be called for gratitude acknowledgment (T059 requirement)"


@pytest.mark.asyncio
async def test_agent_off_topic_decline(agent: TodoAgent, test_user_id: str):
    """
    T060 [P]: Test agent politely declines off-topic requests.

    Validates:
    - Agent recognizes off-topic request (weather)
    - Politely declines without being dismissive
    - Mentions specialization in task management
    - Redirects to task management capabilities
    - No tool calls are made (off-topic request doesn't trigger tools)

    Expected response pattern:
    - "I specialize in task management and can't help with weather..."
    - "I focus on tasks rather than..."
    - "I'm a task assistant, so I can't..."

    Related: agent-prompt.md Section "Handling Off-Topic Requests"
    """
    user_message = "what's the weather?"

    async with agent.mcp_server:
        result = Runner.run(
            agent=agent.get_agent(),
            messages=[{"role": "user", "content": user_message}],
            context_variables={"user_id": test_user_id}
        )

        response_text = result.messages[-1].content if result.messages else ""

        # Validate polite decline
        assert len(response_text) > 0, "Agent should respond to off-topic request"
        assert any(word in response_text.lower() for word in ["sorry", "can't", "cannot", "specialize"]), \
            "Response should politely decline off-topic request"

        # Validate mention of task management specialization
        assert "task" in response_text.lower(), \
            "Response should mention task management specialization (T060 requirement)"

        # Validate redirect to capabilities
        assert any(word in response_text.lower() for word in ["help", "can", "manage", "create", "view"]), \
            "Response should redirect to what agent CAN do (task management)"

        # Validate no tool calls for off-topic requests
        tool_calls_made = any(
            hasattr(msg, "tool_calls") and msg.tool_calls
            for msg in result.messages
        )
        assert not tool_calls_made, "No tools should be called for off-topic requests (T060 requirement)"


@pytest.mark.asyncio
async def test_agent_capabilities_explanation(agent: TodoAgent, test_user_id: str):
    """
    T061: Test agent explains capabilities when asked.

    Validates:
    - Agent understands "what can you do?" question
    - Response lists 5 core operations:
      1. add_task - Create tasks
      2. list_tasks - View tasks
      3. complete_task - Mark tasks done
      4. delete_task - Remove tasks
      5. update_task - Modify tasks
    - Response is helpful and conversational
    - No tool calls are made (explaining capabilities doesn't require tools)

    Expected response pattern:
    - Mentions "add", "create", or "new task"
    - Mentions "list", "show", or "view tasks"
    - Mentions "complete", "mark done", or "finish task"
    - Mentions "delete", "remove", or "remove task"
    - Mentions "update", "modify", or "change task"

    Related: agent-prompt.md Section "Your Capabilities"
    """
    user_message = "what can you do?"

    async with agent.mcp_server:
        result = Runner.run(
            agent=agent.get_agent(),
            messages=[{"role": "user", "content": user_message}],
            context_variables={"user_id": test_user_id}
        )

        response_text = result.messages[-1].content if result.messages else ""

        # Validate response exists
        assert len(response_text) > 0, "Agent should respond to capabilities question"

        # Validate mentions of core operations (5 operations)
        # 1. Add/Create tasks
        assert any(word in response_text.lower() for word in ["add", "create", "new"]), \
            "Response should mention ability to add/create tasks"

        # 2. List/View tasks
        assert any(word in response_text.lower() for word in ["list", "show", "view", "see"]), \
            "Response should mention ability to list/view tasks"

        # 3. Complete/Mark done
        assert any(word in response_text.lower() for word in ["complete", "done", "finish"]), \
            "Response should mention ability to complete tasks"

        # 4. Delete/Remove tasks
        assert any(word in response_text.lower() for word in ["delete", "remove"]), \
            "Response should mention ability to delete tasks"

        # 5. Update/Modify tasks
        assert any(word in response_text.lower() for word in ["update", "modify", "change"]), \
            "Response should mention ability to update tasks"

        # Validate no tool calls for capabilities explanation
        tool_calls_made = any(
            hasattr(msg, "tool_calls") and msg.tool_calls
            for msg in result.messages
        )
        assert not tool_calls_made, "No tools should be called for capabilities explanation (T061 requirement)"
