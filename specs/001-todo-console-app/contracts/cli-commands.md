# CLI Command Contracts

**Feature**: Todo In-Memory Python Console App
**Date**: 2025-12-07
**Framework**: Typer 0.12+

## Overview

This document defines the CLI command interface contracts for all five operations specified in FR-001. Each command is implemented as a Typer command with strict type hints, automatic validation, and user-friendly error handling.

## Application Structure

**Entry Point**: `src/app.py`
**Framework**: Typer with Rich integration
**Command Organization**: Single `typer.Typer()` app instance with sub-commands

```python
import typer
from typing_extensions import Annotated

app = typer.Typer(
    name="todo",
    help="Todo In-Memory Console App - Manage your tasks efficiently",
    add_completion=False
)
```

## Command Contracts

### 1. Add Task

**Command**: `add`
**Purpose**: Create a new task with auto-generated ID (FR-004)
**User Story**: User Story 1 (P1) - Create and View Tasks

**Signature**:
```python
@app.command()
def add(
    title: Annotated[str, typer.Argument(help="Task title (required)")],
    description: Annotated[str | None, typer.Option("--description", "-d", help="Task description (optional)")] = None
) -> None:
    """Add a new task to the todo list."""
```

**Parameters**:
| Parameter   | Type     | Required | Source | Validation | Description |
|-------------|----------|----------|--------|------------|-------------|
| title       | str      | Yes      | Positional argument | Non-empty | Task title |
| description | str \| None | No    | Option `--description` or `-d` | - | Optional task details |

**Behavior**:
1. Validate title is non-empty (strip whitespace first)
2. Call `TaskService.add_task(title, description)`
3. Display success message with assigned ID

**Success Output**:
```
✓ Task created successfully!
  ID: 1
  Title: Buy groceries
  Description: Milk, eggs, bread
  Status: PENDING
```

**Error Cases**:
| Error Condition | Exception | User Message |
|----------------|-----------|--------------|
| Empty title | InvalidTaskDataError | "❌ Error: Title cannot be empty" |
| Service failure | TodoAppError | "❌ Error: {error message}" |

**Examples**:
```bash
# With title only
$ todo add "Buy groceries"
✓ Task created successfully! ID: 1

# With title and description
$ todo add "Call dentist" --description "Schedule annual checkup"
✓ Task created successfully! ID: 2

# Short form
$ todo add "Review PR" -d "Check code quality"
✓ Task created successfully! ID: 3
```

---

### 2. List Tasks

**Command**: `list`
**Purpose**: Display all tasks in Rich table format sorted by ID (FR-007, FR-008)
**User Story**: User Story 1 (P1) - Create and View Tasks

**Signature**:
```python
@app.command(name="list")
def list_tasks() -> None:
    """List all tasks in a formatted table."""
```

**Parameters**: None

**Behavior**:
1. Call `TaskService.get_all_tasks()` to retrieve tasks
2. Pass tasks to `TaskRenderer.render_tasks()`
3. Display Rich table with columns: ID, Title, Description, Status

**Table Format**:
```
                        Tasks
┏━━━━┳━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━┓
┃ ID ┃ Title          ┃ Description            ┃ Status ┃
┡━━━━╇━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━┩
│ 1  │ Buy groceries  │ Milk, eggs, bread      │   -    │
│ 2  │ Call dentist   │ Schedule annual checkup│   ✓    │
└────┴────────────────┴────────────────────────┴────────┘
```

**Column Specs**:
| Column      | Style | Alignment | Format |
|-------------|-------|-----------|--------|
| ID          | Cyan  | Left      | Integer string |
| Title       | White | Left      | Raw string |
| Description | Dim   | Left      | Empty string if None |
| Status      | -     | Center    | "✓" (green) if COMPLETED, "-" if PENDING |

**Empty List Output**:
```
                    Tasks
┏━━━━┳━━━━━━━┳━━━━━━━━━━━━━┳━━━━━━━━┓
┃ ID ┃ Title ┃ Description ┃ Status ┃
┡━━━━╇━━━━━━━╇━━━━━━━━━━━━━╇━━━━━━━━┩
└────┴───────┴─────────────┴────────┘

No tasks found. Add your first task with: todo add "<title>"
```

