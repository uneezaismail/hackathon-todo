# Tasks: Intermediate Level Organization Features

**Input**: Design documents from `/specs/004-intermediate-features/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-endpoints.yaml

**Tests**: Tests are NOT explicitly requested in the specification - implementation tasks only

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

This is a **monorepo** with:
- **Backend**: `backend/src/`, `backend/tests/`, `backend/alembic/`
- **Frontend**: `frontend/app/`, `frontend/components/`, `frontend/actions/`, `frontend/lib/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and Shadcn UI calendar installation

- [x] T001 Install Shadcn UI calendar component via `npx shadcn@latest add calendar` in frontend directory
- [x] T002 Verify calendar dependencies installed (react-day-picker, date-fns) in frontend/package.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema changes that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Create Alembic migration file for schema changes in backend/alembic/versions/
- [x] T004 Add priority column (TEXT with CHECK constraint) to tasks table in migration file
- [x] T005 Add due_date column (DATE, nullable) to tasks table in migration file
- [x] T006 Create tags table with id, user_id, name, created_at columns in migration file
- [x] T007 Create task_tags junction table with task_id, tag_id foreign keys in migration file
- [x] T008 Add composite indexes (user_id, priority), (user_id, due_date), (user_id, priority, due_date) in migration file
- [x] T009 Add unique constraint (user_id, name) to tags table in migration file
- [x] T010 Run Alembic migration to apply schema changes: `uv run alembic upgrade head`
- [x] T011 Verify schema changes in database (check tasks, tags, task_tags tables exist)

**Checkpoint**: Database schema ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Task Prioritization and Due Dates (Priority: P1) 🎯 MVP

**Goal**: Enable users to assign priority levels (High, Medium, Low) and due dates to tasks for effective task management

**Independent Test**: Create a task with High priority and a due date, view it on the task list to see priority indicator and due date displayed, filter/sort by priority and due date

### Backend Models for User Story 1

- [x] T012 [P] [US1] Create Tag model in backend/src/models/tag.py with id, user_id, name, created_at fields
- [x] T013 [P] [US1] Create TaskTag model in backend/src/models/task_tag.py with task_id, tag_id foreign keys
- [x] T014 [US1] Modify Task model in backend/src/models/task.py to add priority field (Literal["High", "Medium", "Low"], default="Medium")
- [x] T015 [US1] Add due_date field (Optional[date]) to Task model in backend/src/models/task.py
- [x] T016 [US1] Add relationship for tags to Task model using SQLModel relationships

### Backend Schemas for User Story 1

- [x] T017 [P] [US1] Update TaskCreate schema in backend/src/schemas/task.py to include priority, due_date, tags fields
- [x] T018 [P] [US1] Update TaskUpdate schema in backend/src/schemas/task.py to include priority, due_date, tags fields
- [x] T019 [P] [US1] Update TaskResponse schema in backend/src/schemas/task.py to include priority, due_date, tags fields
- [x] T020 [US1] Create TagWithUsage schema in backend/src/schemas/task.py with name and usage_count fields

### Backend Services for User Story 1

- [x] T021 [US1] Create TagService in backend/src/services/tag_service.py with get_user_tags method (returns top 10 by usage)
- [x] T022 [US1] Create create_or_get_tag method in TagService to handle tag creation and lookup
- [x] T023 [US1] Update TaskService.create_task in backend/src/services/task_service.py to handle priority, due_date, tags
- [x] T024 [US1] Update TaskService.update_task in backend/src/services/task_service.py to handle priority, due_date, tags
- [x] T025 [US1] Add tag association logic in TaskService to create task_tags junction records
- [x] T026 [US1] Modify TaskService.get_tasks to join tags and include them in response

### Backend API for User Story 1

- [x] T027 [US1] Add priority query parameter to GET /api/{user_id}/tasks endpoint in backend/src/api/v1/tasks.py
- [x] T028 [US1] Add tags query parameter (List[str]) to GET /api/{user_id}/tasks endpoint
- [x] T029 [US1] Update POST /api/{user_id}/tasks to accept priority, due_date, tags in request body
- [x] T030 [US1] Update PUT /api/{user_id}/tasks/{task_id} to accept priority, due_date, tags in request body
- [x] T031 [US1] Create GET /api/{user_id}/tags endpoint in backend/src/api/v1/tasks.py for tag autocomplete
- [x] T032 [US1] Add input validation for priority enum values (High, Medium, Low) in API endpoints
- [x] T033 [US1] Add input validation for due_date format (ISO 8601 YYYY-MM-DD) in API endpoints

