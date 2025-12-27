# Data Model Design: Intermediate Level Organization Features

**Feature**: 004-intermediate-features
**Date**: 2025-12-14
**Database**: Neon Serverless PostgreSQL
**ORM**: SQLModel

## Overview

This document defines the database schema changes required to support priority levels, tags, and due dates for tasks. All changes are **additive** and **backward-compatible** with existing Phase II implementation.

---

## Schema Changes Summary

### Modified Tables
1. **tasks** - Add columns for priority and due_date

### New Tables
2. **tags** - Store unique tags per user
3. **task_tags** - Junction table for many-to-many task-tag relationship

### Indexes
- Composite indexes for efficient filtering and sorting
- Foreign key indexes for join performance

---

## Table: tasks (MODIFIED)

### New Columns

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `priority` | TEXT | NOT NULL, CHECK | 'Medium' | Task priority: "High", "Medium", or "Low" |
| `due_date` | DATE | NULL | NULL | Optional task due date (date only, no time) |

### Updated Schema

```sql
CREATE TABLE tasks (
    -- Existing columns (unchanged)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 200),
    description TEXT CHECK (length(description) <= 1000),
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- NEW columns
    priority TEXT NOT NULL DEFAULT 'Medium'
        CHECK (priority IN ('High', 'Medium', 'Low')),
    due_date DATE NULL,

    -- Existing indexes (unchanged)
    INDEX ix_tasks_user_id (user_id),
    INDEX ix_tasks_user_id_completed (user_id, completed),
    INDEX ix_tasks_created_at (created_at),

    -- NEW indexes for filter/sort performance
    INDEX ix_tasks_user_priority (user_id, priority),
    INDEX ix_tasks_user_due_date (user_id, due_date),
    INDEX ix_tasks_user_priority_due (user_id, priority, due_date)
);
```

### SQLModel Definition

```python
from sqlmodel import SQLModel, Field, Index
from datetime import date, datetime
from typing import Optional, Literal
import uuid

PriorityType = Literal["High", "Medium", "Low"]

class Task(SQLModel, table=True):
    __tablename__ = "tasks"
    __table_args__ = (
        Index("ix_tasks_user_id_completed", "user_id", "completed"),
        Index("ix_tasks_user_priority", "user_id", "priority"),
        Index("ix_tasks_user_due_date", "user_id", "due_date"),
        Index("ix_tasks_user_priority_due", "user_id", "priority", "due_date"),
    )

    # Existing fields
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: str = Field(index=True, nullable=False)
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # NEW fields
    priority: PriorityType = Field(default="Medium")
    due_date: Optional[date] = Field(default=None)
```

### Migration Strategy

**Alembic Migration Steps**:
1. Add `priority` column with default 'Medium' (non-breaking)
2. Add `due_date` column as nullable (non-breaking)
3. Create new indexes (non-blocking with CONCURRENTLY)

**Backward Compatibility**:
- Existing tasks get default priority='Medium' and due_date=NULL
- No data loss or corruption
- Old API clients continue to work (new fields optional)

---

## Table: tags (NEW)

### Purpose
Store unique tags created by users for categorizing tasks.

### Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique tag identifier |
| `user_id` | TEXT | NOT NULL, INDEX | Owner of this tag (foreign key to auth users) |
| `name` | TEXT | NOT NULL | Tag name (e.g., "work", "urgent") |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT | When tag was first created |

**Unique Constraint**: `UNIQUE(user_id, name)` - Each user can have each tag name only once

```sql
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (user_id, name),
    INDEX ix_tags_user_id (user_id),
    INDEX ix_tags_user_name (user_id, name)
);
```

### SQLModel Definition

