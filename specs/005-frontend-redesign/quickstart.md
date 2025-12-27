# Quickstart Guide: Frontend Redesign For Todo App

**Feature**: 005-frontend-redesign
**Target Audience**: Developers implementing this feature
**Estimated Setup Time**: 10-15 minutes

## Prerequisites

Before starting, ensure you have:
- ✅ Node.js 18+ and npm installed
- ✅ Python 3.13+ and `uv` installed
- ✅ Docker Desktop running (for Neon database local development)
- ✅ Git repository cloned and on branch `005-futuristic-dark-mode`
- ✅ Existing Better Auth + FastAPI infrastructure from Phase II

## Project Structure Overview

```
hackathon-todo/
├── frontend/          # Next.js 16 App Router
├── backend/           # FastAPI application
├── specs/             # Feature specifications
│   └── 005-frontend-redesign/
│       ├── spec.md           # Feature specification
│       ├── plan.md           # This implementation plan
│       ├── research.md       # Technology decisions
│       ├── data-model.md     # Database schema
│       ├── quickstart.md     # This guide
│       └── contracts/        # API contracts
└── CLAUDE.md          # Project constitution
```

## Step 1: Environment Setup

### 1.1 Frontend Environment

Navigate to `frontend/` and ensure your `.env.local` contains:

```bash
# Better Auth (existing)
BETTER_AUTH_SECRET="your-shared-secret-here"
BETTER_AUTH_URL="http://localhost:3000"
DATABASE_URL="postgresql://user:password@localhost:5432/todo_db"

# Backend API
NEXT_PUBLIC_API_URL="http://localhost:8000"
```

**Note**: `BETTER_AUTH_SECRET` MUST match the backend configuration.

### 1.2 Backend Environment

Navigate to `backend/` and ensure your `.env` contains:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/todo_db"

# Better Auth JWT Validation
BETTER_AUTH_SECRET="your-shared-secret-here"  # MUST match frontend

# CORS (allow frontend origin)
ALLOWED_ORIGINS="http://localhost:3000"
```

## Step 2: Install Dependencies

### 2.1 Frontend Dependencies

```bash
cd frontend

# Install existing dependencies
npm install

# Install new feature dependencies
npm install react-window @types/react-window
npm install framer-motion  # For smooth animations

# Install Shadcn UI components (if not already installed)
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add input
npx shadcn@latest add label
```

### 2.2 Backend Dependencies

```bash
cd backend

# Sync dependencies with uv
uv sync

# Verify FastAPI, SQLModel, and PyJWT are installed
uv pip list | grep -E "fastapi|sqlmodel|pyjwt"
```

## Step 3: Database Migration

### 3.1 Create Migration for Tasks Table

```bash
cd backend

# Generate new migration
uv run alembic revision --autogenerate -m "create_tasks_table"

# Review the generated migration in backend/alembic/versions/
# Ensure it matches the schema in data-model.md

# Run migration
uv run alembic upgrade head
```

### 3.2 Verify Database Schema

```bash
# Connect to your database (example with psql)
psql $DATABASE_URL

# Check tasks table exists
\dt tasks

# Check indexes
\di tasks*

# Expected output:
# - tasks table with columns: id, user_id, description, status, created_at, updated_at
# - idx_tasks_user_id, idx_tasks_user_status, idx_tasks_created_at indexes
```

## Step 4: Development Server Startup

### 4.1 Start Backend (Terminal 1)

```bash
cd backend
uv run uvicorn src.main:app --reload --port 8000
```

**Expected output**:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Application startup complete
```

**Verify**: Navigate to http://localhost:8000/docs to see auto-generated API documentation.

### 4.2 Start Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

**Expected output**:
```
   ▲ Next.js 16.0.0
   - Local:        http://localhost:3000
   - Ready in 2.1s
```

## Step 5: Verify Authentication Integration

### 5.1 Test JWT Flow

1. Navigate to http://localhost:3000
2. Sign up or log in via Better Auth
3. Open browser DevTools → Application → Cookies
4. Verify `better-auth-session` cookie exists
5. Copy the JWT token from the cookie value

### 5.2 Test Backend JWT Validation

```bash
# Replace <JWT_TOKEN> with actual token from browser
curl -H "Authorization: Bearer <JWT_TOKEN>" \
  http://localhost:8000/api/<your_user_id>/tasks
```

**Expected output**:
```json
[]  # Empty array (no tasks yet)
```

**If you get 401 Unauthorized**: Check that `BETTER_AUTH_SECRET` matches in both `.env` files.

## Step 6: Implementation Workflow

### 6.1 Task Breakdown

Follow the implementation order defined in `tasks.md` (created via `/sp.tasks` command):

1. **Backend Foundation**:
   - Create `Task` SQLModel in `backend/src/models/task.py`
   - Create `TaskService` in `backend/src/services/task_service.py`
   - Create API endpoints in `backend/src/api/tasks.py`
   - Write integration tests in `backend/tests/api/test_tasks.py`

2. **Frontend Components**:
   - Create reusable components in `frontend/components/landing/`, `dashboard/`, etc.
   - Create dashboard pages in `frontend/app/dashboard/`
   - Create landing page in `frontend/app/page.tsx`

