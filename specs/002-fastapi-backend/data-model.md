# Data Model: FastAPI Backend Phase II

**Date**: 2025-12-11
**Feature**: 002-fastapi-backend
**Purpose**: Define database schema, entities, relationships, and validation rules for Task management system

---

## Entity Relationship Diagram

```text
┌─────────────────────────────────────────┐
│ Better Auth (External)                  │
│ ┌─────────────────────────────────────┐ │
│ │ User                                │ │
│ │ - id (string, from JWT 'sub' claim)│ │
│ │ - email                             │ │
│ │ - name                              │ │
│ │ - password_hash                     │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
                    │
                    │ Referenced by
                    │ (user_id FK, NOT NULL)
                    ▼
┌─────────────────────────────────────────┐
│ FastAPI Backend (This System)           │
│ ┌─────────────────────────────────────┐ │
│ │ Task (table: tasks)                 │ │
│ │ - id (UUID, PK)                     │ │
│ │ - user_id (string, FK, indexed)    │ │
│ │ - title (string(200), NOT NULL)    │ │
│ │ - description (string(1000), null) │ │
│ │ - completed (boolean, default=false)│ │
│ │ - created_at (datetime, indexed)   │ │
│ │ - updated_at (datetime)            │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Relationship**: `Task.user_id` references `User.id` (external, managed by Better Auth)
**Cardinality**: One User → Many Tasks (1:N)
**Enforcement**: User isolation enforced by application logic (FastAPI dependency injection), not database FK constraint (user table doesn't exist in this database)

---

## Task Entity

### Table Definition

**Table Name**: `tasks`

**Primary Key**: `id` (UUID, auto-generated)

**Columns**:

| Column       | Type           | Nullable | Default          | Constraints                    | Index |
|--------------|----------------|----------|------------------|--------------------------------|-------|
| id           | UUID           | NO       | uuid4()          | PRIMARY KEY                    | PK    |
| user_id      | VARCHAR        | NO       | -                | NOT NULL                       | IX    |
| title        | VARCHAR(200)   | NO       | -                | NOT NULL, CHECK(length >= 1)   | -     |
| description  | VARCHAR(1000)  | YES      | NULL             | -                              | -     |
| completed    | BOOLEAN        | NO       | FALSE            | NOT NULL                       | -     |
| created_at   | TIMESTAMP(TZ)  | NO       | now() UTC        | NOT NULL                       | IX    |
| updated_at   | TIMESTAMP(TZ)  | NO       | now() UTC        | NOT NULL                       | -     |

**Composite Indexes**:
- `IX_tasks_user_id_completed`: Composite index on `(user_id, completed)` for filtered list queries (e.g., "show my pending tasks")

### Field Specifications

#### id (UUID)
- **Purpose**: Unique identifier for each task
- **Type**: UUID (universally unique identifier)
- **Generation**: Auto-generated using `uuid.uuid4()` on creation
- **Format**: Standard UUID string (e.g., `"550e8400-e29b-41d4-a716-446655440000"`)
- **Validation**: Must be valid UUID format (validated by Pydantic and database)
- **Immutable**: Cannot be changed after creation

#### user_id (String)
- **Purpose**: Links task to owning user (foreign key to Better Auth user)
- **Type**: String (variable length, typically 36 chars for UUID)
- **Source**: Extracted from JWT 'sub' claim during authentication
- **Validation**:
  - NOT NULL (every task must have an owner)
  - Must match authenticated user's JWT user_id (enforced by application logic)
- **Index**: Standard B-tree index for fast user-scoped queries (`WHERE user_id = ?`)
- **Security**: All database queries MUST include `user_id` filter (enforced by FastAPI dependencies)

#### title (String)
- **Purpose**: Task title/summary
- **Type**: String with maximum length 200 characters
- **Validation Rules** (from spec FR-005):
  - **Required**: Cannot be null or empty
  - **Min Length**: 1 character
  - **Max Length**: 200 characters
  - **Enforcement**:
    - Pydantic validation (API layer): Rejects requests with invalid titles before database access
    - Database CHECK constraint: `CHECK (char_length(title) >= 1 AND char_length(title) <= 200)`
- **Error Response**: HTTP 400 Bad Request with message "Title is required and cannot be empty" or "Title cannot exceed 200 characters"

#### description (String, Nullable)
- **Purpose**: Optional detailed task description
- **Type**: String with maximum length 1000 characters
- **Nullable**: YES (users can create tasks without descriptions)
- **Validation Rules** (from spec FR-006):
  - **Optional**: Can be null or empty string
  - **Max Length**: 1000 characters when provided
  - **Enforcement**: Pydantic validation (API layer)
- **Default**: NULL (not empty string)
- **Error Response**: HTTP 400 Bad Request with message "Description cannot exceed 1000 characters"

#### completed (Boolean)
- **Purpose**: Task completion status (Pending=False, Completed=True)
- **Type**: Boolean
- **Default**: FALSE (newly created tasks are Pending)
- **Validation Rule** (from spec FR-007):
  - Must be boolean value (true/false)
  - Defaults to FALSE on creation if not explicitly set
- **State Transitions**:
  - Creation: `completed = False` (Pending status)
  - Completion: `completed = True` (user marks task done)
  - Reopening: `completed = False` (user reopens completed task)
- **Filter Values**:
  - "Pending" → filter `WHERE completed = FALSE`
  - "Completed" → filter `WHERE completed = TRUE`

#### created_at (DateTime with Timezone)
- **Purpose**: Timestamp when task was created
- **Type**: TIMESTAMP WITH TIMEZONE (PostgreSQL TIMESTAMPTZ)
- **Timezone**: UTC (all timestamps stored in UTC, converted to local time on client)
- **Auto-Generated**: Set automatically on task creation (`datetime.utcnow()`)
- **Immutable**: Cannot be modified after creation
- **Index**: B-tree index for sorting operations (`ORDER BY created_at DESC`)
- **Default Sort**: Tasks sorted by `created_at DESC` (newest first) unless explicitly overridden
- **Format**: ISO 8601 in API responses (e.g., `"2025-12-11T14:30:00Z"`)

#### updated_at (DateTime with Timezone)
- **Purpose**: Timestamp when task was last modified
- **Type**: TIMESTAMP WITH TIMEZONE (PostgreSQL TIMESTAMPTZ)
- **Timezone**: UTC
- **Auto-Updated**: Set to current UTC time on every update operation
- **Initial Value**: Set to `created_at` value on creation (creation is first update)
- **Update Trigger**: Application logic (no database trigger) - SQLModel handles this via `onupdate` parameter
- **Use Cases**: Audit trail, conflict resolution (last-write-wins), cache invalidation

### Validation Rules Summary

| Field       | Required | Min Length | Max Length | Default | Indexed |
|-------------|----------|------------|------------|---------|---------|
| id          | YES      | -          | -          | uuid4() | PK      |
| user_id     | YES      | 1          | -          | -       | IX      |
| title       | YES      | 1          | 200        | -       | -       |
| description | NO       | 0          | 1000       | NULL    | -       |
| completed   | YES      | -          | -          | FALSE   | -       |
| created_at  | YES      | -          | -          | now()   | IX      |
| updated_at  | YES      | -          | -          | now()   | -       |

---

## User Reference (External Entity)

### Overview
User data is **NOT stored in this backend database**. Users are managed entirely by Better Auth (Next.js frontend) and only referenced by `user_id` in task records.

### User Entity (External)
- **Location**: Better Auth database (separate from this FastAPI backend)
- **Management**: Better Auth handles user registration, login, password resets
- **Authentication**: Better Auth issues JWT tokens with user_id in 'sub' claim
- **Reference**: FastAPI backend only stores `user_id` as string (no user table in backend database)

### User ID Characteristics
- **Type**: String (typically UUID format, but backend treats as opaque string)
- **Source**: JWT token 'sub' claim (validated by python-jose during authentication)
- **Uniqueness**: Guaranteed unique by Better Auth (backend assumes valid user_id)
- **Lifecycle**: User IDs persist indefinitely (no user deletion in Phase II)

### Integration Pattern
```python
# No local User model in backend
# User ID comes from JWT token:

from jose import jwt

payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
user_id: str = payload.get("sub")  # e.g., "550e8400-e29b-41d4-a716-446655440000"

# Use user_id to filter tasks:
tasks = db.query(Task).filter(Task.user_id == user_id).all()
```

### Assumptions (from spec)
1. Better Auth guarantees valid user_id in JWT tokens (no need to verify user exists)
2. User IDs are stable (do not change after creation)
3. User IDs are unique (no collisions)
4. User deletion is out of scope for Phase II (orphaned tasks not a concern)

---

## Indexes

### Purpose
Indexes optimize query performance for common access patterns identified in user stories and success criteria (SC-009: <200ms for 1,000 tasks).

### Index Definitions

#### 1. Primary Key Index (id)
- **Column**: `id`
- **Type**: B-tree (PostgreSQL default for PRIMARY KEY)
- **Purpose**: Unique task identification, fast lookups by ID
- **Query Pattern**: `SELECT * FROM tasks WHERE id = ?`
- **Cardinality**: High (every task has unique ID)
- **Overhead**: Minimal (maintained automatically by PostgreSQL)

#### 2. User ID Index (user_id)
- **Column**: `user_id`
- **Type**: B-tree
- **Purpose**: Fast user-scoped queries (all endpoints filter by user_id)
- **Query Pattern**: `SELECT * FROM tasks WHERE user_id = ?`
- **Cardinality**: Medium (1:N ratio, ~10,000 tasks per user)
- **Critical**: Required for user isolation (all queries include `WHERE user_id = ?`)
- **Performance**: Reduces query time from O(n) table scan to O(log n) index scan

#### 3. Created At Index (created_at)
- **Column**: `created_at`
- **Type**: B-tree
- **Purpose**: Fast sorting by creation date (default sort order)
- **Query Pattern**: `SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC`
- **Cardinality**: High (every task has unique timestamp to millisecond precision)
- **Use Cases**:
  - Default task list sorting (newest first)
  - Ascending sort for chronological view
  - Date range queries (future feature)

#### 4. Composite Index (user_id, completed)
- **Columns**: `(user_id, completed)`
- **Type**: B-tree composite index
- **Purpose**: Optimize filtered list queries (e.g., "show my pending tasks")
- **Query Pattern**: `SELECT * FROM tasks WHERE user_id = ? AND completed = ?`
- **Cardinality**: Medium (user_id) + Low (completed boolean)
- **Performance**: Reduces filtered queries from O(n) to O(log n)
- **Use Cases**:
  - Filter by "Pending" status (most common filter)
  - Filter by "Completed" status
  - User dashboard statistics (count pending/completed)

### Index Strategy Justification

**Why user_id + completed composite index?**
- Most common query: "Get my pending tasks" (`WHERE user_id = ? AND completed = FALSE`)
- Composite index covers both filter columns (no separate scans needed)
- Low overhead (completed is boolean, minimal storage increase)
- Enables covering index optimization (PostgreSQL can return results from index alone)

**Why NOT index description?**
- Low selectivity (description not used in WHERE clauses for Phase II)
- High storage overhead (1000 char strings)
- Full-text search is out of scope for Phase II (deferred to Phase III)

**Why created_at separate from composite?**
- Sorting and filtering use different access patterns
- PostgreSQL can combine indexes (bitmap index scan) when needed
- Separate indexes provide flexibility for different query patterns

---

## Database Schema (SQL)

### PostgreSQL DDL (Generated by Alembic)

```sql
-- Create tasks table with indexes
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL,
    title VARCHAR(200) NOT NULL CHECK (char_length(title) >= 1),
    description VARCHAR(1000),
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);

