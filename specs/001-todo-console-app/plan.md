# Implementation Plan: Todo In-Memory Python Console App

**Branch**: `001-todo-console-app` | **Date**: 2025-12-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/mnt/d/hackathon-todo/specs/001-todo-console-app/spec.md`

**Note**: This plan follows the `/sp.plan` command workflow and adheres to the Evolution of Todo Constitution v1.0.0.

## Summary

Build a strictly in-memory Python console application for task management with five core operations (Add, List, Update, Delete, Toggle Completion). The system uses the Repository Pattern to ensure business logic separation and forward compatibility with future database integration (Phase II). All code generation will be specification-driven using strict TDD with pytest, type-safe with mypy --strict compliance, and leverages Rich for table formatting and Typer for CLI interactions.

## Technical Context

**Language/Version**: Python 3.13+
**Primary Dependencies**: rich (UI tables), typer (CLI framework), pytest (testing)
**Package Manager**: uv (dependency management and project initialization)
**Storage**: In-memory list (Repository Pattern abstraction for Phase II database swap)
**Testing**: pytest (strict TDD, 100% coverage of business logic and edge cases)
**Target Platform**: Cross-platform console (Linux, macOS, Windows)
**Project Type**: Single console application
**Performance Goals**: <100ms response time for all operations, <10MB memory footprint for 1000 tasks
**Constraints**: No persistence (in-memory only), strict type hints (mypy --strict), Repository Pattern mandatory
**Scale/Scope**: Single-user local session, designed for <1000 tasks per session

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Spec-First Development (Rule I)
- **Status**: PASS
- **Evidence**: Specification exists at `/mnt/d/hackathon-todo/specs/001-todo-console-app/spec.md` with 4 user stories, 20 functional requirements, and 10 success criteria

### ✅ No Manual Code (Rule II)
- **Status**: PASS
- **Plan**: All code will be generated via `/sp.implement` following this plan and tasks.md

### ✅ Reusable Intelligence (Rule III)
- **Status**: PASS
- **Plan**:
  - ADRs will be created for: Repository Pattern choice, uv vs pip/poetry decision, Typer vs Click decision
  - PHRs will be created for each planning/implementation phase

### ✅ Evolutionary Architecture (Rule IV)
- **Status**: PASS
- **Evidence**: Repository Pattern abstraction (`TaskRepository` protocol) enables Phase II database swap without rewriting business logic
- **Forward Compatibility**: `TaskService` will depend on `TaskRepository` interface, not concrete in-memory implementation

### ✅ Single Responsibility (Rule V)
- **Status**: PASS
- **Plan**: Clear separation:
  - `models/`: Domain entities (Task, TaskStatus enum)
  - `storage/`: Repository implementation (InMemoryTaskRepository)
  - `services/`: Business logic (TaskService)
  - `ui/`: Rich table rendering (TaskRenderer)
  - `app.py`: CLI orchestration (Typer commands)

### ✅ User Experience First (Rule VI)
- **Status**: PASS
- **Plan**: Consistent vocabulary ("Add Task", "List Tasks"), graceful error handling with actionable messages, no raw stack traces

### ✅ Test-Driven Development (Rule VIII)
- **Status**: PASS
- **Plan**: Red-Green-Refactor cycle for each task, tests written before/alongside implementation

### ✅ Strict Type Safety (Rule IX)
- **Status**: PASS
- **Plan**: All functions will have strict type hints, mypy --strict enforcement in CI/local checks

### ✅ Strict Error Handling (Rule X)
- **Status**: PASS
- **Plan**: Custom exceptions (TaskNotFoundError, InvalidTaskDataError) with user-friendly messages

### ✅ Immutable Tech Stack (Rule IV - Global Constraints)
- **Status**: PASS
- **Alignment**: Python 3.13+, uv (matches constitution backend tooling)

## Project Structure

### Documentation (this feature)

```text
specs/001-todo-console-app/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output (architectural decisions, dependency choices)
├── data-model.md        # Phase 1 output (entity definitions, state transitions)
├── quickstart.md        # Phase 1 output (setup instructions, usage examples)
├── contracts/           # Phase 1 output (API contracts for CLI commands)
│   └── cli-commands.md  # Typer command signatures and contracts
├── checklists/          # Quality validation checklists
│   └── requirements.md  # Spec quality checklist (completed)
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
src/
├── models/
│   ├── __init__.py
│   ├── task.py          # Task dataclass with id, title, description, status
│   └── enums.py         # TaskStatus enum (PENDING, COMPLETED)
├── storage/
│   ├── __init__.py
│   ├── repository.py    # TaskRepository Protocol (interface)
│   └── in_memory.py     # InMemoryTaskRepository implementation
├── services/
│   ├── __init__.py
│   ├── task_service.py  # TaskService (business logic layer)
│   └── exceptions.py    # TaskNotFoundError, InvalidTaskDataError
├── ui/
│   ├── __init__.py
│   └── renderer.py      # TaskRenderer (Rich table formatting)
└── app.py               # Typer CLI application entry point

