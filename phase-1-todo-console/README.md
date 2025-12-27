# Todo In-Memory Python Console App

**Phase I** of the Evolution of Todo project - A strictly in-memory Python console application for task management.

## Features

- ✅ Add tasks with title and optional description
- ✅ List all tasks in a formatted table (sorted by ID)
- ✅ Toggle task completion status (PENDING ↔ COMPLETED)
- ✅ Update task details (title and/or description)
- ✅ Delete tasks permanently
- ✅ Rich terminal formatting with color-coded status indicators

## Requirements

- Python 3.13+
- uv package manager

## Installation

### 1. Install uv

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 2. Clone and Setup

```bash
git clone <repository-url>
cd hackathon-todo
git checkout 001-todo-console-app
```

### 3. Install Dependencies

```bash
uv sync
```

## Usage

### Interactive Mode (Recommended)

Run the app in interactive menu-driven mode:

```bash
uv run python main.py
```

You'll see a beautiful menu interface:
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 📝 Todo App - Main Menu          ┃
┠──────────────────────────────────┨
┃ 1. Add Task                      ┃
┃ 2. List All Tasks                ┃
┃ 3. Toggle Task Completion        ┃
┃ 4. Update Task                   ┃
┃ 5. Delete Task                   ┃
┃ 6. Exit                          ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

Select an option [1/2/3/4/5/6] (2):
```

- Select options by number
- Interactive prompts guide you through each action
- Beautiful Rich tables show your tasks
- Loop continues until you exit
- Success messages after each operation

### CLI Mode (Advanced)

For automation and scripting, use individual commands:

### Add a Task

```bash
# With title only
uv run python -m src.app add "Buy groceries"

# With title and description
uv run python -m src.app add "Call dentist" --description "Schedule annual checkup"
```

### List All Tasks

```bash
uv run python -m src.app list
```

### Toggle Task Completion

```bash
uv run python -m src.app toggle 1
```

### Update Task

```bash
# Update title only
uv run python -m src.app update 1 --title "Buy organic groceries"

# Update description only
uv run python -m src.app update 1 --description "Include vegetables"

# Update both
uv run python -m src.app update 1 -t "Shopping" -d "Groceries and supplies"
```

### Delete Task

```bash
# With confirmation
uv run python -m src.app delete 1

# Skip confirmation
uv run python -m src.app delete 1 --force
```

## Example Workflow

```bash
# Add tasks for the day
uv run python -m src.app add "Review pull requests"
uv run python -m src.app add "Team standup at 10am"
uv run python -m src.app add "Deploy feature X" -d "Check staging first"

# List all tasks
uv run python -m src.app list

# Complete tasks as you finish them
uv run python -m src.app toggle 1

# Update a task if plans change
uv run python -m src.app update 3 -d "Deploy postponed to tomorrow"

# Remove completed tasks
uv run python -m src.app delete 1 --force
```

## Development

### Run Tests

```bash
# All tests
uv run pytest tests/

# With coverage
uv run pytest tests/ --cov=src --cov-report=html
```

### Type Checking

```bash
uv run mypy src/ --strict
```

## Architecture

This application follows the Repository Pattern for clean separation of concerns:

- **`src/models/`**: Domain entities (Task, TaskStatus enum)
- **`src/storage/`**: Repository abstraction and in-memory implementation
- **`src/services/`**: Business logic layer (TaskService)
- **`src/ui/`**: Rich table rendering (TaskRenderer)
- **`src/app.py`**: Typer CLI entry point

## Important Notes

⚠️ **Data Persistence**: This is an in-memory application. All data is lost when you exit. This is intentional for Phase I.

🔮 **Future Phases**:
- Phase II: Database persistence
- Phase III: Web interface
- Phase IV: AI chatbot integration
- Phase V: Cloud deployment

## Project Structure

```
hackathon-todo/
├── src/
│   ├── models/          # Task and TaskStatus
│   ├── storage/         # Repository pattern
│   ├── services/        # Business logic
│   ├── ui/              # Rich rendering
│   └── app.py           # CLI entry point
├── tests/
│   ├── unit/            # Unit tests
│   └── integration/     # CLI integration tests
├── specs/               # Design documents
│   └── 001-todo-console-app/
│       ├── spec.md      # Feature specification
│       ├── plan.md      # Implementation plan
│       ├── tasks.md     # Task breakdown
│       └── ...
├── pyproject.toml       # Dependencies and config
└── README.md            # This file
```

## License

[Add license here]

## Contributing

See `.specify/memory/constitution.md` for development guidelines and principles.
