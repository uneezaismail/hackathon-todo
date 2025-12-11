# FastAPI Todo Backend - Quick Start Guide

**Version**: 1.0.0 (Phase 8 Complete)
**Status**: Production Ready
**Test Coverage**: 85% (88/88 tests passing)

---

## Prerequisites

- Python 3.13+
- PostgreSQL database (Neon Serverless recommended)
- uv package manager (or pip/poetry)

---

## Local Development Setup

### 1. Install Dependencies

```bash
# Using uv (recommended - fastest)
cd backend
uv sync

# Or using pip
pip install -r requirements.txt

# Or using poetry
poetry install
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

Required environment variables:

```bash
# Neon Serverless PostgreSQL connection string
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require

# Shared secret with Next.js (minimum 32 characters)
BETTER_AUTH_SECRET=your-super-secret-key-here-make-it-long-and-random

# CORS origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Environment mode
ENVIRONMENT=development

# Logging level
LOG_LEVEL=INFO
```

### 3. Run Database Migrations

```bash
# Apply all migrations
uv run alembic upgrade head

# Check current migration status
uv run alembic current

# Rollback last migration (if needed)
uv run alembic downgrade -1
```

### 4. Start Development Server

```bash
# Start server with auto-reload
uv run uvicorn src.main:app --reload --port 8000

# Or with custom host/port
uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8080
```

Server will be available at:
- **API**: http://localhost:8000
- **Health Check**: http://localhost:8000/api/health
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

---

## Testing

### Run All Tests

```bash
# Run full test suite with coverage
uv run pytest tests/ --cov=src --cov-report=term-missing

# Expected: 88 tests passing, 85% coverage
```

### Run Specific Test Suites

```bash
# Integration tests only (45 tests)
uv run pytest tests/integration/ -v

# Unit tests only (34 tests)
uv run pytest tests/unit/ -v

# Contract tests only (7 tests)
uv run pytest tests/contract/ -v

# Health endpoint tests (2 tests)
uv run pytest tests/test_health.py -v
```

### Run Tests with Different Verbosity

```bash
# Minimal output
uv run pytest tests/ -q

# Verbose output with full tracebacks
uv run pytest tests/ -vv --tb=long

# Show test coverage report
uv run pytest tests/ --cov=src --cov-report=html
# Open htmlcov/index.html in browser to view detailed coverage
```

### Run Specific Test

```bash
# Run single test file
uv run pytest tests/integration/test_task_create.py -v

# Run single test function
uv run pytest tests/integration/test_task_create.py::test_create_task_with_title_and_description -v
```

---

## Type Checking

```bash
# Run mypy type checker (strict mode)
uv run mypy src/ --config-file mypy.ini

# Expected: No errors (all functions have type hints)
```

---

## Docker Deployment

### Build Docker Image

```bash
# Build production image
docker build -t todo-api:latest -f Dockerfile .

# Build with specific tag
docker build -t todo-api:v1.0.0 -f Dockerfile .
```

### Run Docker Container

```bash
# Run with environment variables
docker run -d \
  -p 8000:8000 \
  -e DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require" \
  -e BETTER_AUTH_SECRET="your-super-secret-key-minimum-32-chars" \
  -e CORS_ORIGINS="http://localhost:3000" \
  -e ENVIRONMENT="production" \
  -e LOG_LEVEL="INFO" \
  --name todo-api \
  todo-api:latest

# Check container logs
docker logs -f todo-api

# Check container health
docker ps | grep todo-api
curl http://localhost:8000/api/health
```

### Run with Docker Compose (Optional)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
      - BETTER_AUTH_SECRET=your-super-secret-key-minimum-32-chars
      - CORS_ORIGINS=http://localhost:3000
      - ENVIRONMENT=production
      - LOG_LEVEL=INFO
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

Run with:

```bash
docker-compose up -d
docker-compose logs -f
```

---

## API Endpoints

### Health Check (No Authentication)

```bash
# Check server health
curl http://localhost:8000/api/health

