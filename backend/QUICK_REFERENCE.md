# FastAPI Backend - Quick Reference Guide

## Phase 2 Implementation Patterns

### Configuration Pattern

```python
# src/config.py
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    DATABASE_URL: str
    BETTER_AUTH_SECRET: str
    CORS_ORIGINS: str = "http://localhost:3000"

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings() -> Settings:
    return Settings()
```

### Exception Pattern

```python
# src/services/exceptions.py
class TaskNotFoundError(Exception):
    def __init__(self, task_id: str):
        super().__init__(f"Task with ID '{task_id}' not found")

class UnauthorizedError(Exception):
    def __init__(self, message: str):
        super().__init__(message)
```

### Exception Handler Pattern

```python
# src/main.py
from fastapi.responses import JSONResponse
from src.services.exceptions import TaskNotFoundError
from src.schemas.common import ErrorResponse

@app.exception_handler(TaskNotFoundError)
async def task_not_found_handler(request: Request, exc: TaskNotFoundError):
    error_response = ErrorResponse(message=str(exc), code="NOT_FOUND")
    return JSONResponse(
        status_code=404,
        content={"data": None, "error": error_response.model_dump()}
    )
```

### CORS Configuration Pattern

```python
# src/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
```

### Schema Pattern

```python
# src/schemas/common.py
from pydantic import BaseModel, Field

class ErrorResponse(BaseModel):
    message: str = Field(..., description="Human-readable error message")
    code: str = Field(..., description="Machine-readable error code")

class PaginationParams(BaseModel):
    limit: int = Field(default=50, ge=1, le=100)
    offset: int = Field(default=0, ge=0)
```

### Test Fixture Pattern

```python
# tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from src.main import app

@pytest.fixture(name="client")
def client_fixture() -> TestClient:
    with TestClient(app) as test_client:
        yield test_client

@pytest.fixture(name="authenticated_client")
def authenticated_client_fixture(client: TestClient, mock_user_id: str):
    def override_get_current_user_id():
        return mock_user_id

    app.dependency_overrides[get_current_user_id] = override_get_current_user_id
    yield client
    app.dependency_overrides.clear()
```

### Test Pattern

```python
# tests/test_*.py
def test_health_endpoint(client: TestClient):
    response = client.get("/api/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
```

## API Response Format

### Success Response
```json
{
  "data": {
    "id": 1,
    "title": "Task title",
    "completed": false
  },
  "error": null
}
```

### Error Response
```json
{
  "data": null,
  "error": {
    "message": "Task with ID '123' not found",
    "code": "NOT_FOUND"
  }
}
```

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| VALIDATION_ERROR | 422 | Pydantic validation failed |
| NOT_FOUND | 404 | Resource doesn't exist |
| UNAUTHORIZED | 403 | User not authorized |
| INTERNAL_ERROR | 500 | Server error |

## Common Commands

```bash
# Run development server
uvicorn src.main:app --reload --port 8000

# Run tests
pytest -v

# Run tests with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/test_health.py -v

# Run tests with specific marker
pytest -m unit -v
```

## Environment Variables

Required in `.env`:
```bash
DATABASE_URL=postgresql://user:pass@host/db
BETTER_AUTH_SECRET=your-secret-key
```

Optional:
```bash
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
ENVIRONMENT=development
LOG_LEVEL=INFO
HOST=0.0.0.0
PORT=8000
```

## Next Steps for User Story Implementation

### 1. Create Task Schema (src/schemas/task.py)
```python
from pydantic import BaseModel, Field
from datetime import datetime

class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=1000)

class TaskResponse(BaseModel):
    id: int
    user_id: str
    title: str
    description: str | None
    completed: bool
    created_at: datetime
    updated_at: datetime
```

### 2. Create Task Service (src/services/task_service.py)
```python
from sqlmodel import Session, select
from src.models.task import Task
from src.services.exceptions import TaskNotFoundError, UnauthorizedError

class TaskService:
    @staticmethod
    def get_task_by_id(session: Session, task_id: int, user_id: str) -> Task:
        task = session.get(Task, task_id)
        if not task:
            raise TaskNotFoundError(task_id=str(task_id))
        if task.user_id != user_id:
            raise UnauthorizedError("Not authorized to access this task")
        return task
```

### 3. Create Task Endpoint (src/api/v1/endpoints/tasks.py)
```python
from fastapi import APIRouter, Depends, status
from sqlmodel import Session
from src.db.session import get_session
from src.auth.dependencies import get_current_user_id
from src.schemas.task import TaskCreate, TaskResponse
from src.services.task_service import TaskService

router = APIRouter()

@router.post("/{user_id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    user_id: str,
    task_create: TaskCreate,
    current_user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session)
):
    # CRITICAL: Validate user_id matches JWT
    if user_id != current_user_id:
        raise UnauthorizedError("Not authorized to create tasks for this user")

    task = TaskService.create_task(session, user_id, task_create)
    return task
```

### 4. Register Router (src/main.py)
```python
from src.api.v1.endpoints import tasks

app.include_router(tasks.router, prefix="/api", tags=["tasks"])
```

## Testing Patterns

### Unit Test
```python
def test_task_service_create_task(session: Session):
    task_data = TaskCreate(title="Test Task")
    task = TaskService.create_task(session, "user-123", task_data)

    assert task.id is not None
    assert task.user_id == "user-123"
    assert task.title == "Test Task"
```

### Integration Test
```python
def test_create_task_endpoint(authenticated_client: TestClient, mock_user_id: str):
    response = authenticated_client.post(
        f"/api/{mock_user_id}/tasks",
        json={"title": "Test Task", "description": "Test description"}
    )

    assert response.status_code == 201
    data = response.json()
    assert data["data"]["title"] == "Test Task"
```

### User Isolation Test
```python
def test_user_cannot_access_other_user_tasks(
    authenticated_client: TestClient,
    mock_user_id: str,
    mock_user_id_2: str
):
    # Create task as user 1
    response = authenticated_client.post(
        f"/api/{mock_user_id}/tasks",
        json={"title": "User 1 Task"}
    )
    task_id = response.json()["data"]["id"]

    # Try to access as user 2 (should fail)
    response = authenticated_client.get(f"/api/{mock_user_id_2}/tasks/{task_id}")
    assert response.status_code == 403
```

## Security Checklist

- [ ] JWT validation using shared BETTER_AUTH_SECRET
- [ ] User_id validation in all endpoints (JWT vs URL)
- [ ] Proper 401/403 responses for auth failures
- [ ] No cross-user data access
- [ ] Input validation with Pydantic models
- [ ] SQL injection prevention (SQLModel handles this)
- [ ] Proper CORS configuration
- [ ] Environment variables for secrets
- [ ] HTTPS in production

## Documentation Links

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Health Check: http://localhost:8000/api/health

---

**Last Updated**: 2025-12-11
**Phase**: 2 - API Foundation Complete