3. **Testing & Refinement**:
   - Run all backend tests: `cd backend && uv run pytest`
   - Run frontend component tests: `cd frontend && npm test`
   - Run E2E tests: `cd frontend && npm run test:e2e`

### 6.2 Atomic Commits

Follow Constitution Section VII (Checkpoint Pattern):
1. Complete ONE task from `tasks.md`
2. Test the changes locally
3. Commit with descriptive message: `feat: implement task creation API endpoint`
4. Move to next task

### 6.3 Using AI Agents

Leverage specialized agents for efficiency:
- **backend-expert**: For FastAPI endpoint and service implementation
- **frontend-expert**: For Next.js components and pages
- **auth-expert**: For JWT validation logic

Example:
```bash
# From Claude Code CLI
/backend-expert "Implement task CRUD service in backend/src/services/task_service.py"
```

## Step 7: Testing Checklist

### 7.1 Backend Tests

```bash
cd backend

# Run all tests
uv run pytest

# Run specific test file
uv run pytest tests/api/test_tasks.py -v

# Check test coverage
uv run pytest --cov=src --cov-report=term-missing
```

**Expected**: All tests pass, >80% code coverage.

### 7.2 Frontend Tests

```bash
cd frontend

# Run component tests
npm test

# Run E2E tests
npm run test:e2e

# Type checking
npm run type-check
```

**Expected**: All tests pass, no TypeScript errors.

### 7.3 Manual Testing

**Dashboard Statistics**:
1. Create 3 tasks
2. Mark 2 as completed
3. Verify dashboard shows: Total=3, Completed=2, Pending=1

**Task Filtering**:
1. Create mix of pending/completed tasks
2. Test "All", "Active", "Completed" filters
3. Verify correct tasks display for each filter

**Virtual Scrolling**:
1. Create 100+ tasks (use seed script if needed)
2. Scroll through task list
3. Verify smooth 60fps performance

**Modal Confirmations**:
1. Click "Edit" on a task → Modal opens
2. Modify description, click "Cancel" → Changes discarded
3. Modify description, click "Save" → Changes persist
4. Click "Delete" on a task → Confirmation modal appears
5. Click "Cancel" → Task remains
6. Click "Delete" → Task deleted

**Responsive Design**:
1. Resize browser from 320px to 1920px
2. Verify layout adapts at all breakpoints
3. Test on actual mobile device if available

## Step 8: Troubleshooting

### Common Issues

**Issue**: Backend returns 401 Unauthorized
- **Solution**: Verify `BETTER_AUTH_SECRET` matches in frontend and backend `.env`

**Issue**: Tasks don't appear after creation
- **Solution**: Check browser console for CORS errors. Ensure backend `ALLOWED_ORIGINS` includes frontend URL.

**Issue**: Glassmorphism effects not visible
- **Solution**: Check browser supports `backdrop-filter`. Test in Chrome/Firefox/Safari (not IE11).

**Issue**: Virtual scrolling performance issues
- **Solution**: Verify `react-window` is installed. Check browser DevTools Performance tab for bottlenecks.

**Issue**: Database migration fails
- **Solution**: Check existing schema. Drop and recreate `tasks` table if testing:
  ```sql
  DROP TABLE IF EXISTS tasks CASCADE;
  ```
  Then re-run `alembic upgrade head`.

## Step 9: Deployment Preparation

### 9.1 Environment Variables

**Frontend (Vercel)**:
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL` (production URL)
- `DATABASE_URL` (Neon connection string)
- `NEXT_PUBLIC_API_URL` (production backend URL)

**Backend (Railway/Render/Fly.io)**:
- `DATABASE_URL` (Neon connection string)
- `BETTER_AUTH_SECRET` (same as frontend)
- `ALLOWED_ORIGINS` (production frontend URL)

### 9.2 Build Commands

**Frontend**:
```bash
npm run build
npm run start  # Or deploy to Vercel
```

**Backend**:
```bash
uv sync --frozen
uv run alembic upgrade head
uv run uvicorn src.main:app --host 0.0.0.0 --port 8000
```

## Step 10: Documentation

After completing implementation:
1. ✅ Update `README.md` with feature description
2. ✅ Create ADRs for key decisions (virtual scrolling, glassmorphism, scroll nav)
3. ✅ Generate PHR for implementation phase
4. ✅ Update API documentation in `/docs` (if exists)

## Resources

- **Feature Spec**: `specs/005-frontend-redesign/spec.md`
- **Implementation Plan**: `specs/005-frontend-redesign/plan.md`
- **Data Model**: `specs/005-frontend-redesign/data-model.md`
- **API Contract**: `specs/005-frontend-redesign/contracts/task-api.openapi.yaml`
- **Next.js Docs**: https://nextjs.org/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **SQLModel Docs**: https://sqlmodel.tiangolo.com/
- **Shadcn UI**: https://ui.shadcn.com/
- **react-window**: https://react-window.vercel.app/

## Getting Help

If you encounter issues:
1. Check troubleshooting section above
2. Review existing Phase II implementation for patterns
3. Consult CLAUDE.md for project constitution
4. Ask in project Slack/Discord channel (if applicable)

---

**Quickstart Status**: ✅ COMPLETE
**Next Step**: Run `/sp.tasks` to generate implementation task list