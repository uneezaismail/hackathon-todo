# Data Model: Phase V - Enterprise-Grade Cloud Infrastructure

**Feature**: 010-cloud-deployment
**Date**: 2026-01-11
**Related**: research.md, spec.md

---

## Core Entities

### Task Entity

**Purpose**: Represents a user task with CRUD operations, optional recurring pattern, and alert scheduling.

**Attributes**:
- `task_id`: Primary key (auto-incrementing integer)
- `user_id`: Foreign key to Users table (Better Auth) - user isolation
- `title`: Task title/description
- `description`: Detailed task description
- `status`: Task status (pending, in_progress, completed)
- `priority`: Task priority (low, medium, high, urgent)
- `due_date`: Optional due date/timestamp
- `completed_at`: When task was completed
- `created_at`: When task was created
- `updated_at`: When task was last modified
- `is_deleted`: Boolean flag for soft deletion

**Validation Rules**:
- `user_id` must be provided for all task operations
- `title` is required, max 255 characters
- `priority` defaults to 'medium' if not specified

---

### RecurringTask Entity

**Purpose**: Defines recurrence pattern for automatically generating task instances.

**Attributes**:
- `recurring_task_id`: Primary key (auto-incrementing integer)
- `user_id`: Foreign key to Users table - user isolation
- `parent_task_id`: References original Task if created from recurring pattern
- `pattern_type`: Simplified pattern (DAILY, WEEKLY, MONTHLY, YEARLY) or CUSTOM
- `rrule_expression`: RRULE pattern string (RFC 5545 simplified format)
- `interval`: Numeric interval (e.g., every N days)
- `byday`: Day constraint for CUSTOM patterns (comma-separated: "MO,WE,FR")
- `byhour`: Hour constraint for CUSTOM patterns (comma-separated: 0-23)
- `recurrence_end_date`: Optional end date for recurrence (NULL if no end)
- `total_occurrences`: Total instances to generate (NULL if unlimited)

**Validation Rules**:
- At least one of `pattern_type`, `rrule_expression`, or `interval` must be specified
- `recurrence_end_date` must be >= `created_at`
- Invalid RRULE patterns rejected at task creation time (NFR-008)

---

### TaskInstance Entity

**Purpose**: Represents a specific occurrence of a recurring task.

**Attributes**:
- `task_instance_id`: Primary key (auto-incrementing integer)
- `recurring_task_id`: Foreign key to RecurringTask
- `occurrence_date`: Date/time for this specific instance (UTC timezone)
- `status`: Instance status (pending, completed, skipped)
- `is_deleted`: Boolean flag for soft deletion

**Validation Rules**:
- `occurrence_date` >= parent task's `created_at`
- `status` transitions: pending → completed → next instance generation triggered
- No direct modification of RecurringTask allowed after creation

---

### Alert Entity

**Purpose**: Represents a scheduled notification for a task deadline.

**Attributes**:
- `alert_id`: Primary key (auto-incrementing integer)
- `task_id`: Foreign key to Task entity
- `user_id`: Foreign key to Users table - user isolation
- `alert_time`: Scheduled alert time (UTC timezone)
- `alert_processed`: Boolean flag indicating if alert was sent
- `notification_channels`: Array of channels to send (email, push)
- `delivery_status`: Status of delivery (pending, sent, failed)
- `delivery_attempts`: Number of delivery attempts made
- `last_delivery_attempt_at`: Timestamp of last delivery attempt
- `failed_reason`: Reason for failure if delivery failed

**Validation Rules**:
- `task_id` must have `due_date` set
- `alert_time` must be >= `due_date` for pre-deadline alerts
- `delivery_attempts` incremented after each delivery attempt
- Alert cancelled if task completed before `alert_time` (FR-009)

---

### TaskEvent Entity

**Purpose**: Represents a message published to Kafka for task lifecycle events.

**Attributes**:
- `event_id`: Unique identifier (UUID v4)
- `event_type`: Event category (task.created, task.updated, task.completed, task.deleted)
- `user_id`: Foreign key to Users table - user isolation in event processing
- `task_id`: Foreign key to Task entity
- `payload`: JSON-serialized event data
- `occurred_at`: Event timestamp (UTC timezone)
- `event_version`: Event schema version for backward compatibility

**Event Types**:
- `task.created`: Published when a new task is created
- `task.updated`: Published when a task is modified
- `task.completed`: Published when a task is marked complete
- `task.deleted`: Published when a task is deleted

**Validation Rules**:
- `event_id` generated as UUID v4 for uniqueness
- `user_id` always included for authorization
- `payload` must be valid JSON
- `event_version` starts at "1.0.0" and increments on breaking changes

---

### AlertSchedule Entity

**Purpose**: Represents scheduled alert jobs managed by Alert Service.

**Attributes**:
- `schedule_id`: Primary key (auto-incrementing integer)
- `alert_id`: Foreign key to Alert entity
- `scheduled_at`: When to fire the alert (UTC timezone)
- `job_status`: Status of the scheduled job (pending, fired, cancelled, failed)
- `fired_at`: Timestamp when the job was executed
- `failure_reason`: Reason if job failed to fire

**Validation Rules**:
- Jobs can be cancelled if task completed or deleted (FR-009)
- Jobs are scheduled via Dapr Jobs API
- `scheduled_at` must be >= current time (no past alerts)

---

## Indexes and Performance

### Recommended Indexes (PostgreSQL)

**Task Table**:
- PRIMARY INDEX: `task_pkey` (task_id) - `user_id`
- INDEX ON `user_id` for user isolation queries
- INDEX ON `status`, `created_at`, `due_date` for filtering
- INDEX ON `priority` for task filtering
- INDEX ON `is_deleted` for excluding deleted tasks

