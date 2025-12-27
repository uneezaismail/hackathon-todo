# Research & Architectural Decisions: FastAPI Backend Phase II

**Date**: 2025-12-11
**Feature**: 002-fastapi-backend
**Purpose**: Document research findings and architectural decisions for production-ready FastAPI backend implementation

---

## 1. JWT Validation with Shared Secret (HS256)

### Research Question
What is the best practice for validating JWT tokens issued by Better Auth (Next.js) in a FastAPI backend?

### Decision
Use **shared BETTER_AUTH_SECRET** with **HS256 algorithm** (symmetric signing/validation) via python-jose library.

### Rationale
- Both Next.js frontend (Better Auth) and FastAPI backend are **controlled services** (same organization, same security boundary)
- Symmetric signing (HS256) is simpler to implement and manage than asymmetric keys (RS256)
- Shared secret approach eliminates need for public key distribution and rotation complexity
- python-jose is the de facto standard JWT library for Python, well-maintained and widely adopted
- Better Auth uses HS256 by default for JWT tokens, aligning with this approach

### Alternatives Considered

#### RS256 (Asymmetric Keys)
- **Pros**: Better security if private key is compromised (public key can still validate), supports distributed systems with untrusted clients
- **Cons**: Unnecessary complexity for trusted service-to-service authentication, requires public key distribution and rotation infrastructure
- **Rejected Because**: Adds complexity without security benefit for controlled backend-to-frontend architecture

#### OAuth 2.0 Token Introspection
- **Pros**: Centralized token validation, supports revocation checks
- **Cons**: Requires additional network call to auth server on every request (latency penalty), increases system complexity
- **Rejected Because**: Violates stateless requirement (FR-013) and adds latency to every request

### Implementation Pattern
```python
from jose import jwt, JWTError
import os

SECRET_KEY = os.getenv("BETTER_AUTH_SECRET")
ALGORITHM = "HS256"

def verify_jwt_token(token: str) -> dict:
    """Validate JWT token and return payload."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

### Security Considerations
- SECRET_KEY stored in environment variable (never committed to git)
- Token expiration validated automatically by python-jose
- Signature verification prevents tampering
- User ID extracted from 'sub' claim and validated against URL parameters

### References
- [python-jose Documentation](https://python-jose.readthedocs.io/)
- [FastAPI Security Best Practices](https://fastapi.tiangolo.com/tutorial/security/)
- [Better Auth JWT Plugin](https://www.better-auth.com/docs/concepts/jwt)

---

## 2. SQLModel Database Patterns

### Research Question
How should we define database models and API schemas to minimize duplication and maximize type safety?

### Decision
Use **SQLModel** for unified Pydantic validation and SQLAlchemy ORM capabilities (single source of truth for models and schemas).

### Rationale
- **Single Source of Truth**: SQLModel models serve as both database tables (SQLAlchemy) and API schemas (Pydantic)
- **Type Safety**: Full Python type hints with IDE autocomplete and mypy --strict enforcement
- **Less Boilerplate**: Eliminates duplication between SQLAlchemy models and Pydantic schemas
- **FastAPI Integration**: Seamless integration with FastAPI request/response validation
- **Creator Endorsement**: Created by FastAPI author (Sebastián Ramírez) specifically for FastAPI projects

### Alternatives Considered

#### Plain SQLAlchemy + Separate Pydantic Models
- **Pros**: Mature ecosystem, battle-tested, more examples available
- **Cons**: Requires maintaining duplicate model definitions (one for DB, one for API), error-prone when schemas diverge
- **Rejected Because**: Duplication violates DRY principle and increases maintenance burden

#### Tortoise ORM
- **Pros**: Async-first design, Pydantic integration via pydantic-tortoise
- **Cons**: Smaller ecosystem than SQLAlchemy, fewer resources/examples, less mature
- **Rejected Because**: SQLModel provides SQLAlchemy's maturity while maintaining async support

### Implementation Pattern
```python
from sqlmodel import SQLModel, Field, create_engine
from datetime import datetime
from typing import Optional
import uuid

class Task(SQLModel, table=True):
    """Task model - used for both database table and API schema."""
    __tablename__ = "tasks"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: str = Field(index=True, nullable=False)
    title: str = Field(max_length=200, min_length=1)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