tests/
├── unit/
│   ├── __init__.py
│   ├── test_task.py              # Task model tests
│   ├── test_enums.py             # TaskStatus enum tests
│   ├── test_in_memory_repo.py   # InMemoryTaskRepository tests
│   ├── test_task_service.py     # TaskService business logic tests
│   └── test_renderer.py         # TaskRenderer formatting tests
├── integration/
│   ├── __init__.py
│   └── test_cli.py              # End-to-end CLI command tests
└── conftest.py                  # pytest fixtures (sample tasks, repositories)

# Project configuration
pyproject.toml           # uv project config, dependencies, tool settings
.python-version          # Python 3.13+ version pinning
README.md                # Project overview and setup instructions
.gitignore               # Python-specific ignores
```

**Structure Decision**: Single project structure (Option 1) selected for console application. This aligns with the specification's focus on a standalone CLI tool without web/mobile components. The structure implements clear layer separation (models, storage, services, ui) as required by Constitution Rule V (Single Responsibility Principle) and supports the Repository Pattern for evolutionary architecture (Constitution Rule IV).

## Complexity Tracking

> No constitutional violations detected. All design decisions align with Constitution v1.0.0.

**Repository Pattern Justification** (proactive clarification, not a violation):
- **Why Needed**: Enables Phase II database integration without rewriting business logic (Constitution Rule IV: Evolutionary Architecture)
- **Benefit**: `TaskService` depends on `TaskRepository` protocol, allowing swap from `InMemoryTaskRepository` to `DatabaseTaskRepository` in Phase II
- **Trade-off**: Adds one interface layer vs direct list manipulation, but this is explicitly required by FR-013 and Constitution Rule IV

## Phase Summaries

### Phase 0: Research & Architectural Decisions ✅ COMPLETE

**Artifacts Generated**:
- `research.md`: Comprehensive research findings and architectural decisions

**Key Decisions**:
1. **Package Manager**: uv (constitutional requirement, 10-100x faster than pip)
2. **CLI Framework**: Typer (type-safe, Rich integration, automatic validation)
3. **Repository Pattern**: Protocol-based interface for storage abstraction
4. **Rich Formatting**: Dedicated TaskRenderer class for table output
5. **ID Generation**: max(existing_ids) + 1 strategy (spec requirement)
6. **Error Handling**: Custom exception hierarchy with user-friendly messages
7. **Type Safety**: Full mypy --strict compliance with Python 3.13+ native generics
8. **Testing**: Separate unit/integration tests with pytest fixtures

**ADRs Recommended** (to be created during implementation):
- ADR-001: Repository Pattern for Storage Abstraction
- ADR-002: Typer for CLI Framework
- ADR-003: uv for Package Management

**Status**: All technical unknowns resolved. Ready for Phase 1.

---

### Phase 1: Design & Contracts ✅ COMPLETE

**Artifacts Generated**:
1. `data-model.md`: Entity definitions (Task, TaskStatus, TaskRepository)
2. `contracts/cli-commands.md`: CLI command contracts with Typer signatures
3. `quickstart.md`: Setup instructions and usage examples
4. `CLAUDE.md`: Updated agent context with technology stack

**Data Model Summary**:
- **Entities**: 3 (Task, TaskStatus enum, TaskRepository protocol)
- **Attributes**: 4 per Task (id, title, description, status)
- **State Transitions**: 2 (PENDING ↔ COMPLETED)
- **Validation Rules**: 3 (title non-empty, ID exists, ID format)

**CLI Contracts Summary**:
- **Commands**: 5 (add, list, update, delete, toggle)
- **Parameters**: 7 total across all commands
- **Error Cases**: 8 distinct conditions handled
- **Exit Codes**: 3 (0=success, 1=error, 2=usage)

**Agent Context Update**:
- Added Python 3.13+ to CLAUDE.md
- Added rich, typer, pytest frameworks
- Added in-memory repository pattern note

**Status**: Design complete. Ready for Phase 2 (Tasks Generation via `/sp.tasks`).

---

## Constitution Re-Check (Post-Design)

*Re-evaluating constitutional compliance after Phase 1 design:*

### ✅ Spec-First Development (Rule I)
- **Status**: PASS (maintained)
- **Evidence**: All design artifacts generated from approved spec, no implementation code written

### ✅ No Manual Code (Rule II)
- **Status**: PASS (maintained)
- **Evidence**: No code files created, only design documents and contracts

### ✅ Reusable Intelligence (Rule III)
- **Status**: PASS (maintained)
- **Evidence**: 3 ADRs identified for future creation, PHR will be created for this planning session

### ✅ Evolutionary Architecture (Rule IV)
- **Status**: PASS (maintained)
- **Evidence**: Repository Protocol design enables Phase II database swap without business logic changes

### ✅ Single Responsibility (Rule V)
- **Status**: PASS (maintained)
- **Evidence**: Clear layer separation defined in data model and contracts (models/storage/services/ui/app)

### ✅ User Experience First (Rule VI)
- **Status**: PASS (maintained)
- **Evidence**: CLI contracts specify user-friendly error messages, graceful error handling, no stack traces

### ✅ Test-Driven Development (Rule VIII)
- **Status**: PASS (maintained)
- **Evidence**: Test structure defined (unit/integration), pytest fixtures planned

### ✅ Strict Type Safety (Rule IX)
- **Status**: PASS (maintained)
- **Evidence**: All contracts use strict type hints, mypy --strict configuration planned

### ✅ Strict Error Handling (Rule X)
- **Status**: PASS (maintained)
- **Evidence**: Custom exception hierarchy designed, user-friendly error messages specified

**Final Verdict**: All constitutional rules remain satisfied post-design. No violations introduced.

---

## Next Steps

**Phase 2: Task Generation** (NOT part of `/sp.plan` - separate command):
1. Run `/sp.tasks` to generate `tasks.md` from this plan
2. Tasks will be organized by user story priority (P1 → P2 → P3)
3. Each task will have:
   - Clear acceptance criteria from spec
   - Test cases (Red-Green-Refactor)
   - Estimated complexity
   - Dependencies

**Implementation Workflow** (after `/sp.tasks` completes):
1. Run `/sp.implement` to execute tasks in dependency order
2. Follow Checkpoint Pattern (generate → review → commit → next)
3. Run tests after each task completion
4. Create ADRs for significant decisions during implementation

**Suggested ADR Creation** (before implementation):
Run these commands to document architectural decisions:
```bash
/sp.adr "Repository Pattern for Storage Abstraction"
/sp.adr "Typer CLI Framework Selection"
/sp.adr "uv Package Manager Adoption"
```

---

## Appendix: File Manifest

**Planning Artifacts** (all complete):
- [x] `specs/001-todo-console-app/plan.md` (this file)
- [x] `specs/001-todo-console-app/research.md`
- [x] `specs/001-todo-console-app/data-model.md`
- [x] `specs/001-todo-console-app/contracts/cli-commands.md`
- [x] `specs/001-todo-console-app/quickstart.md`
- [x] `CLAUDE.md` (updated with tech stack)

**Future Artifacts** (to be generated):
- [x] `specs/001-todo-console-app/tasks.md` (via `/sp.tasks`)
- [x] `history/adr/001-repository-pattern.md` (via `/sp.adr`)
- [x] `history/adr/002-typer-cli-framework.md` (via `/sp.adr`)
- [x] `history/adr/003-uv-package-manager.md` (via `/sp.adr`)
- [x] `history/prompts/001-todo-console-app/0002-*.plan.prompt.md` (this session's PHR)

**Implementation Files** (to be generated via `/sp.implement`):
- [x] `src/models/task.py`
- [x] `src/models/enums.py`
- [x] `src/storage/repository.py`
- [x] `src/storage/in_memory.py`
- [x] `src/services/task_service.py`
- [x] `src/services/exceptions.py`
- [x] `src/ui/renderer.py`
- [x] `src/app.py`
- [x] `tests/unit/*` (6 test files)
- [x] `tests/integration/test_cli.py`
- [x] `tests/conftest.py`
- [x] `pyproject.toml`
- [x] `.python-version`
- [x] `README.md`

---

**Plan Status**: ✅ COMPLETE
**Date Completed**: 2025-12-07
**Ready for**: `/sp.tasks` command execution

