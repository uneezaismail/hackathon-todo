# Implementation Plan: Intermediate Level Organization Features

**Branch**: `004-intermediate-features` | **Date**: 2025-12-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-intermediate-features/spec.md`

## Summary

Add intermediate-level organization features to the Todo application to make it polished and practical for real-world use. This includes:
- **Priority Levels** (High, Medium, Low) with visual indicators
- **Tags/Categories** for contextual organization
- **Due Dates** via calendar picker
- **Search** for keyword-based task discovery
- **Filtering** by status, priority, and tags
- **Sorting** by due date, creation date, priority, and alphabetically

All data (priority, tags, due_date) must be **persisted to the database** to survive page refresh and logout/login cycles. This is a full-stack enhancement requiring Database schema updates, Backend API changes, and Frontend UI enhancements.

## Technical Context

**Language/Version**:
- Backend: Python 3.13+ with UV
- Frontend: TypeScript with Next.js 16 (App Router)

**Primary Dependencies**:
- Backend: FastAPI, SQLModel, Alembic, PyJWT
- Frontend: Next.js 16, React, Shadcn UI (calendar component), Tailwind CSS, Better Auth

**Storage**:
- Neon Serverless PostgreSQL (existing)
- Database schema extensions required:
  - Add `priority` column (enum/string: "High", "Medium", "Low")
  - Add `due_date` column (date/timestamp, nullable)
  - Add `tags` relationship (many-to-many or JSON array)

**Testing**:
- Backend: pytest with existing fixtures
- Frontend: React Testing Library (existing)

**Target Platform**:
- Backend: Linux server (Docker-compatible)
- Frontend: Browser (modern, ES2020+)

**Project Type**: Web application (monorepo with backend/ and frontend/)

**Performance Goals**:
- Search/filter results in <1 second for 100+ tasks
- Real-time search updates (no page refresh)
- Sort operations complete <1 second

**Constraints**:
- Must maintain JWT authentication flow
- Must enforce user isolation (all queries filtered by user_id)
- No breaking changes to existing API contracts
- Tags must support autocomplete/suggestions
- Calendar picker must use Shadcn UI component

**Scale/Scope**:
- Support up to 50 unique tags per user
- Support up to 1000 tasks per user without performance degradation
- Multiple tags per task (1-10 recommended, no hard limit)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Spec-First Development ✅
- ✅ Feature has approved specification: `specs/004-intermediate-features/spec.md`
- ✅ All requirements documented with acceptance criteria
- ✅ Implementation follows spec → plan → tasks workflow

### II. No Manual Code ✅
- ✅ Plan to use Claude Code for all implementation
- ✅ Code generation via `/sp.tasks` and `/sp.implement`

### III. Reusable Intelligence ✅
- ✅ ADRs planned for:
  - Tag storage strategy (many-to-many vs JSON array)
  - Sort/filter implementation (database vs application layer)
  - Calendar component selection (Shadcn UI)

### IV. Evolutionary Architecture ✅
- ✅ Database schema changes are additive (no breaking changes)
- ✅ API endpoints backward compatible
- ✅ Frontend can gracefully handle missing priority/tags/due_date

### V. Single Responsibility ✅
- ✅ Business logic separated from UI (Backend service layer)
- ✅ Database operations encapsulated in TaskService
- ✅ Frontend components focused on presentation

### VI. User Experience First ✅
- ✅ Real-time search (no button clicks)
- ✅ Visual priority indicators
- ✅ Intuitive calendar date picker
- ✅ Clear empty state messages

### VII. The Checkpoint Pattern ✅
- ✅ Implementation will follow atomic task-by-task commits
- ✅ Each task independently testable

### VIII. Automated Testing ✅
- ✅ Backend: API integration tests for new endpoints (filtering, sorting)
- ✅ Backend: Unit tests for tag management and priority validation
- ✅ Frontend: Component tests for new UI elements (priority selector, tag input, calendar)
- ✅ All tests must pass before merge

### IX. Strict Type Safety ✅
- ✅ Backend: Type hints for all new functions
- ✅ Frontend: TypeScript strict mode enabled

### X. Strict Error Handling ✅
- ✅ No silent failures
- ✅ User-friendly error messages for invalid priority/tags/dates

### XI. 12-Factor Configuration ✅
- ✅ No hardcoded values
- ✅ Environment variables already in place

### XII. AI Sub-Agents and Skills ✅
- ✅ Subagents will follow spec-driven workflow
- ✅ No bypass of specifications

**Gate Status**: ✅ **PASSED** - All constitutional requirements met

## Project Structure

### Documentation (this feature)

```text
specs/004-intermediate-features/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output (technical decisions)
├── data-model.md        # Phase 1 output (database schema)
├── quickstart.md        # Phase 1 output (setup guide)
├── contracts/           # Phase 1 output (API contracts)
│   ├── api-endpoints.yaml    # OpenAPI spec for new/modified endpoints
│   └── data-models.json      # JSON schemas for request/response
├── checklists/
│   └── requirements.md  # Specification quality checklist (complete)
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created yet)
```

### Source Code (repository root)

```text
# Existing monorepo structure (NO changes to structure, only additions)
backend/
├── src/
│   ├── models/
│   │   ├── task.py              # MODIFY: Add priority, due_date, tags fields
│   │   └── tag.py               # NEW: Tag model (if using many-to-many)
│   ├── schemas/
│   │   └── task.py              # MODIFY: Add TaskCreate/Update/Response with new fields
│   ├── services/
│   │   ├── task_service.py      # MODIFY: Add filtering, sorting, tag management
│   │   └── tag_service.py       # NEW: Tag CRUD and autocomplete (if many-to-many)
│   ├── api/
│   │   └── v1/
│   │       └── tasks.py         # MODIFY: Add query params for filter/sort
│   └── db/
│       └── session.py           # NO CHANGE
├── alembic/
│   └── versions/                # NEW: Migration for schema changes
└── tests/
    ├── test_task_service.py     # MODIFY: Add tests for new features
    ├── test_tag_service.py      # NEW: Tag-specific tests (if many-to-many)
    └── test_api_tasks.py        # MODIFY: Add tests for filter/sort/tags