### Frontend Types for User Story 1

- [x] T034 [US1] Update Task interface in frontend/lib/types.ts to include priority, due_date, tags fields
- [x] T035 [US1] Create Priority type (High | Medium | Low) in frontend/lib/types.ts
- [x] T036 [US1] Create Tag interface in frontend/lib/types.ts with name and usage_count fields

### Frontend Actions for User Story 1

- [x] T037 [US1] Update createTask action in frontend/actions/tasks.ts to send priority, due_date, tags to API
- [x] T038 [US1] Update updateTask action in frontend/actions/tasks.ts to send priority, due_date, tags to API
- [x] T039 [US1] Create getTags action in frontend/actions/tasks.ts to fetch user's tags for autocomplete

### Frontend Components for User Story 1

- [x] T040 [P] [US1] Create PrioritySelector component in frontend/components/tasks/priority-selector.tsx with High/Medium/Low buttons
- [x] T041 [P] [US1] Create DueDatePicker component in frontend/components/tasks/due-date-picker.tsx using Shadcn calendar
- [x] T042 [P] [US1] Create TagInput component in frontend/components/tasks/tag-input.tsx with autocomplete support
- [x] T043 [US1] Update TaskForm component in frontend/components/tasks/task-form.tsx to include PrioritySelector, DueDatePicker, TagInput
- [x] T044 [US1] Update TaskCard component in frontend/components/tasks/task-card.tsx to display priority badge with color coding
- [x] T045 [US1] Add due_date display to TaskCard component with date formatting (e.g., "Due Dec 31")
- [x] T046 [US1] Add tags display to TaskCard component as colored badges
- [x] T047 [US1] Implement color coding for priority levels (High=red, Medium=yellow, Low=blue/green) in TaskCard
- [x] T048 [US1] Add "Clear due date" functionality to DueDatePicker component

**Checkpoint**: At this point, User Story 1 should be fully functional - users can create tasks with priority, due dates, and tags

---

## Phase 4: User Story 2 - Task Categorization with Tags (Priority: P2)

**Goal**: Enable users to organize tasks by context using tags/categories

**Independent Test**: Create tasks with different tags, view tags displayed as badges, filter by specific tags to confirm proper grouping

**Note**: Core tag functionality was implemented in User Story 1. This phase focuses on tag-specific enhancements.

### Backend Enhancements for User Story 2

- [x] T049 [US2] Add search parameter to GET /api/{user_id}/tags endpoint for tag name prefix filtering
- [x] T050 [US2] Implement case-insensitive tag matching in TagService for autocomplete
- [x] T051 [US2] Add tag validation (length 1-50 chars, alphanumeric + spaces/hyphens) in TagService

### Frontend Enhancements for User Story 2

- [x] T052 [US2] Enhance TagInput component to support creating new tags on-the-fly (when user types non-existent tag)
- [x] T053 [US2] Add tag suggestion dropdown to TagInput showing existing tags as user types
- [x] T054 [US2] Implement tag badge removal UI in TagInput (X button on each selected tag)
- [x] T055 [US2] Add visual feedback when tag is selected from autocomplete vs newly created
- [x] T056 [US2] Implement debouncing (300ms) for tag autocomplete API calls in TagInput

**Checkpoint**: Tag functionality fully enhanced - users can efficiently manage tags with autocomplete and suggestions

---

## Phase 5: User Story 3 - Search and Filter Tasks (Priority: P3)

**Goal**: Enable users to search by keyword and filter by status, priority, and tags to quickly find specific tasks

**Independent Test**: Create multiple tasks with different attributes, use search/filter controls to verify correct results appear

### Backend for User Story 3

- [x] T057 [US3] Add search query parameter to GET /api/{user_id}/tasks endpoint in backend/src/api/v1/tasks.py
- [x] T058 [US3] Add status query parameter (all|pending|completed) to GET /api/{user_id}/tasks endpoint
- [x] T059 [US3] Implement keyword search logic in TaskService.get_tasks using ILIKE on title and description
- [x] T060 [US3] Implement case-insensitive search matching in TaskService
- [x] T061 [US3] Implement status filtering logic in TaskService.get_tasks (filter by completed boolean)
- [x] T062 [US3] Implement priority filtering logic in TaskService.get_tasks (filter by priority enum)
- [x] T063 [US3] Implement tag filtering logic in TaskService.get_tasks with AND logic (tasks must have ALL selected tags)
- [x] T064 [US3] Add limit and offset parameters to GET /api/{user_id}/tasks for pagination (default limit=50, max=100)
- [x] T065 [US3] Update TaskListResponse schema to include total count of matching tasks

