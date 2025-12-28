# Implementation Plan: Calendar View, Recurring Tasks & Analytics

**Branch**: `007-calendar-recurring-analytics` | **Date**: 2025-12-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-calendar-recurring-analytics/spec.md`

## Summary

This plan implements three interconnected productivity features for the Todo application:

1. **Calendar View (P1)** - Frontend-only feature using react-big-calendar to display tasks by due date with day/week/month views, drag-and-drop rescheduling, and priority color-coding
2. **Recurring Tasks (P2)** - Backend schema extension + frontend UI for creating tasks that repeat on schedules (daily, weekly, monthly, yearly) with on-demand instance generation
3. **Analytics Enhancements (P4)** - Extend existing Recharts-based analytics with completion heatmap, date range filters, and recurring task statistics

Technical approach: Extend existing Task model with recurrence fields (pattern storage, not pre-generation), add calendar route with react-big-calendar, enhance analytics with new Recharts components.

## Technical Context

**Language/Version**: Python 3.13+ (Backend), TypeScript 5.x (Frontend)
**Primary Dependencies**:
- Backend: FastAPI, SQLModel, Alembic, Pydantic
- Frontend: Next.js 16 (App Router), Tailwind CSS, Shadcn UI, react-big-calendar, Recharts
**Storage**: Neon Serverless PostgreSQL (existing tasks table extended)
**Testing**: pytest (Backend), Vitest (Frontend)
**Target Platform**: Web (Desktop + Mobile responsive)
**Project Type**: Web application (fullstack monorepo)
**Performance Goals**:
- Calendar loads within 2 seconds
- 100 tasks/month without degradation
- Analytics dashboard loads within 3 seconds
**Constraints**:
- Free/open-source libraries only
- No paid external services
- Maintain existing user isolation patterns
**Scale/Scope**: Single user application, ~1000 tasks per user

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Spec-First Development | ✅ PASS | spec.md created with 32 requirements before implementation |
| II. No Manual Code | ✅ PASS | All code will be generated via Claude Code |
| III. Reusable Intelligence | ✅ PASS | PHR will capture this planning session |
| IV. Evolutionary Architecture | ✅ PASS | Extends existing Task model, uses existing services |
| V. Single Responsibility | ✅ PASS | Calendar, Recurring, Analytics are separate modules |
| VI. User Experience First | ✅ PASS | Consistent vocabulary, graceful error handling |
| VII. Checkpoint Pattern | ✅ PASS | Will follow atomic task commits |
| VIII. Automated Testing | ✅ PASS | Backend/Frontend tests included in plan |
| IX. Strict Type Safety | ✅ PASS | Python type hints, TypeScript strict mode |
| X. Strict Error Handling | ✅ PASS | User-friendly errors, no silent failures |
| XI. 12-Factor Config | ✅ PASS | No new secrets required |
| XII. AI Sub-Agents | ✅ PASS | Using spec-kit workflow |
| XIII. Conversational AI | ✅ PASS | Extends existing MCP tools for recurring tasks |
| XIV. Stateless Service | ✅ PASS | No in-memory state, database-backed |
| XV. MCP Tool Design | ✅ PASS | New tools follow existing patterns |
| XVI. AI Safety | ✅ PASS | User isolation enforced in new tools |
| XVII. Conversation Mgmt | ✅ PASS | Uses existing conversation infrastructure |

**Gate Status**: ✅ ALL PASS - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/007-calendar-recurring-analytics/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api-endpoints.yaml
└── tasks.md             # Phase 2 output (created by /sp.tasks)
```

### Source Code (repository root)

```text
phase-3-todo-ai-chatbot/
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   └── task.py          # Extended with recurrence fields
│   │   ├── services/
│   │   │   ├── task_service.py  # Extended for recurring logic
│   │   │   └── recurring_service.py  # NEW: Recurrence generation
│   │   ├── api/v1/
│   │   │   └── tasks.py         # Extended endpoints
│   │   └── schemas/
│   │       └── task.py          # Extended schemas
│   ├── mcp_server/
│   │   └── tools.py             # Extended MCP tools
│   ├── alembic/versions/
│   │   └── xxx_add_recurrence_fields.py  # NEW migration
│   └── tests/
│       ├── unit/
│       │   └── test_recurring_service.py
│       └── integration/
│           └── test_recurring_tasks.py
│
└── frontend/
    ├── app/
    │   └── dashboard/
    │       └── calendar/
    │           └── page.tsx     # NEW: Calendar route
    ├── components/
    │   ├── calendar/            # NEW: Calendar components
    │   │   ├── task-calendar.tsx
    │   │   ├── calendar-event.tsx
    │   │   └── calendar-toolbar.tsx
    │   ├── tasks/
    │   │   ├── recurring-selector.tsx  # NEW
    │   │   └── task-form.tsx    # Extended
    │   └── dashboard/
    │       ├── completion-heatmap.tsx  # NEW
    │       └── analytics-filters.tsx   # NEW
    ├── lib/
    │   └── analytics.ts         # Extended
    └── __tests__/
        └── components/
            └── calendar.test.tsx
```

