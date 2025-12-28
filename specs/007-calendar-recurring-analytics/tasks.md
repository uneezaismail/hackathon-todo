# Tasks: Calendar View, Recurring Tasks & Analytics

**Input**: Design documents from `/specs/007-calendar-recurring-analytics/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/api-endpoints.yaml

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US6)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `phase-3-todo-ai-chatbot/backend/src/`, `phase-3-todo-ai-chatbot/frontend/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and configure project for new features

- [x] T001 [P] Install react-big-calendar and types in `phase-3-todo-ai-chatbot/frontend/` (`npm install react-big-calendar @types/react-big-calendar`)
- [x] T002 [P] Verify date-fns is installed (already present) for date manipulation
- [x] T003 Create calendar route structure `phase-3-todo-ai-chatbot/frontend/app/dashboard/calendar/page.tsx`
- [x] T004 Create calendar components folder `phase-3-todo-ai-chatbot/frontend/components/calendar/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema extension for recurring tasks - MUST be complete before US2-US4

**NOTE**: US1 (Calendar View) has NO backend changes - can proceed immediately after Phase 1

- [x] T005 Create Alembic migration for recurrence fields in `phase-3-todo-ai-chatbot/backend/alembic/versions/05f28ccbd23b_add_recurrence_fields.py`:
  - `is_recurring: bool (default=false)`
  - `recurrence_type: str (enum: daily/weekly/monthly/yearly)`
  - `recurrence_interval: int (default=1)`
  - `recurrence_days: str (nullable, for weekly)`
  - `recurrence_end_date: date (nullable)`
  - `max_occurrences: int (nullable)`
  - `parent_task_id: uuid (nullable, self-reference FK)`
  - `occurrence_count: int (default=0)`
- [x] T006 Extend Task SQLModel in `phase-3-todo-ai-chatbot/backend/src/models/task.py` with new recurrence fields
- [x] T007 [P] Extend TaskCreate schema in `phase-3-todo-ai-chatbot/backend/src/models/task.py` with recurrence fields
- [x] T008 [P] Extend TaskUpdate schema in `phase-3-todo-ai-chatbot/backend/src/models/task.py` with recurrence fields
- [x] T009 [P] Extend TaskResponse schema in `phase-3-todo-ai-chatbot/backend/src/models/task.py` with recurrence fields
- [x] T010 Run Alembic migration: `uv run alembic upgrade head` (requires database connection)

**Checkpoint**: Database schema ready - US2-US6 can now proceed

---

## Phase 3: User Story 1 - Calendar View for Task Visualization (Priority: P1)

**Goal**: Display existing tasks on interactive calendar with day/week/month views

**Independent Test**: Create tasks with due dates, navigate to calendar, verify tasks appear on their due dates

### Implementation for User Story 1

- [x] T011 [US1] Create TaskCalendar component in `phase-3-todo-ai-chatbot/frontend/components/calendar/task-calendar.tsx`:
  - Wrap react-big-calendar with task data transformation
  - Map tasks with due_date to calendar events
  - Configure day/week/month views
- [x] T012 [P] [US1] Create CalendarEvent component in `phase-3-todo-ai-chatbot/frontend/components/calendar/calendar-event.tsx`:
  - Custom event rendering with priority colors (High=red, Medium=amber, Low=blue)
  - Show completed status indicator
  - Truncate long titles
- [x] T013 [P] [US1] Create CalendarToolbar component in `phase-3-todo-ai-chatbot/frontend/components/calendar/calendar-toolbar.tsx`:
  - View switcher (day/week/month)
  - Navigation (prev/next/today)
  - Date display
- [x] T014 [US1] Create calendar page in `phase-3-todo-ai-chatbot/frontend/app/dashboard/calendar/page.tsx`:
  - Fetch user's tasks
  - Pass to TaskCalendar
  - Handle loading/error states
- [x] T015 [US1] Implement task click handler to show TaskDetailsDialog in calendar
- [x] T016 [US1] Implement drag-and-drop to update task due_date via PATCH /tasks/{id}
- [x] T017 [US1] Implement click-on-date to open TaskFormDialog with pre-filled due date
- [x] T018 [US1] Add overdue task styling (red border/background for past due dates)
- [x] T019 [P] [US1] Create UnscheduledTasks sidebar component in `phase-3-todo-ai-chatbot/frontend/components/calendar/unscheduled-tasks.tsx` for tasks without due_date
- [x] T020 [US1] Persist user's preferred calendar view (day/week/month) in localStorage
- [x] T021 [US1] Add "Calendar" link to sidebar navigation in `phase-3-todo-ai-chatbot/frontend/components/layout/sidebar.tsx`
- [x] T022 [P] [US1] Create calendar index file `phase-3-todo-ai-chatbot/frontend/components/calendar/index.ts` for exports
- [x] T023 [US1] Add calendar styles/CSS for react-big-calendar in `phase-3-todo-ai-chatbot/frontend/app/globals.css`

**Checkpoint**: Calendar View fully functional - users can view, click, drag tasks on calendar

---

## Phase 4: User Story 2 - Creating Recurring Tasks (Priority: P2)

**Goal**: Allow users to create tasks that repeat on a schedule

**Independent Test**: Create a recurring weekly task for Monday, complete it, verify next Monday's instance is created

### Implementation for User Story 2

- [x] T024 [US2] Create RecurringService in `phase-3-todo-ai-chatbot/backend/src/services/recurring_service.py`:
  - `calculate_next_due_date(task)` - compute next occurrence date
  - `generate_next_occurrence(task)` - create new task instance
  - `should_generate_next(task)` - check end_date and max_occurrences
- [x] T025 [US2] Extend TaskService.complete_task() in `phase-3-todo-ai-chatbot/backend/src/services/task_service.py`:
  - Call RecurringService.generate_next_occurrence if is_recurring
  - Return both completed task and new instance
- [x] T026 [US2] Add POST /api/{user_id}/tasks/{task_id}/complete endpoint in `phase-3-todo-ai-chatbot/backend/src/api/v1/tasks.py`:
  - Marks task completed
  - Returns next occurrence if recurring
- [x] T027 [P] [US2] Write unit tests for RecurringService in `phase-3-todo-ai-chatbot/backend/tests/unit/test_recurring_service.py`:
  - Test daily recurrence calculation
  - Test weekly recurrence with specific days
  - Test monthly recurrence
  - Test yearly recurrence
  - Test interval > 1
  - Test end_date boundary
  - Test max_occurrences limit
- [x] T028 [P] [US2] Create RecurringSelector component in `phase-3-todo-ai-chatbot/frontend/components/tasks/recurring-selector.tsx`:
  - Toggle to enable/disable recurrence
  - Dropdown for pattern (daily/weekly/monthly/yearly)
  - Number input for interval
  - Checkboxes for weekly days (mon-sun)
  - Optional end date picker
  - Optional max occurrences input
- [x] T029 [US2] Integrate RecurringSelector into TaskForm in `phase-3-todo-ai-chatbot/frontend/components/tasks/task-form.tsx`
- [x] T030 [US2] Extend frontend task types in `phase-3-todo-ai-chatbot/frontend/types/task.ts` with recurrence fields
- [x] T031 [US2] Update createTask action in `phase-3-todo-ai-chatbot/frontend/actions/tasks.ts` to include recurrence fields
- [x] T032 [P] [US2] Add recurring indicator icon to TaskItem in `phase-3-todo-ai-chatbot/frontend/components/tasks/task-item.tsx`
- [x] T033 [P] [US2] Add recurring indicator to calendar events (repeat icon overlay)
- [x] T034 [US2] Update completeTask action to use new /complete endpoint and handle next occurrence

**Checkpoint**: Recurring tasks can be created and automatically generate next occurrence on completion

---

## Phase 5: User Story 3 - Managing Recurring Task Series (Priority: P3)

**Goal**: Edit/delete/skip recurring task series

**Independent Test**: Edit a recurring task with "all future instances", verify changes apply to series

### Implementation for User Story 3

- [x] T035 [US3] Add `skip_occurrence(task)` method to RecurringService in `phase-3-todo-ai-chatbot/backend/src/services/recurring_service.py`:
  - Mark current task as skipped
  - Generate next occurrence
- [x] T036 [US3] Add `stop_recurrence(task)` method to RecurringService:
  - Set flag to stop future generation
  - Preserve task and history
- [x] T037 [US3] Add POST /api/{user_id}/tasks/{task_id}/skip endpoint in `phase-3-todo-ai-chatbot/backend/src/api/v1/tasks.py`
- [x] T038 [US3] Add POST /api/{user_id}/tasks/{task_id}/stop-recurrence endpoint
- [x] T039 [US3] Add `update_series` query param to PATCH /api/{user_id}/tasks/{task_id}:
  - If true, update all future instances
  - If false (default), update only this instance
- [ ] T040 [P] [US3] Write integration tests for recurring workflows in `phase-3-todo-ai-chatbot/backend/tests/integration/test_recurring_tasks.py`:
  - Test skip occurrence flow
  - Test stop recurrence flow
  - Test edit series vs edit instance
- [x] T041 [US3] Create EditRecurringDialog component in `phase-3-todo-ai-chatbot/frontend/components/tasks/edit-recurring-dialog.tsx`:
  - "Edit only this instance" option
  - "Edit all future instances" option
- [x] T042 [US3] Add "Skip" action to recurring task context menu in TaskItem
- [x] T043 [US3] Add "Stop Recurrence" action to recurring task context menu
- [x] T044 [US3] Update updateTask action to support update_series parameter

**Checkpoint**: Full recurring task series management - edit, skip, stop

---

## Phase 6: User Story 4 - AI Chatbot Integration with Recurring Tasks (Priority: P3)

**Goal**: Create and manage recurring tasks via natural language

**Independent Test**: Say "Add a recurring task to exercise every Monday", verify task created with weekly recurrence

### Implementation for User Story 4

- [x] T045 [US4] Extend add_task MCP tool in `phase-3-todo-ai-chatbot/backend/mcp_server/tools.py`:
  - Add is_recurring parameter
  - Add recurrence_type parameter
  - Add recurrence_interval parameter
  - Add recurrence_days parameter
- [x] T046 [US4] Create list_recurring_tasks MCP tool in `phase-3-todo-ai-chatbot/backend/mcp_server/tools.py`:
  - Return all recurring patterns for user
  - Show recurrence configuration
- [x] T047 [US4] Create stop_recurrence MCP tool in `phase-3-todo-ai-chatbot/backend/mcp_server/tools.py`:
  - Accept task_id
  - Call RecurringService.stop_recurrence
- [x] T048 [US4] Add GET /api/{user_id}/tasks/recurring endpoint in `phase-3-todo-ai-chatbot/backend/src/api/v1/tasks.py`:
  - List only recurring patterns (is_recurring=true, parent_task_id=null)
- [x] T049 [US4] Update agent system prompt to handle recurring task parsing patterns:
  - "every day" → daily
  - "every Monday" → weekly, days=mon
  - "every week" → weekly
  - "every month" → monthly
  - "every 2 weeks" → weekly, interval=2
- [ ] T050 [P] [US4] Write MCP tool tests in `phase-3-todo-ai-chatbot/backend/tests/unit/test_mcp_tools_recurring.py`

**Checkpoint**: AI chatbot can create, list, and stop recurring tasks

---

## Phase 7: User Story 5 - Enhanced Analytics Dashboard (Priority: P4)

**Goal**: Completion heatmap, date filters, recurring task statistics

**Independent Test**: View analytics dashboard, see completion heatmap and date range filter

### Implementation for User Story 5

- [x] T051 [P] [US5] Create CompletionHeatmap component in `phase-3-todo-ai-chatbot/frontend/components/dashboard/completion-heatmap.tsx`:
  - GitHub-style activity heatmap using Recharts ScatterChart
  - Show completion count per day with color intensity
  - Display 12 months of data
- [x] T052 [P] [US5] Create AnalyticsDateFilter component in `phase-3-todo-ai-chatbot/frontend/components/dashboard/analytics-date-filter.tsx`:
  - Preset ranges: This Week, Last 7 Days, This Month, Last 30 Days, This Quarter, Last 90 Days, This Year
  - Custom date range picker
- [x] T053 [US5] Extend analytics.ts in `phase-3-todo-ai-chatbot/frontend/lib/analytics.ts`:
  - `calculateHeatmapData(tasks, year)` - aggregate completions by day
  - `getRecurringTaskStats(tasks)` - completion rate, streak
  - `filterByDateRange(tasks, startDate, endDate)` - filter function
  - `getAverageCompletionTime(tasks)` - time from creation to completion
- [x] T054 [P] [US5] Create RecurringStatsCard component in `phase-3-todo-ai-chatbot/frontend/components/dashboard/recurring-stats-card.tsx`:
  - Total recurring patterns count
  - Active patterns count
  - Completion rate
  - Current streak
- [x] T055 [P] [US5] Create TagStatsCard component in `phase-3-todo-ai-chatbot/frontend/components/dashboard/tag-stats-card.tsx`:
  - Most used tags
  - Completion rate per tag
- [x] T056 [US5] Add GET /api/{user_id}/analytics endpoint in `phase-3-todo-ai-chatbot/backend/src/api/v1/tasks.py`:
  - Accept start_date, end_date, include_heatmap params
  - Return completion stats, heatmap data, priority distribution
- [x] T057 [US5] Create AnalyticsService in `phase-3-todo-ai-chatbot/backend/src/services/analytics_service.py`:
  - `get_completion_stats(user_id, date_range)`
  - `get_heatmap_data(user_id, year)`
  - `get_recurring_stats(user_id)`
- [x] T058 [US5] Integrate new analytics components into dashboard home in `phase-3-todo-ai-chatbot/frontend/components/dashboard/dashboard-home-enhanced.tsx`
- [x] T059 [US5] Add date range filter to all analytics visualizations

**Checkpoint**: Enhanced analytics with heatmap, date filters, recurring stats

---

## Phase 8: User Story 6 - Calendar-Analytics Integration (Priority: P5)

**Goal**: Workload indicators on calendar days

**Independent Test**: View month calendar, see color-coded workload intensity on days

### Implementation for User Story 6

- [x] T060 [US6] Add workload intensity calculation to calendar day cells:
  - Count tasks per day
  - Light (1-2), Medium (3-4), Heavy (5+)
  - Apply background color gradient
- [x] T061 [US6] Create CalendarDayCell component in `phase-3-todo-ai-chatbot/frontend/components/calendar/calendar-day-cell.tsx`:
  - Custom day rendering for react-big-calendar
  - Show workload indicator
  - NOTE: Implemented as CalendarWorkloadHeader, CalendarMiniHeatmap, DayWorkloadIndicator components
- [x] T062 [US6] Show "busy days" hint when creating new task with date picker

**Checkpoint**: Calendar shows workload distribution for planning

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final integration, testing, and cleanup

- [x] T063 [P] Verify all frontend components have proper TypeScript types
- [x] T064 [P] Add loading skeletons for calendar and analytics components
- [x] T065 [P] Ensure mobile responsiveness for calendar (touch-friendly view switching)
- [x] T066 [P] Add error boundaries around calendar and analytics sections
- [x] T067 Run full test suite: backend (`uv run pytest`) and frontend (`npm test`)
- [ ] T068 Validate quickstart.md setup instructions work end-to-end
- [ ] T069 Update CLAUDE.md with new Phase 4 commands and structure
- [ ] T070 Manual QA: Test all acceptance scenarios from spec.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 - BLOCKS US2-US6
- **Phase 3 (US1 Calendar)**: Depends on Phase 1 only - can run in PARALLEL with Phase 2
- **Phase 4 (US2 Recurring)**: Depends on Phase 2 completion
- **Phase 5 (US3 Series Mgmt)**: Depends on Phase 4 completion
- **Phase 6 (US4 AI)**: Depends on Phase 4 completion (can parallel with Phase 5)
- **Phase 7 (US5 Analytics)**: Depends on Phase 2 completion (can parallel with US2-US4)
- **Phase 8 (US6 Cal-Analytics)**: Depends on Phase 3 and Phase 7
- **Phase 9 (Polish)**: Depends on all user stories

### Parallel Execution Opportunities

```
Phase 1 ──┬──> Phase 2 ──┬──> Phase 4 ──┬──> Phase 5
          │              │              │
          │              │              └──> Phase 6 (parallel)
          │              │
          │              └──> Phase 7 (parallel with US2-US4)
          │
          └──> Phase 3 (Calendar - NO backend dependency!)
                    │
                    └──────────────────────> Phase 8 (after Phase 7)

