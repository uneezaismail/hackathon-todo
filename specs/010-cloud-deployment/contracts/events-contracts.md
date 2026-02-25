# Event Contracts: Phase V - Enterprise-Grade Cloud Infrastructure

**Feature**: 010-cloud-deployment
**Date**: 2026-01-11
**Format**: CloudEvents 1.0 Specification
**Related**: spec.md, data-model.md, api-contracts.md

---

## Overview

This document defines the event schemas for all task-related events published to Apache Kafka. All events follow the CloudEvents 1.0 specification format to ensure interoperability across services.

**CloudEvents Specification**: https://github.com/cloudevents/spec/blob/main/cloudevents/spec.md

### Required CloudEvents Attributes

All events MUST include these required attributes per CloudEvents 1.0:

| Attribute | Type | Description |
|-----------|------|-------------|
| `id` | String | Unique event identifier (UUID v4). Combination of `source` + `id` must be unique |
| `source` | URI-reference | Event producer source (e.g., `/todo-platform/backend-service`) |
| `specversion` | String | CloudEvents specification version (must be "1.0") |
| `type` | String | Event type for routing and processing |

### Optional CloudEvents Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `datacontenttype` | String | MIME type of event data (e.g., `application/json`) |
| `time` | Timestamp | Event occurrence time (ISO 8601, UTC) |
| `datacontentencoding` | String | Encoding of data (e.g., `utf-8`) |

---

## Event Types

### Event Type Naming Convention

Event types use reverse DNS format: `com.hackathon.todo.{category}.{action}`

| Category | Description |
|----------|-------------|
| `task` | Task lifecycle events |
| `alert` | Alert lifecycle events |
| `reminder` | Reminder notification events |
| `system` | System operational events |

---

## Task Events

### Event: task.created

**Description**: Published when a new task is created.

**CloudEvents Attributes**:

```yaml
id:
  type: string
  format: uuid
  description: Unique event identifier
source:
  type: string
  format: uri-reference
  value: /todo-platform/backend-service
specversion:
  type: string
  value: 1.0
type:
  type: string
  value: com.hackathon.todo.task.created
datacontenttype:
  type: string
  value: application/json
time:
  type: string
  format: date-time
  description: ISO 8601 timestamp in UTC
```

**Payload Schema**:

```yaml
type: object
required: [event_version, user_id, task_id, title, status]
properties:
  event_version:
    type: string
    description: Event schema version for backward compatibility
    example: "1.0.0"
  user_id:
    type: string
    description: User identifier for authorization and partitioning
  task_id:
    type: integer
    description: Unique task identifier
  title:
    type: string
    description: Task title
  description:
    type: string
    nullable: true
    description: Task description
  status:
    type: string
    enum: [pending, in_progress, completed]
    description: Task status
  priority:
    type: string
    enum: [low, medium, high, urgent]
    nullable: true
    description: Task priority
  due_date:
    type: string
    format: date-time
    nullable: true
    description: Task due date (UTC)
  recurrence_pattern:
    type: string
    nullable: true
    enum: [DAILY, WEEKLY, MONTHLY, YEARLY, CUSTOM]
    description: Recurrence pattern if applicable
  recurrence_end_date:
    type: string
    format: date-time
    nullable: true
    description: Recurrence end date if applicable
  tags:
    type: array
    items:
      type: string
    nullable: true
    description: Task tags
```

**Kafka Topic**: `task-events` (partition 0-11 by `user_id`)

**Consumers**:
- Alert Service: Schedules alert jobs if task has `due_date`
- Recurring Task Service: Validates recurrence pattern setup
- Notification Service: Logs task creation (optional)

---

### Event: task.updated

**Description**: Published when a task is modified.

**CloudEvents Attributes**:

```yaml
id: <uuid>
source: /todo-platform/backend-service
specversion: 1.0
type: com.hackathon.todo.task.updated
datacontenttype: application/json
time: <iso8601-timestamp>
```

**Payload Schema**:

```yaml
type: object
required: [event_version, user_id, task_id, updated_fields]
properties:
  event_version:
    type: string
    example: "1.0.0"
  user_id:
    type: string
  task_id:
    type: integer
  updated_fields:
    type: array
    items:
      type: string
    description: List of fields that were updated
  previous_values:
    type: object
    description: Previous values of updated fields (for audit)
  current_values:
    type: object
    description: Current values of updated fields
  status:
    type: string
    nullable: true
    enum: [pending, in_progress, completed]
  due_date:
    type: string
    format: date-time
    nullable: true
  priority:
    type: string
    nullable: true
    enum: [low, medium, high, urgent]
```