**Examples**:
```bash
$ todo list
# Displays table as shown above
```

---

### 3. Update Task

**Command**: `update`
**Purpose**: Modify task title and/or description by ID (FR-016)
**User Story**: User Story 3 (P3) - Update Task Details

**Signature**:
```python
@app.command()
def update(
    task_id: Annotated[int, typer.Argument(help="Task ID to update")],
    title: Annotated[str | None, typer.Option("--title", "-t", help="New task title")] = None,
    description: Annotated[str | None, typer.Option("--description", "-d", help="New task description")] = None
) -> None:
    """Update an existing task's title and/or description."""
```

**Parameters**:
| Parameter   | Type        | Required | Source | Validation | Description |
|-------------|-------------|----------|--------|------------|-------------|
| task_id     | int         | Yes      | Positional argument | Must exist | Task ID to update |
| title       | str \| None | No       | Option `--title` or `-t` | Non-empty if provided | New title |
| description | str \| None | No       | Option `--description` or `-d` | - | New description |

**Behavior**:
1. Validate at least one field (title or description) is provided
2. Validate title is non-empty if provided
3. Call `TaskService.update_task(task_id, title, description)`
4. Display success message with updated fields

**Success Output**:
```
✓ Task 1 updated successfully!
  Title: Buy organic milk
  Description: Whole milk, 2 gallons
  Status: PENDING (unchanged)
```

**Error Cases**:
| Error Condition | Exception | User Message |
|----------------|-----------|--------------|
| Task ID not found | TaskNotFoundError | "❌ Error: Task with ID {id} not found" |
| Empty title | InvalidTaskDataError | "❌ Error: Title cannot be empty" |
| No fields provided | - | "❌ Error: Provide at least one field to update (--title or --description)" |
| Invalid ID format | typer.BadParameter | "❌ Error: Invalid ID format" |

**Examples**:
```bash
# Update title only
$ todo update 1 --title "Buy organic milk"
✓ Task 1 updated successfully!

# Update description only
$ todo update 2 -d "New appointment time: 3pm"
✓ Task 2 updated successfully!

# Update both
$ todo update 3 --title "Review PR #42" --description "Focus on error handling"
✓ Task 3 updated successfully!
```

---

### 4. Delete Task

**Command**: `delete`
**Purpose**: Permanently remove task by ID (FR-014)
**User Story**: User Story 4 (P3) - Remove Unwanted Tasks

**Signature**:
```python
@app.command()
def delete(
    task_id: Annotated[int, typer.Argument(help="Task ID to delete")],
    force: Annotated[bool, typer.Option("--force", "-f", help="Skip confirmation prompt")] = False
) -> None:
    """Delete a task permanently."""
```

**Parameters**:
| Parameter | Type | Required | Source | Validation | Description |
|-----------|------|----------|--------|------------|-------------|
| task_id   | int  | Yes      | Positional argument | Must exist | Task ID to delete |
| force     | bool | No       | Option `--force` or `-f` | - | Skip confirmation |

**Behavior**:
1. Retrieve task by ID to show details
2. If `--force` not set, prompt for confirmation
3. Call `TaskService.delete_task(task_id)`
4. Display success message

**Confirmation Prompt** (if not `--force`):
```
Delete this task?
  ID: 2
  Title: Call dentist
  Description: Schedule annual checkup
  Status: COMPLETED

This action cannot be undone. Continue? [y/N]:
```

**Success Output**:
```
✓ Task 2 deleted successfully!
```

**Error Cases**:
| Error Condition | Exception | User Message |
|----------------|-----------|--------------|
| Task ID not found | TaskNotFoundError | "❌ Error: Task with ID {id} not found" |
| Invalid ID format | typer.BadParameter | "❌ Error: Invalid ID format" |
| User cancels prompt | - | "⚠ Deletion cancelled" |

**Examples**:
```bash
# With confirmation
$ todo delete 2
# Shows prompt, waits for y/N

# Skip confirmation
$ todo delete 2 --force
✓ Task 2 deleted successfully!
```

