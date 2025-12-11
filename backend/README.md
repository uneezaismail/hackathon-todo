# Todo API Backend - Phase 2

FastAPI backend for the Todo application with JWT authentication using Better Auth shared secret approach and Neon Serverless PostgreSQL.

## Features

- RESTful API endpoints for task management
- JWT authentication with shared secret between Next.js and FastAPI
- User isolation - each user can only access their own tasks
- Neon Serverless PostgreSQL integration
- Complete CRUD operations for tasks

## API Endpoints

- `GET /api/{user_id}/tasks` - List all tasks for a user
- `POST /api/{user_id}/tasks` - Create a new task
- `GET /api/{user_id}/tasks/{task_id}` - Get a specific task
- `PUT /api/{user_id}/tasks/{task_id}` - Update a task
- `DELETE /api/{user_id}/tasks/{task_id}` - Delete a task
- `PATCH /api/{user_id}/tasks/{task_id}/complete` - Toggle task completion
- `GET /api/health` - Health check endpoint (no authentication required)

## Prerequisites

Before starting, ensure you have:

- **Python 3.13+** installed
- **uv package manager** installed (`curl -LsSf https://astral.sh/uv/install.sh | sh`)
- **Neon PostgreSQL database** provisioned (get DATABASE_URL from Neon console)
- **BETTER_AUTH_SECRET** shared with Next.js frontend

## Quick Start

### 1. Environment Configuration

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration
# Required variables:
# - DATABASE_URL (from Neon console)
# - BETTER_AUTH_SECRET (same as Next.js frontend)
```

### 2. Install Dependencies

```bash
# Using uv (recommended - fast)
uv sync

# Alternative: Using pip
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -e .
```

### 3. Run Database Migrations

```bash
# Apply all migrations (creates tasks table with indexes)
uv run alembic upgrade head
```

### 4. Start Development Server

```bash
# Start FastAPI with auto-reload
uv run uvicorn src.main:app --reload --port 8000

# API available at: http://localhost:8000
# Swagger UI at: http://localhost:8000/docs
# OpenAPI spec at: http://localhost:8000/openapi.json
```

### 5. Test Health Endpoint

```bash
curl http://localhost:8000/api/health

# Expected response:
# {"status":"healthy","timestamp":"2025-12-11T14:30:00Z"}
```

## Development Workflow

### Running Tests

```bash
# Run all tests with verbose output
uv run pytest tests/ -v

# Integration tests only
uv run pytest tests/integration/ -v

# Unit tests only
uv run pytest tests/unit/ -v

# With coverage report
uv run pytest --cov=src tests/ --cov-report=term-missing

# Generate HTML coverage report
uv run pytest --cov=src tests/ --cov-report=html
open htmlcov/index.html  # On macOS; use 'start' on Windows
```

### Type Checking

```bash
# Run mypy strict type checking
uv run mypy src/ --strict
```

### Database Migrations

```bash
# Create new migration after model changes
uv run alembic revision --autogenerate -m "Add new field"

# Review generated migration in alembic/versions/
# Edit if needed (Alembic auto-generate is not perfect)

# Apply migration
uv run alembic upgrade head

# Rollback migration (if needed)
uv run alembic downgrade -1
```

### Testing with JWT Token

For local testing without Better Auth, generate a test JWT token:

```python
# Create test_jwt.py
from jose import jwt
from datetime import datetime, timedelta
import os

SECRET_KEY = os.getenv("BETTER_AUTH_SECRET")
ALGORITHM = "HS256"

payload = {
    "sub": "test-user-123",  # User ID
    "exp": datetime.utcnow() + timedelta(days=7),
    "iat": datetime.utcnow(),
}

token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
print(f"Test Token: {token}")
```

```bash
# Generate token
uv run python test_jwt.py