**Kafka Topic**: `task-updates` (partition 0-5)

**Consumers**:
- Alert Service: Reschedules or cancels alerts if `due_date` changed
- Analytics Service: Updates task metrics (optional future)

---

### Event: task.completed

**Description**: Published when a task is marked complete. **Critical event** for recurring task generation.

**CloudEvents Attributes**:

```yaml
id: <uuid>
source: /todo-platform/backend-service
specversion: 1.0
type: com.hackathon.todo.task.completed
datacontenttype: application/json
time: <iso8601-timestamp>
```

**Payload Schema**:

```yaml
type: object
required: [event_version, user_id, task_id, completed_at, has_recurrence]
properties:
  event_version:
    type: string
    example: "1.0.0"
  user_id:
    type: string
  task_id:
    type: integer
  completed_at:
    type: string
    format: date-time
    description: When task was completed (UTC)
  has_recurrence:
    type: boolean
    description: Whether task has recurrence pattern
  recurrence_pattern:
    type: string
    nullable: true
    description: Recurrence pattern if task is recurring
  next_occurrence:
    type: string
    format: date-time
    nullable: true
    description: Pre-calculated next occurrence date (UTC)
  was_overdue:
    type: boolean
    description: Whether task was completed after due date
```

**Kafka Topic**: `task-events` (partition by `user_id`)

**Consumers**:
- **Recurring Task Service**: **Critical** - Creates next task instance if `has_recurrence=true`
- Alert Service: Cancels all pending alerts for this task
- Analytics Service: Records completion metrics (optional future)

---

### Event: task.deleted

**Description**: Published when a task is soft deleted.

**CloudEvents Attributes**:

```yaml
id: <uuid>
source: /todo-platform/backend-service
specversion: 1.0
type: com.hackathon.todo.task.deleted
datacontenttype: application/json
time: <iso8601-timestamp>
```

**Payload Schema**:

```yaml
type: object
required: [event_version, user_id, task_id, deleted_at]
properties:
  event_version:
    type: string
    example: "1.0.0"
  user_id:
    type: string
  task_id:
    type: integer
  deleted_at:
    type: string
    format: date-time
    description: When task was deleted (UTC)
  was_recurring:
    type: boolean
    description: Whether task was recurring
  had_alerts:
    type: boolean
    description: Whether task had pending alerts
```

**Kafka Topic**: `task-events` (partition by `user_id`)

**Consumers**:
- Alert Service: Cancels all pending alerts for this task
- Recurring Task Service: Stops future instance generation if task was recurring parent

---

## Alert Events

### Event: alert.scheduled

**Description**: Published when an alert job is scheduled via Dapr Jobs API.

**CloudEvents Attributes**:

```yaml
id: <uuid>
source: /todo-platform/alert-service
specversion: 1.0
type: com.hackathon.todo.alert.scheduled
datacontenttype: application/json
time: <iso8601-timestamp>
```

**Payload Schema**:

```yaml
type: object
required: [event_version, user_id, alert_id, task_id, scheduled_at]
properties:
  event_version:
    type: string
    example: "1.0.0"
  user_id:
    type: string
  alert_id:
    type: integer
  task_id:
    type: integer
  scheduled_at:
    type: string
    format: date-time
    description: When alert will fire (UTC)
  notification_channels:
    type: array
    items:
      type: string
      enum: [email, push]
  schedule_id:
    type: string
    description: Dapr job ID
```

**Kafka Topic**: `reminders` (partition 0-2)

**Consumers**:
- Notification Service: Waits for alert time to fire (via Dapr binding)

---

### Event: alert.fired

**Description**: Published when alert job fires at scheduled time.

**CloudEvents Attributes**:

```yaml
id: <uuid>
source: /todo-platform/alert-service
specversion: 1.0
type: com.hackathon.todo.alert.fired
datacontenttype: application/json
time: <iso8601-timestamp>
```

**Payload Schema**:

```yaml
type: object
required: [event_version, user_id, alert_id, task_id, fired_at]
properties:
  event_version:
    type: string
    example: "1.0.0"
  user_id:
    type: string
  alert_id:
    type: integer
  task_id:
    type: integer
  fired_at:
    type: string
    format: date-time
  task_title:
    type: string
  task_due_date:
    type: string
    format: date-time
  notification_channels:
    type: array
    items:
      type: string
      enum: [email, push]
```

**Kafka Topic**: `reminders`

**Consumers**:
- **Notification Service**: **Critical** - Sends email/push notifications

---

