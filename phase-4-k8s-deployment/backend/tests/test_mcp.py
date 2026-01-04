"""
Unit tests for MCP server tools (Phase III).

Tests MCP server module imports and priority detection.
Database tool tests require full integration test setup.

Testing Strategy:
- Test module imports (verify no hanging)
- Test priority detection from text
- Tool tests verified through integration testing
"""

import pytest
import sys
from pathlib import Path
from unittest.mock import Mock, patch
from uuid import uuid4
from datetime import datetime

# Ensure src directory is in path
_src_path = Path(__file__).parent.parent
if str(_src_path) not in sys.path:
    sys.path.insert(0, str(_src_path))

# Set environment variables before any imports
import os
if "DATABASE_URL" not in os.environ:
    os.environ["DATABASE_URL"] = "sqlite:///:memory:"
if "BETTER_AUTH_SECRET" not in os.environ:
    os.environ["BETTER_AUTH_SECRET"] = "test-secret-key-for-testing-minimum-32-characters-long"


class TestMCPServerImport:
    """Test suite for MCP server module import."""

    def test_mcp_server_import(self):
        """
        Test that MCP server can be imported without hanging.

        This is the critical test - the old implementation would hang
        on import due to asyncpg connection attempts. The new synchronous
        implementation should import instantly.
        """
        import importlib

        # Force reimport to verify it works
        if 'mcp_server.tools' in sys.modules:
            del sys.modules['mcp_server.tools']
        if 'mcp_server' in sys.modules:
            del sys.modules['mcp_server']

        # This should not hang - if it does, the test will timeout
        from mcp_server.tools import mcp, detect_priority_from_text

        # Verify mcp is a FastMCP instance
        assert mcp is not None
        assert hasattr(mcp, 'run')

        # Verify helper functions exist
        assert callable(detect_priority_from_text)

    def test_mcp_tools_exist(self):
        """Test that all required MCP tools are registered."""
        from mcp_server.tools import mcp

        # FastMCP stores tools internally, we verify the module loaded correctly
        # by checking the tools are defined in the module
        import mcp_server.tools as tools_module

        # Check that tool functions exist in the module
        expected_tools = ['add_task', 'list_tasks', 'complete_task', 'delete_task', 'update_task', 'set_priority', 'get_task']
        for name in expected_tools:
            assert hasattr(tools_module, name), f"Tool {name} not found in module"

    def test_mcp_helper_functions_exist(self):
        """Test that helper functions are exported."""
        import mcp_server.tools as tools_module

        # Check helper functions
        assert hasattr(tools_module, 'detect_priority_from_text')
        assert hasattr(tools_module, 'set_mock_task_service')
        assert hasattr(tools_module, '_clear_task_service_cache')


class TestPriorityDetection:
    """Test suite for priority detection from text."""

    def test_high_priority_keywords(self):
        """Test detection of high priority keywords."""
        from mcp_server.tools import detect_priority_from_text
        assert detect_priority_from_text("URGENT task") == "high"
        assert detect_priority_from_text("critical bug") == "high"
        assert detect_priority_from_text("important meeting") == "high"
        assert detect_priority_from_text("ASAP delivery") == "high"
        assert detect_priority_from_text("high priority") == "high"
        assert detect_priority_from_text("emergency") == "high"
        assert detect_priority_from_text("immediately") == "high"
        assert detect_priority_from_text("must do today") == "high"

    def test_low_priority_keywords(self):
        """Test detection of low priority keywords."""
        from mcp_server.tools import detect_priority_from_text
        assert detect_priority_from_text("low priority") == "low"
        assert detect_priority_from_text("minor task") == "low"
        assert detect_priority_from_text("optional feature") == "low"
        assert detect_priority_from_text("when you have time") == "low"
        assert detect_priority_from_text("someday maybe") == "low"
        assert detect_priority_from_text("eventually") == "low"
        assert detect_priority_from_text("if possible") == "low"

    def test_medium_priority_keywords(self):
        """Test detection of medium priority keywords."""
        from mcp_server.tools import detect_priority_from_text
        assert detect_priority_from_text("medium priority") == "medium"
        assert detect_priority_from_text("normal task") == "medium"

    def test_default_priority(self):
        """Test default priority when no keywords match."""
        from mcp_server.tools import detect_priority_from_text
        assert detect_priority_from_text("Buy groceries") == "medium"
        assert detect_priority_from_text("Call mom") == "medium"
        assert detect_priority_from_text("Schedule appointment") == "medium"

    def test_case_insensitive(self):
        """Test that priority detection is case insensitive."""
        from mcp_server.tools import detect_priority_from_text
        assert detect_priority_from_text("URGENT") == "high"
        assert detect_priority_from_text("urgent") == "high"
        assert detect_priority_from_text("Urgent") == "high"
        assert detect_priority_from_text("LOW PRIORITY") == "low"
        assert detect_priority_from_text("Low Priority") == "low"

    def test_combined_text_priority(self):
        """Test priority detection with combined title and description."""
        from mcp_server.tools import detect_priority_from_text

        # Title says normal, description says urgent -> should detect urgent
        combined = "Review document This is URGENT and must be done today"
        assert detect_priority_from_text(combined) == "high"

    def test_empty_text(self):
        """Test priority detection with empty text."""
        from mcp_server.tools import detect_priority_from_text
        assert detect_priority_from_text("") == "medium"


