# Tasks: Todo In-Memory Python Console App

**Input**: Design documents from `/mnt/d/hackathon-todo/specs/001-todo-console-app/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/cli-commands.md
**Branch**: `001-todo-console-app`
**Date**: 2025-12-07

**Tests**: Test tasks are included per Constitution Rule VIII (TDD required) and plan.md requirement (strict TDD with pytest).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story?] Description`

- **Checkbox**: `- [ ]` (required)
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

All paths are relative to repository root:
- Source: `src/`
- Tests: `tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization with uv, basic directory structure, and configuration

- [x] T001 Initialize Python project with uv (run: `uv init` in repo root, create `.python-version` with 3.13)
- [x] T002 Create directory structure: `src/models/`, `src/storage/`, `src/services/`, `src/ui/`, `tests/unit/`, `tests/integration/`
- [x] T003 [P] Create `pyproject.toml` with dependencies (rich, typer, pytest) and mypy strict configuration
- [x] T004 [P] Create `.gitignore` for Python (.venv/, __pycache__/, .pytest_cache/, .mypy_cache/, *.pyc)
- [x] T005 [P] Create `README.md` with project overview and setup instructions per quickstart.md

**Checkpoint**: Project structure ready for implementation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core domain models and infrastructure that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 [P] Create TaskStatus enum in `src/models/enums.py` (PENDING="pending", COMPLETED="completed")
- [x] T007 [P] Create Task dataclass in `src/models/task.py` (id: int, title: str, description: str | None, status: TaskStatus)
- [x] T008 Create TaskRepository Protocol in `src/storage/repository.py` (add, get_all, get_by_id, update, delete, toggle_completion methods)
- [x] T009 [P] Create custom exceptions in `src/services/exceptions.py` (TaskNotFoundError, InvalidTaskDataError, TodoAppError base)
- [x] T010 [P] Create `src/models/__init__.py` to export Task and TaskStatus
- [x] T011 [P] Create `src/storage/__init__.py` to export TaskRepository
- [x] T012 [P] Create `src/services/__init__.py` to export exceptions

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create and View Tasks (Priority: P1) 🎯 MVP

**Goal**: Users can add tasks (with optional description) and view all tasks in a formatted Rich table sorted by ID

**Independent Test**: Launch app, add "Buy groceries" (title only), add "Call dentist" with description "Schedule checkup", list tasks → verify both appear sorted by ID in Rich table

### Tests for User Story 1 (TDD: Write and verify FAIL first)

- [x] T013 [P] [US1] Write unit test for TaskStatus enum in `tests/unit/test_enums.py` (test PENDING and COMPLETED values)
- [x] T014 [P] [US1] Write unit test for Task dataclass validation in `tests/unit/test_task.py` (test title validation, ID validation)
- [x] T015 [P] [US1] Write unit test for InMemoryTaskRepository.add in `tests/unit/test_in_memory_repo.py` (test ID generation: max+1, starting from 1)
- [x] T016 [P] [US1] Write unit test for InMemoryTaskRepository.get_all in `tests/unit/test_in_memory_repo.py` (test sorting by ID, empty list)
- [x] T017 [P] [US1] Write unit test for TaskService.add_task in `tests/unit/test_task_service.py` (test empty title rejection, successful creation)
- [x] T018 [P] [US1] Write unit test for TaskService.get_all_tasks in `tests/unit/test_task_service.py` (test retrieval and sorting)
- [x] T019 [P] [US1] Write unit test for TaskRenderer.render_tasks in `tests/unit/test_renderer.py` (test table generation, empty list handling)
- [x] T020 [P] [US1] Write integration test for add command in `tests/integration/test_cli.py` (test CLI `add "Task"` and `add "Task" -d "Desc"`)
- [x] T021 [P] [US1] Write integration test for list command in `tests/integration/test_cli.py` (test CLI `list` with tasks and empty)

### Implementation for User Story 1

- [x] T022 [P] [US1] Implement InMemoryTaskRepository in `src/storage/in_memory.py` (list storage, add method with max+1 ID logic, get_all sorted by ID)
- [x] T023 [US1] Implement TaskService.add_task in `src/services/task_service.py` (inject TaskRepository, validate title, call repo.add)
- [x] T024 [US1] Implement TaskService.get_all_tasks in `src/services/task_service.py` (call repo.get_all)
- [x] T025 [US1] Implement TaskRenderer in `src/ui/renderer.py` (create Rich table with columns: ID, Title, Description, Status; handle empty list)
- [x] T026 [US1] Create Typer app instance in `src/app.py` (app = typer.Typer with name="todo", help text)
- [x] T027 [US1] Implement `add` command in `src/app.py` (title argument, description option, call TaskService.add_task, display success)
- [x] T028 [US1] Implement `list` command in `src/app.py` (call TaskService.get_all_tasks, call TaskRenderer.render_tasks)
- [x] T029 [US1] Add error handling for add command in `src/app.py` (catch InvalidTaskDataError, display user-friendly message)
- [x] T030 [US1] Create pytest fixtures in `tests/conftest.py` (sample_tasks, in_memory_repo, task_service)
- [x] T031 [US1] Create `src/__init__.py` and `tests/__init__.py` empty files
- [x] T032 [US1] Run all User Story 1 tests and verify they pass (pytest tests/ -v)

**Checkpoint**: User Story 1 fully functional - users can add and list tasks independently

---

## Phase 4: User Story 2 - Mark Tasks Complete (Priority: P2)

**Goal**: Users can toggle task completion status (PENDING ↔ COMPLETED) with visual green checkmark indicator

**Independent Test**: Add task, list to verify PENDING ("-"), toggle ID 1, list to verify COMPLETED ("✓"), toggle again, verify back to PENDING

### Tests for User Story 2 (TDD: Write and verify FAIL first)

- [x] T033 [P] [US2] Write unit test for InMemoryTaskRepository.toggle_completion in `tests/unit/test_in_memory_repo.py` (test PENDING→COMPLETED, COMPLETED→PENDING, task not found)
- [x] T034 [P] [US2] Write unit test for TaskService.toggle_task_completion in `tests/unit/test_task_service.py` (test toggle logic, error handling)
- [x] T035 [P] [US2] Write unit test for TaskRenderer green checkmark display in `tests/unit/test_renderer.py` (test COMPLETED shows "✓", PENDING shows "-")
- [x] T036 [P] [US2] Write integration test for toggle command in `tests/integration/test_cli.py` (test CLI `toggle 1` success and error cases)

### Implementation for User Story 2

- [x] T037 [US2] Implement InMemoryTaskRepository.toggle_completion in `src/storage/in_memory.py` (find by ID, toggle status, return updated task)
- [x] T038 [US2] Implement InMemoryTaskRepository.get_by_id in `src/storage/in_memory.py` (return task or None)
- [x] T039 [US2] Implement TaskService.toggle_task_completion in `src/services/task_service.py` (call repo.toggle_completion, handle TaskNotFoundError)
- [x] T040 [US2] Update TaskRenderer in `src/ui/renderer.py` to display green checkmark "[green]✓[/green]" for COMPLETED, "-" for PENDING
- [x] T041 [US2] Implement `toggle` command in `src/app.py` (task_id argument, call TaskService.toggle_task_completion, display success with new status)
- [x] T042 [US2] Add error handling for toggle command in `src/app.py` (catch TaskNotFoundError, display "Task with ID X not found")
- [x] T043 [US2] Run all User Story 2 tests and verify they pass (pytest tests/ -v)

**Checkpoint**: User Stories 1 AND 2 both work independently - full add/list/toggle workflow functional

---

## Phase 5: User Story 3 - Update Task Details (Priority: P3)

**Goal**: Users can modify task title and/or description by ID (status and ID preserved)

**Independent Test**: Add task "Buy milk", update title to "Buy organic milk", verify change; update description only, verify title unchanged; update both fields together

### Tests for User Story 3 (TDD: Write and verify FAIL first)

- [x] T044 [P] [US3] Write unit test for InMemoryTaskRepository.update in `tests/unit/test_in_memory_repo.py` (test title-only update, description-only update, both fields, task not found)
- [x] T045 [P] [US3] Write unit test for TaskService.update_task in `tests/unit/test_task_service.py` (test validation: empty title rejected, None=no change logic, error handling)
- [x] T046 [P] [US3] Write integration test for update command in `tests/integration/test_cli.py` (test CLI `update 1 -t "New title"`, `update 1 -d "New desc"`, `update 1 -t "T" -d "D"`, error cases)

### Implementation for User Story 3

- [x] T047 [US3] Implement InMemoryTaskRepository.update in `src/storage/in_memory.py` (find by ID, update fields where not None, preserve ID and status)
- [x] T048 [US3] Implement TaskService.update_task in `src/services/task_service.py` (validate title if provided, call repo.update, handle errors)
- [x] T049 [US3] Implement `update` command in `src/app.py` (task_id argument, title option, description option, validate at least one field provided, call TaskService.update_task)
- [x] T050 [US3] Add error handling for update command in `src/app.py` (catch TaskNotFoundError, InvalidTaskDataError, display user-friendly messages)
- [x] T051 [US3] Add validation in update command to require at least one field (--title or --description)
- [x] T052 [US3] Run all User Story 3 tests and verify they pass (pytest tests/ -v)

**Checkpoint**: User Stories 1, 2, AND 3 all work independently - full CRUD except delete

---

## Phase 6: User Story 4 - Remove Unwanted Tasks (Priority: P3)

**Goal**: Users can permanently delete tasks by ID (IDs never reused, sequence continues from max historical ID)

**Independent Test**: Add tasks ID 1,2,3, delete ID 2, list shows 1 and 3 only, add new task gets ID 4 (not 2)

### Tests for User Story 4 (TDD: Write and verify FAIL first)

- [x] T053 [P] [US4] Write unit test for InMemoryTaskRepository.delete in `tests/unit/test_in_memory_repo.py` (test deletion, ID sequence preservation after delete, task not found)
- [x] T054 [P] [US4] Write unit test for TaskService.delete_task in `tests/unit/test_task_service.py` (test deletion, error handling)
- [x] T055 [P] [US4] Write integration test for delete command in `tests/integration/test_cli.py` (test CLI `delete 1 --force`, confirmation prompt, error cases)

### Implementation for User Story 4

- [x] T056 [US4] Implement InMemoryTaskRepository.delete in `src/storage/in_memory.py` (find and remove task, preserve max ID for future adds)
- [x] T057 [US4] Implement TaskService.delete_task in `src/services/task_service.py` (call repo.delete, handle TaskNotFoundError)
- [x] T058 [US4] Implement `delete` command in `src/app.py` (task_id argument, force option, confirmation prompt if not --force, call TaskService.delete_task)
- [x] T059 [US4] Add confirmation prompt logic in delete command (retrieve task details, display, ask "Continue? [y/N]", cancel if not y)
- [x] T060 [US4] Add error handling for delete command in `src/app.py` (catch TaskNotFoundError, handle user cancellation)
- [x] T061 [US4] Run all User Story 4 tests and verify they pass (pytest tests/ -v)

**Checkpoint**: All 4 user stories complete - full CRUD operations functional independently

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements, validation, and quality checks across all user stories

- [x] T062 [P] Add `__main__.py` in `src/` directory to enable `python -m src.app` execution
- [x] T063 [P] Update README.md with complete usage examples from quickstart.md
- [x] T064 Run mypy strict type checking on all src/ files (mypy src/ --strict) and fix any errors
- [x] T065 Run full pytest suite with coverage (pytest tests/ --cov=src --cov-report=html) and verify >90% coverage
- [x] T066 [P] Test all edge cases from spec.md (empty title, invalid ID, non-numeric ID, empty list, ID preservation after deletions)
- [x] T067 [P] Validate success/error message formatting with Rich console (green checkmarks for success, red X for errors)
- [x] T068 [P] Test quickstart.md workflows manually (daily task management, project tracking)
- [x] T069 Create pyproject.toml scripts for common commands (uv run todo, uv run pytest, uv run mypy)
- [x] T070 Final integration test: Run complete user workflow (add 5 tasks, toggle 2, update 1, delete 1, list all)

**Checkpoint**: Production-ready application passing all quality gates

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 - BLOCKS all user stories
- **Phase 3 (US1 - P1)**: Depends on Phase 2 completion
- **Phase 4 (US2 - P2)**: Depends on Phase 2 completion - Can run in parallel with US1 but builds on it
- **Phase 5 (US3 - P3)**: Depends on Phase 2 completion - Can run in parallel with US1/US2
- **Phase 6 (US4 - P3)**: Depends on Phase 2 completion - Can run in parallel with US1/US2/US3
- **Phase 7 (Polish)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other user stories (only Phase 2)
- **User Story 2 (P2)**: No dependencies on other user stories (only Phase 2) - Enhances US1 but independently testable
- **User Story 3 (P3)**: No dependencies on other user stories (only Phase 2) - Independently testable
- **User Story 4 (P3)**: No dependencies on other user stories (only Phase 2) - Independently testable

**Key Independence**: All user stories can be implemented and tested independently after Phase 2 completes

### Within Each User Story

1. **Tests FIRST** (T013-T021 for US1, etc.): Write all tests, verify they FAIL
2. **Models** (T022 InMemoryTaskRepository): Foundational data structures
3. **Services** (T023-T024 TaskService): Business logic layer
4. **UI/CLI** (T025-T028 Renderer, Typer commands): User interface
5. **Error Handling** (T029 error handling): Graceful failures
6. **Integration** (T030-T032 fixtures, final tests): Everything working together

### Parallel Opportunities

**Phase 1 (Setup)**: T003, T004, T005 can run in parallel

**Phase 2 (Foundational)**: T006, T007, T009, T010, T011, T012 can all run in parallel (different files)

**User Story 1 Tests**: T013-T021 can all run in parallel (different test files)

**User Story 1 Implementation**: T022, T025 can run in parallel (different files)

**User Story 2 Tests**: T033-T036 can all run in parallel

**User Story 3 Tests**: T044-T046 can all run in parallel

**User Story 4 Tests**: T053-T055 can all run in parallel

**Phase 7 (Polish)**: T062, T063, T066, T067, T068 can run in parallel

**Cross-Story Parallel**: After Phase 2, User Stories 1-4 can all be worked on in parallel by different developers

---

## Parallel Example: User Story 1

```bash
# Step 1: Launch all US1 tests together (write tests, verify FAIL):
Parallel Tasks: T013, T014, T015, T016, T017, T018, T019, T020, T021
Files: tests/unit/test_enums.py, tests/unit/test_task.py, tests/unit/test_in_memory_repo.py,
       tests/unit/test_task_service.py, tests/unit/test_renderer.py, tests/integration/test_cli.py