### Frontend Components for User Story 3

- [x] T066 [P] [US3] Create TaskSearch component in frontend/components/tasks/task-search.tsx with real-time search input
- [x] T067 [P] [US3] Create TaskFilters component in frontend/components/tasks/task-filters.tsx with status, priority, tags dropdowns
- [x] T068 [US3] Update dashboard page in frontend/app/dashboard/page.tsx to integrate TaskSearch component
- [x] T069 [US3] Integrate TaskFilters component into dashboard page
- [x] T070 [US3] Implement URL search params state management for filter/sort persistence (useSearchParams hook)
- [x] T071 [US3] Add "Clear Filters" button to TaskFilters component that resets all filters
- [x] T072 [US3] Update getTasks action in frontend/actions/tasks.ts to pass search, status, priority, tags params
- [x] T073 [US3] Implement debounced search (300ms delay) in TaskSearch component to reduce API calls
- [x] T074 [US3] Add empty state message when search/filter returns zero results (e.g., "No tasks match your filters")
- [x] T075 [US3] Add visual indicators for active filters (e.g., badge count showing "3 filters active")

**Checkpoint**: Search and filtering fully functional - users can quickly find tasks using keywords and filters

---

## Phase 6: User Story 4 - Sort Tasks (Priority: P4)

**Goal**: Enable users to sort tasks by due date, creation date, priority level, or alphabetically to view tasks in their preferred order

**Independent Test**: Create tasks with different attributes, click sort controls to verify list reorders correctly

### Backend for User Story 4

- [x] T076 [US4] Add sort_by query parameter to GET /api/{user_id}/tasks endpoint in backend/src/api/v1/tasks.py
- [x] T077 [US4] Implement "due_date_soonest" sorting in TaskService.get_tasks (ASC, NULLS LAST)
- [x] T078 [US4] Implement "created_newest" sorting in TaskService.get_tasks (created_at DESC)
- [x] T079 [US4] Implement "created_oldest" sorting in TaskService.get_tasks (created_at ASC)
- [x] T080 [US4] Implement "priority_high_low" sorting in TaskService.get_tasks (custom order: High, Medium, Low)
- [x] T081 [US4] Implement "alphabetical_az" sorting in TaskService.get_tasks (title ASC, case-insensitive)
- [x] T082 [US4] Add validation for sort_by enum values in API endpoint

### Frontend Components for User Story 4

- [x] T083 [US4] Create TaskSort component in frontend/components/tasks/task-sort.tsx with dropdown for sort options
- [x] T084 [US4] Integrate TaskSort component into dashboard page in frontend/app/dashboard/page.tsx
- [x] T085 [US4] Update getTasks action to pass sort_by parameter to API
- [x] T086 [US4] Implement URL search params for sort order persistence across page refreshes
- [x] T087 [US4] Add visual indicator in TaskSort dropdown showing currently active sort order
- [x] T088 [US4] Ensure task list auto-refreshes when sort order changes (no manual refresh needed)
- [x] T089 [US4] Handle tasks with missing sort values (e.g., no due_date) by placing them at the end

**Checkpoint**: All user stories complete - full intermediate feature set is functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final validation

### Code Quality & Validation
- [x] T090 [P] Add TypeScript type checking validation: run `npm run type-check` in frontend directory
- [x] T091 [P] Add backend type checking validation: run `uv run mypy src/` in backend directory
- [x] T092 [P] Add frontend linting validation: run `npm run lint` in frontend directory
- [x] T093 Fix all ESLint errors: Replace `any` types with proper error types in auth forms
- [x] T094 Fix unescaped HTML entities in not-found.tsx, task-item.tsx, task-list.tsx, task-table.tsx
- [x] T095 Convert tailwind.config.ts to use ES module imports instead of require()

### UI/UX Improvements
- [x] T096 [UI] Convert PrioritySelector from button group to dropdown Select component with color indicators
- [x] T097 [UI] Update TaskForm to display Priority and Due Date side-by-side in 2-column grid layout
- [x] T098 [UI] Remove Dashboard button from Header component (desktop and mobile views)