### Event: alert.cancelled

**Description**: Published when alert is cancelled (task completed/deleted or user cancelled).

**CloudEvents Attributes**:

```yaml
id: <uuid>
source: /todo-platform/alert-service
specversion: 1.0
type: com.hackathon.todo.alert.cancelled
datacontenttype: application/json
time: <iso8601-timestamp>
```

**Payload Schema**:

```yaml
type: object
required: [event_version, user_id, alert_id, task_id, reason]
properties:
  event_version:
    type: string
    example: "1.0.0"
  user_id:
    type: string
  alert_id:
    type: integer
  task_id:
    type: integer
  reason:
    type: string
    enum: [task_completed, task_deleted, user_cancelled, alert_already_sent]
  cancelled_at:
    type: string
    format: date-time
```

**Kafka Topic**: `reminders`

**Consumers**:
- Notification Service: Stops any pending notification delivery attempts

---

## Notification Events

### Event: notification.sent

**Description**: Published when notification is successfully delivered.

**CloudEvents Attributes**:

```yaml
id: <uuid>
source: /todo-platform/notification-service
specversion: 1.0
type: com.hackathon.todo.notification.sent
datacontenttype: application/json
time: <iso8601-timestamp>
```

**Payload Schema**:

```yaml
type: object
required: [event_version, user_id, alert_id, notification_type, channel]
properties:
  event_version:
    type: string
    example: "1.0.0"
  user_id:
    type: string
  alert_id:
    type: integer
  task_id:
    type: integer
  notification_type:
    type: string
    enum: [deadline_reminder, task_overdue]
  channel:
    type: string
    enum: [email, push]
  sent_at:
    type: string
    format: date-time
  recipient:
    type: string
    description: Email address or push token (masked for security)
```

**Kafka Topic**: `reminders`

**Consumers**:
- Analytics Service: Records notification delivery metrics (optional future)

---

### Event: notification.failed

**Description**: Published when notification delivery fails.

**CloudEvents Attributes**:

```yaml
id: <uuid>
source: /todo-platform/notification-service
specversion: 1.0
type: com.hackathon.todo.notification.failed
datacontenttype: application/json
time: <iso8601-timestamp>
```

**Payload Schema**:

```yaml
type: object
required: [event_version, user_id, alert_id, channel, error_type]
properties:
  event_version:
    type: string
    example: "1.0.0"
  user_id:
    type: string
  alert_id:
    type: integer
  task_id:
    type: integer
  channel:
    type: string
    enum: [email, push]
  error_type:
    type: string
    enum: [invalid_email, smtp_error, push_token_invalid, push_service_down, timeout]
  error_message:
    type: string
    description: Human-readable error message
  failed_at:
    type: string
    format: date-time
  retry_count:
    type: integer
    description: Number of retry attempts
  will_retry:
    type: boolean
    description: Whether system will retry or escalate to secondary channel
```

**Kafka Topic**: `reminders`

**Consumers**:
- Alert Service: May escalate to secondary notification channel (push if email failed)
- Operations: Logs failures for troubleshooting

---

## Event Versioning Strategy

### Version Format
Event versions follow semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes in payload structure (requires consumer update)
- **MINOR**: Non-breaking additions (consumers can ignore new fields)
- **PATCH**: Bug fixes or documentation updates

### Backward Compatibility Rules

1. **Never remove fields** - Only add optional fields in MINOR versions
2. **Never change field types** - Create new field with different name if needed
3. **MAJOR version increment** - Requires all consumers to be updated before deployment
4. **Support multiple versions** - Deploy new event version alongside old version for transition period

### Version Transition Process

1. Create new event schema with incremented version
2. Publish events with both old and new versions (dual publishing)
3. Update consumers to handle new version
4. Monitor consumer processing for 24-48 hours
5. Deprecate old version (mark as deprecated in documentation)
6. Remove old version after 7 days

---

## Kafka Topic Configuration

### Topic Specifications

| Topic | Partitions | Replication Factor | Retention (Local) | Retention (Cloud) | Purpose |
|--------|-------------|-------------------|-------------------|------------------|---------|
| task-events | 12 | 3 | 7 days | 30 days | Task lifecycle events (partitioned by user_id) |
| reminders | 3 | 3 | 7 days | 30 days | Alert and notification events |
| task-updates | 6 | 3 | 7 days | 30 days | Task update events |

### Partitioning Strategy

**task-events**: Hash-based partitioning by `user_id`
- Ensures all events for a user go to same partition
- Maintains event ordering per user
- Allows consumer group to process user events sequentially

