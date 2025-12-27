# Quickstart Guide: Intermediate Level Organization Features

**Feature**: 004-intermediate-features
**Date**: 2025-12-14
**Branch**: `004-intermediate-features`

## Overview

This guide provides step-by-step instructions for setting up and implementing the intermediate level organization features (priorities, tags, due dates, search, filter, sort).

---

## Prerequisites

- Existing Phase II Todo application with:
  - Backend: FastAPI + SQLModel + Neon PostgreSQL
  - Frontend: Next.js 16 + Better Auth
  - User authentication working with JWT
- Development tools:
  - Python 3.13+ with UV
  - Node.js 18+ with npm
  - Database access to Neon PostgreSQL

---

## Setup Steps

### 1. Check Out Feature Branch

```bash
git checkout 004-intermediate-features
```

### 2. Backend Setup

#### a. Install Dependencies (if new)
```bash
cd backend
uv sync
```

#### b. Apply Database Migration
```bash
# Create migration
uv run alembic revision --autogenerate -m "Add priority, due_date, and tags support"

# Review generated migration in alembic/versions/
# Ensure it matches data-model.md schema

# Apply migration
uv run alembic upgrade head
```

#### c. Verify Migration
```bash
# Connect to database and verify schema
psql $DATABASE_URL -c "\d tasks"
psql $DATABASE_URL -c "\d tags"
psql $DATABASE_URL -c "\d task_tags"
```

Expected output:
- `tasks` table has `priority` and `due_date` columns
- `tags` table exists with `id`, `user_id`, `name`, `created_at`
- `task_tags` junction table exists

#### d. Run Backend Tests
```bash
uv run pytest
```

### 3. Frontend Setup

#### a. Install Dependencies
```bash
cd ../frontend
npm install
```

#### b. Add Shadcn UI Calendar Component
```bash
npx shadcn@latest add calendar
```

This installs:
- `components/ui/calendar.tsx`
- `react-day-picker` dependency
- `date-fns` dependency

#### c. Run Frontend Dev Server
```bash
npm run dev
```

Navigate to http://localhost:3000/dashboard

---

## Development Workflow

### Phase 1: Database Layer (Backend)

1. **Models**:
   - Modify `backend/src/models/task.py` - Add priority, due_date fields
   - Create `backend/src/models/tag.py` - New Tag and TaskTag models

2. **Schemas**:
   - Update `backend/src/schemas/task.py` - Add new fields to Create/Update/Response

3. **Services**:
   - Update `backend/src/services/task_service.py` - Add filter/sort logic
   - Create `backend/src/services/tag_service.py` - Tag CRUD and autocomplete

4. **Tests**:
   - Update `backend/tests/test_task_service.py` - Test new functionality
   - Create `backend/tests/test_tag_service.py` - Tag-specific tests

### Phase 2: API Layer (Backend)

1. **Endpoints**:
   - Modify `backend/src/api/v1/tasks.py` - Add query params for filter/sort
   - Add new endpoint `/api/{user_id}/tags` for autocomplete

2. **Tests**:
   - Update `backend/tests/test_api_tasks.py` - Integration tests for new endpoints

### Phase 3: UI Layer (Frontend)

1. **Components** (Create New):
   - `frontend/components/tasks/priority-selector.tsx`
   - `frontend/components/tasks/tag-input.tsx`
   - `frontend/components/tasks/due-date-picker.tsx`
   - `frontend/components/tasks/task-filters.tsx`
   - `frontend/components/tasks/task-search.tsx`
   - `frontend/components/tasks/task-sort.tsx`

2. **Components** (Modify Existing):
   - `frontend/components/tasks/task-form.tsx` - Add priority, tags, due_date inputs
   - `frontend/components/tasks/task-card.tsx` - Display priority badge, tags, due_date

3. **Pages**:
   - Modify `frontend/app/dashboard/page.tsx` - Integrate search, filter, sort UI

4. **Actions**:
   - Update `frontend/actions/tasks.ts` - Add filter/sort params to API calls

5. **Types**:
   - Update `frontend/lib/types.ts` - Add Task interface with new fields

---

## Testing Checklist

### Backend

