"""Integration tests for CLI commands."""

import pytest
from typer.testing import CliRunner

from src.app import app

runner = CliRunner()


def test_add_command_with_title_only() -> None:
    """Test add command with title only."""
    result = runner.invoke(app, ["add", "Buy groceries"])

    assert result.exit_code == 0
    assert "created successfully" in result.stdout.lower() or "✓" in result.stdout
    assert "Buy groceries" in result.stdout


def test_add_command_with_title_and_description() -> None:
    """Test add command with title and description."""
    result = runner.invoke(app, ["add", "Call dentist", "--description", "Schedule annual checkup"])

    assert result.exit_code == 0
    assert "created successfully" in result.stdout.lower() or "✓" in result.stdout
    assert "Call dentist" in result.stdout
    assert "Schedule annual checkup" in result.stdout


def test_add_command_with_short_description_flag() -> None:
    """Test add command with -d short flag."""
    result = runner.invoke(app, ["add", "Review PR", "-d", "Check code quality"])

    assert result.exit_code == 0
    assert "created successfully" in result.stdout.lower() or "✓" in result.stdout


def test_list_command_with_no_tasks() -> None:
    """Test list command when no tasks exist."""
    # Note: This test assumes a fresh app state
    # In real scenario, we'd need to reset state between tests
    result = runner.invoke(app, ["list"])

    assert result.exit_code == 0
    # Should show empty table or "No tasks" message


def test_list_command_after_adding_tasks() -> None:
    """Test list command displays added tasks."""
    # Add tasks first
    runner.invoke(app, ["add", "Task 1"])
    runner.invoke(app, ["add", "Task 2", "-d", "Description 2"])

    # List tasks
    result = runner.invoke(app, ["list"])

    assert result.exit_code == 0
    assert "Task 1" in result.stdout
    assert "Task 2" in result.stdout
    assert "Description 2" in result.stdout


def test_list_command_shows_table_headers() -> None:
    """Test that list command shows table with proper headers."""
    runner.invoke(app, ["add", "Sample Task"])

    result = runner.invoke(app, ["list"])

    assert result.exit_code == 0
    # Check for table headers (ID, Title, Description, Status)
    assert "ID" in result.stdout or "Id" in result.stdout
    assert "Title" in result.stdout
    assert "Status" in result.stdout


def test_toggle_command_marks_task_complete() -> None:
    """Test toggle command toggles task from PENDING to COMPLETED."""
    # Add a task first
    add_result = runner.invoke(app, ["add", "Task to toggle"])
    assert add_result.exit_code == 0

    # Toggle the task (assuming it gets ID 1)
    # Note: In integration tests with shared state, ID may vary
    # We'll toggle whatever the last added task ID was
    result = runner.invoke(app, ["toggle", "1"])

    assert result.exit_code == 0
    assert "toggled" in result.stdout.lower() or "completed" in result.stdout.lower() or "✓" in result.stdout


def test_toggle_command_toggles_back_to_pending() -> None:
    """Test toggle command toggles task from COMPLETED back to PENDING."""
    runner.invoke(app, ["add", "Toggle twice"])

    # Toggle to COMPLETED
    runner.invoke(app, ["toggle", "1"])
    # Toggle back to PENDING
    result = runner.invoke(app, ["toggle", "1"])

    assert result.exit_code == 0
    assert "pending" in result.stdout.lower() or "toggled" in result.stdout.lower()


def test_toggle_command_with_invalid_id() -> None:
    """Test toggle command with non-existent task ID."""
    result = runner.invoke(app, ["toggle", "9999"])

    assert result.exit_code == 1
    assert "not found" in result.stdout.lower() or "error" in result.stdout.lower()


def test_toggle_command_with_non_numeric_id() -> None:
    """Test toggle command rejects non-numeric ID."""
    result = runner.invoke(app, ["toggle", "abc"])

    # Typer should handle this validation
    assert result.exit_code != 0


def test_update_command_title_only() -> None:
    """Test update command with title only."""
    runner.invoke(app, ["add", "Original Title", "-d", "Original Desc"])

    result = runner.invoke(app, ["update", "1", "--title", "New Title"])

    assert result.exit_code == 0
    assert "updated" in result.stdout.lower() or "✓" in result.stdout
    assert "New Title" in result.stdout


