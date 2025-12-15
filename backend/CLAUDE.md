# Backend Guidelines (FastAPI)

## Overview
Python FastAPI service implementing the core business logic and data management for Tasks.
It is stateless and relies on JWT tokens signed by the Frontend for authentication.

## Tech Stack
- **Framework:** FastAPI
- **Language:** Python 3.13+
- **ORM:** SQLModel (SQLAlchemy + Pydantic)
- **Database:** Neon Serverless PostgreSQL (`asyncpg`)
- **Package Manager:** UV (fast pip replacement)
- **Migrations:** Alembic

## Architecture
- **Data Source:** Owns the `tasks`, `tags`, and `task_tags` tables in Neon.
- **Auth:** Stateless. Verifies JWT signature using `BETTER_AUTH_SECRET`.
- **User Isolation:** EVERY endpoint validates `url_user_id == jwt_user_id` to prevent unauthorized access.
- **Features:** Tasks with priority (High/Medium/Low), due dates, tags, search, filtering, and sorting.

## Key Patterns
### 1. User Isolation (CRITICAL)
```python
def verify_user_access(user_id: str, current_user_id: str):
    if user_id != current_user_id:
        raise HTTPException(403, "Forbidden")
```
**Every endpoint** must call this to prevent users from accessing other users' data.
- `user_id` comes from URL path parameter
- `current_user_id` comes from JWT token
- Both must match exactly

### 2. Database Session
- Use Dependency Injection: `session: Session = Depends(get_session)`.
- Use `select(Task).where(...)` for queries.
- Always filter by `user_id` to enforce data isolation.

### 3. Pydantic Schemas
- `TaskCreate`: Input validation for creating tasks.
- `TaskUpdate`: Input validation for updating tasks (partial updates).
- `TaskResponse`: Output serialization (includes all task fields).
- Common schemas: `PaginationParams`, `ApiResponse`, `TaskStatus`, `SortBy`, `SortOrder`.

### 4. Service Layer
- `TaskService`: Business logic for task operations (CRUD, search, filter, sort).
- `TagService`: Business logic for tag operations.
- Services keep controllers clean and testable.

## Commands
```bash
# Setup
uv sync              # Install dependencies (creates .venv)

# Development
uv run uvicorn src.main:app --reload --port 8000  # Start dev server

# Database Migrations
uv run alembic revision --autogenerate -m "msg"   # Create migration
uv run alembic upgrade head                       # Apply migration
uv run alembic downgrade -1                       # Rollback one migration
uv run alembic history                            # View migration history

# Testing
uv run pytest                    # Run all tests
uv run pytest -v                 # Verbose output
uv run pytest tests/test_auth.py # Run specific test file

# Docker
docker build -t todo-backend .               # Build Docker image
docker run -p 8000:8000 todo-backend         # Run container
```

## Environment Variables

### Development (.env)
- `DATABASE_URL`: Connection string for Neon (`postgresql+asyncpg://user:pass@host/db`)
- `BETTER_AUTH_SECRET`: **CRITICAL**. Must match Frontend.
- `CORS_ORIGINS`: `http://localhost:3000` (comma-separated for multiple origins)

### Docker/Production
- Same variables as development
- Ensure `DATABASE_URL` uses cloud Neon URL (not localhost)
- For docker-compose, backend should accept requests from frontend service name

## Docker Setup
The backend uses a multi-stage Dockerfile optimized for UV:
1. **builder stage**: Installs dependencies using UV (fast)
2. **runtime stage**: Minimal production image with only runtime dependencies

**Important:**
- The `.dockerignore` excludes .venv, tests, and other unnecessary files
- `README.md` is included (required for `uv sync`)
- Migrations run automatically on container start: `alembic upgrade head && uvicorn ...`

## API Endpoints
All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

### Task Endpoints
**Format:** `/api/{user_id}/tasks`

- `POST /api/{user_id}/tasks` - Create new task
  - Body: `{ "title": "string", "description": "string", "priority": "High|Medium|Low", "due_date": "YYYY-MM-DD", "tags": ["tag1"] }`

- `GET /api/{user_id}/tasks` - List user's tasks with filtering, search, and sorting
  - Query params:
    - `search` (string): Search in title/description
    - `status` (string): `all`, `pending`, `completed`
    - `priority` (string): `all`, `High`, `Medium`, `Low`
    - `tags` (array): Filter by tags
    - `sort_by` (string): `created_at`, `updated_at`, `title`, `due_date`, `priority`
    - `sort_direction` (string): `asc`, `desc`
    - `limit` (int): Pagination limit (default: 50)
    - `offset` (int): Pagination offset (default: 0)

- `GET /api/{user_id}/tasks/{task_id}` - Get single task by ID

- `PATCH /api/{user_id}/tasks/{task_id}` - Update task (partial update)
  - Body: Any combination of task fields to update

- `DELETE /api/{user_id}/tasks/{task_id}` - Delete task

### Tag Endpoints
- `GET /api/{user_id}/tags` - Get all unique tags with usage count for the user

### Health Check
- `GET /api/health` - Health check endpoint (no auth required)

## Authentication Flow
1. Frontend sends JWT in `Authorization: Bearer <token>` header
2. Backend extracts JWT and validates signature using `BETTER_AUTH_SECRET`
3. Backend extracts `user_id` from JWT payload
4. Backend compares JWT `user_id` with URL path `{user_id}` parameter
5. If they don't match → 403 Forbidden
6. If they match → proceed with request and filter data by `user_id`

## Security
- **User Isolation:** Every endpoint must validate `url_user_id == jwt_user_id`
- **JWT Validation:** All endpoints (except `/api/health`) require valid JWT
- **Data Filtering:** All database queries filter by authenticated user's ID
- **CORS:** Only allows requests from configured frontend origins