-- Create indexes for performance
CREATE INDEX ix_tasks_user_id ON tasks (user_id);
CREATE INDEX ix_tasks_created_at ON tasks (created_at);
CREATE INDEX ix_tasks_user_id_completed ON tasks (user_id, completed);

-- Add comments for documentation
COMMENT ON TABLE tasks IS 'User task management table with strict user isolation';
COMMENT ON COLUMN tasks.id IS 'Unique task identifier (UUID v4)';
COMMENT ON COLUMN tasks.user_id IS 'Foreign key to Better Auth user (enforced by application)';
COMMENT ON COLUMN tasks.title IS 'Task title (1-200 characters, required)';
COMMENT ON COLUMN tasks.description IS 'Optional task description (max 1000 characters)';
COMMENT ON COLUMN tasks.completed IS 'Task completion status (false=Pending, true=Completed)';
COMMENT ON COLUMN tasks.created_at IS 'Task creation timestamp (UTC timezone)';
COMMENT ON COLUMN tasks.updated_at IS 'Last modification timestamp (UTC timezone)';
```

### SQLModel Model Definition

```python
from sqlmodel import SQLModel, Field, Index
from datetime import datetime
from typing import Optional
import uuid

class Task(SQLModel, table=True):
    """Task database model with user isolation and validation.

    Represents a user's work item with title, optional description,
    completion status, and automatic timestamps.
    """

    __tablename__ = "tasks"
    __table_args__ = (
        Index("ix_tasks_user_id_completed", "user_id", "completed"),
    )

    # Primary Key
    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        description="Unique task identifier (UUID v4)"
    )

    # Foreign Key (external reference to Better Auth user)
    user_id: str = Field(
        index=True,
        nullable=False,
        description="User ID from Better Auth JWT 'sub' claim"
    )

    # Task Content
    title: str = Field(
        max_length=200,
        min_length=1,
        nullable=False,
        description="Task title (1-200 characters, required)"
    )

    description: Optional[str] = Field(
        default=None,
        max_length=1000,
        nullable=True,
        description="Optional task description (max 1000 characters)"
    )

    # Task Status
    completed: bool = Field(
        default=False,
        nullable=False,
        description="Completion status (false=Pending, true=Completed)"
    )

    # Automatic Timestamps (UTC timezone)
    created_at: datetime = Field(
        default_factory=lambda: datetime.utcnow(),
        nullable=False,
        index=True,
        description="Task creation timestamp (UTC)"
    )

    updated_at: datetime = Field(
        default_factory=lambda: datetime.utcnow(),
        nullable=False,
        sa_column_kwargs={"onupdate": lambda: datetime.utcnow()},
        description="Last modification timestamp (UTC)"
    )

    class Config:
        """SQLModel configuration."""
        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "user_id": "auth0|123456789",
                "title": "Deploy Phase II backend",
                "description": "Complete FastAPI deployment to production",
                "completed": False,
                "created_at": "2025-12-11T14:30:00Z",
                "updated_at": "2025-12-11T14:30:00Z"
            }
        }