# Step 2: Launch parallel implementation tasks:
Parallel Tasks: T022 (InMemoryTaskRepository), T025 (TaskRenderer)
Files: src/storage/in_memory.py, src/ui/renderer.py

# Step 3: Sequential service/CLI tasks (depend on T022):
Sequential: T023 → T024 → T026 → T027 → T028 → T029
```

---

## Parallel Example: Cross-Story After Foundation

```bash
# After Phase 2 completes, launch all user stories in parallel:

# Developer/Agent A: User Story 1 (T013-T032)
# Developer/Agent B: User Story 2 (T033-T043)
# Developer/Agent C: User Story 3 (T044-T052)
# Developer/Agent D: User Story 4 (T053-T061)

# Each story can be completed independently and tested without waiting for others
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete **Phase 1: Setup** (T001-T005) → Project initialized
2. Complete **Phase 2: Foundational** (T006-T012) → Domain models ready
3. Complete **Phase 3: User Story 1** (T013-T032) → Add and List tasks working
4. **STOP and VALIDATE**: Run `uv run python -m src.app add "Test"` and `uv run python -m src.app list`
5. If working, you have an MVP! Deploy/demo/share

### Incremental Delivery (Recommended)

1. **Foundation** (Phase 1 + 2): Setup + Core models → Checkpoint: Can import Task, TaskStatus
2. **+ User Story 1** (Phase 3): Add + List → Checkpoint: Can add and view tasks → **MVP!** 🎯
3. **+ User Story 2** (Phase 4): Toggle completion → Checkpoint: Can mark tasks done → **Enhanced!**
4. **+ User Story 3** (Phase 5): Update tasks → Checkpoint: Can fix mistakes → **Refined!**
5. **+ User Story 4** (Phase 6): Delete tasks → Checkpoint: Full CRUD → **Complete!**
6. **+ Polish** (Phase 7): Quality gates → Checkpoint: Production-ready → **Ship it!** 🚀

