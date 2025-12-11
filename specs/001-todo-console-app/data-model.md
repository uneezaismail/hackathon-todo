# Phase 1: Data Model

**Feature**: Todo In-Memory Python Console App
**Date**: 2025-12-07
**Status**: Complete

## Overview

This document defines all domain entities, their attributes, relationships, validation rules, and state transitions for the Todo Console App. The model is designed to support strict type safety (mypy --strict) and evolutionary architecture (Phase II database migration).

## Entity Definitions

### Task (Primary Entity)

**Purpose**: Represents a single todo item in the user's task list.

**Type**: `@dataclass` with frozen fields for immutability where applicable

**Attributes**:

| Attribute   | Type              | Required | Default | Constraints | Description |
|-------------|-------------------|----------|---------|-------------|-------------|
| id          | int               | Yes      | Auto    | > 0, unique, immutable | Auto-generated unique identifier (FR-004) |
| title       | str               | Yes      | -       | Non-empty   | Task title (FR-002) |
| description | str \| None       | No       | None    | -           | Optional task details (FR-011) |
| status      | TaskStatus        | Yes      | PENDING | Enum value  | Current completion status (FR-005) |

**Validation Rules**:
- `title`: Must not be empty string after stripping whitespace
  - Invalid: `""`, `"   "`, `None`
  - Valid: `"Buy groceries"`, `"a"`
- `id`: Must be positive integer, uniqueness enforced by repository
- `description`: Can be `None` or any string (including empty)
- `status`: Must be one of `TaskStatus` enum values

**Immutability**: Task objects should be treated as immutable after creation (update operations create new instances or modify in-place via repository)

**Python Definition**:
```python
from dataclasses import dataclass
from typing import Optional
from .enums import TaskStatus

@dataclass
class Task:
    id: int
    title: str
    description: Optional[str]
    status: TaskStatus

    def __post_init__(self) -> None:
        """Validate task data after initialization"""
        if not self.title.strip():
            raise ValueError("Title cannot be empty")
        if self.id <= 0:
            raise ValueError("ID must be positive")
```

### TaskStatus (Enumeration)

**Purpose**: Defines the two possible states for a task's completion status.

**Type**: `Enum` (Python standard library)

**Values**:

| Value     | Description | Business Meaning |
|-----------|-------------|------------------|
| PENDING   | Not started or in progress | Default status for new tasks |
| COMPLETED | Finished/done | User has marked task as complete |

**State Transitions**: See State Transition section below

**Python Definition**:
```python
from enum import Enum

class TaskStatus(Enum):
    PENDING = "pending"
    COMPLETED = "completed"
```

### TaskRepository (Interface/Protocol)

**Purpose**: Abstract interface for task storage operations, enabling storage implementation swapping (Phase I: in-memory, Phase II: database).

**Type**: `Protocol` (typing.Protocol)

**Operations**:

| Method            | Parameters | Return Type | Description | Throws |
|-------------------|------------|-------------|-------------|--------|
| add               | title: str, description: str \| None | Task | Create new task with auto-generated ID | InvalidTaskDataError |
| get_all           | - | list[Task] | Retrieve all tasks sorted by ID ascending | - |
| get_by_id         | task_id: int | Task \| None | Retrieve single task by ID, None if not found | - |
| update            | task_id: int, title: str \| None, description: str \| None | Task | Update task fields (None = no change) | TaskNotFoundError, InvalidTaskDataError |
| delete            | task_id: int | None | Permanently remove task | TaskNotFoundError |
| toggle_completion | task_id: int | Task | Switch status between PENDING/COMPLETED | TaskNotFoundError |

**Python Definition**:
```python
from typing import Protocol, Optional

class TaskRepository(Protocol):
    def add(self, title: str, description: Optional[str] = None) -> Task:
        """Add new task with auto-generated ID"""
        ...

    def get_all(self) -> list[Task]:
        """Get all tasks sorted by ID"""
        ...

    def get_by_id(self, task_id: int) -> Optional[Task]:
        """Get task by ID, returns None if not found"""
        ...

    def update(
        self,
        task_id: int,
        title: Optional[str] = None,
        description: Optional[str] = None
    ) -> Task:
        """Update task fields (None means no change)"""
        ...

    def delete(self, task_id: int) -> None:
        """Permanently delete task"""
        ...

    def toggle_completion(self, task_id: int) -> Task:
        """Toggle task status between PENDING and COMPLETED"""
        ...
```

