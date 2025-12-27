---
id: "0005"
title: "Implement Task Sorting Phase 6 and 7"
stage: green
date: 2025-12-15
surface: agent
model: claude-sonnet-4-5-20250929
feature: 004-intermediate-features
branch: 004-intermediate-features
user: uneezaismail
command: /sp.implement
labels: ["sorting", "backend", "frontend", "sqlmodel", "phase-6", "phase-7", "task-management"]
links:
  spec: specs/004-intermediate-features/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - backend/src/schemas/common.py
  - backend/src/services/task_service.py
  - backend/src/api/v1/tasks.py
  - frontend/types/task.ts
  - frontend/actions/tasks.ts
  - frontend/components/tasks/task-sort.tsx
  - frontend/components/tasks/task-list.tsx
  - frontend/app/dashboard/page.tsx
  - frontend/app/dashboard/dashboard-client.tsx
  - frontend/components/ui/dropdown-menu.tsx
tests:
  - none (build verification only)
---

## Prompt

/sp.implement implement the phase 6 and 7

User requested implementation of Phase 6 (User Story 4 - Sort Tasks) and Phase 7 (Polish) from the 004-intermediate-features specification. The implementation involved adding sorting functionality to both the FastAPI backend and Next.js 16 frontend, with proper schema alignment between both layers.

Additional context:
- User instructed to use MCP server for SQLModel documentation
- Prior fix applied for PriorityType enum serialization issue (enum names changed from HIGH/MEDIUM/LOW to High/Medium/Low to match database CHECK constraint values)

## Response snapshot

Implemented complete task sorting functionality across the full stack:

**Backend (T076-T082):** Added `SortBy` enum with 5 sort options (due_date_soonest, created_newest, created_oldest, priority_high_low, alphabetical_az). Updated TaskService.get_user_tasks() with SQLModel/SQLAlchemy sorting logic including `nulls_last()` for due dates and `case()` for custom priority ordering. Added `sort_by` query parameter to the GET tasks endpoint.

**Frontend (T083-T089):** Created TaskSort dropdown component using shadcn/ui DropdownMenu. Added `TaskSortBy` type matching backend enum. Integrated sort state into URL parameters via dashboard client. Updated TaskList and fetchTasks to pass sort_by to API.

**Verification:** Frontend build successful (Next.js 16.0.9), backend imports verified, schema alignment confirmed between TypeScript types and Python Pydantic models.

## Outcome

- ✅ Impact: Complete sorting feature implemented - users can now sort tasks by due date, creation date, priority, or alphabetically with URL-persisted state
- 🧪 Tests: Build verification passed; no unit tests added in this session
- 📁 Files: 10 files modified/created across backend and frontend
- 🔁 Next prompts: Add unit tests for sorting logic; implement pagination UI; add sort persistence to user preferences
- 🧠 Reflection: Using SQLAlchemy's `case()` for custom priority ordering and `nulls_last()` for optional due dates provides clean database-level sorting without application-side filtering

## Evaluation notes (flywheel)

- Failure modes observed: Initial PriorityType enum mismatch (enum names vs values) caused database CHECK constraint violations - fixed by aligning enum member names with string values
- Graders run and results (PASS/FAIL): PASS - Frontend build successful, backend imports verified
- Prompt variant (if applicable): Standard /sp.implement with MCP documentation lookup
- Next experiment (smallest change to try): Add automated schema alignment tests to catch frontend/backend type mismatches early