- [ ] Migration runs without errors
- [ ] Can create task with priority, tags, due_date
- [ ] Can update task priority, tags, due_date
- [ ] Can filter tasks by priority
- [ ] Can filter tasks by tags (multiple)
- [ ] Can filter tasks by status
- [ ] Can search tasks by keyword
- [ ] Can sort tasks by due_date (soonest)
- [ ] Can sort tasks by created (newest/oldest)
- [ ] Can sort tasks by priority (high to low)
- [ ] Can sort tasks alphabetically
- [ ] Tag autocomplete returns top 10 tags
- [ ] User isolation enforced (cannot access other user's tasks/tags)
- [ ] All pytest tests pass

### Frontend

- [ ] Priority selector shows High, Medium, Low options
- [ ] Priority defaults to Medium
- [ ] Priority badge displays with correct color (High=red, Medium=yellow, Low=green)
- [ ] Tag input supports autocomplete
- [ ] Tag input allows creating new tags
- [ ] Tag input displays selected tags as badges
- [ ] Calendar date picker opens on click
- [ ] Selected due date displays on task card
- [ ] Can clear due date
- [ ] Search input filters tasks in real-time
- [ ] Filter controls update task list
- [ ] Sort dropdown reorders tasks correctly
- [ ] Tasks without due dates appear last when sorting by due date
- [ ] Page refresh preserves filter/sort state (URL params)
- [ ] All TypeScript types compile without errors

### Integration

- [ ] Create task with priority, tags, due_date via UI → appears in database
- [ ] Update task priority → reflects in UI immediately
- [ ] Add tag to task → tag appears in autocomplete for next task
- [ ] Filter by tag → shows only matching tasks
- [ ] Search keyword → highlights matching tasks
- [ ] Sort by due date → tasks with due dates appear first
- [ ] Logout and login → tasks retain priority, tags, due_date

---

## Common Issues and Solutions

### Issue: Migration Fails with "column already exists"
**Solution**: Drop the column manually or delete and recreate migration
```bash
# Option 1: Downgrade and re-run
uv run alembic downgrade -1
uv run alembic upgrade head

# Option 2: Manual column drop (if safe)
psql $DATABASE_URL -c "ALTER TABLE tasks DROP COLUMN priority;"
```

### Issue: Shadcn calendar not installing
**Solution**: Ensure you're in frontend directory and have latest shadcn CLI
```bash
cd frontend
npm install -g @shadcn/cli@latest
npx shadcn@latest add calendar
```

### Issue: Tags not showing in autocomplete
**Solution**: Check API endpoint returns data
```bash
curl -H "Authorization: Bearer $JWT_TOKEN" \
  http://localhost:8000/api/{user_id}/tags
```

### Issue: Filter/sort not working
**Solution**: Check URL search params are being set correctly
```typescript
// Frontend: Verify search params in browser DevTools
console.log(window.location.search);
// Should show: ?priority=high&tags=work&sort_by=due_date_soonest
```

---

## Performance Validation

Test with 100+ tasks:

```python
# Backend: Seed database with test data
uv run python scripts/seed_tasks.py --count 100 --user-id test_user_123

# Measure query performance
uv run python -m timeit -s "from src.services.task_service import TaskService" \
  "TaskService.get_tasks(user_id='test_user_123', priority='High')"
```

Expected: <100ms for filter/sort queries

---

## Deployment

### Backend Deployment

1. Run migration on production database:
```bash
uv run alembic upgrade head
```

2. Verify no data loss:
```bash
psql $PROD_DATABASE_URL -c "SELECT COUNT(*) FROM tasks WHERE priority IS NULL;"
# Should return 0
```

3. Deploy backend service (Docker or direct):
```bash
docker build -t todo-backend .
docker run -p 8000:8000 todo-backend
```

### Frontend Deployment

1. Build production bundle:
```bash
npm run build
```

2. Test production build locally:
```bash
npm run start
```

3. Deploy to Vercel:
```bash
vercel --prod
```

---

## Next Steps

After completing implementation:

1. Run full test suite (backend + frontend)
2. Manual UI testing with realistic data
3. Performance validation (100+ tasks)
4. Create pull request with:
   - Link to spec.md
   - Screenshot of new UI features
   - Performance metrics
5. Request code review
6. Merge to master after approval

---

## Additional Resources

- [Spec Document](./spec.md) - Feature requirements
- [Data Model](./data-model.md) - Database schema
- [API Contracts](./contracts/api-endpoints.yaml) - OpenAPI specification
- [Research Findings](./research.md) - Technical decisions

---

**Status**: Ready for implementation
**Estimated Time**: 2-3 days (database → backend → frontend)