```python
class Tag(SQLModel, table=True):
    __tablename__ = "tags"
    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_tags_user_name"),
        Index("ix_tags_user_id", "user_id"),
        Index("ix_tags_user_name", "user_id", "name"),
    )

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: str = Field(nullable=False)
    name: str = Field(min_length=1, max_length=50)
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

---

## Table: task_tags (NEW)

### Purpose
Junction table for many-to-many relationship between tasks and tags.

### Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `task_id` | UUID | FOREIGN KEY, PRIMARY KEY (composite) | Reference to tasks.id |
| `tag_id` | UUID | FOREIGN KEY, PRIMARY KEY (composite) | Reference to tags.id |

```sql
CREATE TABLE task_tags (
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,

    PRIMARY KEY (task_id, tag_id),
    INDEX ix_task_tags_tag_id (tag_id)
);
```

### SQLModel Definition

```python
class TaskTag(SQLModel, table=True):
    __tablename__ = "task_tags"
    __table_args__ = (
        Index("ix_task_tags_tag_id", "tag_id"),
    )

    task_id: uuid.UUID = Field(foreign_key="tasks.id", primary_key=True, ondelete="CASCADE")
    tag_id: uuid.UUID = Field(foreign_key="tags.id", primary_key=True, ondelete="CASCADE")
```

### Cascade Behavior
- **ON DELETE CASCADE on task_id**: When a task is deleted, remove all its tag associations
- **ON DELETE CASCADE on tag_id**: When a tag is deleted, remove all task associations

---

## Entity Relationships

```
┌──────────────────┐
│      tasks       │
├──────────────────┤
│ id (PK)          │
│ user_id          │──┐
│ title            │  │
│ description      │  │
│ completed        │  │
│ priority (NEW)   │  │
│ due_date (NEW)   │  │
│ created_at       │  │
│ updated_at       │  │
└──────────────────┘  │
         │            │
         │ 1          │
         │            │
         │ M          │
         ▼            │
┌──────────────────┐  │
│   task_tags      │  │
├──────────────────┤  │
│ task_id (PK,FK)  │  │
│ tag_id (PK,FK)   │  │
└──────────────────┘  │
         │            │
         │ M          │
         │            │
         │ 1          │
         ▼            │
┌──────────────────┐  │
│      tags        │  │
├──────────────────┤  │
│ id (PK)          │  │
│ user_id          │──┘ (same user owns tasks and tags)
│ name             │
│ created_at       │
└──────────────────┘
```

**Cardinality**:
- One Task has Many TaskTag associations (1:M)
- One Tag has Many TaskTag associations (1:M)
- One Task has Many Tags (M:M via task_tags)
- One Tag belongs to Many Tasks (M:M via task_tags)

---

## Index Strategy

### Performance Goals
- Filter by priority: <100ms for 1000 tasks
- Filter by tags: <100ms for 1000 tasks
- Sort by due_date: <100ms for 1000 tasks
- Autocomplete tags: <50ms

### Index Design

| Index Name | Columns | Purpose |
|------------|---------|---------|
| `ix_tasks_user_id` | (user_id) | User isolation (existing) |
| `ix_tasks_user_id_completed` | (user_id, completed) | Status filter (existing) |
| `ix_tasks_created_at` | (created_at) | Sort by creation date (existing) |
| `ix_tasks_user_priority` | (user_id, priority) | **NEW**: Filter by priority |
| `ix_tasks_user_due_date` | (user_id, due_date) | **NEW**: Sort by due date |
| `ix_tasks_user_priority_due` | (user_id, priority, due_date) | **NEW**: Combined filter/sort |
| `ix_tags_user_id` | (user_id) | Tag ownership lookup |
| `ix_tags_user_name` | (user_id, name) | **NEW**: Tag autocomplete |
| `ix_task_tags_tag_id` | (tag_id) | **NEW**: Reverse tag lookup |

**Composite Index Usage**:
- `(user_id, priority, due_date)` supports queries filtering by any prefix:
  - `WHERE user_id = ?`
  - `WHERE user_id = ? AND priority = ?`
  - `WHERE user_id = ? AND priority = ? AND due_date = ?`

---

## Query Patterns

### 1. Get Tasks with Tags
```sql
SELECT t.*, ARRAY_AGG(tg.name) as tags
FROM tasks t
LEFT JOIN task_tags tt ON t.id = tt.task_id
LEFT JOIN tags tg ON tt.tag_id = tg.id
WHERE t.user_id = :user_id
GROUP BY t.id;
```

### 2. Filter by Priority and Tags
```sql
SELECT DISTINCT t.*
FROM tasks t
LEFT JOIN task_tags tt ON t.id = tt.task_id
LEFT JOIN tags tg ON tt.tag_id = tg.id
WHERE t.user_id = :user_id
  AND t.priority = :priority
  AND (tg.name = ANY(:tag_names) OR :tag_names IS NULL)
