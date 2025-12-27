# Quickstart Guide

**Feature**: Todo In-Memory Python Console App
**Date**: 2025-12-07
**Target Audience**: Developers and end users

## Prerequisites

**Required**:
- Python 3.13 or higher
- `uv` package manager (install: `curl -LsSf https://astral.sh/uv/install.sh | sh`)

**Optional**:
- Git (for cloning repository)
- Terminal with Unicode support (for checkmark symbols)

**System Requirements**:
- OS: Linux, macOS, or Windows
- RAM: 100MB minimum
- Disk: 50MB for dependencies

## Installation

### Step 1: Clone Repository (or extract archive)

```bash
git clone <repository-url> hackathon-todo
cd hackathon-todo
```

### Step 2: Switch to Feature Branch

```bash
git checkout 001-todo-console-app
```

### Step 3: Initialize Project with uv

```bash
# Install dependencies (reads pyproject.toml)
uv sync

# Verify installation
uv run python --version  # Should show Python 3.13.x
```

### Step 4: Verify Setup

```bash
# Run tests to verify installation
uv run pytest tests/

# Check type safety
uv run mypy src/

# Run the application
uv run python -m src.app --help
```

Expected output:
```
Usage: app [OPTIONS] COMMAND [ARGS]...

  Todo In-Memory Console App - Manage your tasks efficiently

Options:
  --help  Show this message and exit.

Commands:
  add     Add a new task to the todo list.
  delete  Delete a task permanently.
  list    List all tasks in a formatted table.
  toggle  Toggle task completion status (PENDING ↔ COMPLETED).
  update  Update an existing task's title and/or description.
```

## Quick Usage Examples

### Add Your First Task

```bash
# Add task with title only
uv run python -m src.app add "Buy groceries"

# Output:
# ✓ Task created successfully!
#   ID: 1
#   Title: Buy groceries
#   Description:
#   Status: PENDING
```

### Add Task with Description

```bash
uv run python -m src.app add "Call dentist" --description "Schedule annual checkup"

# Output:
# ✓ Task created successfully!
#   ID: 2
#   Title: Call dentist
#   Description: Schedule annual checkup
#   Status: PENDING
```

### List All Tasks

```bash
uv run python -m src.app list

# Output:
#                         Tasks
# ┏━━━━┳━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━┓
# ┃ ID ┃ Title         ┃ Description            ┃ Status ┃
# ┡━━━━╇━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━┩
# │ 1  │ Buy groceries │                        │   -    │
# │ 2  │ Call dentist  │ Schedule annual checkup│   -    │
# └────┴───────────────┴────────────────────────┴────────┘
```

### Mark Task as Complete

```bash
uv run python -m src.app toggle 1

# Output:
# ✓ Task 1 marked as COMPLETED!
#   Title: Buy groceries

# List again to see checkmark
uv run python -m src.app list

# Output shows green checkmark (✓) for task 1:
# │ 1  │ Buy groceries │                        │   ✓    │
# │ 2  │ Call dentist  │ Schedule annual checkup│   -    │
```

### Update Task

```bash
# Update title
uv run python -m src.app update 1 --title "Buy organic groceries"

# Update description
uv run python -m src.app update 2 --description "Call by Friday"

# Update both
uv run python -m src.app update 1 -t "Buy groceries" -d "Milk, eggs, bread"
```

### Delete Task

```bash
# Delete with confirmation prompt
uv run python -m src.app delete 2

# Output:
# Delete this task?
#   ID: 2
#   Title: Call dentist
#   Description: Schedule annual checkup
#   Status: PENDING
#
# This action cannot be undone. Continue? [y/N]: y
# ✓ Task 2 deleted successfully!

# Delete without confirmation
uv run python -m src.app delete 2 --force
```

## Common Workflows

### Daily Task Management

