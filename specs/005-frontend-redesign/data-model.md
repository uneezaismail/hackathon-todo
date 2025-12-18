# Phase 1: Data Model

**Feature**: Frontend Redesign For Todo App
**Date**: 2025-12-16
**Purpose**: Define entities, relationships, and validation rules for task management system

## Entity: Task

**Description**: Represents a user's to-do item with description, status, and timestamps.

### Attributes

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, NOT NULL, AUTO-GENERATED | Unique identifier for the task |
| `user_id` | String | NOT NULL, FOREIGN KEY → user.id | References authenticated user who owns this task |
| `title` | String | NOT NULL, LENGTH(1-200) | Task title |
| `description` | String | NULLABLE, LENGTH(0-1000) | Task description text |
| `completed` | Boolean | NOT NULL, DEFAULT=false | Task completion status |
| `priority` | Enum | NOT NULL, DEFAULT='Medium' | Task priority: 'High', 'Medium', 'Low' |
| `due_date` | Date | NULLABLE | Task due date (ISO 8601: YYYY-MM-DD) |
| `tags` | List[String] | AUTO-POPULATED | List of tags associated with the task |
| `created_at` | Timestamp | NOT NULL, AUTO-GENERATED | When task was created (UTC) |
| `updated_at` | Timestamp | NOT NULL, AUTO-UPDATED | When task was last modified (UTC) |

### Validation Rules

1. **Title**:
   - MUST NOT be empty string or whitespace-only
   - MUST be between 1 and 200 characters (inclusive)
   - Trimmed of leading/trailing whitespace before storage

2. **Description**:
   - Optional, max 1000 characters

3. **Status**:
   - `completed`: Boolean

4. **Priority**:
   - MUST be one of: `High`, `Medium`, `Low`

5. **User Isolation**:
   - All task queries MUST filter by `user_id`
   - Cannot read/modify tasks belonging to other users

6. **Timestamps**:
   - `created_at` is immutable after creation
   - `updated_at` automatically updates on any modification

### State Transitions

```
pending (completed=false) ←→ completed (completed=true)
```

**Allowed Transitions**:
- `pending → completed`: User marks task as done
- `completed → pending`: User reverts task to active

### Indexes

```sql
-- Primary key index (auto-created)
PRIMARY KEY (id)

-- User isolation index (critical for performance)
INDEX idx_tasks_user_id ON tasks(user_id)

-- Compound index for filtered queries (user + completed)
INDEX ix_tasks_user_id_completed ON tasks(user_id, completed)

-- Timestamp index for sorting (most recent first)
INDEX idx_tasks_created_at ON tasks(created_at DESC)
```

**Rationale**:
- `idx_tasks_user_id`: All queries filter by user_id (user isolation requirement)
- `ix_tasks_user_id_completed`: Supports filter views (All/Active/Completed)
- `idx_tasks_created_at`: Enables efficient sorting

### Backend Implementation (SQLModel)

```python
# In backend/src/models/task.py
from sqlmodel import SQLModel, Field, Index
from datetime import datetime, date
from enum import Enum
from uuid import UUID, uuid4
from typing import Optional, List

class PriorityType(str, Enum):
    High = "High"
    Medium = "Medium"
    Low = "Low"

class TaskBase(SQLModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: bool = Field(default=False)
    priority: PriorityType = Field(default=PriorityType.Medium)
    due_date: Optional[date] = Field(default=None)

class Task(TaskBase, table=True):
    __tablename__ = "tasks"
    __table_args__ = (Index("ix_tasks_user_id_completed", "user_id", "completed"),)

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: str = Field(index=True, nullable=False)
    created_at: datetime
    updated_at: datetime

class TaskCreate(TaskBase):
    tags: List[str] = Field(default_factory=list)

class TaskUpdate(SQLModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: Optional[bool] = None
    priority: Optional[PriorityType] = None
    due_date: Optional[date] = None
    tags: Optional[List[str]] = None

class TaskResponse(TaskBase):
    id: UUID
    user_id: str
    created_at: datetime
    updated_at: datetime
    tags: List[str] = Field(default_factory=list)
```

### Frontend Implementation (TypeScript)

```typescript
// In frontend/types/task.ts
export type Priority = 'High' | 'Medium' | 'Low'

export interface Task {
  id: string; // UUID
  userId: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: Priority;
  due_date: string | null; // YYYY-MM-DD
  tags: string[];
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface TaskCreate {
  title: string;
  description?: string | null;
  priority?: Priority;
  due_date?: string | null;
  tags?: string[];
}

export interface TaskUpdate {
  title?: string;
  description?: string | null;
  completed?: boolean;
  priority?: Priority;
  due_date?: string | null;
  tags?: string[];
}
```

## Entity: User (Existing)

**Description**: Authenticated user managed by Better Auth. Tasks reference this entity via `user_id` foreign key.

### Relevant Attributes (from Better Auth schema)

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Primary key, referenced by tasks.user_id |
| `email` | String | User email (unique) |
| `name` | String | Display name |
| `createdAt` | Timestamp | Account creation date |

**Note**: User management (signup, login, password reset) is handled by Better Auth. This feature only reads user.id for task ownership.

## Relationships

```
User (Better Auth)
  ↓ 1:N
Task (This Feature)
```

**Relationship Rules**:
- One user can have many tasks (1:N)
- Each task belongs to exactly one user (mandatory foreign key)
- Deleting a user should cascade delete their tasks (configured at database level)

## Aggregated Entity: TaskStatistics

**Description**: Derived metrics calculated from Task entity. Not stored in database, computed on-demand.

### Attributes

| Field | Type | Calculation |
|-------|------|-------------|
| `total` | Integer | COUNT(*) WHERE user_id = {user_id} |
| `completed` | Integer | COUNT(*) WHERE user_id = {user_id} AND completed = true |
| `pending` | Integer | COUNT(*) WHERE user_id = {user_id} AND completed = false |

### Frontend Implementation

```typescript
// In frontend/types/task.ts
export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
}
```

## Security Considerations

1. **User Isolation**: All queries MUST include `WHERE user_id = {authenticated_user_id}`
2. **JWT Validation**: Backend dependency ensures token validity before any database access
3. **SQL Injection**: SQLModel parameterized queries prevent injection attacks
4. **XSS Prevention**: Task descriptions are plain text only, escaped in React rendering

---

**Data Model Status**: ✅ COMPLETE
**Next Phase**: API Contracts (OpenAPI schema)