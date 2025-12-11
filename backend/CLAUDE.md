# Backend: FastAPI Application for Phase 2

## Overview

Python FastAPI backend with SQLModel ORM, JWT verification using shared secret approach, and Neon Serverless PostgreSQL database for the Todo application Phase 2. Implements user isolation by validating JWT user_id matches URL user_id in all endpoints.

## Technology Stack

- **Framework:** FastAPI
- **Language:** Python 3.13+
- **ORM:** SQLModel (built on SQLAlchemy + Pydantic)
- **Database:** Neon Serverless PostgreSQL
- **Authentication:** JWT tokens (shared secret with frontend)
- **Package Manager:** UV
- **Testing:** Pytest
- **Deployment:** Railway (or alternative Python hosting)

## Key Files

- `src/main.py` - FastAPI app entry point with CORS configuration
- `src/core/config.py` - Settings and configuration
- `src/core/database.py` - SQLModel database connection for Neon
- `src/core/security.py` - JWT verification with shared secret
- `src/models/task.py` - Task SQLModel with Better Auth user_id
- `src/schemas/task.py` - Pydantic request/response schemas
- `src/api/v1/endpoints/tasks.py` - Task CRUD endpoints with user validation
- `src/api/deps.py` - JWT authentication dependencies

## Authentication

JWT tokens from Better Auth (Next.js) are verified using shared secret (BETTER_AUTH_SECRET):

```python
# src/core/security.py
def verify_jwt_token(token: str) -> dict:
    # Verify JWT using shared BETTER_AUTH_SECRET
    # Return user data including user_id from 'sub' claim
    # Validate user_id matches URL parameter in all endpoints
```

## API Endpoints

### Task Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET    | /health | Health check | No |
| GET | /api/{user_id}/tasks | List user's tasks | Yes |
| POST | /api/{user_id}/tasks | Create task | Yes |
| GET | /api/{user_id}/tasks/{id} | Get task | Yes |
| PUT | /api/{user_id}/tasks/{id} | Update task | Yes |
| DELETE | /api/{user_id}/tasks/{id} | Delete task | Yes |
| PATCH | /api/{user_id}/tasks/{id}/complete | Toggle complete | Yes |


## Critical Security Requirement

**ALL endpoints must validate that user_id in URL matches user_id from JWT token** to ensure proper user data isolation.

## API Conventions

### HTTP Status Codes
- **200 OK:** Successful GET, PUT, PATCH
- **201 Created:** Successful POST
- **204 No Content:** Successful DELETE
- **400 Bad Request:** Invalid request data
- **401 Unauthorized:** Missing or invalid JWT token
- **403 Forbidden:** User not authorized for resource
- **404 Not Found:** Resource doesn't exist
- **422 Unprocessable Entity:** Validation error
- **500 Internal Server Error:** Server error

## Commands

```bash
# Development
uvicorn src.main:app --reload --port 8000

# Testing
pytest -v
```

## Environment Variables

Load configuration from environment variables:

```python
import os

DATABASE_URL = os.getenv("DATABASE_URL")
BETTER_AUTH_SECRET = os.getenv("BETTER_AUTH_SECRET")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
CORS_ALLOWED_ORIGINS = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
```

### Required Variables
- `DATABASE_URL` - Neon PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Shared secret for JWT validation (same as Next.js)

### Optional Variables
- `ENVIRONMENT` - Environment mode (default: "development")
- `CORS_ALLOWED_ORIGINS` - Comma-separated list of allowed origins (default: "http://localhost:3000")
- `LOG_LEVEL` - Logging level (default: "INFO")
- `HOST` - Server host (default: "0.0.0.0")
- `PORT` - Server port (default: 8000)
- `DB_POOL_SIZE` - Database connection pool size (default: 5)
- `DB_MAX_OVERFLOW` - Database max overflow connections (default: 10)
- `DB_POOL_PRE_PING` - Enable connection health checks (default: True)
- `DB_POOL_RECYCLE` - Connection recycle interval in seconds (default: 300)
- `JWT_ALGORITHM` - JWT signing algorithm (default: "HS256")
- `JWT_EXPIRATION_DELTA` - JWT expiration in seconds (default: 604800 for 7 days)

## SQLModel Patterns

```python
from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)  # Better Auth user ID
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```