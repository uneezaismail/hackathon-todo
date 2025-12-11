---
name: neon-serverless-postgresql
description: Neon Serverless PostgreSQL integration for Todo application Phase 2 with SQLModel and JWT authentication. Includes connection configuration, database operations, and security validation patterns.
---

# Neon Serverless PostgreSQL for Todo Application

## Instructions

Use this skill when implementing Neon Serverless PostgreSQL integration for the Todo application in Phase 2. Follow these guidelines for proper implementation:

### 1. Connection String Configuration
- Use the specific connection string for the todo-app project
- Include SSL mode requirements for Neon security (sslmode=require)
- Set application_name for monitoring and debugging
- Include statement timeout settings (30 seconds recommended)

### 2. Pool Configuration for Serverless
- Configure pool_size for serverless workloads (5 recommended)
- Set max_overflow for traffic spikes (10 recommended)
- Use pool_pre_ping for connection validation (critical for serverless)
- Set pool_recycle for timeout management (300 seconds recommended)

### 3. Phase 2 JWT Authentication Integration
- Connect to Neon using credentials from JWT validation flow
- Next.js generates JWTs from Better Auth sessions for API calls to FastAPI
- FastAPI validates JWTs using shared BETTER_AUTH_SECRET (HS256 algorithm)
- Ensure user_id from JWT matches URL parameter for security

### 4. Database Schema for Better Auth Integration
- Use Better Auth user_id as foreign key for user identification
- Ensure Neon database schema supports user isolation
- Create proper indexes on user_id for performance and security
- Implement data isolation between users at the application level

### 5. SQLModel Integration
- Use SQLModel for all database operations
- Implement proper field constraints for data validation
- Use parameterized queries to prevent SQL injection
- Follow SQLModel best practices for model relationships

## Examples

### Example 1: Neon Serverless Connection Configuration
```python
# backend/src/core/database.py
from sqlmodel import create_engine
import os

# Neon Serverless PostgreSQL connection string from project
# Project ID: summer-bar-58332935
# Database: neondb
# Role: neondb_owner
# Branch: br-polished-base-a47vynfg
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://neondb_owner:npg_TSQ8nfG4PtZC@ep-mute-moon-a4ueuef7-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&application_name=todo-app"
)

# Create engine with Neon-specific configuration for serverless
engine = create_engine(
    DATABASE_URL,
    pool_size=5,        # Optimal for serverless workloads
    max_overflow=10,    # Allow some overflow during traffic spikes
    pool_pre_ping=True, # Verify connections before use (critical for serverless)
    pool_recycle=300,   # Recycle connections every 5 minutes to handle timeouts
    echo=False,         # Set to True for debugging only
    connect_args={
        "sslmode": "require",           # Required for Neon
        "application_name": "todo-app", # Help with monitoring
        "connect_timeout": 10,          # Connection timeout
        "options": "-c statement_timeout=30000"  # 30 second statement timeout
    }
)
```

### Example 2: Database Model for Better Auth Integration
```python
# backend/src/models/task.py
from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class TaskBase(SQLModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: bool = Field(default=False)

class Task(TaskBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True, nullable=False)  # Better Auth user ID with index for performance
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)  # Index for sorting
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Indexes for performance in Neon Serverless
    # Index on user_id for efficient filtering by user (critical for security)
    # Index on completed for status filtering
    # Index on created_at for chronological sorting

class TaskCreate(TaskBase):
    """Schema for creating a new task"""
    pass

class TaskUpdate(SQLModel):
    """Schema for updating an existing task"""
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: Optional[bool] = None

class TaskResponse(TaskBase):
    """Schema for API responses"""
    id: int
    user_id: str
    created_at: datetime
    updated_at: datetime
```

### Example 3: JWT Validation Dependency
```python
# backend/src/api/deps.py
from fastapi import Depends, HTTPException, status, Request
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

async def get_user_id_from_token(request: Request) -> str:
    """Dependency to extract user_id from JWT token in Authorization header"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        logger.error("Missing or invalid authorization header")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header"
        )

    token = auth_header.split(" ", 1)[1]
    try:
        # Verify the JWT using the JWKS endpoint from Next.js
        # This should validate the token and extract user_id
        # Implementation details would depend on your specific JWT validation setup
        user_data = await verify_jwt(token)  # This function should be implemented elsewhere
        user_id = user_data.get("sub")  # User ID is typically in 'sub' field

        if not user_id:
            logger.error("Invalid token: no user_id found in claims")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: no user_id found"
            )

        logger.info(f"Successfully authenticated user: {user_id}")
        return user_id
    except Exception as e:
        logger.error(f"Invalid token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )
```