### Best Practices
- Use `Field()` for column metadata (indexes, constraints, defaults)
- Separate read/write schemas when needed (TaskCreate, TaskUpdate, TaskResponse)
- Leverage Pydantic validation for business logic (min/max length, custom validators)
- Use `Optional[T]` for nullable fields (explicit over implicit)
- Index foreign keys (user_id) and frequently filtered/sorted columns (created_at)

### References
- [SQLModel Documentation](https://sqlmodel.tiangolo.com/)
- [SQLModel with FastAPI Tutorial](https://sqlmodel.tiangolo.com/tutorial/fastapi/)
- [Alembic with SQLModel](https://alembic.sqlalchemy.org/en/latest/cookbook.html#building-an-up-to-date-database-from-scratch)

---

## 3. Neon Serverless PostgreSQL Connection Pooling

### Research Question
What are the optimal connection pool settings for Neon Serverless PostgreSQL to balance performance and cost?

### Decision
Use **pool_size=5, max_overflow=10, pool_pre_ping=True** (from spec FR-020).

### Rationale
- **Neon Serverless Behavior**: Scales down to zero when idle, charges per active connection hour
- **Small Base Pool**: pool_size=5 minimizes idle connection costs while handling typical request load
- **Overflow Buffer**: max_overflow=10 allows temporary burst handling (up to 15 total connections) without permanent allocation
- **Connection Health**: pool_pre_ping=True validates connections before use (prevents stale connection errors after Neon scale-down)
- **Industry Practice**: Common pattern for serverless databases (AWS RDS Proxy, Supabase recommend similar settings)

### Alternatives Considered

#### Larger Pool (20+ connections)
- **Pros**: Better handling of sustained high load, fewer pool exhaustion events
- **Cons**: Higher idle connection costs (Neon charges per connection), unnecessary for Phase II scale (1,000 concurrent users)
- **Rejected Because**: Violates cost optimization goal for serverless architecture

#### External Pooler (PgBouncer)
- **Pros**: Connection pooling outside application, supports transaction-level pooling
- **Cons**: Additional infrastructure to manage, deployment complexity, not needed for Phase II scale
- **Rejected Because**: Over-engineering for Phase II requirements (defer to Phase III if needed)

#### Connection Per Request
- **Pros**: Simplest approach, no pool management
- **Cons**: High connection overhead (Neon connection time ~50-100ms), exhausts database connections under load
- **Rejected Because**: Violates performance requirements (SC-001: <500ms p95 latency)

### Implementation Pattern
```python
from sqlmodel import create_engine
import os

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(
    DATABASE_URL,
    pool_size=5,           # Base connection pool size
    max_overflow=10,       # Allow up to 15 total connections (5 + 10 overflow)
    pool_pre_ping=True,    # Validate connections before use (health check)
    echo=False,            # Disable SQL logging in production
    pool_recycle=3600,     # Recycle connections after 1 hour (prevents stale connections)
)
```

### Performance Impact
- **Connection Reuse**: Reduces overhead by 50-100ms per request (no connection establishment)
- **Burst Handling**: Overflow allows temporary spikes without connection exhaustion
- **Health Checks**: pool_pre_ping prevents 500ms penalty for stale connection retries

### Cost Impact
- **Base Cost**: 5 connections × $0.10/hour (example) = $0.50/hour baseline
- **Peak Cost**: 15 connections (during overflow) × $0.10/hour = $1.50/hour maximum
- **Savings**: ~70% cheaper than 20-connection static pool

### References
- [Neon Connection Pooling Guide](https://neon.tech/docs/connect/connection-pooling)
- [SQLAlchemy Engine Configuration](https://docs.sqlalchemy.org/en/20/core/engines.html#sqlalchemy.create_engine)
- [Serverless Database Best Practices](https://blog.cloudflare.com/the-serverless-database/)

---

## 4. Alembic Migration Strategy

### Research Question
How should we manage database schema changes and migrations for SQLModel with PostgreSQL?

### Decision
Use **Alembic** for schema migrations, **SQLModel** for model definitions (Alembic detects SQLModel changes via autogenerate).

### Rationale
- **Industry Standard**: Alembic is the de facto migration tool for SQLAlchemy (which SQLModel builds on)
- **Version Control**: Migration scripts stored in git, enabling rollback and auditability
- **Autogenerate**: Alembic detects model changes automatically (reduces manual SQL writing)
- **SQLModel Integration**: SQLModel models are SQLAlchemy tables, Alembic works seamlessly
- **Zero-Downtime**: Supports additive migrations (add columns with defaults, create indexes concurrently)

### Alternatives Considered

#### Manual SQL Scripts
- **Pros**: Direct control over SQL, no abstraction overhead
- **Cons**: No version tracking, no rollback support, error-prone, requires manual dependency management
- **Rejected Because**: Lacks safety mechanisms and automation required for production system

#### Django ORM Migrations
- **Pros**: Integrated with Django ORM, strong autogenerate capabilities
- **Cons**: Requires Django framework (heavyweight for FastAPI backend), not compatible with SQLModel
- **Rejected Because**: Tech stack constraint (Constitution Section 4: FastAPI + SQLModel required)

### Implementation Pattern

**Alembic Initialization**:
```bash
alembic init alembic
# Creates alembic/ directory with env.py and alembic.ini
```

**Configure env.py for SQLModel**:
```python
from sqlmodel import SQLModel
from src.models.task import Task  # Import all models

# Set target metadata for autogenerate
target_metadata = SQLModel.metadata
```

**Create Migration**:
```bash
alembic revision --autogenerate -m "Create tasks table"
# Generates alembic/versions/xxx_create_tasks_table.py
```

**Review and Apply**:
```bash
# ALWAYS review autogenerated migration before applying
cat alembic/versions/xxx_create_tasks_table.py

# Apply migration
alembic upgrade head
```

### Migration Workflow Best Practices
1. **Always Review Autogenerate**: Alembic's autogenerate is not perfect (may miss renames, index changes)
2. **Test Migrations**: Run migrations on dev database before production
3. **Additive Changes**: Prefer adding nullable columns (can backfill later) over breaking changes
4. **Concurrent Index Creation**: Use `op.create_index(..., postgresql_concurrently=True)` for zero-downtime
5. **Rollback Plan**: Test `alembic downgrade -1` before each release

### Zero-Downtime Migration Example
```python
# Bad: Breaks old code if not deployed simultaneously
op.alter_column('tasks', 'title', new_column_name='task_title')

# Good: Additive change, old code still works
op.add_column('tasks', sa.Column('priority', sa.Integer(), nullable=True, server_default='0'))
```

### References
- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [SQLModel with Alembic Guide](https://sqlmodel.tiangolo.com/tutorial/alembic/)
- [Zero-Downtime Migrations](https://www.braintreepayments.com/blog/safe-operations-for-high-volume-postgresql/)

---

## 5. User Data Isolation Pattern

### Research Question
How can we guarantee user data isolation at the FastAPI dependency level to prevent cross-user data access bugs?

### Decision
Implement **get_current_user_id** FastAPI dependency that extracts user_id from JWT and auto-injects into all protected endpoints.

### Rationale
- **Dependency Injection**: FastAPI dependencies run before endpoint logic (impossible to forget validation)
- **Single Source of Truth**: User ID extraction happens once per request, reused across all endpoint logic
- **Type Safety**: Dependency returns typed user_id (str), enforced by mypy --strict
- **Security by Default**: All endpoints requiring user context must explicitly depend on get_current_user_id
- **Testability**: Dependencies can be overridden in tests (mock user IDs for testing)

### Alternatives Considered

#### Manual Validation in Each Endpoint
- **Pros**: Explicit and clear, no "magic" dependency injection
- **Cons**: Error-prone (easy to forget), code duplication, not DRY
- **Rejected Because**: High risk of security bugs from forgotten validation (violates FR-002, FR-003)

#### Middleware-Based User Context
- **Pros**: Automatic for all requests, no endpoint changes needed
- **Cons**: Global state (not thread-safe), unclear where user_id comes from (harder to test)
- **Rejected Because**: FastAPI dependencies provide better type safety and explicitness

### Implementation Pattern

**auth/dependencies.py**:
```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import os

security = HTTPBearer()
SECRET_KEY = os.getenv("BETTER_AUTH_SECRET")
ALGORITHM = "HS256"

async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """Extract and validate user ID from JWT token.

    Returns:
        user_id (str): User ID from JWT 'sub' claim

    Raises:
        HTTPException 401: Invalid/expired/missing token
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID"
            )
        return user_id
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token signature or expired"
        )
```

**api/v1/tasks.py** (usage):
```python
from fastapi import APIRouter, Depends
from src.auth.dependencies import get_current_user_id
from src.services.task_service import TaskService

router = APIRouter()

@router.get("/tasks")
async def list_tasks(
    current_user_id: str = Depends(get_current_user_id),  # Auto-injected
    task_service: TaskService = Depends()
):
    """List tasks for authenticated user ONLY."""
    # current_user_id is guaranteed to be valid JWT user ID
    return await task_service.get_user_tasks(user_id=current_user_id)
```

### User ID Validation Pattern
For endpoints with user_id in URL path (e.g., GET /api/v1/users/{user_id}/tasks):
```python
@router.get("/users/{url_user_id}/tasks")
async def list_user_tasks(
    url_user_id: str,
    current_user_id: str = Depends(get_current_user_id),
):
    """List tasks for specific user (must match JWT user_id)."""
    if url_user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource"
        )
    # Validation passed, proceed with user-scoped query
    return await task_service.get_user_tasks(user_id=current_user_id)
```

### Testing Strategy
```python
# tests/conftest.py - Override dependency for testing
def override_get_current_user_id():
    return "test-user-id"

@pytest.fixture
def client():
    app.dependency_overrides[get_current_user_id] = override_get_current_user_id
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
```

### References
- [FastAPI Dependencies](https://fastapi.tiangolo.com/tutorial/dependencies/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/)
- [Dependency Injection Best Practices](https://fastapi.tiangolo.com/advanced/advanced-dependencies/)

---

## 6. Error Response Standardization

### Research Question
How should we ensure consistent JSON error responses across all API endpoints matching spec FR-011?

### Decision
Implement **custom exception handlers** returning `{"data": null, "error": {"message": "...", "code": "..."}}` format for all errors.

### Rationale
- **Consistent Client Experience**: Frontend always receives same error structure (simplifies error handling)
- **Spec Compliance**: Matches FR-011 requirement exactly
- **Centralized Logic**: Exception handlers defined once, applied globally
- **Detailed Error Codes**: Supports machine-readable error codes (e.g., "INVALID_TITLE_LENGTH", "UNAUTHORIZED")
- **Security**: Prevents internal error details leaking to clients (FR-012)

### Alternatives Considered

#### Default FastAPI Error Format
- **Pros**: No custom code needed, FastAPI handles automatically
- **Cons**: Different format than spec requirement (`{"detail": "error"}` instead of `{"data": null, "error": {...}}`)
- **Rejected Because**: Doesn't match spec FR-011 format requirement

#### Per-Endpoint Error Handling
- **Pros**: Maximum flexibility per endpoint
- **Cons**: Inconsistent error formats across endpoints, code duplication
- **Rejected Because**: Violates DRY and increases risk of format inconsistencies

### Implementation Pattern

**main.py** (global exception handlers):
```python
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from src.services.exceptions import TaskNotFoundError, UnauthorizedError

app = FastAPI()

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic validation errors (400 Bad Request)."""
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "data": None,
            "error": {
                "message": "Validation error",
                "code": "VALIDATION_ERROR",
                "details": exc.errors()  # Include Pydantic validation details
            }
        }
    )

@app.exception_handler(TaskNotFoundError)
async def task_not_found_handler(request: Request, exc: TaskNotFoundError):
    """Handle task not found errors (404 Not Found)."""
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={
            "data": None,
            "error": {
                "message": str(exc),
                "code": "TASK_NOT_FOUND"
            }
        }
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Handle unexpected errors (500 Internal Server Error)."""
    # Log full error server-side (not exposed to client)
    logger.error(f"Unexpected error: {exc}", exc_info=True)

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "data": None,
            "error": {
                "message": "Internal server error",
                "code": "INTERNAL_ERROR"
            }
        }
    )
```

**services/exceptions.py** (custom exceptions):
```python
class TaskNotFoundError(Exception):
    """Raised when task does not exist."""
    pass

class UnauthorizedError(Exception):
    """Raised when user lacks permission."""
    pass
```

### Success Response Pattern
```python
# Consistent success format
{
    "data": {
        "id": "uuid",
        "title": "Task title",
        ...
    },
    "error": None
}
```

### References
- [FastAPI Exception Handlers](https://fastapi.tiangolo.com/tutorial/handling-errors/)
- [Custom Exception Handling](https://fastapi.tiangolo.com/advanced/custom-response/)

---

## 7. API Versioning Strategy

### Research Question
How should we version the API to support future breaking changes while maintaining backward compatibility?

### Decision
Use **URL-based versioning** with `/api/v1/` prefix (single version for Phase II, structure allows future v2).

### Rationale
- **Simplicity**: Phase II has single API version, URL prefix is simplest approach
- **Explicit**: Version visible in URL, easy for frontend developers to understand
- **RESTful**: Aligns with REST best practices for versioning
- **Future-Proof**: Structure supports future `/api/v2/` without breaking v1 clients
- **Spec Alignment**: Out of Scope section states "Phase II uses a single API version (/api/v1)"

### Alternatives Considered

#### Header-Based Versioning
- **Pros**: Cleaner URLs, version in Accept header (e.g., `Accept: application/vnd.api.v1+json`)
- **Cons**: Harder to test (requires custom headers), less discoverable, more complex
- **Rejected Because**: Over-engineering for Phase II (defer to Phase III if needed)

#### Query Parameter Versioning
- **Pros**: Easy to add to existing URLs
- **Cons**: Not RESTful, pollutes query parameters, harder to enforce
- **Rejected Because**: Poor practice, violates REST principles

### Implementation Pattern

**main.py** (API router organization):
```python
from fastapi import FastAPI
from src.api.v1 import tasks, health

app = FastAPI()

# Version 1 API
app.include_router(tasks.router, prefix="/api/v1", tags=["tasks"])
app.include_router(health.router, prefix="/api", tags=["health"])  # Health check not versioned
```

**api/v1/tasks.py**:
```python
from fastapi import APIRouter

router = APIRouter()

@router.post("/tasks")  # Full path: POST /api/v1/tasks
async def create_task(...):
    pass

@router.get("/tasks")  # Full path: GET /api/v1/tasks
async def list_tasks(...):
    pass
```

### Future v2 Migration Path
When breaking changes are needed (Phase III):
1. Create `api/v2/` directory with new implementation
2. Keep `api/v1/` running for backward compatibility
3. Deprecate v1 with sunset headers: `Sunset: Sat, 31 Dec 2025 23:59:59 GMT`
4. Announce deprecation 6 months before sunset
5. Remove v1 after sunset date

### References
- [REST API Versioning Best Practices](https://restfulapi.net/versioning/)
- [FastAPI Multiple Routers](https://fastapi.tiangolo.com/tutorial/bigger-applications/)

---

## Summary: Research Complete

All technical unknowns resolved. Key decisions:

1. **JWT Validation**: python-jose with shared secret HS256 (simpler than RS256 for controlled services)
2. **Database Models**: SQLModel for unified models and schemas (eliminates duplication)
3. **Connection Pooling**: pool_size=5, max_overflow=10 (optimized for Neon Serverless cost/performance)
4. **Migrations**: Alembic with autogenerate (industry standard, version-controlled)
5. **User Isolation**: FastAPI dependency injection for get_current_user_id (security by default)
6. **Error Handling**: Custom exception handlers for consistent JSON format (spec FR-011 compliance)
7. **API Versioning**: URL-based /api/v1/ prefix (simple, future-proof)

**Next Phase**: Generate data-model.md, contracts/, and quickstart.md based on these architectural decisions.

**ADRs Required**:
- `/sp.adr "JWT Shared Secret Authentication Strategy"`
- `/sp.adr "SQLModel for Database Models"`
- `/sp.adr "Neon Serverless PostgreSQL Connection Pooling"`

---

**Research Status**: ✅ COMPLETE
**Generated**: 2025-12-11
