# Feature Specification: Todo In-Memory Python Console App

**Feature Branch**: `001-todo-console-app`
**Created**: 2025-12-07
**Status**: Draft
**Input**: User description: "Define the full specification for a Todo In-Memory Python Console App.

Features:
1. Add Task (Title required, Description optional)
2. List Tasks (Rich table format)
3. Update Task (By ID)
4. Delete Task (By ID)
5. Toggle Completion (By ID)

Must detail the following logic:
- Input Validation: Reject empty titles; validate IDs exist before Update/Delete.
- State Changes: Append/Remove/Modify items in the in-memory list.
- Unique IDs: Auto-increment logic (max(id) + 1).
- Status Handling: Toggle between PENDING and COMPLETED Enums.
- Ordering: List output must always be sorted by ID.
- Rich Formatting: Use rich.table with Green checkmarks for completed items.

Constraints: Strictly In-Memory (Repository Pattern), Strict Type Hinting (mypy), No Database."

## User Scenarios & Testing

### User Story 1 - Create and View Tasks (Priority: P1)

A user needs to quickly capture tasks and see their current todo list to manage daily activities.

**Why this priority**: Core value proposition - users must be able to add and view tasks before any other operations are meaningful.

**Independent Test**: Can be fully tested by launching the app, adding one task with title only, adding another task with title and description, listing all tasks, and verifying both appear in the output table sorted by ID.

**Acceptance Scenarios**:

1. **Given** the app is running and empty, **When** user selects "Add Task" and enters "Buy groceries" as title with no description, **Then** system confirms task created with auto-generated ID 1 and status PENDING
2. **Given** one task exists, **When** user selects "Add Task" and enters "Call dentist" as title and "Schedule annual checkup" as description, **Then** system confirms task created with auto-generated ID 2 and status PENDING
3. **Given** two tasks exist, **When** user selects "List Tasks", **Then** system displays a formatted table with both tasks sorted by ID (1, 2), showing ID, Title, Description, and Status columns with green checkmarks for completed tasks

---

### User Story 2 - Mark Tasks Complete (Priority: P2)

A user needs to track progress by marking tasks as complete when finished.

**Why this priority**: Essential for task management - distinguishes active work from completed work, providing sense of accomplishment.

**Independent Test**: Can be fully tested by adding one task, listing it to verify PENDING status, toggling completion by ID, listing again to verify COMPLETED status with green checkmark, toggling again, and verifying it returns to PENDING.

**Acceptance Scenarios**:

1. **Given** a task with ID 1 exists with status PENDING, **When** user selects "Toggle Completion" and enters ID 1, **Then** system updates task status to COMPLETED and confirms the change
2. **Given** a task with ID 2 exists with status COMPLETED, **When** user selects "Toggle Completion" and enters ID 2, **Then** system updates task status to PENDING and confirms the change
3. **Given** tasks exist with mixed statuses, **When** user lists tasks, **Then** completed tasks display with green checkmarks while pending tasks display without checkmarks

---

### User Story 3 - Update Task Details (Priority: P3)

A user needs to correct or enhance task information after initial creation.

**Why this priority**: Improves data quality but not essential for basic task tracking - users can delete and recreate if needed.

**Independent Test**: Can be fully tested by adding one task, updating its title only, verifying the change, then updating its description, verifying the change, ensuring ID and status remain unchanged.

**Acceptance Scenarios**:

1. **Given** a task with ID 1 titled "Buy milk", **When** user selects "Update Task", enters ID 1, and provides new title "Buy organic milk", **Then** system updates the title while preserving ID, description, and status
2. **Given** a task with ID 2 with description "Old notes", **When** user selects "Update Task", enters ID 2, and provides new description "Updated detailed notes", **Then** system updates the description while preserving ID, title, and status
3. **Given** a task with ID 3, **When** user selects "Update Task", enters ID 3, and provides both new title and new description, **Then** system updates both fields while preserving ID and status

---

### User Story 4 - Remove Unwanted Tasks (Priority: P3)

A user needs to clean up their task list by permanently removing tasks that are no longer relevant.

**Why this priority**: Nice-to-have for list maintenance - users can ignore irrelevant tasks if deletion isn't available.

**Independent Test**: Can be fully tested by adding three tasks, listing to verify all three exist, deleting the middle task by ID, listing again to verify only two tasks remain with correct IDs.

**Acceptance Scenarios**:

1. **Given** three tasks exist with IDs 1, 2, 3, **When** user selects "Delete Task" and enters ID 2, **Then** system permanently removes task 2 and confirms deletion
2. **Given** task 2 has been deleted, **When** user lists tasks, **Then** system displays only tasks 1 and 3 sorted by ID (IDs are not reassigned)
3. **Given** only task 1 remains, **When** user adds a new task, **Then** system assigns ID 4 (continuing from max historical ID)

---

### Edge Cases

- What happens when user tries to add a task with an empty title?
  - System rejects the input and displays error message "Title cannot be empty"

- What happens when user tries to update/delete/toggle a task with an invalid ID?
  - System validates ID exists before operation and displays error message "Task with ID [X] not found"

- What happens when user tries to update/delete/toggle a task with a non-numeric ID?
  - System validates input is a valid integer and displays error message "Invalid ID format"

- What happens when no tasks exist and user selects "List Tasks"?
  - System displays empty table with headers and message "No tasks found"

- What happens when user adds first task after deleting all previous tasks?
  - System continues ID sequence from max historical ID (e.g., if tasks 1-5 were deleted, next task is ID 6)

- What happens when user provides description without title during task creation?
  - System rejects the input since title is required

- What happens when user leaves description empty during update?
  - System treats empty input as "no change" - preserves existing description

## Requirements

### Functional Requirements

- **FR-001**: System MUST provide a menu-driven console interface with five operations: Add Task, List Tasks, Update Task, Delete Task, Toggle Completion, and Exit
- **FR-002**: System MUST validate that task title is non-empty before creating or updating a task
- **FR-003**: System MUST validate that task ID exists before performing update, delete, or toggle operations
- **FR-004**: System MUST generate unique auto-incrementing IDs using logic: max(existing_ids) + 1, starting from 1
- **FR-005**: System MUST maintain task status as enumerated type with exactly two values: PENDING and COMPLETED
- **FR-006**: System MUST toggle task status between PENDING and COMPLETED when toggle operation is invoked
- **FR-007**: System MUST display all tasks sorted by ID in ascending order when listing
- **FR-008**: System MUST format task list output using Rich library table with columns: ID, Title, Description, Status
- **FR-009**: System MUST display green checkmarks (✓) for COMPLETED tasks and empty/dash for PENDING tasks in the Status column
- **FR-010**: System MUST store all tasks in-memory only (no file persistence, no database)
- **FR-011**: System MUST allow task description to be optional (can be empty/null)
- **FR-012**: System MUST enforce strict type hints on all functions and data structures for mypy compatibility
- **FR-013**: System MUST implement Repository Pattern for task storage abstraction
- **FR-014**: System MUST permanently remove tasks on delete (no soft delete)
- **FR-015**: System MUST preserve ID sequence across deletions (never reuse IDs)
- **FR-016**: System MUST accept both title and description updates independently or together during update operation
- **FR-017**: System MUST clear the console screen or provide visual separation between operations for better readability
- **FR-018**: System MUST display appropriate error messages for all validation failures
- **FR-019**: System MUST display success confirmation messages after successful operations
- **FR-020**: System MUST continue running and return to main menu after each operation until user selects Exit

### Key Entities

- **Task**: Represents a single todo item with the following attributes:
  - ID (integer, auto-generated, unique, immutable)
  - Title (string, required, non-empty, user-provided)
  - Description (string, optional, can be empty, user-provided)
  - Status (enumeration: PENDING or COMPLETED, defaults to PENDING)

- **TaskRepository**: Abstraction for task storage operations providing:
  - Add task capability (returns new task with generated ID)
  - Get all tasks capability (returns list sorted by ID)
  - Get task by ID capability (returns single task or None)
  - Update task capability (modifies existing task)
  - Delete task capability (removes task permanently)
  - Toggle status capability (switches between PENDING/COMPLETED)

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can add a new task with title in under 10 seconds from menu selection
- **SC-002**: Users can view complete task list with all fields in under 5 seconds
- **SC-003**: Users can toggle task completion status with 2 inputs: operation selection and task ID
- **SC-004**: All validation errors display clear messages indicating what went wrong and how to correct it
- **SC-005**: Task list displays correctly formatted table with aligned columns regardless of title/description length
- **SC-006**: 100% of invalid operations (empty title, non-existent ID) are rejected with helpful error messages
- **SC-007**: Task ID sequence maintains integrity across 100+ add/delete operations without ID collision
- **SC-008**: Console interface remains responsive and clear after 50+ tasks are created
- **SC-009**: All type hints pass mypy strict mode validation with zero errors
- **SC-010**: Users can distinguish completed vs pending tasks at a glance through visual indicators (green checkmarks)