---

### 5. Toggle Completion

**Command**: `toggle`
**Purpose**: Switch task status between PENDING and COMPLETED (FR-006)
**User Story**: User Story 2 (P2) - Mark Tasks Complete

**Signature**:
```python
@app.command()
def toggle(
    task_id: Annotated[int, typer.Argument(help="Task ID to toggle")]
) -> None:
    """Toggle task completion status (PENDING ↔ COMPLETED)."""
```

**Parameters**:
| Parameter | Type | Required | Source | Validation | Description |
|-----------|------|----------|--------|------------|-------------|
| task_id   | int  | Yes      | Positional argument | Must exist | Task ID to toggle |

**Behavior**:
1. Call `TaskService.toggle_task_completion(task_id)`
2. Display success message with new status

**Success Output**:
```
✓ Task 1 marked as COMPLETED!
  Title: Buy groceries
```
or
```
✓ Task 1 marked as PENDING!
  Title: Buy groceries
```

**Error Cases**:
| Error Condition | Exception | User Message |
|----------------|-----------|--------------|
| Task ID not found | TaskNotFoundError | "❌ Error: Task with ID {id} not found" |
| Invalid ID format | typer.BadParameter | "❌ Error: Invalid ID format" |

**Examples**:
```bash
# Mark as completed
$ todo toggle 1
✓ Task 1 marked as COMPLETED!

# Mark as pending (toggle again)
$ todo toggle 1
✓ Task 1 marked as PENDING!
```

---

## Global Conventions

### Exit Codes
| Code | Meaning | When Used |
|------|---------|-----------|
| 0    | Success | Command completed successfully |
| 1    | Error   | Validation error, task not found, or service failure |
| 2    | Usage   | Invalid arguments or options (Typer default) |

### Error Handling Pattern
```python
try:
    # Call service method
    result = service.some_operation()
    # Display success message
    console.print("[green]✓[/green] Success message")
except TaskNotFoundError as e:
    console.print(f"[red]❌ Error:[/red] {e}")
    raise typer.Exit(1)
except InvalidTaskDataError as e:
    console.print(f"[red]❌ Error:[/red] {e}")
    raise typer.Exit(1)
except TodoAppError as e:
    console.print(f"[red]❌ Error:[/red] {e}")
    raise typer.Exit(1)
```

### Rich Console Styling
- **Success**: `[green]✓[/green]` prefix
- **Error**: `[red]❌[/red]` prefix
- **Warning**: `[yellow]⚠[/yellow]` prefix
- **Info**: `[cyan]ℹ[/cyan]` prefix

### Console Clearing (FR-017)
- Use Rich's `Console.clear()` or visual separators between operations
- Optional: Add blank lines for readability

## Help Text

**Main App Help** (`todo --help`):
```
Usage: todo [OPTIONS] COMMAND [ARGS]...

  Todo In-Memory Console App - Manage your tasks efficiently

Options:
  --help  Show this message and exit.

Commands:
  add     Add a new task to the todo list.
  list    List all tasks in a formatted table.
  update  Update an existing task's title and/or description.
  delete  Delete a task permanently.
  toggle  Toggle task completion status (PENDING ↔ COMPLETED).
```

**Command Help Example** (`todo add --help`):
```
Usage: todo add [OPTIONS] TITLE

  Add a new task to the todo list.

Arguments:
  TITLE  Task title (required)

Options:
  -d, --description TEXT  Task description (optional)
  --help                  Show this message and exit.
```

## Integration Points

**Service Layer**: All commands delegate to `TaskService` methods
**UI Layer**: All commands use `TaskRenderer` for Rich table output
**Error Handling**: All commands catch domain exceptions and display user-friendly messages
**Type Safety**: All commands use strict type hints for Typer validation

## Summary

**Total Commands**: 5 (add, list, update, delete, toggle)
**Parameters**: 7 total across all commands
**Error Cases**: 8 distinct error conditions handled
**Output Formats**: 2 (success messages, Rich table)
**Exit Codes**: 3 (0=success, 1=error, 2=usage)

**Next Steps**: Generate quickstart.md with setup instructions and usage examples.