```

---

## State Transitions

### Task Lifecycle

```text
┌─────────────┐
│   Created   │
│ completed=F │
└──────┬──────┘
       │
       │ User creates task (POST /api/v1/tasks)
       │ Default: completed = False
       │
       ▼
┌─────────────┐
│   Pending   │ ◄──────┐
│ completed=F │        │
└──────┬──────┘        │
       │               │
       │ User marks    │ User reopens
       │ complete      │ task
       │ (PATCH)       │ (PATCH)
       │               │
       ▼               │
┌─────────────┐        │
│  Completed  │ ───────┘
│ completed=T │
└──────┬──────┘
       │
       │ User deletes task (DELETE /api/v1/tasks/{id})
       │ Permanent removal (no soft delete)
       │
       ▼
┌─────────────┐
│   Deleted   │
│  (removed)  │
└─────────────┘
```

### State Transition Rules

1. **Creation → Pending**: Automatic on task creation (completed defaults to False)
2. **Pending → Completed**: User action via PATCH /api/v1/tasks/{id} with `{"completed": true}`
3. **Completed → Pending**: User action via PATCH /api/v1/tasks/{id} with `{"completed": false}` (reopening)
4. **Any State → Deleted**: User action via DELETE /api/v1/tasks/{id} (permanent removal)

### State Constraints
- **No Soft Delete**: Deleted tasks are permanently removed (no "archived" or "deleted" status)
- **Idempotent Updates**: Setting `completed = true` on already completed task is allowed (no-op)
- **No Intermediate States**: Only two states (Pending/Completed), no "in_progress", "blocked", etc. (deferred to Phase III)

---

## Data Volume & Performance Considerations

### Scale Assumptions (from spec Assumption #10)
- **Max Tasks per User**: 10,000 tasks
- **Expected Avg per User**: ~100-500 tasks
- **Concurrent Users**: 1,000 authenticated users
- **Database Size Estimate**:
  - Task row size: ~500 bytes (UUID + strings + timestamps + overhead)
  - 10,000 users × 1,000 tasks/user × 500 bytes = ~5 GB
  - With indexes: ~7-8 GB total

### Query Performance Targets (from spec SC-009)
- **Filter/Sort Operations**: <200ms for up to 1,000 tasks per user
- **List All Tasks**: <500ms for typical user (100-500 tasks)
- **Single Task Lookup**: <50ms (primary key lookup)

### Index Impact
- **Without Indexes**: O(n) table scan (10,000 tasks = ~200-500ms)
- **With user_id Index**: O(log n) index scan (~1-5ms for user filter)
- **With Composite Index**: O(log n) for filtered queries (~1-5ms for pending tasks)
- **Total Query Time**: Index scan (1-5ms) + Sorting (5-10ms) + Network (10-20ms) = **~20-50ms** (well under 200ms target)

---

## Database Migration (Alembic)

### Initial Migration Script

**File**: `alembic/versions/001_create_tasks_table.py`

```python
"""Create tasks table with indexes

Revision ID: 001
Revises:
Create Date: 2025-12-11

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

# revision identifiers
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create tasks table with all indexes."""
    op.create_table(
        'tasks',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('user_id', sa.String(), nullable=False, index=True),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.String(length=1000), nullable=True),
        sa.Column('completed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.CheckConstraint('char_length(title) >= 1', name='tasks_title_not_empty'),
    )

    # Create indexes
    op.create_index('ix_tasks_user_id', 'tasks', ['user_id'])
    op.create_index('ix_tasks_created_at', 'tasks', ['created_at'])
    op.create_index('ix_tasks_user_id_completed', 'tasks', ['user_id', 'completed'])


def downgrade() -> None:
    """Drop tasks table and all indexes."""
    op.drop_index('ix_tasks_user_id_completed', table_name='tasks')
    op.drop_index('ix_tasks_created_at', table_name='tasks')
    op.drop_index('ix_tasks_user_id', table_name='tasks')
    op.drop_table('tasks')
```

### Migration Commands

```bash
# Apply migration
uv run alembic upgrade head

# Rollback migration (if needed)
uv run alembic downgrade -1

# Check current version
uv run alembic current

# View migration history
uv run alembic history
```

---

**Data Model Status**: ✅ COMPLETE
**Generated**: 2025-12-11
**Next**: Generate contracts/ (OpenAPI spec + request/response schemas)
