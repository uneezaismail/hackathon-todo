# Data Model: AI-Powered Todo Chatbot

**Feature**: Phase III AI Chatbot
**Date**: 2025-12-22
**Purpose**: Entity definitions, relationships, and constraints for conversational interface

## Overview

The AI chatbot data model extends Phase 2 architecture with two new entities (`Conversation`, `Message`) while reusing the existing `Task` entity. The design enforces complete user isolation, supports stateless conversation loading, and enables efficient retention cleanup.

## Entity Relationship Diagram

```
User (from Phase 2)
  │
  ├─── 1:N ───> Conversation (NEW)
  │                │
  │                └─── 1:N ───> Message (NEW)
  │
  └─── 1:N ───> Task (EXISTING, extended with priority field)
```

## Entities

### 1. Conversation

**Purpose**: Represents a distinct chat thread between a user and the AI assistant. Uses ChatKit's `thread_id` for frontend integration.

**Table Name**: `conversations`

#### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | Primary Key | Internal conversation identifier |
| `thread_id` | UUID | NOT NULL, UNIQUE | ChatKit's thread ID (links to frontend widget) |
| `user_id` | VARCHAR(255) | NOT NULL, Indexed | Owner of conversation (from JWT, string type) |
| `title` | VARCHAR(255) | NULL | Conversation title (from first message) |
| `is_active` | BOOLEAN | DEFAULT TRUE | Soft delete flag (FALSE = archived) |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | NOT NULL, Default: NOW() | Conversation creation timestamp |
| `updated_at` | TIMESTAMP WITHOUT TIME ZONE | NOT NULL, Default: NOW() | Last message timestamp (updated on new message) |

#### Relationships

- **User** (Many-to-One): Each conversation belongs to one user
  - Foreign Key: `user_id → users.id` (string-based for JWT compatibility)
  - Cascade: `ON DELETE CASCADE` (delete conversations when user deleted)

- **Messages** (One-to-Many): Each conversation contains multiple messages
  - Back-reference from `Message.conversation_id`
  - Cascade: Delete all messages when conversation deleted

#### Constraints

- **Thread ID Uniqueness**: Each thread_id maps to exactly one conversation
  - Ensures ChatKit frontend and backend stay synchronized

- **Business Rule**: Maximum 100 active conversations per user (FR-035)
  - Enforcement: Application logic in conversation creation service
  - Strategy: When limit exceeded, delete oldest inactive conversation first, then oldest active

#### Indexes

```sql
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_thread_id ON conversations(thread_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX idx_conversations_user_created ON conversations(user_id, created_at DESC);
```

**Index Rationale**:
- `user_id`: Fast lookup of user's conversations
- `thread_id`: Fast lookup by ChatKit thread ID (required for widget integration)
- `created_at DESC`: Fast FIFO cleanup (find oldest conversation)
- Composite `(user_id, created_at DESC)`: Optimized query for user's conversations sorted by creation time

#### SQLModel Definition

```python
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from uuid import UUID, uuid4

class Conversation(SQLModel, table=True):
    __tablename__ = "conversations"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    thread_id: UUID = Field(unique=True, nullable=False)  # ChatKit's thread ID
    user_id: str = Field(nullable=False, index=True)  # String for JWT compatibility
    title: str | None = None
    is_active: bool = Field(default=True)  # Soft delete flag
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Relationships
    messages: list["Message"] = Relationship(
        back_populates="conversation",
        cascade_delete=True,
        sa_relationship_kwargs={"lazy": "selectin"}
    )
```

#### Example Queries

**Create new conversation**:
```python
conversation = Conversation(user_id=authenticated_user_id)
session.add(conversation)
await session.commit()
```

**Enforce 100-conversation limit**:
```python
# Count user's conversations
count = await session.scalar(
    select(func.count()).where(Conversation.user_id == user_id)
)

if count >= 100:
    # Delete oldest
    oldest = await session.scalar(
        select(Conversation)
        .where(Conversation.user_id == user_id)
        .order_by(Conversation.created_at.asc())
        .limit(1)
    )
    await session.delete(oldest)
    await session.commit()
```

---

### 2. Message

**Purpose**: Individual chat message within a conversation (user input or AI response). Preserves ChatKit's `item_id` to prevent synchronization issues.

**Table Name**: `messages`

#### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | Primary Key | Internal message identifier |
| `chatkit_item_id` | UUID | NOT NULL, Indexed | ChatKit's message ID (preserves frontend sync) |
| `conversation_id` | UUID | Foreign Key, NOT NULL, Indexed | Parent conversation (references `conversations.id`) |
| `user_id` | VARCHAR(255) | NOT NULL, Indexed | Denormalized owner (for user isolation queries) |
| `role` | VARCHAR(20) | NOT NULL, CHECK IN ('user', 'assistant') | Message sender role |
| `content` | TEXT | NOT NULL | Message text content |
| `tool_calls` | JSONB | NULL | MCP tool invocations (for debugging) |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | NOT NULL, Default: NOW(), Indexed | Message creation timestamp |
| `expires_at` | TIMESTAMP WITHOUT TIME ZONE | NOT NULL | 2-day expiration (created_at + 2 days) |

