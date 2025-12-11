# Quickstart Guide: FastAPI Backend Phase II

**Date**: 2025-12-11
**Feature**: 002-fastapi-backend
**Purpose**: Step-by-step guide for local development setup, database migrations, and testing

---

## Prerequisites

Before starting, ensure you have the following installed and configured:

### Required Software

1. **Python 3.13+**
   ```bash
   python --version  # Should show Python 3.13 or higher
   ```
   Install from [python.org](https://www.python.org/downloads/) if needed.

2. **uv Package Manager** (recommended for fast dependency management)
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   uv --version
   ```
   Alternative: Use `pip` if uv is not available (slower but compatible).

3. **Git** (for version control)
   ```bash
   git --version
   ```

4. **PostgreSQL Client** (optional, for manual database inspection)
   ```bash
   psql --version
   ```

### Required External Services

1. **Neon Serverless PostgreSQL Database**
   - Sign up at [neon.tech](https://neon.tech)
   - Create a new project
   - Copy the connection string (format: `postgresql://user:pass@host/dbname?sslmode=require`)
   - Keep this handy for environment configuration

2. **Better Auth Shared Secret**
   - If running with Next.js frontend, obtain `BETTER_AUTH_SECRET` from frontend `.env` file
   - If running standalone (backend-only testing), generate a random secret:
     ```bash
     python -c "import secrets; print(secrets.token_urlsafe(32))"
     ```

---

## Initial Setup

### 1. Clone Repository and Navigate to Backend

```bash
# Clone the repository (if not already cloned)
git clone https://github.com/your-org/hackathon-todo.git
cd hackathon-todo

# Switch to feature branch
git checkout 002-fastapi-backend

# Navigate to backend directory
cd backend
```

### 2. Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration
nano .env  # or use your preferred editor
```

**Required Variables** (edit `.env` file):

```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
# Example: postgresql://neondb_owner:abc123@ep-cool-field-123456.us-east-2.aws.neon.tech/neondb?sslmode=require

# Authentication Secret (must match Next.js frontend)
BETTER_AUTH_SECRET=your-shared-secret-here-minimum-32-chars

# CORS Configuration (Next.js frontend URL)
CORS_ORIGINS=http://localhost:3000,https://app.example.com

# Logging Configuration (optional)
LOG_LEVEL=INFO  # Options: DEBUG, INFO, WARNING, ERROR
```

**Security Notes**:
- **Never commit `.env` file to git** (already in `.gitignore`)
- Use strong random secrets (minimum 32 characters)
- Use `sslmode=require` for Neon connections (enforces encrypted connections)
- Separate `.env` files for dev/staging/production environments

### 3. Install Dependencies

#### Using uv (Recommended - Fast)

```bash
# Sync all dependencies from pyproject.toml
uv sync

# This installs:
# - FastAPI, SQLModel, python-jose, Alembic
# - pytest, mypy, httpx (dev dependencies)
# - All transitive dependencies
```

#### Using pip (Alternative)

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -e .

# Install dev dependencies
pip install -e ".[dev]"
```

**Verify Installation**:
```bash
uv run python -c "import fastapi, sqlmodel, jose; print('✅ Dependencies installed')"
```

---

## Database Setup

### 1. Initialize Alembic (First Time Only)

**Note**: Alembic should already be initialized from repository. Skip this if `alembic/` directory exists.

```bash
# Initialize Alembic (creates alembic/ directory)
uv run alembic init alembic

# Edit alembic.ini to use DATABASE_URL from environment
# (Already configured if using repository version)
```

### 2. Run Database Migrations

```bash
# Apply all pending migrations (creates tasks table with indexes)
uv run alembic upgrade head

# Expected output:
# INFO  [alembic.runtime.migration] Running upgrade  -> 001, Create tasks table
# ✅ Migration complete
```

**Verify Migration**:
```bash
# Connect to database and verify table exists
psql $DATABASE_URL -c "\d tasks"

# Expected output: tasks table with columns (id, user_id, title, etc.)
```

### 3. Check Migration Status

```bash
# Show current migration version
uv run alembic current

# Show migration history
uv run alembic history

# Check for pending migrations
uv run alembic check
```

---

## Running the Application

### 1. Start Development Server

```bash
# Start FastAPI with auto-reload (watches for file changes)
uv run uvicorn src.main:app --reload --port 8000

# Expected output:
# INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
# INFO:     Started reloader process
# INFO:     Started server process
# INFO:     Waiting for application startup.
# INFO:     Application startup complete.
```

### 2. Access API Documentation

Once the server is running, open your browser:

- **Swagger UI** (Interactive API docs): http://localhost:8000/docs
- **ReDoc** (Alternative docs): http://localhost:8000/redoc
- **OpenAPI Schema** (JSON): http://localhost:8000/openapi.json
- **Health Check**: http://localhost:8000/api/health

**Test Health Endpoint**:
```bash
curl http://localhost:8000/api/health

# Expected response:
# {"status":"healthy","timestamp":"2025-12-11T14:30:00Z"}
```

### 3. Test Authenticated Endpoint (Manual)

**Generate Test JWT Token** (for local testing without Better Auth):

```python
# Create test_jwt.py
from jose import jwt
from datetime import datetime, timedelta
import os

SECRET_KEY = os.getenv("BETTER_AUTH_SECRET")
ALGORITHM = "HS256"

# Create test token for user "test-user-123"
payload = {
    "sub": "test-user-123",  # User ID
    "exp": datetime.utcnow() + timedelta(days=7),  # Expires in 7 days
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

# Expected response (201 Created):
# {
#   "data": {
#     "id": "550e8400-...",
#     "user_id": "test-user-123",
#     "title": "Test Task",
#     "description": "Testing FastAPI backend",
#     "completed": false,
#     "created_at": "2025-12-11T14:30:00Z",
#     "updated_at": "2025-12-11T14:30:00Z"
#   },
#   "error": null
# }
```

---

## Running Tests

### 1. Run All Tests

```bash
# Run all tests with verbose output
uv run pytest tests/ -v

# Expected output:
# tests/integration/test_task_create.py::test_create_task_success PASSED
# tests/integration/test_task_read.py::test_list_tasks PASSED
# tests/unit/test_task_service.py::test_user_scoped_query PASSED
# ... (all tests)
# ==================== X passed in Y.YYs ====================
```

### 2. Run Specific Test Suites

```bash
# Integration tests only (tests API endpoints with real database)
uv run pytest tests/integration/ -v

# Unit tests only (tests services and utilities with mocks)
uv run pytest tests/unit/ -v

# Contract tests only (validates OpenAPI schema compliance)
uv run pytest tests/contract/ -v

# Run specific test file
uv run pytest tests/integration/test_auth.py -v

# Run specific test function
uv run pytest tests/integration/test_auth.py::test_invalid_jwt_401 -v
```

### 3. Run Tests with Coverage Report

```bash
# Generate coverage report
uv run pytest --cov=src tests/ --cov-report=term-missing

# Expected output:
# Name                          Stmts   Miss  Cover   Missing
# -----------------------------------------------------------
# src/main.py                      25      0   100%
# src/auth/jwt.py                  30      2    93%   45-46
# src/services/task_service.py     50      1    98%   67
# -----------------------------------------------------------
# TOTAL                           500     10    98%

# Generate HTML coverage report (opens in browser)
uv run pytest --cov=src tests/ --cov-report=html
open htmlcov/index.html  # On macOS; use `start` on Windows
```

### 4. Run Type Checking

```bash
# Run mypy strict type checking
uv run mypy src/ --strict

# Expected output:
# Success: no issues found in X source files

# Fix type errors if any (mypy will show line numbers and issues)
```

### 5. Test Fixtures and Debugging

```bash
# Show available test fixtures
uv run pytest --fixtures

# Run tests with detailed output (shows print statements)
uv run pytest tests/ -v -s

# Run tests in parallel (faster, requires pytest-xdist)
uv run pytest tests/ -n auto

# Stop on first failure (useful for debugging)
uv run pytest tests/ -x

# Debug failing test (drops into Python debugger)
uv run pytest tests/integration/test_auth.py::test_invalid_jwt_401 --pdb
```

---

## Database Migration Workflow

### Creating New Migrations

When modifying database models (e.g., adding new field to Task):

```bash
# 1. Modify SQLModel model in src/models/task.py
# Example: Add "priority" field

# 2. Generate migration automatically (Alembic detects changes)
uv run alembic revision --autogenerate -m "Add priority field to tasks"

# 3. Review generated migration file
cat alembic/versions/002_add_priority_field_to_tasks.py

# IMPORTANT: Always review autogenerated migrations!
# Alembic sometimes misses renames or generates suboptimal SQL

# 4. Edit migration if needed (add default values, data backfill, etc.)

# 5. Apply migration to local database
uv run alembic upgrade head

# 6. Test migration (run tests to verify nothing broke)
uv run pytest tests/ -v

# 7. Commit migration file to git
git add alembic/versions/002_add_priority_field_to_tasks.py
git commit -m "Add priority field migration"
```

### Rolling Back Migrations

```bash
# Rollback one migration
uv run alembic downgrade -1

# Rollback to specific version
uv run alembic downgrade <revision_id>

# Rollback all migrations (reset to empty database)
uv run alembic downgrade base
```

### Migration Best Practices

1. **Always Review Autogenerate**: Alembic's autogenerate is not perfect
2. **Test Migrations Locally**: Run migration + tests before committing
3. **Additive Changes**: Add nullable columns or columns with defaults (avoids table rewrites)
4. **Concurrent Index Creation**: Use `postgresql_concurrently=True` for large tables
5. **Data Migrations**: Separate schema changes from data backfill (two migrations)
6. **Downgrade Scripts**: Always test downgrade path (rollback should work)

**Example: Adding Column with Default (Zero Downtime)**

```python
def upgrade():
    # Add nullable column first
    op.add_column('tasks', sa.Column('priority', sa.Integer(), nullable=True))

    # Backfill existing rows with default value
    op.execute("UPDATE tasks SET priority = 0 WHERE priority IS NULL")

    # Make column NOT NULL after backfill
    op.alter_column('tasks', 'priority', nullable=False)


def downgrade():
    op.drop_column('tasks', 'priority')
```

---

## Development Workflow

### Typical Development Session

```bash
# 1. Pull latest changes
git pull origin 002-fastapi-backend

# 2. Install any new dependencies
uv sync

# 3. Run pending migrations
uv run alembic upgrade head

# 4. Start development server
uv run uvicorn src.main:app --reload --port 8000

# 5. In another terminal: run tests in watch mode (optional)
uv run pytest-watch tests/  # Reruns tests on file changes

# 6. Make code changes (auto-reload applies changes instantly)

# 7. Run tests before committing
uv run pytest tests/ -v
uv run mypy src/ --strict

# 8. Commit changes
git add .
git commit -m "feat: Add new endpoint"
git push origin 002-fastapi-backend
```

### Hot Reload (Auto-Reload)

FastAPI with `--reload` watches for file changes and restarts automatically:

```bash
# Edit src/api/v1/tasks.py
# Save file
# Output: INFO:     Application startup complete. (auto-reloaded)

# Test changes immediately (no manual restart needed)
curl http://localhost:8000/api/v1/tasks
```

**Note**: Auto-reload only works in development mode (`--reload` flag). Production uses `uvicorn src.main:app` without reload.

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

**Error**: `could not connect to server: Connection refused`

**Solution**:
```bash
# Verify DATABASE_URL is correct
echo $DATABASE_URL

# Test connection manually
psql $DATABASE_URL -c "SELECT 1"

# Check Neon database status (may be paused)
# Visit Neon console to wake up database
```

#### 2. Alembic Migration Errors

**Error**: `Can't locate revision identified by 'abc123'`

**Solution**:
```bash
# Check migration history
uv run alembic history

# Reset alembic_version table (DANGEROUS - only if migration history is corrupted)
psql $DATABASE_URL -c "DELETE FROM alembic_version"
uv run alembic stamp head  # Mark current version as head
```

#### 3. JWT Validation Errors

**Error**: `401 Unauthorized: Invalid token signature`

**Solution**:
```bash
# Verify BETTER_AUTH_SECRET matches frontend
echo $BETTER_AUTH_SECRET

# Ensure secret is same in both Next.js and FastAPI
# Check frontend .env file for BETTER_AUTH_SECRET value

# Regenerate test token with correct secret
uv run python test_jwt.py
```

#### 4. Module Import Errors

**Error**: `ModuleNotFoundError: No module named 'fastapi'`

**Solution**:
```bash
# Reinstall dependencies
uv sync

# Or with pip:
pip install -e .

# Verify installation
uv run python -c "import fastapi; print(fastapi.__version__)"
```

#### 5. Port Already in Use

**Error**: `[Errno 48] Address already in use`

**Solution**:
```bash
# Find process using port 8000
lsof -i :8000  # On macOS/Linux
netstat -ano | findstr :8000  # On Windows

# Kill process
kill -9 <PID>  # Replace <PID> with process ID

# Or use different port
uv run uvicorn src.main:app --reload --port 8001
```

---

## Next Steps

1. **Explore API Docs**: Visit http://localhost:8000/docs and test endpoints interactively
2. **Review Code Structure**: Check `src/` directory for models, services, API routes
3. **Run Integration Tests**: Verify all endpoints work with `uv run pytest tests/integration/ -v`
4. **Connect Frontend**: Configure Next.js frontend to use `http://localhost:8000/api/v1`
5. **Read Architecture Docs**: Review `plan.md` and `data-model.md` for design decisions

---

## Quick Reference Commands

```bash
# Development Server
uv run uvicorn src.main:app --reload --port 8000

# Run Tests
uv run pytest tests/ -v                    # All tests
uv run pytest tests/integration/ -v        # Integration tests
uv run pytest --cov=src tests/             # With coverage

# Type Checking
uv run mypy src/ --strict

# Database Migrations
uv run alembic upgrade head                # Apply migrations
uv run alembic downgrade -1                # Rollback one migration
uv run alembic revision --autogenerate -m "message"  # Create migration

# Database Inspection
psql $DATABASE_URL -c "\d tasks"           # Show tasks table schema
psql $DATABASE_URL -c "SELECT COUNT(*) FROM tasks"  # Count tasks

# Generate Test JWT
uv run python test_jwt.py                  # Create test token for local testing
```

---

**Quickstart Status**: ✅ COMPLETE
**Generated**: 2025-12-11
**For Help**: See plan.md, data-model.md, or ask in #backend-dev channel