# Response: {"status": "healthy", "timestamp": "2025-12-11T10:00:00Z"}
```

### Task Endpoints (Require Authentication)

All task endpoints require JWT token in Authorization header:

```bash
# List all tasks for user
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8000/api/v1/tasks

# Create new task
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "My task", "description": "Task description"}' \
  http://localhost:8000/api/v1/tasks

# Get specific task
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8000/api/v1/tasks/{task_id}

# Update task
curl -X PATCH \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"completed": true}' \
  http://localhost:8000/api/v1/tasks/{task_id}

# Delete task
curl -X DELETE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8000/api/v1/tasks/{task_id}
```

### Query Parameters

```bash
# Filter by completion status
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:8000/api/v1/tasks?status=Completed"

# Sort by creation date (ascending = oldest first)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:8000/api/v1/tasks?sort=created_at_asc"

# Pagination
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:8000/api/v1/tasks?limit=10&offset=0"

# Combined filters
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:8000/api/v1/tasks?status=Pending&sort=created_at_desc&limit=20"
```

---

## Interactive API Documentation

### Swagger UI (Recommended)

1. Start server: `uv run uvicorn src.main:app --reload`
2. Open browser: http://localhost:8000/docs
3. Click "Authorize" button
4. Enter JWT token: `Bearer YOUR_JWT_TOKEN`
5. Try API endpoints interactively

### ReDoc

1. Start server: `uv run uvicorn src.main:app --reload`
2. Open browser: http://localhost:8000/redoc
3. View clean documentation of all endpoints

---

## Database Management

### Create New Migration

```bash
# Auto-generate migration from model changes
uv run alembic revision --autogenerate -m "Add new field to tasks"

# Review generated migration in alembic/versions/
# Edit if needed, then apply:
uv run alembic upgrade head
```

### Migration Commands

```bash
# Show current migration version
uv run alembic current

# Show migration history
uv run alembic history

# Upgrade to latest
uv run alembic upgrade head

# Upgrade to specific version
uv run alembic upgrade <revision_id>

# Downgrade one version
uv run alembic downgrade -1

# Downgrade to specific version
uv run alembic downgrade <revision_id>

# Downgrade all (back to base)
uv run alembic downgrade base
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Test database connection
python -c "from src.db.engine import get_engine; engine = get_engine(); print('Connection successful!')"

# Check environment variables
env | grep DATABASE_URL

# Verify Neon connection string format
# Should be: postgresql://user:password@host:5432/dbname?sslmode=require
```

### Authentication Errors

```bash
# Verify BETTER_AUTH_SECRET matches Next.js
env | grep BETTER_AUTH_SECRET

# Test JWT token validation
# Use /docs to test with actual JWT token from Next.js
```

### Test Failures

```bash
# Run tests with verbose output
uv run pytest tests/ -vv --tb=long

# Run specific failing test
uv run pytest tests/integration/test_auth.py::test_missing_authorization_header -vv

# Check test database connection
cat .env.test
```

### Docker Build Issues

```bash
# Build with verbose output
docker build -t todo-api:latest -f Dockerfile . --progress=plain

# Check Docker logs
docker logs todo-api