```bash
# Morning: Add today's tasks
uv run python -m src.app add "Review pull requests"
uv run python -m src.app add "Team standup at 10am"
uv run python -m src.app add "Deploy feature X" -d "Check staging first"

# List tasks to plan day
uv run python -m src.app list

# As you complete tasks
uv run python -m src.app toggle 1  # Review PRs done
uv run python -m src.app toggle 2  # Standup done

# End of day: Review progress
uv run python -m src.app list

# Next morning: Clean up completed tasks
uv run python -m src.app delete 1 --force
uv run python -m src.app delete 2 --force
```

### Project Tracking

```bash
# Add project tasks
uv run python -m src.app add "Design database schema" -d "ERD and migrations"
uv run python -m src.app add "Implement API endpoints" -d "CRUD operations"
uv run python -m src.app add "Write integration tests" -d "Test all endpoints"

# Update as requirements change
uv run python -m src.app update 1 -d "ERD, migrations, and seed data"

# Mark milestones complete
uv run python -m src.app toggle 1  # Schema design done
```

## Shell Alias (Optional)

For convenience, create a shell alias:

**Bash/Zsh** (`~/.bashrc` or `~/.zshrc`):
```bash
alias todo='uv run python -m src.app'
```

**PowerShell** (`$PROFILE`):
```powershell
function todo { uv run python -m src.app $args }
```

After reloading shell:
```bash
todo add "Task title"
todo list
todo toggle 1
```

## Troubleshooting

### Issue: "uv: command not found"
**Solution**: Install uv:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
# Add to PATH (follow installer instructions)
```

### Issue: "Python version 3.13 required"
**Solution**: Use uv to install Python 3.13:
```bash
uv python install 3.13
uv python pin 3.13
```

### Issue: "Module not found" errors
**Solution**: Sync dependencies:
```bash
uv sync
```

### Issue: Checkmarks not displaying correctly
**Solution**: Ensure terminal supports Unicode (UTF-8 encoding):
- **Windows**: Use Windows Terminal or WSL
- **macOS/Linux**: Most terminals support Unicode by default

### Issue: Tests failing
**Solution**: Verify environment:
```bash
# Clean and reinstall
rm -rf .venv
uv sync

# Run tests with verbose output
uv run pytest tests/ -v
```

## Development Setup (For Contributors)

### Install Development Dependencies

```bash
# Install all dependencies including dev tools
uv sync --all-extras

# Verify dev tools
uv run mypy --version
uv run pytest --version
```

### Run Quality Checks

```bash
# Type checking
uv run mypy src/ --strict

# Run tests with coverage
uv run pytest tests/ --cov=src --cov-report=html

# Format code (if using ruff/black)
uv run ruff format src/ tests/
```

### Run in Development Mode

```bash
# Run directly from source
uv run python -m src.app list

# Run with Python debugger
uv run python -m pdb -m src.app add "Debug task"
```

## Data Persistence Note

**Important**: This application stores data in-memory only (FR-010). All tasks are **lost when you exit** the application. This is by design for Phase I (In-Memory Console App).

**Future Phases**:
- Phase II: Database persistence will be added
- Phase III: Cloud sync capabilities

For now, use the app for **single-session task management** (e.g., during a work session, meeting notes).

## Next Steps

- **Explore all commands**: Run `uv run python -m src.app COMMAND --help` for detailed usage
- **Read specification**: See `specs/001-todo-console-app/spec.md` for full feature details
- **Review architecture**: See `specs/001-todo-console-app/plan.md` for design decisions
- **Run tests**: Explore `tests/` directory to understand test coverage
- **Contribute**: Follow TDD process (write tests first, then implementation)

## Support

**Issues**: Report bugs at [repository-issues-url]
**Documentation**: See `specs/001-todo-console-app/` for detailed specifications
**Contributing**: Follow Constitution guidelines in `.specify/memory/constitution.md`

## License

[Add license information here]

---

**Version**: 1.0.0 (Phase I - In-Memory Console App)
**Last Updated**: 2025-12-07

