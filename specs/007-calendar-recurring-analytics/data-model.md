# Data Model: Calendar View, Recurring Tasks & Analytics

**Feature**: 007-calendar-recurring-analytics
**Date**: 2025-12-27

## Overview

This feature extends the existing `Task` model with recurrence fields. No new tables are required.

## Entity Changes

### Task (Extended)

The existing `Task` model is extended with the following fields for recurring task support:

#### New Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `is_recurring` | boolean | false | Whether this task repeats on a schedule |
| `recurrence_type` | string (enum) | null | Pattern type: "daily", "weekly", "monthly", "yearly" |
| `recurrence_interval` | integer | 1 | Interval between occurrences (e.g., every 2 weeks) |
| `recurrence_days` | string | null | Days for weekly recurrence: "mon,wed,fri" |
| `recurrence_end_date` | date | null | Optional end date for recurrence |
| `max_occurrences` | integer | null | Optional max number of occurrences |
| `parent_task_id` | UUID | null | Links generated instances to original recurring task |
| `occurrence_count` | integer | 0 | Number of occurrences generated from this pattern |

#### Existing Fields (Reference)

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | string | Owner (Better Auth user ID) |
| `title` | string | Task title (1-200 chars) |
| `description` | string | Optional description (max 1000 chars) |
| `completed` | boolean | Completion status |
| `priority` | enum | High, Medium, Low |
| `due_date` | date | Optional due date |
| `created_at` | datetime | Creation timestamp |
| `updated_at` | datetime | Last update timestamp |
| `tags` | string[] | Associated tags (via junction table) |

## Field Constraints

### recurrence_type
- Allowed values: `"daily"`, `"weekly"`, `"monthly"`, `"yearly"`
- Required when `is_recurring = true`
- Null when `is_recurring = false`

### recurrence_interval
- Minimum: 1
- Maximum: 365 (reasonable upper bound)
- Represents: "every N {days|weeks|months|years}"

### recurrence_days
- Format: Comma-separated lowercase day abbreviations
- Valid values: `"mon"`, `"tue"`, `"wed"`, `"thu"`, `"fri"`, `"sat"`, `"sun"`
- Example: `"mon,wed,fri"` for Monday, Wednesday, Friday
- Only applicable when `recurrence_type = "weekly"`
- Null for other recurrence types

### parent_task_id
- References `tasks.id`
- Self-referential foreign key
- Used to link generated instances back to the original recurring task pattern
- Original recurring task has `parent_task_id = null`
- Generated instances have `parent_task_id = <original_task_id>`

## Relationships

```
Task (Recurring Pattern)
├── is_recurring = true
├── parent_task_id = null
└── children: Task[] (generated instances)

Task (Generated Instance)
├── is_recurring = false (instance, not pattern)
├── parent_task_id = <parent_task_id>
└── Inherits title, description, priority from parent at creation
```

## State Transitions

### Recurring Task Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    RECURRING PATTERN                        │
│                                                             │
│  [Created] ──► [Active] ──► [Stopped] ──► [Archived]       │
│                  │                                          │
│                  ▼ (on complete)                            │
│           [Generate Next Instance]                          │
│                  │                                          │
│                  ▼                                          │
│           [New Task Created]                                │
│                  │                                          │
│                  ▼                                          │
│           [Original Marked Complete]                        │
└─────────────────────────────────────────────────────────────┘
```

### Instance States

| State | is_recurring | completed | parent_task_id |
|-------|--------------|-----------|----------------|
| Active Pattern | true | false | null |
| Stopped Pattern | true (with flag) | false | null |
| Pending Instance | false | false | <uuid> |
| Completed Instance | false | true | <uuid> |
| Skipped Instance | false | true (skipped flag) | <uuid> |

## Validation Rules

### Creating a Recurring Task

1. `is_recurring` must be `true`
2. `recurrence_type` must be one of: daily, weekly, monthly, yearly
3. `recurrence_interval` must be >= 1
4. If `recurrence_type = "weekly"`, `recurrence_days` must have at least one day
5. `recurrence_end_date` if provided, must be >= today
6. `max_occurrences` if provided, must be >= 1

### Completing a Recurring Task

1. If `is_recurring = true` and not stopped:
   - Generate next occurrence
   - Increment `occurrence_count`
   - Check `max_occurrences` limit
   - Check `recurrence_end_date`
2. Mark current task as completed
3. Preserve in history

### Stopping Recurrence

1. Set flag to indicate recurrence is stopped
2. Do not delete the task or past completed instances
3. Future completion will not generate new instances

## Database Migration

### Alembic Migration Script

```python
# alembic/versions/xxx_add_recurrence_fields.py

def upgrade():
    # Add columns to tasks table
    op.add_column('tasks', sa.Column('is_recurring', sa.Boolean(),
                                      nullable=False, server_default='false'))
    op.add_column('tasks', sa.Column('recurrence_type', sa.String(10),
                                      nullable=True))
    op.add_column('tasks', sa.Column('recurrence_interval', sa.Integer(),
                                      nullable=False, server_default='1'))
    op.add_column('tasks', sa.Column('recurrence_days', sa.String(27),
                                      nullable=True))
    op.add_column('tasks', sa.Column('recurrence_end_date', sa.Date(),
                                      nullable=True))
    op.add_column('tasks', sa.Column('max_occurrences', sa.Integer(),
                                      nullable=True))
    op.add_column('tasks', sa.Column('parent_task_id', postgresql.UUID(),
                                      nullable=True))
    op.add_column('tasks', sa.Column('occurrence_count', sa.Integer(),
                                      nullable=False, server_default='0'))

    # Add self-referential foreign key
    op.create_foreign_key(
        'fk_tasks_parent_task_id',
        'tasks', 'tasks',
        ['parent_task_id'], ['id'],
        ondelete='SET NULL'
    )

    # Add index for efficient parent lookups
    op.create_index('ix_tasks_parent_task_id', 'tasks', ['parent_task_id'])


def downgrade():
    op.drop_index('ix_tasks_parent_task_id', 'tasks')
    op.drop_constraint('fk_tasks_parent_task_id', 'tasks', type_='foreignkey')
    op.drop_column('tasks', 'occurrence_count')
    op.drop_column('tasks', 'parent_task_id')
    op.drop_column('tasks', 'max_occurrences')
    op.drop_column('tasks', 'recurrence_end_date')
    op.drop_column('tasks', 'recurrence_days')
    op.drop_column('tasks', 'recurrence_interval')
    op.drop_column('tasks', 'recurrence_type')
    op.drop_column('tasks', 'is_recurring')
```

## Indexes

| Index Name | Columns | Purpose |
|------------|---------|---------|
| `ix_tasks_parent_task_id` | parent_task_id | Fast lookup of instances by parent |
| `ix_tasks_user_id_is_recurring` | user_id, is_recurring | Filter recurring patterns by user |

## Analytics Data (Computed, Not Stored)

The following analytics are computed from existing task data, not stored in the database:

### Completion Heatmap Data
- Computed from: `tasks.updated_at` where `completed = true`
- Grouped by: Date
- Aggregation: Count per day

### Recurring Task Statistics
- Completion rate: Completed instances / Total generated instances
- Current streak: Consecutive completions without skips
- Most consistent: Tasks with highest completion rates

### Priority Distribution
- Computed from: `tasks.priority` where `completed = false`
- Grouped by: Priority level

### Tag Usage
- Computed from: `task_tags` joined with `tags`
- Grouped by: Tag name
- Includes: Completion rate per tag
