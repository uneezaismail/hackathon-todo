# Phase 0: Research & Architectural Decisions

**Feature**: Todo In-Memory Python Console App
**Date**: 2025-12-07
**Status**: Complete

## Overview

This document consolidates research findings and architectural decisions for the Todo Console App implementation. All technical unknowns from the plan's Technical Context have been resolved through investigation of best practices, library evaluations, and constitutional alignment.

## Research Tasks Completed

### 1. Package Manager Selection: uv vs pip/poetry
**Decision**: uv
**Rationale**:
- **Constitution Alignment**: Explicitly specified in Constitution Section 4 (Immutable Tech Stack) - "utilizing `uv`"
- **Performance**: 10-100x faster than pip for dependency resolution and installation
- **Modern Features**: Built-in virtual environment management, lock files by default, Python version management
- **Project Initialization**: `uv init` creates standard Python project structure with pyproject.toml
**Alternatives Considered**:
- **pip**: Standard but lacks lock file management, slower dependency resolution
- **poetry**: Feature-rich but slower than uv, not specified in Constitution
**Best Practices**:
- Use `uv init` to bootstrap project
- Pin Python version with `.python-version` file
- Define dependencies in `pyproject.toml` [project.dependencies]
- Use `uv sync` for reproducible installations

### 2. CLI Framework: Typer vs Click vs argparse
**Decision**: Typer
**Rationale**:
- **Type Safety**: Built on Python type hints (aligns with FR-012 strict typing requirement and Constitution Rule IX)
- **Developer Experience**: Automatic help text generation from docstrings and type hints
- **Rich Integration**: Native support for Rich library (used for FR-008 table formatting)
- **Simplicity**: Decorator-based API reduces boilerplate vs Click/argparse
**Alternatives Considered**:
- **Click**: Popular but doesn't leverage type hints, requires more explicit configuration
- **argparse**: Standard library but verbose, poor type hint support
**Best Practices**:
- Use `typer.Typer()` app instance for command organization
- Leverage type annotations for automatic validation
- Use `rich.console.Console` for styled output within Typer commands
- Implement `--help` documentation through docstrings

### 3. Repository Pattern Implementation in Python
**Decision**: Protocol (typing.Protocol) for interface, dataclass for implementation
**Rationale**:
- **Type Safety**: Protocol provides structural subtyping without inheritance (Pythonic)
- **Testability**: Easy to create mock repositories for unit testing
- **Forward Compatibility**: Allows Phase II database repository to implement same Protocol without code changes in TaskService
- **Constitution Alignment**: Satisfies Rule IV (Evolutionary Architecture) and FR-013 (Repository Pattern)
**Alternatives Considered**:
- **ABC (Abstract Base Class)**: Requires inheritance, less flexible than Protocol
- **Duck Typing**: No static type checking, violates mypy --strict requirement
**Best Practices**:
- Define `TaskRepository` as Protocol with all CRUD operations
- Implement `InMemoryTaskRepository` with `list[Task]` storage
- Inject repository into `TaskService` via constructor (dependency injection)
- Use Protocol for type hints, not concrete class

### 4. Rich Table Formatting Best Practices
**Decision**: Dedicated `TaskRenderer` class with Rich Table API
**Rationale**:
- **Separation of Concerns**: UI rendering isolated from business logic (Constitution Rule V)
- **Rich Features**: Built-in column alignment, color support, overflow handling
- **Testability**: Renderer can be tested independently with mock Console
**Implementation Pattern**:
```python
from rich.table import Table
from rich.console import Console

class TaskRenderer:
    def render_tasks(self, tasks: list[Task]) -> None:
        table = Table(title="Tasks")
        table.add_column("ID", style="cyan")
        table.add_column("Title", style="white")
        table.add_column("Description", style="dim")
        table.add_column("Status", justify="center")

        for task in sorted(tasks, key=lambda t: t.id):
            status = "[green]✓[/green]" if task.status == TaskStatus.COMPLETED else "-"
            table.add_row(str(task.id), task.title, task.description or "", status)

        console = Console()
        console.print(table)
```
**Best Practices**:
- Use Rich markup for colors (`[green]`, `[/green]`)
- Sort data before rendering (FR-007: sort by ID)
- Handle None/empty values gracefully
- Use `Console.print()` for output

### 5. ID Generation Strategy: Auto-increment Logic
**Decision**: max(existing_ids) + 1 with default 1 for empty list
**Rationale**:
- **Specification Compliance**: FR-004 explicitly requires "max(existing_ids) + 1, starting from 1"
- **Simplicity**: No external libraries needed (UUID, sequence generators)
- **ID Preservation**: FR-015 requires IDs never reused after deletion
**Implementation Pattern**:
```python
def generate_next_id(self) -> int:
    if not self._tasks:
        return 1
    return max(task.id for task in self._tasks) + 1
```
**Edge Cases Handled**:
- Empty list → returns 1
- After deletions → continues from max historical ID
- Thread safety: Not required (single-user console app, FR-010 in-memory only)