#### Relationships

- **Conversation** (Many-to-One): Each message belongs to one conversation
  - Foreign Key: `conversation_id → conversations.id`
  - Cascade: `ON DELETE CASCADE` (delete messages when conversation deleted)

#### Constraints

- **Role Validation**: `CHECK (role IN ('user', 'assistant'))`
  - Only two valid roles - enforced at database level

- **User Message Length**: Maximum 2000 characters for user messages (FR-032)
  - Constraint: `CHECK (role != 'user' OR length(content) <= 2000)`
  - No limit for assistant responses (AI may generate long explanations)

- **Retention Policy**: Messages automatically expire after 2 days (FR-021)
  - Enforcement: Scheduled cleanup job (see Retention Service section below)
  - Query: `DELETE FROM messages WHERE expires_at < NOW()`

#### Indexes

```sql
CREATE INDEX idx_messages_chatkit_item_id ON messages(chatkit_item_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at);
```

**Index Rationale**:
- `chatkit_item_id`: Fast lookup by ChatKit message ID (prevents "first message disappears" bug)
- `conversation_id`: Fast filtering by conversation
- `user_id`: Fast user isolation queries (denormalized for performance)
- `created_at`: Fast retention cleanup (find expired messages)
- Composite `(conversation_id, created_at)`: Optimized chronological message loading (most common query)

#### SQLModel Definition

```python
from sqlmodel import SQLModel, Field, Relationship, Column, JSONB
from datetime import datetime, timedelta
from uuid import UUID, uuid4
from enum import Enum

class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"

class Message(SQLModel, table=True):
    __tablename__ = "messages"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    chatkit_item_id: str = Field(index=True)  # Preserved ChatKit ID
    conversation_id: UUID = Field(
        foreign_key="conversations.id",
        nullable=False,
        index=True
    )
    user_id: str = Field(nullable=False, index=True)  # Denormalized for user isolation
    role: MessageRole = Field(nullable=False)
    content: str = Field(nullable=False, max_length=None)  # No limit for assistant
    tool_calls: dict | None = Field(default=None, sa_column=Column(JSONB))  # MCP tool debugging
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        index=True
    )
    expires_at: datetime = Field(
        default_factory=lambda: datetime.utcnow() + timedelta(days=2),
        nullable=False
    )

    # Relationships
    conversation: Conversation = Relationship(back_populates="messages")

    @property
    def is_expired(self) -> bool:
        return datetime.utcnow() > self.expires_at

    @property
    def is_user_message(self) -> bool:
        return self.role == MessageRole.USER

    @property
    def is_assistant_message(self) -> bool:
        return self.role == MessageRole.ASSISTANT
```

#### Validation

**User message length validation (client-side and server-side)**:
```python
from pydantic import BaseModel, Field, field_validator

class CreateMessageRequest(BaseModel):
    conversation_id: UUID | None = None
    message: str = Field(min_length=1, max_length=2000)  # FR-032

    @field_validator("message")
    @classmethod
    def validate_message_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Message cannot be empty")
        return v
```

#### Example Queries

**Save new user message**:
```python
from uuid import uuid4
from datetime import timedelta

user_message = Message(
    chatkit_item_id=str(uuid4()),  # Preserve ChatKit's message ID
    conversation_id=conversation_id,
    user_id=user_id,  # Denormalized for user isolation
    role=MessageRole.USER,
    content=user_input,
    created_at=datetime.utcnow(),
    expires_at=datetime.utcnow() + timedelta(days=2)
)
session.add(user_message)
await session.commit()
```

**Save assistant response**:
```python
assistant_message = Message(
    chatkit_item_id=str(uuid4()),  # Preserve ChatKit's message ID
    conversation_id=conversation_id,
    user_id=user_id,  # Denormalized for user isolation
    role=MessageRole.ASSISTANT,
    content=ai_response,
    tool_calls=tool_calls,  # Optional: MCP tool invocations for debugging
    created_at=datetime.utcnow(),
    expires_at=datetime.utcnow() + timedelta(days=2)
)
session.add(assistant_message)
await session.commit()
```

**Load conversation history (chronological)**:
```python
messages = await session.execute(
    select(Message)
    .where(Message.conversation_id == conversation_id)
    .order_by(Message.created_at.asc())  # Oldest to newest
)
history = messages.scalars().all()
```