### Example 4: Secure API Endpoint with User Validation
```python
# backend/src/api/v1/endpoints/tasks.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List
from sqlmodel import Session
from ...models.task import TaskResponse, TaskCreate, TaskUpdate
from ...services.task_service import TaskService
from ..deps import get_user_id_from_token, get_session
import logging

# Set up logging for API operations
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/{user_id}/tasks", response_model=List[TaskResponse])
async def list_tasks(
    user_id: str,
    current_user_id: str = Depends(get_user_id_from_token),  # JWT-based user validation
    completed: bool = Query(None, description="Filter by completion status"),
    limit: int = Query(50, ge=1, le=100, description="Number of tasks to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    session: Session = Depends(get_session)
):
    """
    List all tasks for the authenticated user with optional filtering
    Phase 2 Security: Validates that URL user_id matches JWT user_id
    """
    # CRITICAL: Validate that the user_id in URL matches the authenticated user from JWT
    if user_id != current_user_id:
        logger.warning(f"Unauthorized access attempt: user {current_user_id} tried to access tasks for user {user_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access these tasks"
        )

    logger.info(f"User {current_user_id} requesting tasks (limit={limit}, offset={offset})")
    tasks = TaskService.get_tasks_by_user(
        session=session,
        user_id=user_id,
        completed=completed,
        limit=limit,
        offset=offset
    )

    logger.info(f"Returning {len(tasks)} tasks for user {current_user_id}")
    return tasks
```

## Best Practices

- Use environment variables for database configuration (DATABASE_URL with Neon connection string)
- Implement connection pooling appropriate for serverless environments (pool_size=5, max_overflow=10)
- Always use SSL connections with sslmode=require for Neon security
- Use application_name in connection string for monitoring and debugging in Neon console
- Set appropriate connection timeouts for serverless functions (10s connection, 30s statement)
- Use pool_pre_ping to verify connections before use (critical for serverless)
- Set pool_recycle to handle serverless timeouts (300 seconds recommended)
- Include statement timeout settings to prevent hanging queries
- Validate Neon environment configuration before application startup
- Handle connection timeouts gracefully with proper error responses
- Use Neon's built-in monitoring and performance insights to optimize queries
- Monitor connection pool usage and adjust settings as needed for traffic patterns
- Include proper error logging for connection issues
- Use consistent application_name for monitoring across services
- Follow Phase 2 security requirements: validate JWT user_id matches URL user_id in all endpoints
- Use Neon-optimized Alembic configuration with proper connection settings for migrations
- Implement proper resource cleanup to avoid connection leaks in serverless environment
- Always use Better Auth user_id for user identification and data isolation
- Validate JWT tokens from Next.js before accessing database records
- Create indexes on user_id field for efficient filtering and security validation
- Implement proper access controls based on user authentication (validate user_id in JWT matches URL)
- Use connection timeouts appropriate for serverless functions (30s statement timeout recommended)
- Include structured logging to track database operations and performance
- Use Neon branch feature for development, staging, and production environments
- Validate Neon environment configuration before application startup
- Use Neon's serverless features like automatic scaling and smart branch management
- Implement proper logging for database operations with structured logging
- Test database operations with concurrent access patterns
- Use parameterized queries to prevent SQL injection (SQLModel handles this automatically)
- Optimize queries using proper indexing and relationship loading strategies for Neon
- Create indexes on frequently queried fields (user_id, created_at, completed status)
- Use Neon-optimized query patterns with proper indexing
- Follow SQLModel best practices for model relationships with proper indexing
- Use appropriate field lengths to prevent oversized data in Neon
- Implement proper default values for timestamps in Neon
- Consider indexing completed field for status filtering in Neon
- Use datetime.utcnow for consistent timestamp generation across Neon instances
- Handle database connection timeouts gracefully with proper error responses in Neon
- Monitor query performance and optimize slow queries with Neon's query insights