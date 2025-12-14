# Backend Guidelines (FastAPI)

## Overview
Python FastAPI service implementing the core business logic and data management for Tasks.
It is stateless and relies on JWT tokens signed by the Frontend for authentication.

## Tech Stack
- **Framework:** FastAPI
- **Language:** Python 3.13+
- **ORM:** SQLModel (SQLAlchemy + Pydantic)
- **Database:** Neon Serverless PostgreSQL (`asyncpg`)
- **Package Manager:** UV
- **Migrations:** Alembic

## Architecture
- **Data Source:** Owns the `tasks` table in Neon.
- **Auth:** Stateless. Verifies JWT signature using `BETTER_AUTH_SECRET`.
- **User Isolation:** EVERY endpoint must validate `url_user_id == jwt_user_id`.

## Key Patterns
### 1. User Isolation
```python
def verify_user_access(user_id: str, current_user_id: str):
    if user_id != current_user_id:
        raise HTTPException(403, "Forbidden")
```

### 2. Database Session
- Use Dependency Injection: `session: Session = Depends(get_session)`.
- Use `select(Task).where(...)` for queries.

### 3. Pydantic Schemas
- `TaskCreate`: Input validation.
- `TaskResponse`: Output serialization (hides internal fields if needed).

## Commands
```bash
# Setup
uv sync              # Install dependencies

# Development
uv run uvicorn src.main:app --reload --port 8000

# Database
uv run alembic revision --autogenerate -m "msg"  # Create migration
uv run alembic upgrade head                      # Apply migration

# Testing
uv run pytest        # Run all tests
```

## Environment Variables (.env)
- `DATABASE_URL`: Connection string for Neon (`postgresql+asyncpg://...` logic handled internally or explicit).
- `BETTER_AUTH_SECRET`: **CRITICAL**. Must match Frontend.
- `CORS_ORIGINS`: `http://localhost:3000`