**Retention cleanup (delete expired messages)**:
```python
await session.execute(
    delete(Message).where(Message.expires_at < datetime.utcnow())
)
await session.commit()
```

---

### 3. Task (Extended from Phase 2)

**Purpose**: Todo task entity (existing from Phase 2, extended with priority field for chatbot).

**Table Name**: `tasks`

#### New Field (if not already present)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `priority` | VARCHAR(10) | CHECK IN ('high', 'medium', 'low'), Default: 'medium' | Task priority level |

#### Priority Constraint

```sql
ALTER TABLE tasks
ADD COLUMN priority VARCHAR(10) DEFAULT 'medium'
CHECK (priority IN ('high', 'medium', 'low'));
```

#### Priority Enum

```python
from enum import Enum

class TaskPriority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
```

#### Integration with MCP Tools

MCP tools (`add_task`, `update_task`) accept optional `priority` parameter:
- **Detected from natural language** by AI agent (FR-013, FR-014, FR-015)
- **Defaults to medium** if not specified (FR-016)

**Example**:
- User: "add urgent task to fix bug" → Agent detects `priority="high"`
- User: "add task to buy milk" → No indicator → Defaults to `priority="medium"`
- User: "add task to read article when you have time" → Agent detects `priority="low"`

**No structural changes needed** - Task entity already has all CRUD operations via existing `TaskService`.

---

## Database Migrations

### Migration 002: Add Chat Tables (ChatKit-Enhanced)

**File**: `backend/alembic/versions/002_add_chat_tables.py`

```python
"""Add conversations and messages tables for AI chatbot (ChatKit protocol)

Revision ID: 002
Revises: 001
Create Date: 2025-12-22
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from datetime import timedelta

revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Create conversations table with ChatKit fields
    op.create_table(
        'conversations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('thread_id', postgresql.UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column('user_id', sa.VARCHAR(255), nullable=False),
        sa.Column('title', sa.VARCHAR(255), nullable=True),
        sa.Column('is_active', sa.BOOLEAN, server_default='true', nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=False), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=False), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )

    # Indexes for conversations
    op.create_index('idx_conversations_user_id', 'conversations', ['user_id'])
    op.create_index('idx_conversations_thread_id', 'conversations', ['thread_id'])
    op.create_index('idx_conversations_created_at', 'conversations', ['created_at'], postgresql_using='btree', postgresql_ops={'created_at': 'DESC'})
    op.create_index('idx_conversations_user_created', 'conversations', ['user_id', 'created_at'], postgresql_ops={'created_at': 'DESC'})

    # Create messages table with ChatKit fields
    op.create_table(
        'messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('chatkit_item_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('conversation_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', sa.VARCHAR(255), nullable=False),
        sa.Column('role', sa.VARCHAR(20), nullable=False),
        sa.Column('content', sa.TEXT, nullable=False),
        sa.Column('tool_calls', postgresql.JSONB, nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=False), server_default=sa.text('now()'), nullable=False),
        sa.Column('expires_at', sa.TIMESTAMP(timezone=False), nullable=False),
        sa.CheckConstraint("role IN ('user', 'assistant')", name='check_message_role'),
        sa.CheckConstraint("role != 'user' OR length(content) <= 2000", name='check_user_message_length'),
        sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], ondelete='CASCADE'),
    )

    # Indexes for messages
    op.create_index('idx_messages_chatkit_item_id', 'messages', ['chatkit_item_id'])
    op.create_index('idx_messages_conversation_id', 'messages', ['conversation_id'])
    op.create_index('idx_messages_user_id', 'messages', ['user_id'])
    op.create_index('idx_messages_created_at', 'messages', ['created_at'])
    op.create_index('idx_messages_conversation_created', 'messages', ['conversation_id', 'created_at'])

    # Add priority column to tasks table (if not exists)
    op.add_column('tasks', sa.Column('priority', sa.VARCHAR(10), server_default='medium', nullable=False))
    op.create_check_constraint('check_task_priority', 'tasks', "priority IN ('high', 'medium', 'low')")

def downgrade() -> None:
    # Remove priority from tasks
    op.drop_constraint('check_task_priority', 'tasks')
    op.drop_column('tasks', 'priority')

    # Drop messages table
    op.drop_index('idx_messages_conversation_created', 'messages')
    op.drop_index('idx_messages_created_at', 'messages')
    op.drop_index('idx_messages_user_id', 'messages')
    op.drop_index('idx_messages_conversation_id', 'messages')
    op.drop_index('idx_messages_chatkit_item_id', 'messages')
    op.drop_table('messages')

    # Drop conversations table
    op.drop_index('idx_conversations_user_created', 'conversations')
    op.drop_index('idx_conversations_created_at', 'conversations')
    op.drop_index('idx_conversations_thread_id', 'conversations')
    op.drop_index('idx_conversations_user_id', 'conversations')
    op.drop_table('conversations')
```