### Docker & Deployment
- [x] T099 [Docker] Create frontend/.dockerignore to exclude node_modules, tests, and build artifacts
- [x] T100 [Docker] Create root .dockerignore for docker-compose build context optimization
- [x] T101 [Docker] Fix docker-compose.yml NEXT_PUBLIC_API_URL to use service name (http://backend:8000)
- [x] T102 [Docker] Add Docker networks configuration to docker-compose.yml for inter-container communication
- [x] T103 [Docker] Fix frontend/Dockerfile public directory copy order and ownership
- [x] T104 [Docker] Fix backend/.dockerignore to allow README.md (required for uv sync)

### Documentation
- [x] T105 [Docs] Update backend/CLAUDE.md with correct API endpoints (/api/{user_id}/tasks format)
- [x] T106 [Docs] Update backend/CLAUDE.md with Docker setup instructions and environment variables
- [x] T107 [Docs] Update root CLAUDE.md with docker-compose command and authentication architecture
- [x] T108 [Docs] Update frontend/CLAUDE.md with Docker setup and environment variable documentation

### Testing & Verification
- [x] T109 Verify all database indexes were created correctly (check pg_indexes view)
- [x] T110 Test user isolation: verify users cannot access other users' tasks/tags via API
- [x] T111 Test data persistence: create task with priority/tags/due_date, logout, login, verify data persists
- [x] T112 Performance test: create 100+ tasks, verify search/filter/sort completes in <1 second
- [x] T113 Manual UI testing: follow quickstart.md testing checklist for all scenarios
- [x] T114 Docker testing: run `docker-compose up --build` and verify both services start correctly
- [x] T115 Create PR with link to spec.md and screenshots of new UI features
- [x] T116 Final verification: run full test suite (backend pytest and frontend tests if available)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User Story 1 can start after Phase 2
  - User Story 2 depends on User Story 1 (tags implemented there)
  - User Story 3 can start after Phase 2 (independent of US1/US2)
  - User Story 4 can start after Phase 2 (independent of US1/US2/US3)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Depends on User Story 1 for core tag implementation
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1 for filtering by priority/tags
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - May integrate with US1 for sorting by priority/due_date

### Within Each User Story

- Models before services
- Services before API endpoints
- Backend API before frontend actions
- Frontend actions before frontend components
- Core components before UI integration

### Parallel Opportunities

- Phase 1: T001 and T002 can run in parallel
- Phase 2: T003-T009 are all part of the same migration file (sequential), but T010 and T011 follow after
- Phase 3 (User Story 1):
  - T012, T013 (models) can run in parallel
  - T017, T018, T019, T020 (schemas) can run in parallel after models complete
  - T040, T041, T042 (frontend components) can run in parallel after actions are ready
- Phase 4 (User Story 2): T049, T050, T051 can run in parallel
- Phase 5 (User Story 3): T066, T067 can run in parallel
- Phase 7 (Polish): T090, T091, T092 can run in parallel

---

## Parallel Example: User Story 1

```bash
# After models are complete, launch all schemas together:
Task: "Update TaskCreate schema in backend/src/schemas/task.py"
Task: "Update TaskUpdate schema in backend/src/schemas/task.py"
Task: "Update TaskResponse schema in backend/src/schemas/task.py"

# After actions are ready, launch all core UI components together:
Task: "Create PrioritySelector component in frontend/components/tasks/priority-selector.tsx"
Task: "Create DueDatePicker component in frontend/components/tasks/due-date-picker.tsx"
Task: "Create TagInput component in frontend/components/tasks/tag-input.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T011) - CRITICAL, blocks all stories
3. Complete Phase 3: User Story 1 (T012-T048)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready - users can now assign priorities, due dates, and tags

### Incremental Delivery

1. Complete Setup + Foundational → Database ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP! Priority/tags/due dates working)
3. Add User Story 2 → Test independently → Deploy/Demo (Enhanced tag management)
4. Add User Story 3 → Test independently → Deploy/Demo (Search and filtering working)
5. Add User Story 4 → Test independently → Deploy/Demo (Sorting working)
6. Complete Polish phase → Final validation → Production deployment

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T011)
2. Once Foundational is done:
   - Developer A: User Story 1 (T012-T048)
   - Developer B: Wait for US1 models/schemas, then start User Story 2 (T049-T056)
   - Developer C: User Story 3 (T057-T075) - can start in parallel with US1/US2
   - Developer D: User Story 4 (T076-T089) - can start in parallel with US1/US2/US3
3. Stories integrate and test independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Follow database → backend → frontend flow within each story
- Maintain backward compatibility - existing tasks without priority/tags/due_date should still work
- All queries MUST be filtered by user_id for user isolation
- Tests are NOT included as they were not requested in the specification