Phase 9 (after all stories)
```

### Key Insight: Calendar View is Frontend-Only!

US1 (Calendar View) requires NO backend changes:
- Uses existing GET /tasks endpoint
- Uses existing PATCH /tasks/{id} for drag-drop
- Can be implemented immediately after setup
- Delivers immediate value while recurring task backend is built

---

## Implementation Strategy

### Recommended Order (Solo Developer)

1. Phase 1: Setup (30 min)
2. Phase 3: Calendar View - P1 (delivers immediate value!)
3. Phase 2: Foundational DB changes
4. Phase 4: Recurring Tasks Backend + Frontend - P2
5. Phase 5: Series Management - P3
6. Phase 6: AI Integration - P3
7. Phase 7: Analytics Enhancements - P4
8. Phase 8: Calendar-Analytics - P5
9. Phase 9: Polish

### MVP Delivery Points

- **MVP 1**: After Phase 3 - Calendar View working!
- **MVP 2**: After Phase 4 - Basic recurring tasks working!
- **MVP 3**: After Phase 7 - Enhanced analytics working!

---

## Notes

- [P] tasks can run in parallel (different files)
- Calendar View (US1) is frontend-only - fastest win
- Recurring tasks generate on-demand, not pre-generated
- All recurrence logic in dedicated RecurringService
- Analytics extend existing Recharts (no new deps except react-big-calendar)
