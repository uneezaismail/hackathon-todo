---
id: 0003
title: intermediate-features-task-generation
stage: tasks
date: 2025-12-15T00:00:00Z
surface: claude-code
model: claude-sonnet-4-5
feature: 004-intermediate-features
branch: 004-intermediate-features
user: uneezaismail
command: /sp.tasks
labels: [task-generation, user-stories, priorities, tags, due-dates, search, filter, sort, monorepo, incremental-delivery]
links:
  spec: specs/004-intermediate-features/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - path: specs/004-intermediate-features/tasks.md
    status: created
tests: []
---

## Prompt

User executed `/sp.tasks` command after completing planning phase (Phase 0 research + Phase 1 design) for intermediate level organization features.

**Context**:
- Feature: Add priorities, tags, due dates, search, filter, and sort to Todo application
- Specification complete with 4 prioritized user stories (P1-P4)
- Planning complete with research decisions, data model design, and API contracts
- Technology stack: FastAPI backend, Next.js 16 frontend, Neon PostgreSQL database
- Architecture: Monorepo with backend/ and frontend/ directories

**User Stories**:
1. **P1 (MVP)**: Task Prioritization and Due Dates - High/Medium/Low priority levels + calendar date picker
2. **P2**: Task Categorization with Tags - User-defined tags with autocomplete
3. **P3**: Search and Filter Tasks - Keyword search + filter by status/priority/tags
4. **P4**: Sort Tasks - Sort by due date, created date, priority, alphabetically

**Key Requirements**:
- All data MUST persist to database (not session-based)
- Database-level filtering and sorting for scalability
- Many-to-many tag relationship via junction table
- Shadcn UI calendar component for date picker
- User isolation enforced (all queries filtered by user_id)

## Response snapshot

Generated comprehensive task breakdown with 100 atomic tasks organized by user story:

**Phase 1: Setup** (T001-T002)
- Install Shadcn UI calendar component
- Verify dependencies installed

**Phase 2: Foundational** (T003-T011) - BLOCKS all user stories
- Create Alembic migration for schema changes
- Add priority column to tasks table (TEXT with CHECK)
- Add due_date column to tasks table (DATE, nullable)
- Create tags table (id, user_id, name, created_at)
- Create task_tags junction table (task_id, tag_id)
- Add composite indexes for filter/sort performance
- Run migration and verify schema

**Phase 3: User Story 1 - Priority & Due Dates (P1)** (T012-T048) - MVP
- Backend: Models (Task, Tag, TaskTag), Schemas, Services, API endpoints
- Frontend: Types, Actions, Components (PrioritySelector, DueDatePicker, TagInput)
- Integration: Update TaskForm and TaskCard to display priority/tags/due_date

**Phase 4: User Story 2 - Tag Categorization (P2)** (T049-T056)
- Backend: Tag search, case-insensitive matching, validation
- Frontend: Tag autocomplete, create-on-the-fly, visual feedback

**Phase 5: User Story 3 - Search & Filter (P3)** (T057-T075)
- Backend: Search query, status/priority/tags filtering, pagination
- Frontend: TaskSearch, TaskFilters components, URL params state, empty states

**Phase 6: User Story 4 - Sort Tasks (P4)** (T076-T089)
- Backend: 5 sort options (due_date_soonest, created_newest/oldest, priority_high_low, alphabetical_az)
- Frontend: TaskSort component, URL params persistence

**Phase 7: Polish** (T090-T100)
- Type checking, linting, performance testing, user isolation verification
- Manual UI testing, PR creation

## Outcome

- ✅ Impact: Complete task breakdown ready for `/sp.implement` execution
- 🧪 Tests: Tests NOT included (not requested in specification)
- 📁 Files: 1 file created (tasks.md with 100 tasks)
- 🔁 Next prompts: /sp.implement to execute tasks atomically
- 🧠 Reflection: Task generation followed user story organization to enable independent implementation and incremental delivery. MVP scope clearly defined as User Story 1 (priority + due dates + tags). Parallel opportunities identified within each phase.

## Evaluation notes (flywheel)

- Failure modes observed: None - task generation completed successfully
- Graders run and results (PASS/FAIL): All 100 tasks follow checklist format with [ID] [P?] [Story] Description + file paths
- Prompt variant (if applicable): Standard /sp.tasks workflow organized by user story priority
- Next experiment (smallest change to try): Execute /sp.implement to begin atomically implementing tasks starting with MVP (User Story 1)

### Task Organization Strategy

**Decision**: Organize tasks by user story instead of by layer (models → services → API → UI)

**Rationale**:
- Enables independent implementation of each user story
- Supports incremental delivery (MVP = User Story 1)
- Allows parallel development (different developers on different stories)
- Each story is independently testable

**Trade-off**: Some components (tags) are implemented in User Story 1 even though they're fully featured in User Story 2, but this enables User Story 1 to be a complete MVP.

### Foundational Phase Strategy

**Critical Decision**: Phase 2 (Foundational) BLOCKS all user stories

**Rationale**:
- Database schema changes must be complete before ANY story can start
- Migration must run successfully before models can be created
- Prevents partial implementations or schema conflicts

**Impact**: Clear checkpoint - once Phase 2 complete, all user stories can start in parallel

### MVP Definition

**MVP = User Story 1** (Tasks T001-T048)
- Users can assign priority levels (High, Medium, Low)
- Users can set due dates via calendar picker
- Users can add tags to tasks
- All data persists to database

**Rationale**: Delivers core organization features that provide immediate value. Search/filter/sort enhance this but aren't required for basic task management.

### Parallel Execution Opportunities

- **Phase 1**: T001-T002 (2 parallel tasks)
- **Phase 3 Models**: T012-T013 (2 parallel tasks)
- **Phase 3 Schemas**: T017-T020 (4 parallel tasks)
- **Phase 3 UI Components**: T040-T042 (3 parallel tasks)
- **Phase 7 Validation**: T090-T092 (3 parallel tasks)

**Total parallel opportunities**: 14 tasks can run in parallel across phases