# Use token to create a task
curl -X POST http://localhost:8000/api/v1/tasks \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Task", "description": "Testing FastAPI backend"}'
```

## Security

- **JWT Validation**: All endpoints require valid JWT token in Authorization header
- **User Isolation**: User_id in URL is validated against JWT token in all endpoints
- **Access Control**: Only user's own tasks are accessible (403 Forbidden for cross-user access)
- **Input Validation**: Pydantic models validate all request data
- **SQL Injection Prevention**: SQLModel ORM handles parameterization automatically

## Project Structure

```
backend/
├── src/
│   ├── main.py              # FastAPI app initialization with CORS
│   ├── config.py            # Environment variable configuration
│   ├── models/              # SQLModel database models
│   │   ├── task.py          # Task model with user_id FK
│   │   └── base.py          # Base model with timestamps
│   ├── schemas/             # Pydantic request/response schemas
│   │   ├── task.py          # TaskCreate, TaskUpdate, TaskResponse
│   │   └── common.py        # ErrorResponse, PaginationParams
│   ├── api/                 # API route handlers
│   │   ├── v1/
│   │   │   └── tasks.py     # Task CRUD endpoints
│   │   └── dependencies.py  # FastAPI dependencies
│   ├── services/            # Business logic layer
│   │   ├── task_service.py  # TaskService with user-scoped CRUD
│   │   └── exceptions.py    # Custom exceptions
│   ├── auth/                # JWT authentication
│   │   ├── jwt.py           # JWT validation with shared secret
│   │   └── dependencies.py  # get_current_user_id dependency
│   └── db/                  # Database connection
│       ├── engine.py        # SQLModel engine with Neon config
│       └── session.py       # Session factory and dependency
├── alembic/                 # Database migration scripts
│   └── versions/            # Generated migration files
├── tests/
│   ├── integration/         # API integration tests
│   ├── unit/                # Unit tests for services
│   └── contract/            # Contract tests (OpenAPI)
├── .env.example             # Example environment variables
├── pyproject.toml           # Python dependencies (uv format)
├── alembic.ini              # Alembic configuration
└── README.md                # This file
```

## Environment Variables

### Required

- `DATABASE_URL` - Neon PostgreSQL connection string with SSL
- `BETTER_AUTH_SECRET` - Shared secret for JWT validation (same as Next.js)

### Optional

- `CORS_ORIGINS` - Allowed origins (default: http://localhost:3000)
- `HOST` - Server host (default: 0.0.0.0)
- `PORT` - Server port (default: 8000)
- `LOG_LEVEL` - Logging level (default: INFO)
- `DB_POOL_SIZE` - Connection pool size (default: 5)
- `DB_MAX_OVERFLOW` - Max overflow connections (default: 10)
- `DB_POOL_PRE_PING` - Verify connections before use (default: True)
- `DB_POOL_RECYCLE` - Connection recycle interval (default: 300)

## Troubleshooting

### Database Connection Errors

```bash
# Verify DATABASE_URL is correct
echo $DATABASE_URL

# Test connection manually
psql $DATABASE_URL -c "SELECT 1"

# Check Neon database status (may be paused)
# Visit Neon console to wake up database
```

### JWT Validation Errors

```bash
# Verify BETTER_AUTH_SECRET matches frontend
echo $BETTER_AUTH_SECRET

# Ensure secret is same in both Next.js and FastAPI
# Regenerate test token with correct secret
uv run python test_jwt.py
```

### Port Already in Use

```bash
# Find process using port 8000
lsof -i :8000  # On macOS/Linux
netstat -ano | findstr :8000  # On Windows

# Kill process or use different port
uv run uvicorn src.main:app --reload --port 8001
```

## Documentation

- **Swagger UI**: http://localhost:8000/docs (interactive API documentation)
- **ReDoc**: http://localhost:8000/redoc (alternative documentation)
- **OpenAPI Schema**: http://localhost:8000/openapi.json (raw JSON schema)

## Related Documentation

- [Plan](../specs/002-fastapi-backend/plan.md) - Architecture decisions
- [Data Model](../specs/002-fastapi-backend/data-model.md) - Database schema
- [Quickstart Guide](../specs/002-fastapi-backend/quickstart.md) - Detailed setup guide

## Next Steps

1. **Explore API Docs**: Visit http://localhost:8000/docs and test endpoints interactively
2. **Review Code Structure**: Check `src/` directory for models, services, API routes
3. **Run Integration Tests**: Verify all endpoints work with `uv run pytest tests/integration/ -v`
4. **Connect Frontend**: Configure Next.js frontend to use `http://localhost:8000/api/v1`
5. **Read Architecture Docs**: Review plan.md and data-model.md for design decisions

## License

MIT

---

**Backend Status**: Phase 1 Setup Complete
**Generated**: 2025-12-11
**For Support**: See plan.md or contact backend team