ORDER BY t.due_date ASC NULLS LAST;
```

### 3. Tag Autocomplete
```sql
SELECT name, COUNT(*) as usage_count
FROM tags t
JOIN task_tags tt ON t.id = tt.tag_id
WHERE t.user_id = :user_id
  AND t.name ILIKE :search_pattern
GROUP BY t.id, name
ORDER BY usage_count DESC, name ASC
LIMIT 10;
```

---

## Data Validation Rules

### Priority
- **Values**: "High", "Medium", "Low" (case-sensitive)
- **Default**: "Medium"
- **Validation**: CHECK constraint + Pydantic enum

### Due Date
- **Format**: ISO 8601 date (YYYY-MM-DD)
- **Range**: Any valid date (past, present, future allowed)
- **Nullable**: Yes (optional field)
- **Validation**: DATE type enforces valid dates

### Tags
- **Name Length**: 1-50 characters
- **Characters**: Alphanumeric + spaces + hyphens (a-zA-Z0-9 -_)
- **Uniqueness**: Per user (user cannot have duplicate tag names)
- **Case Sensitivity**: Case-insensitive matching for autocomplete

---

## Migration Script (Alembic)

```python
"""Add priority, due_date, and tags support

Revision ID: 004_intermediate_features
Revises: previous_revision
Create Date: 2025-12-14
"""
from alembic import op
import sqlalchemy as sa

def upgrade() -> None:
    # Add priority column to tasks
    op.add_column('tasks', sa.Column(
        'priority',
        sa.Text(),
        nullable=False,
        server_default='Medium'
    ))
    op.create_check_constraint(
        'ck_tasks_priority',
        'tasks',
        "priority IN ('High', 'Medium', 'Low')"
    )

    # Add due_date column to tasks
    op.add_column('tasks', sa.Column(
        'due_date',
        sa.Date(),
        nullable=True
    ))

    # Create tags table
    op.create_table(
        'tags',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.Text(), nullable=False),
        sa.Column('name', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'name', name='uq_tags_user_name'),
        sa.CheckConstraint("length(name) >= 1 AND length(name) <= 50", name='ck_tags_name_length')
    )

    # Create task_tags junction table
    op.create_table(
        'task_tags',
        sa.Column('task_id', sa.UUID(), nullable=False),
        sa.Column('tag_id', sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('task_id', 'tag_id')
    )

    # Create indexes
    op.create_index('ix_tasks_user_priority', 'tasks', ['user_id', 'priority'])
    op.create_index('ix_tasks_user_due_date', 'tasks', ['user_id', 'due_date'])
    op.create_index('ix_tasks_user_priority_due', 'tasks', ['user_id', 'priority', 'due_date'])
    op.create_index('ix_tags_user_id', 'tags', ['user_id'])
    op.create_index('ix_tags_user_name', 'tags', ['user_id', 'name'])
    op.create_index('ix_task_tags_tag_id', 'task_tags', ['tag_id'])

def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_task_tags_tag_id')
    op.drop_index('ix_tags_user_name')
    op.drop_index('ix_tags_user_id')
    op.drop_index('ix_tasks_user_priority_due')
    op.drop_index('ix_tasks_user_due_date')
    op.drop_index('ix_tasks_user_priority')

    # Drop tables
    op.drop_table('task_tags')
    op.drop_table('tags')

    # Drop columns from tasks
    op.drop_column('tasks', 'due_date')
    op.drop_column('tasks', 'priority')
```

---

## Storage Estimates

**For 1000 tasks per user**:
- Tasks table: +16 bytes per row (priority TEXT ~10 bytes, due_date DATE 4 bytes)
  - Total: 16 KB additional
- Tags table: Assume 20 unique tags per user
  - ~50 bytes per tag × 20 = 1 KB
- TaskTags: Assume average 2 tags per task
  - 32 bytes (2 UUIDs) × 2000 associations = 64 KB

**Total additional storage**: ~81 KB per 1000 tasks (negligible)

---

**Design Complete**: 2025-12-14
**Next Phase**: API Contracts Design
**Status**: ✅ Schema ready for implementation
