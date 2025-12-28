"""
Unit tests for MCP tools (Phase 4 User Story 1).

Tests all 5 MCP tools (add_task, list_tasks, complete_task, delete_task, update_task)
with mocked TaskService to verify tool contract and user isolation.

Testing Strategy:
- Mock TaskService methods to isolate tool logic
- Verify correct parameters passed to service layer
- Test error handling and edge cases
- Validate response structure matches MCP contract
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from uuid import uuid4

from mcp_server.tools import add_task, list_tasks, complete_task, delete_task, update_task
from src.services.exceptions import TaskNotFoundError, UnauthorizedError
from src.models.task import Task, PriorityType


class TestAddTask:
    """Test suite for add_task MCP tool."""

    @patch("mcp_server.tools.get_session_context")
    @patch("mcp_server.tools.TaskService.create_task")
    def test_add_task_success(self, mock_create_task, mock_session_context):
        """
        Test successful task creation with valid parameters.

        Validates:
        - TaskService.create_task is called with correct parameters
        - user_id is passed through correctly
        - Priority is normalized to lowercase
        - Response matches expected MCP tool contract
        """
        # Setup
        user_id = "test-user-123"
        task_title = "Buy groceries"
        task_description = "Milk, eggs, bread"
        priority = "High"

        # Create mock task response
        mock_task = Mock()
        mock_task.id = uuid4()
        mock_task.title = task_title
        mock_task.priority = "high"
        mock_create_task.return_value = mock_task

        # Mock session context
        mock_session = MagicMock()
        mock_session_context.return_value.__enter__.return_value = mock_session

        # Execute
        result = add_task(
            user_id=user_id,
            title=task_title,
            description=task_description,
            priority=priority
        )

        # Verify TaskService.create_task was called
        mock_create_task.assert_called_once()
        call_args = mock_create_task.call_args

        # Verify session and user_id passed correctly
        assert call_args.kwargs["session"] == mock_session
        assert call_args.kwargs["user_id"] == user_id

        # Verify TaskCreate object has correct fields
        task_create = call_args.kwargs["task_create"]
        assert task_create.title == task_title
        assert task_create.description == task_description
        assert task_create.priority == "high"  # Normalized to lowercase

        # Verify response structure
        assert result["task_id"] == str(mock_task.id)
        assert result["status"] == "created"
        assert result["title"] == task_title
        assert result["priority"] == "high"

    @patch("mcp_server.tools.get_session_context")
    @patch("mcp_server.tools.TaskService.create_task")
    def test_add_task_user_validation(self, mock_create_task, mock_session_context):
        """
        Test that user_id is required and validated.

        Validates:
        - Empty user_id raises appropriate error
        - user_id is passed to TaskService for database filtering
        """
        # Setup
        mock_session = MagicMock()
        mock_session_context.return_value.__enter__.return_value = mock_session

        # Execute with valid user_id
        mock_task = Mock()
        mock_task.id = uuid4()
        mock_task.title = "Test task"
        mock_task.priority = "medium"
        mock_create_task.return_value = mock_task

        result = add_task(
            user_id="valid-user-id",
            title="Test task"
        )

        # Verify user_id was passed to TaskService
        call_args = mock_create_task.call_args
        assert call_args.kwargs["user_id"] == "valid-user-id"
        assert result["status"] == "created"

    @patch("mcp_server.tools.get_session_context")
    @patch("mcp_server.tools.TaskService.create_task")
    def test_add_task_priority_parameter(self, mock_create_task, mock_session_context):
        """
        Test priority parameter handling.

        Validates:
        - High/Medium/Low priority values are normalized to lowercase
        - Default priority is 'medium' when not provided
        - Invalid priorities default to 'medium'
        """
        # Setup
        mock_session = MagicMock()
        mock_session_context.return_value.__enter__.return_value = mock_session

        # Test case 1: High priority
        mock_task = Mock(id=uuid4(), title="Task", priority="high")
        mock_create_task.return_value = mock_task

        result = add_task(user_id="user-1", title="Task", priority="High")
        task_create = mock_create_task.call_args.kwargs["task_create"]
        assert task_create.priority == "high"

        # Test case 2: Medium priority (explicit)
        mock_task.priority = "medium"
        mock_create_task.return_value = mock_task

        result = add_task(user_id="user-1", title="Task", priority="Medium")
        task_create = mock_create_task.call_args.kwargs["task_create"]
        assert task_create.priority == "medium"

        # Test case 3: Low priority
        mock_task.priority = "low"
        mock_create_task.return_value = mock_task

        result = add_task(user_id="user-1", title="Task", priority="Low")
        task_create = mock_create_task.call_args.kwargs["task_create"]
        assert task_create.priority == "low"

        # Test case 4: No priority provided (default to medium)
        mock_task.priority = "medium"
        mock_create_task.return_value = mock_task

        result = add_task(user_id="user-1", title="Task")
        task_create = mock_create_task.call_args.kwargs["task_create"]
        assert task_create.priority == "medium"

        # Test case 5: Invalid priority (default to medium)
        result = add_task(user_id="user-1", title="Task", priority="INVALID")
        task_create = mock_create_task.call_args.kwargs["task_create"]
        assert task_create.priority == "medium"


class TestListTasks:
    """Test suite for list_tasks MCP tool."""

    @patch("mcp_server.tools.get_session_context")
    @patch("mcp_server.tools.TaskService.get_tasks")
    def test_list_tasks_success(self, mock_get_tasks, mock_session_context):
        """
        Test successful task listing with status filtering.

        Validates:
        - TaskService.get_tasks is called with correct user_id
        - Tasks are serialized correctly
        - Response matches MCP tool contract
        """
        # Setup
        user_id = "test-user-123"

        # Create mock tasks
        task1 = Mock()
        task1.id = uuid4()
        task1.title = "Task 1"
        task1.completed = False
        task1.priority = "high"

        task2 = Mock()
        task2.id = uuid4()
        task2.title = "Task 2"
        task2.completed = True
        task2.priority = "medium"

        mock_get_tasks.return_value = [task1, task2]

        # Mock session context
        mock_session = MagicMock()
        mock_session_context.return_value.__enter__.return_value = mock_session

        # Execute
        result = list_tasks(user_id=user_id, status="all")

        # Verify TaskService.get_tasks was called
        mock_get_tasks.assert_called_once_with(db=mock_session, user_id=user_id)

        # Verify response structure
        assert result["count"] == 2
        assert len(result["tasks"]) == 2
        assert result["tasks"][0]["id"] == str(task1.id)
        assert result["tasks"][0]["title"] == "Task 1"
        assert result["tasks"][0]["completed"] is False
        assert result["tasks"][0]["priority"] == "high"

    @patch("mcp_server.tools.get_session_context")
    @patch("mcp_server.tools.TaskService.get_tasks")
    def test_list_tasks_user_isolation(self, mock_get_tasks, mock_session_context):
        """
        Test that tasks are filtered by user_id.

        Validates:
        - Only tasks for specified user_id are returned
        - TaskService is called with correct user_id parameter
        """
        # Setup
        user_id = "user-123"

        mock_session = MagicMock()
        mock_session_context.return_value.__enter__.return_value = mock_session

        task = Mock(id=uuid4(), title="User task", completed=False, priority="medium")
        mock_get_tasks.return_value = [task]

        # Execute
        result = list_tasks(user_id=user_id)

        # Verify user_id was passed to TaskService
        mock_get_tasks.assert_called_once_with(db=mock_session, user_id=user_id)

        # Verify only 1 task returned (user's task)
        assert result["count"] == 1

    @patch("mcp_server.tools.get_session_context")
    @patch("mcp_server.tools.TaskService.get_tasks")
    def test_list_tasks_empty_results(self, mock_get_tasks, mock_session_context):
        """
        Test listing when user has no tasks.

        Validates:
        - Empty list is handled correctly
        - Response structure is valid with count=0
        """
        # Setup
        user_id = "new-user"
        mock_session = MagicMock()
        mock_session_context.return_value.__enter__.return_value = mock_session
        mock_get_tasks.return_value = []

        # Execute
        result = list_tasks(user_id=user_id)

        # Verify
        assert result["count"] == 0
        assert result["tasks"] == []

    @patch("mcp_server.tools.get_session_context")
    @patch("mcp_server.tools.TaskService.get_tasks")
    def test_list_tasks_status_filtering(self, mock_get_tasks, mock_session_context):
        """
        Test status filtering (all/pending/completed).

        Validates:
        - "pending" returns only incomplete tasks
        - "completed" returns only complete tasks
        - "all" returns all tasks
        """
        # Setup
        mock_session = MagicMock()
        mock_session_context.return_value.__enter__.return_value = mock_session

        task1 = Mock(id=uuid4(), title="Pending", completed=False, priority="high")
        task2 = Mock(id=uuid4(), title="Done", completed=True, priority="low")
        task3 = Mock(id=uuid4(), title="Pending 2", completed=False, priority="medium")

        mock_get_tasks.return_value = [task1, task2, task3]

        # Test case 1: status="pending"
        result = list_tasks(user_id="user-1", status="pending")
        assert result["count"] == 2  # Only task1 and task3
        assert all(t["completed"] is False for t in result["tasks"])

        # Test case 2: status="completed"
        result = list_tasks(user_id="user-1", status="completed")
        assert result["count"] == 1  # Only task2
        assert all(t["completed"] is True for t in result["tasks"])

        # Test case 3: status="all"
        result = list_tasks(user_id="user-1", status="all")
        assert result["count"] == 3  # All tasks


class TestCompleteTask:
    """Test suite for complete_task MCP tool."""

    @patch("mcp_server.tools.get_session_context")
    @patch("mcp_server.tools.TaskService.get_task_by_id")
    def test_complete_task_success(self, mock_get_task, mock_session_context):
        """
        Test successful task completion.

        Validates:
        - Task is retrieved with user_id validation
        - Task.completed is set to True
        - Session is committed
        - Response matches MCP tool contract
        """
        # Setup
        user_id = "user-123"
        task_id = str(uuid4())

        mock_task = Mock()
        mock_task.id = uuid4()
        mock_task.title = "Test task"
        mock_task.completed = False
        mock_get_task.return_value = mock_task

        mock_session = MagicMock()
        mock_session_context.return_value.__enter__.return_value = mock_session

        # Execute
        result = complete_task(user_id=user_id, task_id=task_id)

        # Verify task was retrieved with user_id validation
        mock_get_task.assert_called_once_with(
            db=mock_session,
            task_id=task_id,
            user_id=user_id
        )

        # Verify task.completed was set to True
        assert mock_task.completed is True

        # Verify session operations
        mock_session.commit.assert_called_once()
        mock_session.refresh.assert_called_once_with(mock_task)

        # Verify response
        assert result["task_id"] == str(mock_task.id)
        assert result["status"] == "completed"
        assert "Test task" in result["message"]

    @patch("mcp_server.tools.get_session_context")
    @patch("mcp_server.tools.TaskService.get_task_by_id")
    def test_complete_task_not_found(self, mock_get_task, mock_session_context):
        """
        Test completion when task doesn't exist.

        Validates:
        - TaskNotFoundError is handled gracefully
        - Error response is returned
        """
        # Setup
        user_id = "user-123"
        task_id = str(uuid4())

        mock_session = MagicMock()
        mock_session_context.return_value.__enter__.return_value = mock_session
        mock_get_task.side_effect = TaskNotFoundError(task_id)

        # Execute
        result = complete_task(user_id=user_id, task_id=task_id)

        # Verify error response
        assert result["task_id"] == task_id
        assert result["status"] == "error"
        assert "not found" in result["message"].lower()

    @patch("mcp_server.tools.get_session_context")
    @patch("mcp_server.tools.TaskService.get_task_by_id")
    def test_complete_task_already_completed(self, mock_get_task, mock_session_context):
        """
        Test completing an already completed task (idempotent).

        Validates:
        - Already completed tasks return success
        - Idempotent behavior (no error on re-completion)
        """
        # Setup
        user_id = "user-123"
        task_id = str(uuid4())

        mock_task = Mock()
        mock_task.id = uuid4()
        mock_task.title = "Already done"
        mock_task.completed = True  # Already completed
        mock_get_task.return_value = mock_task

        mock_session = MagicMock()
        mock_session_context.return_value.__enter__.return_value = mock_session

        # Execute
        result = complete_task(user_id=user_id, task_id=task_id)

        # Verify success response (idempotent)
        assert result["status"] == "completed"


class TestDeleteTask:
    """Test suite for delete_task MCP tool."""

    @patch("mcp_server.tools.get_session_context")
    @patch("mcp_server.tools.TaskService.delete_task")
    def test_delete_task_success(self, mock_delete_task, mock_session_context):
        """
        Test successful task deletion.

        Validates:
        - TaskService.delete_task is called with correct parameters
        - Response matches MCP tool contract
        """
        # Setup
        user_id = "user-123"
        task_id = str(uuid4())

        mock_session = MagicMock()
        mock_session_context.return_value.__enter__.return_value = mock_session

        # Execute
        result = delete_task(user_id=user_id, task_id=task_id)

        # Verify TaskService.delete_task was called
        mock_delete_task.assert_called_once_with(
            db=mock_session,
            task_id=task_id,
            user_id=user_id
        )

        # Verify response
        assert result["task_id"] == task_id
        assert result["status"] == "deleted"
        assert "success" in result["message"].lower()

    @patch("mcp_server.tools.get_session_context")
    @patch("mcp_server.tools.TaskService.delete_task")
    def test_delete_task_permission_denied(self, mock_delete_task, mock_session_context):
        """
        Test deletion when user doesn't own task.

        Validates:
        - UnauthorizedError is handled gracefully
        - Error response is returned
        """
        # Setup
        user_id = "user-123"
        task_id = str(uuid4())

        mock_session = MagicMock()
        mock_session_context.return_value.__enter__.return_value = mock_session
        mock_delete_task.side_effect = UnauthorizedError("Access denied")

        # Execute
        result = delete_task(user_id=user_id, task_id=task_id)

        # Verify error response
        assert result["task_id"] == task_id
        assert result["status"] == "error"
        assert "not found or access denied" in result["message"].lower()

    @patch("mcp_server.tools.get_session_context")
    @patch("mcp_server.tools.TaskService.delete_task")
    def test_delete_task_not_found(self, mock_delete_task, mock_session_context):
        """
        Test deletion when task doesn't exist.

        Validates:
        - TaskNotFoundError is handled gracefully
        - Error response is returned
        """
        # Setup
        user_id = "user-123"
        task_id = str(uuid4())

        mock_session = MagicMock()
        mock_session_context.return_value.__enter__.return_value = mock_session
        mock_delete_task.side_effect = TaskNotFoundError(task_id)

        # Execute
        result = delete_task(user_id=user_id, task_id=task_id)

        # Verify error response
        assert result["task_id"] == task_id
        assert result["status"] == "error"


class TestUpdateTask:
    """Test suite for update_task MCP tool."""

    @patch("mcp_server.tools.get_session_context")
    @patch("mcp_server.tools.TaskService.get_task_by_id")
    def test_update_task_title(self, mock_get_task, mock_session_context):
        """
        Test updating task title.

        Validates:
        - Task is retrieved with user_id validation
        - Title is updated correctly
        - Session is committed
        - Response matches MCP tool contract
        """
        # Setup
        user_id = "user-123"
        task_id = str(uuid4())
        new_title = "Updated title"

        mock_task = Mock()
        mock_task.id = uuid4()
        mock_task.title = "Old title"
        mock_task.description = "Description"
        mock_get_task.return_value = mock_task

        mock_session = MagicMock()
        mock_session_context.return_value.__enter__.return_value = mock_session

        # Execute
        result = update_task(user_id=user_id, task_id=task_id, title=new_title)

        # Verify task was retrieved
        mock_get_task.assert_called_once_with(
            db=mock_session,
            task_id=task_id,
            user_id=user_id
        )

        # Verify title was updated
        assert mock_task.title == new_title

        # Verify session operations
        mock_session.commit.assert_called_once()
        mock_session.refresh.assert_called_once_with(mock_task)

        # Verify response
        assert result["task_id"] == str(mock_task.id)
        assert result["status"] == "updated"
        assert new_title in result["message"]

    @patch("mcp_server.tools.get_session_context")
    @patch("mcp_server.tools.TaskService.get_task_by_id")
    def test_update_task_description(self, mock_get_task, mock_session_context):
        """
        Test updating task description.

        Validates:
        - Description is updated correctly
        - Title remains unchanged when not provided
        """
        # Setup
        user_id = "user-123"
        task_id = str(uuid4())
        new_description = "Updated description"

        mock_task = Mock()
        mock_task.id = uuid4()
        mock_task.title = "Title"
        mock_task.description = "Old description"
        mock_get_task.return_value = mock_task

        mock_session = MagicMock()
        mock_session_context.return_value.__enter__.return_value = mock_session

        # Execute
        result = update_task(
            user_id=user_id,
            task_id=task_id,
            description=new_description
        )

        # Verify description was updated
        assert mock_task.description == new_description

        # Verify title was NOT changed
        assert mock_task.title == "Title"

        # Verify response
        assert result["status"] == "updated"

    def test_update_task_validation_errors(self):
        """
        Test update validation when neither title nor description provided.

        Validates:
        - Returns error when no fields to update
        - Error message is clear
        """
        # Setup
        user_id = "user-123"
        task_id = str(uuid4())

        # Execute (no title or description)
        result = update_task(user_id=user_id, task_id=task_id)

        # Verify error response
        assert result["task_id"] == task_id
        assert result["status"] == "error"
        assert "must provide" in result["message"].lower()

    @patch("mcp_server.tools.get_session_context")
    @patch("mcp_server.tools.TaskService.get_task_by_id")
    def test_update_task_both_fields(self, mock_get_task, mock_session_context):
        """
        Test updating both title and description.

        Validates:
        - Both fields are updated correctly
        """
        # Setup
        user_id = "user-123"
        task_id = str(uuid4())
        new_title = "New title"
        new_description = "New description"

        mock_task = Mock()
        mock_task.id = uuid4()
        mock_task.title = "Old title"
        mock_task.description = "Old description"
        mock_get_task.return_value = mock_task

        mock_session = MagicMock()
        mock_session_context.return_value.__enter__.return_value = mock_session

        # Execute
        result = update_task(
            user_id=user_id,
            task_id=task_id,
            title=new_title,
            description=new_description
        )

        # Verify both fields were updated
        assert mock_task.title == new_title
        assert mock_task.description == new_description

        # Verify response
        assert result["status"] == "updated"

    @patch("mcp_server.tools.get_session_context")
    @patch("mcp_server.tools.TaskService.get_task_by_id")
    def test_update_task_not_found(self, mock_get_task, mock_session_context):
        """
        Test update when task doesn't exist.

        Validates:
        - TaskNotFoundError is handled gracefully
        - Error response is returned
        """
        # Setup
        user_id = "user-123"
        task_id = str(uuid4())

        mock_session = MagicMock()
        mock_session_context.return_value.__enter__.return_value = mock_session
        mock_get_task.side_effect = TaskNotFoundError(task_id)

        # Execute
        result = update_task(
            user_id=user_id,
            task_id=task_id,
            title="New title"
        )

        # Verify error response
        assert result["task_id"] == task_id
        assert result["status"] == "error"
        assert "not found or access denied" in result["message"].lower()


# =============================================================================
# Additional MCP Tools Tests (T037-T039) - NEW
# Tests for: set_priority, list_tasks_by_priority, bulk_update_tasks
# =============================================================================

class TestSetPriorityTool:
    """Test suite for set_priority MCP tool (T037)."""

    @patch("mcp_server.tools.get_session_context")
    @patch("mcp_server.tools.TaskService.get_task_by_id")
    @patch("mcp_server.tools.TaskService.update_task")
    def test_set_priority_success_high(self, mock_update, mock_get, mock_session_context):
        """Test setting priority to high."""
        user_id = "user-123"
        task_id = str(uuid4())

        mock_task = Mock()
        mock_task.id = uuid4()
        mock_task.title = "Important task"
        mock_task.priority = "high"
        mock_get.return_value = mock_task

        mock_session = MagicMock()
        mock_session_context.return_value.__enter__.return_value = mock_session

        result = set_priority(user_id=user_id, task_id=task_id, priority="high")

        assert result["status"] == "success"
        assert "high" in result["message"].lower()

    @patch("mcp_server.tools.get_session_context")
    @patch("mcp_server.tools.TaskService.get_task_by_id")
    def test_set_priority_to_low(self, mock_get, mock_session_context):
        """Test setting priority to low."""
        user_id = "user-123"
        task_id = str(uuid4())

        mock_task = Mock()
        mock_task.id = uuid4()
        mock_task.title = "Low priority task"
        mock_task.priority = "low"
        mock_get.return_value = mock_task

        mock_session = MagicMock()
        mock_session_context.return_value.__enter__.return_value = mock_session

        result = set_priority(user_id=user_id, task_id=task_id, priority="low")

        assert result["status"] == "success"
        assert mock_task.priority == "low"

    @patch("mcp_server.tools.get_session_context")
    @patch("mcp_server.tools.TaskService.get_task_by_id")
    def test_set_priority_invalid_value(self, mock_get, mock_session_context):
        """Test setting invalid priority value."""
        user_id = "user-123"
        task_id = str(uuid4())

        mock_session = MagicMock()
        mock_session_context.return_value.__enter__.return_value = mock_session

        result = set_priority(user_id=user_id, task_id=task_id, priority="invalid")

        assert result["status"] == "error"
        assert "invalid" in result["message"].lower()


class TestListTasksByPriorityTool:
    """Test suite for list_tasks_by_priority MCP tool (T038)."""

    @patch("mcp_server.tools.get_session_context")
    @patch("mcp_server.tools.TaskService.get_tasks_by_priority")
    def test_list_tasks_by_priority_success(self, mock_get_by_priority, mock_session_context):
        """Test listing tasks grouped by priority."""
        user_id = "user-123"

        # Create mock tasks by priority
        high_task = Mock(id=uuid4(), title="Urgent", priority="high")
        medium_task = Mock(id=uuid4(), title="Normal", priority="medium")
        low_task = Mock(id=uuid4(), title="When time", priority="low")

        mock_get_by_priority.return_value = {
            "high": [high_task],
            "medium": [medium_task],
            "low": [low_task]
        }

        mock_session = MagicMock()
        mock_session_context.return_value.__enter__.return_value = mock_session

        result = list_tasks_by_priority(user_id=user_id)

        assert result["status"] == "success"
        assert len(result["high"]) == 1
        assert len(result["medium"]) == 1
        assert len(result["low"]) == 1
        assert result["high"][0]["title"] == "Urgent"
        assert result["medium"][0]["title"] == "Normal"
        assert result["low"][0]["title"] == "When time"

    @patch("mcp_server.tools.get_session_context")
    @patch("mcp_server.tools.TaskService.get_tasks_by_priority")
    def test_list_tasks_by_priority_empty(self, mock_get_by_priority, mock_session_context):
        """Test listing when user has no tasks."""
        user_id = "new-user"

        mock_get_by_priority.return_value = {
            "high": [],
            "medium": [],
            "low": []
        }

        mock_session = MagicMock()
        mock_session_context.return_value.__enter__.return_value = mock_session

        result = list_tasks_by_priority(user_id=user_id)

        assert result["status"] == "success"
        assert result["high"] == []
        assert result["medium"] == []
        assert result["low"] == []

    @patch("mcp_server.tools.get_session_context")
    @patch("mcp_server.tools.TaskService.get_tasks_by_priority")
    def test_list_tasks_by_priority_mixed(self, mock_get_by_priority, mock_session_context):
        """Test listing with multiple tasks per priority."""
        user_id = "user-123"

        mock_get_by_priority.return_value = {
            "high": [
                Mock(id=uuid4(), title="Task 1", priority="high"),
                Mock(id=uuid4(), title="Task 2", priority="high")
            ],
            "medium": [Mock(id=uuid4(), title="Task 3", priority="medium")],
            "low": []
        }

        mock_session = MagicMock()
        mock_session_context.return_value.__enter__.return_value = mock_session

        result = list_tasks_by_priority(user_id=user_id)

        assert result["status"] == "success"
        assert len(result["high"]) == 2
        assert len(result["medium"]) == 1
        assert len(result["low"]) == 0


class TestBulkUpdateTasksTool:
    """Test suite for bulk_update_tasks MCP tool (T039)."""

    @patch("mcp_server.tools.get_session_context")
    @patch("mcp_server.tools.TaskService.bulk_update_status")
    def test_bulk_update_to_completed(self, mock_bulk_update, mock_session_context):
        """Test bulk marking tasks as completed."""
        user_id = "user-123"
        task_ids = [str(uuid4()), str(uuid4()), str(uuid4())]

        mock_bulk_update.return_value = 3  # 3 tasks updated

        mock_session = MagicMock()
        mock_session_context.return_value.__enter__.return_value = mock_session

        result = bulk_update_tasks(
            user_id=user_id,
            task_ids=task_ids,
            status="completed"
        )

        assert result["status"] == "success"
        assert result["updated_count"] == 3
        mock_bulk_update.assert_called_once()

    @patch("mcp_server.tools.get_session_context")
    @patch("mcp_server.tools.TaskService.bulk_update_status")
    def test_bulk_update_to_pending(self, mock_bulk_update, mock_session_context):
        """Test bulk marking tasks as pending."""
        user_id = "user-123"
        task_ids = [str(uuid4())]

        mock_bulk_update.return_value = 1

        mock_session = MagicMock()
        mock_session_context.return_value.__enter__.return_value = mock_session

        result = bulk_update_tasks(
            user_id=user_id,
            task_ids=task_ids,
            status="pending"
        )

        assert result["status"] == "success"
        assert result["updated_count"] == 1

    @patch("mcp_server.tools.get_session_context")
    @patch("mcp_server.tools.TaskService.bulk_update_status")
    def test_bulk_update_empty_list(self, mock_bulk_update, mock_session_context):
        """Test bulk update with empty task list."""
        user_id = "user-123"

        mock_session = MagicMock()
        mock_session_context.return_value.__enter__.return_value = mock_session

        result = bulk_update_tasks(
            user_id=user_id,
            task_ids=[],
            status="completed"
        )

        assert result["status"] == "success"
        assert result["updated_count"] == 0
        # Should not call service with empty list
        mock_bulk_update.assert_not_called()

    @patch("mcp_server.tools.get_session_context")
    @patch("mcp_server.tools.TaskService.bulk_update_status")
    def test_bulk_update_partial_failure(self, mock_bulk_update, mock_session_context):
        """Test bulk update with partial success (some tasks not found)."""
        user_id = "user-123"
        task_ids = [str(uuid4()), str(uuid4())]

        # Only 1 task was updated (other didn't exist)
        mock_bulk_update.return_value = 1

        mock_session = MagicMock()
        mock_session_context.return_value.__enter__.return_value = mock_session

        result = bulk_update_tasks(
            user_id=user_id,
            task_ids=task_ids,
            status="completed"
        )

        assert result["status"] == "success"
        assert result["updated_count"] == 1