**reminders**: Round-robin partitioning
- Lower volume events don't require ordering guarantees
- Simple load distribution across consumers

**task-updates**: Hash-based partitioning by `task_id`
- Maintains ordering of updates for individual tasks
- Allows analytics consumers to track task lifecycle

### Consumer Groups

| Consumer Group | Services | Purpose |
|---------------|-----------|---------|
| recurring-task-consumers | Recurring Task Service | Processes task.completed events |
| alert-consumers | Alert Service | Processes task events to schedule/cancel alerts |
| notification-consumers | Notification Service | Processes reminder events to send notifications |
| analytics-consumers | Analytics Service (future) | Processes all events for metrics |

---

## Idempotency and Exactly-Once Processing

### Event ID Deduplication

All consumers MUST implement idempotency to handle duplicate message delivery (Kafka at-least-once):

**State Store Key Pattern**: `event-processed-{event_id}`

**Processing Logic**:

1. Receive event from Kafka
2. Check Dapr State Store for key `event-processed-{event_id}`
3. If key exists:
   - Skip processing (already processed)
   - Ack message
4. If key doesn't exist:
   - Process event
   - Store key `event-processed-{event_id}` with value `{event_id, processed_at}`
   - Ack message

**TTL Configuration**: State Store entries expire after 7 days to limit storage

### Consumer Implementation Example (Python)

```python
import uuid
from dapr.clients import DaprClient

dapr = DaprClient()

async def process_event(event: dict) -> None:
    event_id = event['id']

    # Check if already processed
    state_key = f"event-processed-{event_id}"
    existing = await dapr.get_state(
        store_name="event-state-store",
        key=state_key
    )

    if existing:
        # Already processed, skip
        return

    # Process event
    await handle_event_logic(event)

    # Mark as processed
    await dapr.save_state(
        store_name="event-state-store",
        states=[{
            "key": state_key,
            "value": json.dumps({
                "event_id": event_id,
                "processed_at": datetime.utcnow().isoformat()
            }),
            "metadata": {"ttlInSeconds": "604800"}  # 7 days
        }]
    )
```

---

## Event Publishing Guidelines

### When to Publish Events

**Backend Service** publishes events:
- After successful task creation (POST /tasks)
- After successful task update (PUT /tasks/{id})
- After successful task completion (PUT /tasks/{id} with status=completed)
- After successful task deletion (DELETE /tasks/{id})

**Alert Service** publishes events:
- After scheduling alert job (POST /alerts/schedule)
- When alert job fires (Dapr Jobs API callback)
- When alert is cancelled (POST /alerts/cancel)

**Notification Service** publishes events:
- After successful notification delivery
- When notification delivery fails

### Publishing Best Practices

1. **Event ID**: Always generate UUID v4 for unique `id` attribute
2. **Timestamp**: Use current UTC time for `time` attribute
3. **Payload Validation**: Validate payload matches schema before publishing
4. **Error Handling**: Log publish failures but don't block API response
5. **Retry Logic**: Use Dapr's built-in retry for transient failures

### Dapr Pub/Sub Publishing Example (Python)

```python
from dapr.clients import DaprClient
import json
from datetime import datetime
import uuid

dapr = DaprClient()

async def publish_task_created_event(user_id: str, task: dict) -> None:
    event_id = str(uuid.uuid4())

    cloud_event = {
        "id": event_id,
        "source": "/todo-platform/backend-service",
        "specversion": "1.0",
        "type": "com.hackathon.todo.task.created",
        "datacontenttype": "application/json",
        "time": datetime.utcnow().isoformat() + "Z",
        "data": {
            "event_version": "1.0.0",
            "user_id": user_id,
            "task_id": task["task_id"],
            "title": task["title"],
            "status": task["status"],
            # ... other fields
        }
    }

    try:
        await dapr.publish_event(
            pubsub_name="kafka-pubsub",
            topic_name="task-events",
            data=json.dumps(cloud_event),
            data_content_type="application/cloudevents+json"
        )
    except Exception as e:
        logger.error(f"Failed to publish event {event_id}: {e}")
        # Don't block - event will be logged for manual retry if needed
```

---

## References

- **CloudEvents Spec**: https://github.com/cloudevents/spec
- **Specification**: spec.md - Full feature requirements
- **Data Model**: data-model.md - Database schema and entities
- **API Contracts**: api-contracts.md - REST API schemas
- **Dapr Pub/Sub**: https://docs.dapr.io/developing-applications/building-blocks/pubsub/
- **Kafka Documentation**: https://kafka.apache.org/documentation/
