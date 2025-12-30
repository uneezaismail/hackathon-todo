# Quickstart: Calendar View, Recurring Tasks & Analytics

**Feature**: 007-calendar-recurring-analytics
**Date**: 2025-12-27

## Prerequisites

- Phase 3 Todo application running (frontend + backend)
- Node.js 20+, Python 3.13+, UV package manager
- Neon PostgreSQL database configured

## Quick Setup

### 1. Install New Dependencies

```bash
# Frontend - add react-big-calendar
cd phase-3-todo-ai-chatbot/frontend
npm install react-big-calendar @types/react-big-calendar

# Backend - no new dependencies needed
```

### 2. Run Database Migration

```bash
cd phase-3-todo-ai-chatbot/backend

# Create migration
uv run alembic revision --autogenerate -m "add_recurrence_fields"

# Apply migration
uv run alembic upgrade head
```

### 3. Start Development Servers

```bash
# Terminal 1: Backend
cd phase-3-todo-ai-chatbot/backend
uv run uvicorn src.main:app --reload --port 8000

# Terminal 2: Frontend
cd phase-3-todo-ai-chatbot/frontend
npm run dev
```

### 4. Verify Features

| Feature | URL | Test |
|---------|-----|------|
| Calendar View | http://localhost:3000/dashboard/calendar | See tasks on calendar |
| Recurring Task | http://localhost:3000/dashboard/tasks | Create task with "Repeat" option |
| Analytics | http://localhost:3000/dashboard | View heatmap and date filters |

## Feature-Specific Commands

### Calendar View

```bash
# No special commands - uses existing tasks with due_date
```

### Recurring Tasks

```bash
# Create recurring task via API
curl -X POST http://localhost:8000/api/{user_id}/tasks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Weekly Review",
    "priority": "High",
    "due_date": "2025-01-06",
    "is_recurring": true,
    "recurrence_type": "weekly",
    "recurrence_days": "mon"
  }'

# List recurring patterns
curl http://localhost:8000/api/{user_id}/tasks/recurring \
  -H "Authorization: Bearer <token>"

# Stop recurrence
curl -X POST http://localhost:8000/api/{user_id}/tasks/{task_id}/stop-recurrence \
  -H "Authorization: Bearer <token>"
```

### AI Chatbot Commands

```
"Add a recurring task to exercise every Monday"
"Show my recurring tasks"
"Stop the recurring exercise task"
```

## Testing

```bash
# Backend tests
cd phase-3-todo-ai-chatbot/backend
uv run pytest tests/unit/test_recurring_service.py -v
uv run pytest tests/integration/test_recurring_tasks.py -v

# Frontend tests
cd phase-3-todo-ai-chatbot/frontend
npm test -- --testPathPattern=calendar
```

## Configuration

No new environment variables required. Uses existing:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection |
| `BETTER_AUTH_SECRET` | JWT authentication |
| `NEXT_PUBLIC_API_URL` | Backend URL |

## Troubleshooting

### Calendar not showing tasks

1. Verify tasks have `due_date` set
2. Check browser console for errors
3. Ensure user is authenticated

### Recurring task not generating next occurrence

1. Check `is_recurring` is `true` on the task
2. Verify `recurrence_end_date` hasn't passed
3. Check `max_occurrences` hasn't been reached
4. Review backend logs for errors

### Analytics not loading

1. Clear browser cache
2. Check API response in Network tab
3. Verify date range filter is valid

## Key Files

### Backend

| File | Purpose |
|------|---------|
| `src/models/task.py` | Extended Task model with recurrence fields |
| `src/services/recurring_service.py` | Recurrence logic |
| `src/services/task_service.py` | Extended for recurring task handling |
| `alembic/versions/*_add_recurrence_fields.py` | Database migration |
| `mcp_server/tools.py` | Extended MCP tools |

### Frontend

| File | Purpose |
|------|---------|
| `app/dashboard/calendar/page.tsx` | Calendar route |
| `components/calendar/task-calendar.tsx` | Main calendar component |
| `components/tasks/recurring-selector.tsx` | Recurrence UI |
| `components/dashboard/completion-heatmap.tsx` | Heatmap visualization |
| `lib/analytics.ts` | Extended analytics functions |

## Next Steps

After setup:

1. Create a few tasks with due dates to test calendar
2. Create a recurring task and complete it to verify instance generation
3. View analytics dashboard with date range filters
4. Test AI chatbot recurring task commands