**RecurringTask Table**:
- PRIMARY INDEX: `recurring_task_id` - `user_id`
- INDEX ON `user_id` for user isolation queries
- INDEX ON `recurrence_end_date` for cleanup queries

**TaskInstance Table**:
- PRIMARY INDEX: `task_instance_id` - `recurring_task_id`
- FOREIGN KEY: `recurring_task_id` → RecurringTask.recurring_task_id
- INDEX ON `occurrence_date`, `status` for instance management

**Alert Table**:
- PRIMARY INDEX: `alert_id` - `task_id`
- FOREIGN KEY: `task_id` → Task.task_id
- INDEX ON `task_id`, `alert_time`, `alert_processed` for efficient querying
- INDEX ON `delivery_status` for monitoring failed deliveries

**TaskEvent Table**:
- PRIMARY INDEX: `event_id`
- INDEX ON `event_type`, `user_id` for efficient consumer filtering
- INDEX ON `occurred_at` for time-based queries
- PARTITION STRATEGY: Use `user_id` hash for Kafka partitioning

### Performance Optimizations

**Query Performance**:
- Use connection pooling for database queries
- Implement read replicas for Task/RecurringTask tables
- Cache frequently accessed data (e.g., user preferences)

**Kafka Performance**:
- 12 partitions by `user_id` balances load across consumers
- Consumer group size: 2-3 consumers per consumer group
- Batch size: 100 messages per batch
- Compression: Snappy or LZ4 for larger payloads

---

## Migration Strategy (Phase IV → Phase V)

### Database Schema Migrations

**Phase IV Tables** (Existing):
- `users` (Better Auth)
- `tasks` (Task)

**Phase V Additions** (New Fields):
- `tasks` table additions:
  - `recurrence_pattern` (VARCHAR(50))
  - `recurrence_end_date` (TIMESTAMP WITH TIME ZONE)
  - `next_occurrence` (TIMESTAMP WITH TIME ZONE)
  - `parent_task_id` (BIGINT, nullable)

**Migration Approach**:
1. **Create migration scripts** using Alembic
   - Add new columns to existing `tasks` table
   - Handle NULL values gracefully for existing tasks
   - Set default values for new fields

2. **Create new tables** using Alembic
   - `recurring_tasks` table
   - `task_instances` table (partitioned by `user_id`)
   - `alerts` table
   - `task_events` table (partitioned by `user_id`)
   - `alert_schedules` table

3. **Data backfill** for recurring tasks
   - If user has existing tasks, ask if they want to convert any to recurring
   - Do not auto-convert existing tasks

**Rollback Plan**:
- Database backup before migration
- Test migrations on staging environment
- Deploy in blue-green fashion
- Monitor for 24 hours after migration
- Automatic rollback on schema validation errors

---

## Relationships Summary

```
┌─────────────┐
│   User    │
│   ├─ id (PK)   │
│   ├─ email       │
│   └─ name       │
└─────────────┘
       │
       ├────────────────────────┐
       │  RecurringTask             │
       │  ├─ id (PK)            │
       │  ├─ user_id (FK → User)   │
       │  ├─ pattern_type              │
       │  ├─ rrule_expression         │
       │  ├─ recurrence_end_date       │
       │  └─ total_occurrences       │
       └────────────────────────┘
              │
              ├────────────────────────┐
              │         TaskInstance         │
              │         ├─ id (PK)            │
              │         ├─ recurring_task_id (FK → RecurringTask) │
              │         ├─ occurrence_date         │
              │         ├─ status               │
              │         └─ is_deleted           │
              └────────────────────────┘
       │
       ├────────────────────────┐
       │           Alert           │
       │           ├─ id (PK)             │
       │           ├─ task_id (FK → Task) │
       │           ├─ alert_time            │
       │           ├─ alert_processed       │
       │           ├─ notification_channels   │
       │           └─ delivery_status       │
       └────────────────────────┘
              │
       ├────────────────────────┐
       │         TaskEvent         │
       │         ├─ id (PK)             │
       │         ├─ event_type            │
       │         ├─ user_id (FK → User)   │
       │         ├─ task_id (FK → Task)   │
       │         ├─ payload              │
       │         ├─ occurred_at           │
       │         └─ event_version         │
       └────────────────────────┘
       │
```

---

## Data Consistency Rules

### User Isolation (Constitution Section VI)

**Rule 1**: All database queries MUST filter by `user_id`
**Rule 2**: All Kafka messages MUST include `user_id` in payload
**Rule 3**: All service invocations MUST pass `user_id` in headers/body
**Rule 4**: Event consumers MUST validate `user_id` before processing

### Idempotency (Constitution Section V - Microservices Patterns)

**Rule 1**: All Kafka consumers MUST check for duplicate `event_id`
**Rule 2**: Task creation MUST use idempotency key to prevent duplicates
**Rule 3**: Alert delivery MUST track `alert_id` to prevent duplicate notifications

### Transaction Integrity

**Rule 1**: Task updates within single transaction
**Rule 2**: Related entities (Task + TaskInstance) updated atomically
**Rule 3**: Alert status updates use optimistic locking to prevent race conditions

---

## References

- **Research**: research.md - Technology decisions and rationale
- **Specification**: spec.md - Feature requirements and clarifications
- **Constitution**: .specify/memory/constitution.md - All Phase V mandatory requirements
- **Skills**:
  - dapr-integration - Dapr building blocks
  - kafka-event-driven - Event-driven architecture
  - microservices-patterns - Service communication patterns
  - rrule-recurring-tasks - RRULE parsing and next occurrence
  - kubernetes-helm-deployment - Helm chart configurations
  - terraform-infrastructure - IaC provisioning