# Inspect running container
docker exec -it todo-api bash
```

---

## Performance Tips

### Development

- Use `--reload` flag for auto-reload on code changes
- Use SQLite for faster test execution (in-memory database)
- Run specific test files instead of full suite during development

### Production

- Use Neon Serverless PostgreSQL for scalability
- Set `pool_size=5` and `max_overflow=10` in database configuration
- Enable `pool_pre_ping=True` for connection validation (serverless)
- Use connection pooling with `pool_recycle=300` (5 minutes)
- Disable Swagger UI in production: `app = FastAPI(docs_url=None, redoc_url=None)`

---

## Security Checklist

✅ JWT validation using shared secret (BETTER_AUTH_SECRET)
✅ User isolation on all endpoints (user_id validation)
✅ CORS properly configured (CORS_ORIGINS environment variable)
✅ Non-root user in Docker container
✅ HTTPS enforcement in production (Neon requires SSL)
✅ Input validation with Pydantic models
✅ SQL injection prevention (SQLModel parameterized queries)
✅ Environment variables for secrets (never hardcoded)

### Additional Security Measures (Recommended)

- Rate limiting (not yet implemented)
- API key rotation (not yet implemented)
- Request logging and monitoring
- Regular dependency updates
- Security headers (HSTS, CSP, etc.)

---

## Project Structure

```
backend/
├── src/
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Environment configuration
│   ├── api/
│   │   └── v1/
│   │       └── tasks.py     # Task CRUD endpoints
│   ├── auth/
│   │   ├── jwt.py           # JWT validation
│   │   └── dependencies.py  # Auth dependencies
│   ├── db/
│   │   ├── engine.py        # Database engine
│   │   └── session.py       # Session management
│   ├── models/
│   │   ├── base.py          # Base model with timestamps
│   │   └── task.py          # Task SQLModel
│   ├── schemas/
│   │   ├── common.py        # Common schemas (errors, pagination)
│   │   └── task.py          # Task Pydantic schemas
│   └── services/
│       ├── exceptions.py    # Custom exceptions
│       └── task_service.py  # Task business logic
├── tests/
│   ├── conftest.py          # Pytest fixtures
│   ├── test_health.py       # Health endpoint tests
│   ├── contract/            # Contract tests (OpenAPI)
│   ├── integration/         # Integration tests (45 tests)
│   └── unit/                # Unit tests (34 tests)
├── alembic/
│   ├── versions/            # Migration files
│   └── env.py               # Alembic configuration
├── .env.example             # Example environment variables
├── .env.test                # Test environment variables
├── Dockerfile               # Multi-stage production build
├── .dockerignore            # Docker build optimization
├── mypy.ini                 # Type checking configuration
├── pytest.ini               # Test configuration
├── pyproject.toml           # Project dependencies (uv format)
├── README.md                # Project overview
└── QUICKSTART.md            # This file
```

---

## Common Commands Reference

```bash
# Development
uv run uvicorn src.main:app --reload                    # Start dev server
uv run pytest tests/ --cov=src                          # Run all tests
uv run mypy src/ --config-file mypy.ini                 # Type checking

# Database
uv run alembic upgrade head                             # Apply migrations
uv run alembic current                                  # Check status
uv run alembic revision --autogenerate -m "message"     # Create migration

# Docker
docker build -t todo-api:latest -f Dockerfile .         # Build image
docker run -p 8000:8000 todo-api:latest                 # Run container
docker logs -f todo-api                                 # View logs

# Testing
uv run pytest tests/integration/ -v                     # Integration tests
uv run pytest tests/unit/ -v                            # Unit tests
uv run pytest tests/contract/ -v                        # Contract tests
```

---

## Next Steps

1. **Start Development Server**:
   ```bash
   cd backend
   uv sync
   cp .env.example .env
   # Edit .env with your DATABASE_URL and BETTER_AUTH_SECRET
   uv run alembic upgrade head
   uv run uvicorn src.main:app --reload
   ```

2. **Run Tests**:
   ```bash
   uv run pytest tests/ --cov=src
   ```

3. **Explore API Documentation**:
   - Open http://localhost:8000/docs in browser
   - Try the interactive API testing

4. **Deploy to Production**:
   - Build Docker image
   - Set production environment variables
   - Run migrations
   - Deploy container to hosting platform

---

## Support & Resources

- **API Documentation**: http://localhost:8000/docs
- **OpenAPI Specification**: http://localhost:8000/openapi.json
- **Test Coverage Report**: `htmlcov/index.html` (after running pytest with --cov-report=html)
- **Implementation Summary**: See `PHASE8_COMPLETE.md` for full details

---

**Last Updated**: 2025-12-11
**Version**: 1.0.0 (Phase 8 Complete)
**Status**: Production Ready