---

## Service Layer Operations

### Conversation Service

**Responsibilities**:
- Create new conversations with user validation
- Enforce 100-conversation limit (FIFO deletion)
- Load conversation history with security validation
- Update conversation timestamp on new messages

### Message Service

**Responsibilities**:
- Save user and assistant messages
- Validate user message length (2000 chars)
- Load conversation history in chronological order
- Execute retention cleanup (2-day expiration)

### Retention Service

**Responsibilities**:
- Scheduled cleanup job (runs daily)
- Delete messages where `expires_at < NOW()` (2-day expiration)
- Log cleanup metrics (messages deleted)

**Scheduler**: APScheduler or similar cron-like library

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job('cron', hour=2, minute=0)  # Daily at 2 AM
async def cleanup_expired_messages():
    async with get_db_session() as session:
        result = await session.execute(
            delete(Message).where(Message.expires_at < datetime.utcnow())
        )
        await session.commit()
        logger.info(f"Retention cleanup: Deleted {result.rowcount} expired messages")
```

---

## Data Flow

### Chat Request Flow (ChatKit Protocol)

1. **User sends message** → ChatKit widget sends to `POST /api/chatkit`
2. **JWT validation** → Backend extracts and validates user_id from token
3. **ChatKitServer.respond()** → Called with thread, input, context
4. **Load conversation** → Fetch by thread_id, validate user owns it
5. **SQLiteSession** → Loads conversation history from session DB
6. **First message** → Add system context to session
7. **Run agent** → Runner.run_streamed() with MCP tools
8. **Stream events** → ChatKit protocol events (chunk, tool_call, tool_result, done)
9. **Return to client** → ChatKit widget renders streaming response

### New Conversation Flow (ChatKit Protocol)

1. **User initiates chat** → ChatKit widget creates new thread automatically
2. **Thread creation** → ChatKitServer creates Conversation with thread_id
3. **Check conversation limit** → Count user's active conversations
4. **Enforce limit** → If >= 100, delete oldest inactive, then oldest active
5. **First message** → System prompt added to SQLiteSession
6. **AI responds** → Same as chat request flow above
7. **Thread persisted** → Conversation record created with thread_id

---

## Security & Validation

### User Isolation (FR-010, FR-011)

**Conversation Access**:
```python
# ALWAYS validate user owns conversation before operations
async def validate_conversation_access(
    session: AsyncSession,
    conversation_id: UUID,
    user_id: UUID
) -> Conversation:
    conversation = await session.get(Conversation, conversation_id)
    if not conversation:
        raise NotFoundError("Conversation not found")
    if conversation.user_id != user_id:
        raise PermissionError("Unauthorized access to conversation")
    return conversation
```

**Message Creation**:
- All messages linked to conversation via `conversation_id`
- Conversation ownership validated before saving message
- No cross-user message access possible

### Data Integrity

- **Foreign key constraints**: Enforce referential integrity (user → conversation → messages)
- **Cascade deletes**: When user deleted, all conversations and messages deleted
- **Check constraints**: Validate role enum, message length, task priority
- **Indexes**: Prevent table scans, enforce query performance requirements

---

## Testing Strategy

### Unit Tests
- Conversation creation with limit enforcement
- Message validation (role, length)
- Retention cleanup with backdated messages
- Priority field validation

### Integration Tests
- Full chat flow (create conversation, save messages, load history)
- Cross-user isolation (verify users can't access others' conversations)
- Cascading deletes (verify messages deleted when conversation deleted)

### Performance Tests
- Load 500 messages in < 2 seconds (SC-006)
- Concurrent conversation creation (100 users)
- Retention cleanup with large datasets (1M+ messages)

---

## Summary

**New Entities**: 2 (Conversation, Message)
**Extended Entities**: 1 (Task with priority field)
**New Tables**: 2 (conversations, messages)
**New Indexes**: 8 (4 on conversations, 4 on messages)
**Foreign Keys**: 2 (user_id, conversation_id)
**Constraints**: 4 (role enum, message length, priority enum, conversation limit)

**ChatKit-Specific Fields**:
- `Conversation.thread_id`: Links to ChatKit frontend widget
- `Conversation.is_active`: Soft delete for conversation archival
- `Message.chatkit_item_id`: Preserves frontend message ID (prevents sync issues)
- `Message.expires_at`: 2-day automatic expiration
- `Message.tool_calls`: JSONB for MCP tool debugging
- `Message.user_id`: Denormalized for user isolation queries

**Data Model Status**: ✅ Complete - Ready for ChatKit protocol implementation