### 6. Error Handling Strategy
**Decision**: Custom exception hierarchy with user-friendly messages
**Rationale**:
- **Constitution Rule X**: No silent failures, user-friendly errors required
- **Type Safety**: Typed exceptions enable specific error handling
- **Separation**: Domain exceptions vs presentation error messages
**Exception Hierarchy**:
```python
class TodoAppError(Exception):
    """Base exception for all app errors"""
    pass

class TaskNotFoundError(TodoAppError):
    """Raised when task ID doesn't exist"""
    def __init__(self, task_id: int):
        self.task_id = task_id
        super().__init__(f"Task with ID {task_id} not found")

class InvalidTaskDataError(TodoAppError):
    """Raised when task data validation fails"""
    pass
```
**Best Practices**:
- Catch specific exceptions in CLI layer (app.py)
- Convert to user-friendly messages using Rich console
- Never expose stack traces to users (Constitution Rule X)
- Log internal errors for debugging (if needed in future)

### 7. Type Hinting Strategy for mypy --strict
**Decision**: Full type coverage with dataclasses and Protocol
**Rationale**:
- **Constitution Rule IX**: Strict type hints required
- **FR-012**: mypy compatibility mandatory
- **Tooling**: mypy --strict catches all type errors at development time
**Key Patterns**:
- Use `dataclass` for Task (automatic __init__, type-safe fields)
- Use `Enum` for TaskStatus (type-safe status values)
- Use `Protocol` for TaskRepository (interface typing)
- Use `Optional[str]` for description field (FR-011: optional)
- Use `list[Task]` not `List[Task]` (Python 3.13+ native generics)
**mypy Configuration** (pyproject.toml):
```toml
[tool.mypy]
python_version = "3.13"
strict = true
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
```

### 8. Testing Strategy: pytest Best Practices
**Decision**: Separate unit and integration tests with pytest fixtures
**Rationale**:
- **Constitution Rule VIII**: TDD required (Red-Green-Refactor)
- **Coverage**: Unit tests for business logic, integration tests for CLI flows
- **Maintainability**: Fixtures reduce test boilerplate
**Test Organization**:
- **Unit Tests** (`tests/unit/`): Test individual components in isolation
  - Mock repository for service tests
  - Test edge cases and error conditions
- **Integration Tests** (`tests/integration/`): Test CLI commands end-to-end
  - Use Typer test client (`typer.testing.CliRunner`)
  - Verify output formatting, error messages
**Fixture Strategy** (`tests/conftest.py`):
```python
@pytest.fixture
def sample_tasks() -> list[Task]:
    return [
        Task(id=1, title="Task 1", description="Desc 1", status=TaskStatus.PENDING),
        Task(id=2, title="Task 2", description=None, status=TaskStatus.COMPLETED),
    ]

@pytest.fixture
def in_memory_repo() -> InMemoryTaskRepository:
    return InMemoryTaskRepository()

@pytest.fixture
def task_service(in_memory_repo: InMemoryTaskRepository) -> TaskService:
    return TaskService(repository=in_memory_repo)
```

## Architectural Decisions Summary

### ADR-001: Repository Pattern for Storage Abstraction
**Status**: Approved
**Context**: Need to support in-memory storage (Phase I) with future database migration (Phase II)
**Decision**: Implement Repository Pattern with Protocol interface
**Consequences**:
- ✅ Business logic (TaskService) decoupled from storage implementation
- ✅ Easy to swap InMemoryTaskRepository for DatabaseTaskRepository in Phase II
- ✅ Improved testability through repository mocking
- ⚠️  Adds one abstraction layer vs direct list manipulation

### ADR-002: Typer for CLI Framework
**Status**: Approved
**Context**: Need menu-driven console interface with type safety (FR-001, FR-012)
**Decision**: Use Typer for CLI command handling
**Consequences**:
- ✅ Type-safe CLI arguments and validation
- ✅ Automatic help text generation
- ✅ Native Rich integration for styled output
- ⚠️  External dependency vs argparse (acceptable per Constitution tech stack)

### ADR-003: uv for Package Management
**Status**: Approved (Constitutional Requirement)
**Context**: Constitution Section 4 mandates uv usage
**Decision**: Use uv for all dependency management and project initialization
**Consequences**:
- ✅ 10-100x faster than pip
- ✅ Lock file management built-in
- ✅ Python version management
- ⚠️  Relatively new tool (less ecosystem maturity than pip/poetry)

## Next Steps

Phase 0 research is complete. All technical unknowns resolved. Ready to proceed to Phase 1 (Design & Contracts):
1. Generate `data-model.md` with entity definitions and state transitions
2. Generate `contracts/cli-commands.md` with Typer command signatures
3. Generate `quickstart.md` with setup and usage instructions
4. Update agent context with new technology decisions