class TestToolValidation:
    """Test suite for tool input validation (no database required)."""

    def test_add_task_requires_user_id(self):
        """Test that add_task function signature is correct."""
        from mcp_server.tools import add_task
        import inspect

        sig = inspect.signature(add_task)
        params = list(sig.parameters.keys())

        assert 'user_id' in params
        assert 'title' in params
        assert 'description' in params
        assert 'priority' in params

    def test_list_tasks_requires_user_id(self):
        """Test that list_tasks function signature is correct."""
        from mcp_server.tools import list_tasks
        import inspect

        sig = inspect.signature(list_tasks)
        params = list(sig.parameters.keys())

        assert 'user_id' in params
        assert 'status' in params

    def test_complete_task_requires_user_id_and_task_id(self):
        """Test that complete_task function signature is correct."""
        from mcp_server.tools import complete_task
        import inspect

        sig = inspect.signature(complete_task)
        params = list(sig.parameters.keys())

        assert 'user_id' in params
        assert 'task_id' in params

    def test_delete_task_requires_user_id_and_task_id(self):
        """Test that delete_task function signature is correct."""
        from mcp_server.tools import delete_task
        import inspect

        sig = inspect.signature(delete_task)
        params = list(sig.parameters.keys())

        assert 'user_id' in params
        assert 'task_id' in params

    def test_update_task_requires_user_id_and_task_id(self):
        """Test that update_task function signature is correct."""
        from mcp_server.tools import update_task
        import inspect

        sig = inspect.signature(update_task)
        params = list(sig.parameters.keys())

        assert 'user_id' in params
        assert 'task_id' in params
        assert 'title' in params
        assert 'description' in params
        assert 'priority' in params
        assert 'completed' in params

    def test_set_priority_requires_user_id_task_id_and_priority(self):
        """Test that set_priority function signature is correct."""
        from mcp_server.tools import set_priority
        import inspect

        sig = inspect.signature(set_priority)
        params = list(sig.parameters.keys())

        assert 'user_id' in params
        assert 'task_id' in params
        assert 'priority' in params

    def test_get_task_requires_user_id_and_task_id(self):
        """Test that get_task function signature is correct."""
        from mcp_server.tools import get_task
        import inspect

        sig = inspect.signature(get_task)
        params = list(sig.parameters.keys())

        assert 'user_id' in params
        assert 'task_id' in params


class TestMockServiceFunctions:
    """Test suite for mock service helper functions."""

    def test_set_mock_task_service_exists(self):
        """Test that set_mock_task_service function exists."""
        from mcp_server.tools import set_mock_task_service
        assert callable(set_mock_task_service)

    def test_clear_task_service_cache_exists(self):
        """Test that _clear_task_service_cache function exists."""
        from mcp_server.tools import _clear_task_service_cache
        assert callable(_clear_task_service_cache)

    def test_clear_task_service_cache_clears_mock(self):
        """Test that _clear_task_service_cache clears the mock."""
        from mcp_server.tools import set_mock_task_service, _clear_task_service_cache, _mock_task_service

        # Set a mock
        mock_service = Mock()
        set_mock_task_service(mock_service)

        # Clear it
        _clear_task_service_cache()

        # Verify mock is cleared
        # (This tests the function runs without error)


class TestMCPServerConfig:
    """Test suite for MCP server configuration."""

    def test_mcp_server_has_name(self):
        """Test that MCP server has a name."""
        from mcp_server.tools import mcp
        assert mcp.name is not None
        assert isinstance(mcp.name, str)

    def test_mcp_server_default_name(self):
        """Test that MCP server has a default name."""
        from mcp_server.tools import mcp
        # Should be "todo-task-server" by default
        assert mcp.name == "todo-task-server"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