## Relationships

**Current Phase (Phase I - In-Memory)**:
- Task ←→ TaskRepository: One-to-many (repository manages collection of tasks)
- No inter-task relationships (tasks are independent entities)

**Future Phases**:
- Phase II: TaskRepository backed by database (many-to-one Task ← User relationship)
- Phase III: Potential task dependencies, tags, projects (to be defined in Phase III spec)

## State Transitions

### TaskStatus State Machine

```
┌─────────┐   toggle_completion    ┌───────────┐
│ PENDING │ ────────────────────>  │ COMPLETED │
└─────────┘                         └───────────┘
     ▲                                    │
     │                                    │
     └────────── toggle_completion ──────┘
```

**Transitions**:
1. **Initial State**: All new tasks start in `PENDING` status (default)
2. **PENDING → COMPLETED**: User marks task as done via `toggle_completion`
3. **COMPLETED → PENDING**: User un-marks task via `toggle_completion`

**Transition Rules**:
- No direct status assignment (only toggle operation allowed per FR-006)
- Status changes must be idempotent (toggling twice returns to original state)
- Status persists across update operations (FR-003: update preserves status)

### ID Generation State

**ID Sequence**:
- **Initial**: First task ID = 1
- **Increment**: Next ID = max(all historical IDs) + 1
- **After Deletion**: IDs are NEVER reused (FR-015)

**Example Sequence**:
```
Operation              | Existing IDs | Next ID
-----------------------|--------------|--------
(empty list)           | []           | 1
add("Task A")          | [1]          | 2
add("Task B")          | [1, 2]       | 3
delete(1)              | [2]          | 3 (not reused!)
add("Task C")          | [2, 3]       | 4
```

## Validation Rules

### Title Validation
**Rule**: Non-empty after whitespace stripping
**Implementation**: `if not title.strip(): raise InvalidTaskDataError("Title cannot be empty")`
**Applies To**: `add()`, `update()` operations
**Error Message**: "Title cannot be empty"

### ID Validation
**Rule**: Must exist in repository
**Implementation**: Repository lookup returns `None` → raise `TaskNotFoundError`
**Applies To**: `get_by_id()`, `update()`, `delete()`, `toggle_completion()`
**Error Message**: "Task with ID {task_id} not found"

### ID Format Validation (CLI Layer)
**Rule**: Must be valid integer
**Implementation**: Typer type coercion + try/except
**Applies To**: All CLI commands accepting task ID
**Error Message**: "Invalid ID format"

## Storage Constraints

### Phase I (In-Memory)
**Implementation**: `list[Task]` in Python
**Constraints**:
- No persistence (data lost on app exit per FR-010)
- Single session scope
- Performance: O(n) for ID lookups, O(n log n) for sorting
- Memory: ~1KB per task (estimated), target <10MB for 1000 tasks

**Trade-offs**:
- ✅ Simplicity: No database setup, immediate startup
- ✅ Speed: In-memory operations <1ms
- ⚠️  No persistence: Data lost on exit (acceptable for Phase I)
- ⚠️  Scalability: Not suitable for >10k tasks (acceptable for Phase I scope)

### Phase II (Database) - Future
**Planned Migration**:
- Swap `InMemoryTaskRepository` for `DatabaseTaskRepository`
- Same `TaskRepository` Protocol interface
- Add `user_id` foreign key to Task (multi-user support)
- Add indices on `id`, `user_id`, `status`
- No changes to `TaskService` business logic (architecture benefit)

## Serialization (Future Consideration)

**Phase I**: Not required (in-memory only)
**Phase II**: JSON serialization for API responses
**Phase III**: Potential export formats (CSV, JSON, Markdown)

**Draft Task JSON Schema** (for Phase II planning):
```json
{
  "id": 1,
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "status": "pending"
}
```

## Summary

**Entities Defined**: 3 (Task, TaskStatus, TaskRepository)
**Total Attributes**: 4 per Task entity
**State Transitions**: 2 (PENDING ↔ COMPLETED)
**Validation Rules**: 3 (title non-empty, ID exists, ID format)
**Storage Strategy**: In-memory list with Repository abstraction

**Next Steps**: Proceed to CLI command contracts definition.