Each increment is independently testable and deployable.

### Parallel Team Strategy

With 4 developers/agents:

1. **Together**: Complete Phase 1 (Setup) and Phase 2 (Foundational)
2. **Split after Phase 2**:
   - Developer A: User Story 1 (P1) - Create and View Tasks
   - Developer B: User Story 2 (P2) - Mark Tasks Complete
   - Developer C: User Story 3 (P3) - Update Task Details
   - Developer D: User Story 4 (P3) - Remove Unwanted Tasks
3. **Merge and Test**: Each story merges independently, all tests pass
4. **Together**: Complete Phase 7 (Polish)

---

## Task Summary

**Total Tasks**: 70
- **Phase 1 (Setup)**: 5 tasks
- **Phase 2 (Foundational)**: 7 tasks (BLOCKS all user stories)
- **Phase 3 (US1 - P1)**: 20 tasks (9 tests + 11 implementation)
- **Phase 4 (US2 - P2)**: 11 tasks (4 tests + 7 implementation)
- **Phase 5 (US3 - P3)**: 9 tasks (3 tests + 6 implementation)
- **Phase 6 (US4 - P3)**: 9 tasks (3 tests + 6 implementation)
- **Phase 7 (Polish)**: 9 tasks

**Parallel Opportunities**: 32 tasks marked [P] can run in parallel
**Test Tasks**: 19 (27% of total - strict TDD compliance)
**User Stories**: 4 (all independently testable after Phase 2)

**Suggested MVP Scope**: Phase 1 + Phase 2 + Phase 3 (User Story 1) = 32 tasks

---

## Notes

- **[P] marker**: Tasks that can run in parallel (different files, no blocking dependencies)
- **[Story] label**: Maps task to specific user story for traceability and independent testing
- **TDD Requirement**: Tests written FIRST, verify FAIL, then implement to make them pass
- **Checkpoint Pattern**: Each phase ends with validation - stop and test before proceeding
- **Independent Stories**: After Phase 2, each user story can be completed without the others
- **Commit Strategy**: Commit after each task or logical group (e.g., all US1 tests together)
- **Avoid**: Vague tasks, multiple files in one task, cross-story dependencies that break independence
- **Type Safety**: All tasks must maintain mypy --strict compliance (verified in Phase 7)
- **Constitution Compliance**: All tasks follow SDD-RI principles (Spec → Plan → Tasks → Implement)