frontend/
├── app/
│   └── dashboard/
│       └── page.tsx             # MODIFY: Add search, filter, sort UI
├── components/
│   ├── tasks/
│   │   ├── task-form.tsx        # MODIFY: Add priority, tags, due_date inputs
│   │   ├── task-card.tsx        # MODIFY: Display priority badge, tags, due_date
│   │   ├── task-filters.tsx     # NEW: Filter controls
│   │   ├── task-search.tsx      # NEW: Search input
│   │   ├── task-sort.tsx        # NEW: Sort dropdown
│   │   ├── priority-selector.tsx # NEW: Priority dropdown with Select component and color indicators
│   │   ├── tag-input.tsx        # NEW: Tag input with autocomplete
│   │   └── due-date-picker.tsx  # NEW: Calendar date picker (Shadcn UI)
│   └── ui/
│       └── calendar.tsx         # NEW: Shadcn UI calendar component (npx shadcn add calendar)
├── actions/
│   └── tasks.ts                 # MODIFY: Add filter/sort params to API calls
└── lib/
    └── types.ts                 # MODIFY: Add Task interface with new fields
```

**Structure Decision**: Existing monorepo structure preserved. Changes are additive only (new files and modifications to existing files). No restructuring required.

## Complexity Tracking

> No constitutional violations requiring justification.

All complexity is inherent to the feature requirements:
- Tag management complexity is necessary for user-defined categories
- Filter/sort complexity is necessary for search and organization
- Database schema changes are additive and non-breaking

---

## Phase 0: Research & Technical Decisions

**Status**: ✅ Complete

### Research Tasks

1. **Tag Storage Strategy**
   - **Decision**: Use many-to-many relationship with `task_tags` junction table
   - **Rationale**:
     - Better data normalization
     - Supports tag autocomplete/suggestions efficiently
     - Allows future tag management features (rename, merge, delete)
     - PostgreSQL has excellent support for joins
   - **Alternatives Considered**:
     - JSON array: Simpler but harder to query, no referential integrity
     - PostgreSQL array type: Good for queries but lacks foreign key constraints
   - **Trade-off**: Slightly more complex schema but better long-term maintainability

2. **Filter/Sort Implementation**
   - **Decision**: Database-level filtering and sorting
   - **Rationale**:
     - Scales better (offload to PostgreSQL)
     - Supports pagination efficiently
     - Leverages database indexes
   - **Alternatives Considered**:
     - Client-side filtering: Doesn't scale beyond 100-200 tasks
     - Hybrid approach: Adds unnecessary complexity
   - **Trade-off**: More complex SQL queries but better performance

3. **Calendar Component**
   - **Decision**: Shadcn UI Calendar component
   - **Rationale**:
     - Already using Shadcn UI in the project
     - Accessible, customizable, well-documented
     - TypeScript-friendly
   - **Installation**: `npx shadcn@latest add calendar`
   - **Dependencies**: date-fns (for date handling)

4. **Priority Field Type**
   - **Decision**: String enum in database, TypeScript enum in frontend
   - **Rationale**:
     - Readable in database queries
     - Easy validation
     - Simple to add new priorities in future
   - **Values**: "High", "Medium", "Low"
   - **Alternatives Considered**:
     - Integer (0, 1, 2): Less readable, harder to debug
     - PostgreSQL enum: More type-safe but harder to migrate

5. **Due Date Handling**
   - **Decision**: Store as `DATE` type (no time component)
   - **Rationale**:
     - Spec explicitly excludes time-based scheduling
     - Simpler UX (no timezone issues)
     - Adequate for task due dates
   - **Format**: ISO 8601 date string (YYYY-MM-DD) in API

### Best Practices Identified

1. **SQLModel Indexing**:
   - Add composite index on `(user_id, priority, due_date)` for filter performance
   - Index on `user_id, tags` for tag-based filtering

2. **FastAPI Query Parameters**:
   - Use Pydantic models for complex query params
   - Support multiple values for tags filter (`?tags=work&tags=urgent`)

3. **React State Management**:
   - Use URL search params for filter/sort state (enables deep linking)
   - Debounce search input (300ms) to reduce API calls

4. **Tag Autocomplete**:
   - Return top 10 most-used tags for the user
   - Sort by usage frequency descending

---

## Phase 1: Design & Contracts

**Prerequisites**: Phase 0 research complete ✅

### 1. Data Model Design

See `data-model.md` for detailed schema.

**Summary**:
- **Task table**: Add `priority`, `due_date` columns
- **Tag table**: New table for tag definitions
- **TaskTag table**: New junction table for many-to-many relationship
- **Indexes**: Composite indexes for filter/sort performance

### 2. API Contracts

See `contracts/` directory for OpenAPI specifications.

**New/Modified Endpoints**:

#### GET /api/{user_id}/tasks
**Modifications**: Add query parameters for filtering and sorting
- **Query Params**:
  - `status`: "all" | "pending" | "completed"
  - `priority`: "all" | "high" | "medium" | "low"
  - `tags`: string[] (multiple values allowed)
  - `search`: string (keyword search)
  - `sort_by`: "due_date_soonest" | "created_newest" | "created_oldest" | "priority_high_low" | "alphabetical_az"
  - `limit`: integer (default: 50, max: 100)
  - `offset`: integer (default: 0)

#### POST /api/{user_id}/tasks
**Modifications**: Accept priority, tags, due_date in request body
- **Request Body**:
  ```json
  {
    "title": "string",
    "description": "string?",
    "priority": "High" | "Medium" | "Low",
    "tags": ["string"],
    "due_date": "YYYY-MM-DD?"
  }
  ```

#### PATCH /api/{user_id}/tasks/{id}
**Modifications**: Support partial updates for priority, tags, due_date

#### GET /api/{user_id}/tags
**New Endpoint**: Get all tags for autocomplete
- **Response**:
  ```json
  {
    "tags": [
      { "name": "work", "usage_count": 15 },
      { "name": "urgent", "usage_count": 8 }
    ]
  }
  ```

### 3. Quickstart Guide

See `quickstart.md` for developer setup instructions.

### 4. Agent Context Update

After Phase 1 design is complete, run:
```bash
.specify/scripts/bash/update-agent-context.sh claude
```

This will update `CLAUDE.md` with new technologies and patterns specific to this feature.

---

## Next Steps

**Phase 2**: Task Generation (`/sp.tasks` command)
- Break down implementation into atomic tasks
- Generate task checklist with dependencies
- Prioritize by: Database → Backend → Frontend

**Phase 3**: Implementation (`/sp.implement` command)
- Execute tasks one-by-one
- Generate code via Claude Code
- Run tests after each task
- Commit atomically

**Phase 4**: Validation
- All tests passing
- Manual testing of UI
- Performance validation (100+ tasks)

---

## Definition of Done

- ✅ All database migrations applied successfully
- ✅ All backend tests pass (pytest)
- ✅ All frontend tests pass (npm test)
- ✅ No TypeScript errors (npm run type-check)
- ✅ No linting errors (backend: mypy, frontend: eslint)
- ✅ All acceptance scenarios from spec validated
- ✅ Manual UI testing completed
- ✅ Performance validated (100+ tasks, <1s filter/sort/search)
- ✅ User isolation verified (no cross-user data leaks)
- ✅ Data persistence verified (page refresh, logout/login)

---

**Created**: 2025-12-14
**Branch**: 004-intermediate-features
**Status**: Phase 1 Complete - Ready for `/sp.tasks`
