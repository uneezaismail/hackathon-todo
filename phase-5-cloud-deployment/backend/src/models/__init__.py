"""
Database models for the FastAPI backend - Phase V.
Exports all models for use in API endpoints and migrations.

Phase V additions:
- Alert: Scheduled task reminders via Dapr Jobs API
- TaskEvent: Event sourcing for task mutations
"""

from .base import TimestampMixin, Base
from .task import Task, TaskBase, TaskCreate, TaskUpdate, TaskResponse
from .tag import Tag
from .task_tag import TaskTag
from .conversation import Conversation
from .message import Message
from .alert import Alert, AlertCreate, AlertUpdate, AlertResponse, DeliveryStatus
from .task_event import TaskEvent, TaskEventCreate, TaskEventResponse, TaskEventQuery

__all__ = [
    # Base
    "TimestampMixin",
    "Base",
    # Task
    "Task",
    "TaskBase",
    "TaskCreate",
    "TaskUpdate",
    "TaskResponse",
    # Tags
    "Tag",
    "TaskTag",
    # Chat
    "Conversation",
    "Message",
    # Phase V: Alert
    "Alert",
    "AlertCreate",
    "AlertUpdate",
    "AlertResponse",
    "DeliveryStatus",
    # Phase V: TaskEvent
    "TaskEvent",
    "TaskEventCreate",
    "TaskEventResponse",
    "TaskEventQuery",
]