**Structure Decision**: Extends existing Phase 3 web application structure. Calendar is a new route under dashboard. Recurring task logic added to backend services. Analytics components added to existing dashboard folder.

## Implementation Phases

### Phase 1: Calendar View (Frontend Only) - P1

**Goal**: Display existing tasks on interactive calendar

**Tasks**:
1. Install react-big-calendar and date-fns
2. Create `/dashboard/calendar` route
3. Create TaskCalendar component with day/week/month views
4. Implement task click → details modal
5. Implement drag-and-drop → update due date
6. Implement click date → create task with pre-filled date
7. Add priority color-coding
8. Add "Unscheduled" sidebar for tasks without due dates
9. Persist user's preferred view in localStorage
10. Add calendar link to sidebar navigation

**No backend changes required** - uses existing GET /tasks endpoint

### Phase 2: Recurring Tasks - Backend (P2)

**Goal**: Extend Task model and services for recurrence

**Tasks**:
1. Create Alembic migration for new Task fields:
   - `is_recurring: bool`
   - `recurrence_type: str` (daily/weekly/monthly/yearly)
   - `recurrence_interval: int`
   - `recurrence_days: str` (comma-separated for weekly)
   - `recurrence_end_date: date | null`
   - `max_occurrences: int | null`
   - `parent_task_id: uuid | null`
   - `occurrence_count: int`
2. Extend TaskCreate/TaskUpdate schemas
3. Create RecurringService with methods:
   - `generate_next_occurrence(task)`
   - `skip_occurrence(task)`
   - `stop_recurrence(task)`
   - `calculate_next_due_date(task)`
4. Extend TaskService to call RecurringService on completion
5. Add endpoint: GET /api/{user_id}/tasks/recurring (list patterns)
6. Write unit tests for RecurringService
7. Write integration tests for recurring workflows

### Phase 3: Recurring Tasks - Frontend (P2)

**Goal**: UI for creating and managing recurring tasks

**Tasks**:
1. Create RecurringSelector component:
   - Enable/disable toggle
   - Pattern dropdown (daily/weekly/monthly/yearly)
   - Interval input
   - Weekly day checkboxes
   - End date picker (optional)
   - Max occurrences input (optional)
2. Integrate RecurringSelector into TaskForm
3. Add recurring indicator icon to TaskItem
4. Add recurring indicator to calendar events
5. Create "Edit Series" vs "Edit Instance" dialog
6. Create "Skip" action for recurring tasks
7. Add recurring tasks filter to task list
8. Write component tests

### Phase 4: AI Chatbot Integration (P3)

**Goal**: Natural language recurring task commands

**Tasks**:
1. Extend MCP tools:
   - Modify `add_task` to accept recurrence parameters
   - Add `list_recurring_tasks` tool
   - Add `stop_recurrence` tool
2. Update agent system prompt for recurring task parsing
3. Add recurrence pattern parsing (e.g., "every Monday" → weekly, days=["mon"])
4. Write MCP tool tests
5. Test natural language commands

### Phase 5: Analytics Enhancements (P4)

**Goal**: Enhanced productivity visualizations

**Tasks**:
1. Create CompletionHeatmap component (GitHub-style)
2. Create AnalyticsDateFilter component (week/month/quarter/custom)
3. Extend analytics.ts with:
   - `calculateHeatmapData(tasks, year)`
   - `getRecurringTaskStats(tasks)`
   - `filterByDateRange(tasks, range)`
4. Add recurring task completion rate card
5. Add average completion time by priority chart
6. Add tag usage statistics
7. Integrate date range filter across all analytics
8. Write component tests

### Phase 6: Calendar-Analytics Integration (P5)

**Goal**: Workload indicators on calendar

**Tasks**:
1. Add workload intensity to calendar day cells
2. Color-code days by task count (light → heavy)
3. Show busy/available indicator when creating tasks

## Complexity Tracking

> No violations requiring justification

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| react-big-calendar learning curve | Use simple default config first, enhance iteratively |
| Recurring task edge cases | Comprehensive test coverage, on-demand generation (not pre-generate) |
| Calendar performance with many tasks | Limit visible range, pagination for large datasets |
| Timezone handling | Store UTC, convert in frontend with date-fns-tz |

## Dependencies

| Dependency | Version | Purpose | License |
|------------|---------|---------|---------|
| react-big-calendar | ^1.x | Calendar component | MIT |
| date-fns | ^3.x | Date manipulation (already installed) | MIT |
| Recharts | ^2.x | Charts (already installed) | MIT |

## Success Metrics

From spec.md SC-001 to SC-011:
- Calendar interaction < 2 seconds
- Recurring task creation < 30 seconds
- View switching < 1 second
- 100 tasks/month without degradation
- Analytics load < 3 seconds