def test_update_command_description_only() -> None:
    """Test update command with description only."""
    runner.invoke(app, ["add", "Title", "-d", "Old Desc"])

    result = runner.invoke(app, ["update", "1", "--description", "New Desc"])

    assert result.exit_code == 0
    assert "updated" in result.stdout.lower() or "✓" in result.stdout


def test_update_command_both_fields() -> None:
    """Test update command with both title and description."""
    runner.invoke(app, ["add", "Old Title", "-d", "Old Desc"])

    result = runner.invoke(app, ["update", "1", "-t", "New Title", "-d", "New Desc"])

    assert result.exit_code == 0
    assert "New Title" in result.stdout
    assert "New Desc" in result.stdout


def test_update_command_with_short_flags() -> None:
    """Test update command with short flags -t and -d."""
    runner.invoke(app, ["add", "Title"])

    result = runner.invoke(app, ["update", "1", "-t", "Updated", "-d", "New Description"])

    assert result.exit_code == 0


def test_update_command_invalid_id() -> None:
    """Test update command with non-existent task ID."""
    result = runner.invoke(app, ["update", "9999", "-t", "New Title"])

    assert result.exit_code == 1
    assert "not found" in result.stdout.lower() or "error" in result.stdout.lower()


def test_update_command_requires_at_least_one_field() -> None:
    """Test update command requires at least title or description."""
    runner.invoke(app, ["add", "Task"])

    # Update with neither title nor description should fail
    result = runner.invoke(app, ["update", "1"])

    # Should fail because no fields provided
    assert result.exit_code != 0


def test_update_command_empty_title_rejected() -> None:
    """Test update command rejects empty title."""
    runner.invoke(app, ["add", "Original Title"])

    result = runner.invoke(app, ["update", "1", "-t", ""])

    assert result.exit_code == 1
    assert "error" in result.stdout.lower() or "empty" in result.stdout.lower()


def test_delete_command_with_force_flag() -> None:
    """Test delete command with --force flag (no confirmation)."""
    runner.invoke(app, ["add", "Task to delete"])

    result = runner.invoke(app, ["delete", "1", "--force"])

    assert result.exit_code == 0
    assert "deleted" in result.stdout.lower() or "✓" in result.stdout


def test_delete_command_with_confirmation_yes() -> None:
    """Test delete command with confirmation prompt (user says yes)."""
    add_result = runner.invoke(app, ["add", "Task to delete uniquely"])
    # Extract task ID from output (format: "ID: X")
    task_id = None
    for line in add_result.stdout.split("\n"):
        if "ID:" in line:
            task_id = line.split("ID:")[-1].strip()
            break

    assert task_id is not None, "Could not find task ID in add command output"

    # Simulate user typing 'y' at confirmation prompt
    result = runner.invoke(app, ["delete", task_id], input="y\n")

    assert result.exit_code == 0
    assert "deleted" in result.stdout.lower() or "✓" in result.stdout


def test_delete_command_with_confirmation_no() -> None:
    """Test delete command with confirmation prompt (user says no)."""
    add_result = runner.invoke(app, ["add", "Task to keep uniquely"])
    task_id = None
    for line in add_result.stdout.split("\n"):
        if "ID:" in line:
            task_id = line.split("ID:")[-1].strip()
            break

    assert task_id is not None

    # Simulate user typing 'n' at confirmation prompt
    result = runner.invoke(app, ["delete", task_id], input="n\n")

    # Should cancel (exit 0 or 1 depending on implementation)
    # Task should still exist
    assert "cancel" in result.stdout.lower() or "abort" in result.stdout.lower()


def test_delete_command_invalid_id() -> None:
    """Test delete command with non-existent task ID."""
    result = runner.invoke(app, ["delete", "9999", "--force"])

    assert result.exit_code == 1
    assert "not found" in result.stdout.lower() or "error" in result.stdout.lower()


def test_delete_command_shows_task_details_in_prompt() -> None:
    """Test delete command shows task details before confirmation."""
    add_result = runner.invoke(app, ["add", "Important Task Unique", "-d", "Important Description"])
    task_id = None
    for line in add_result.stdout.split("\n"):
        if "ID:" in line:
            task_id = line.split("ID:")[-1].strip()
            break

    assert task_id is not None

    result = runner.invoke(app, ["delete", task_id], input="n\n")

    # Should display task title in confirmation
    assert "Important Task Unique" in result.stdout
