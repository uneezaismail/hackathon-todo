# Research: AI-Powered Todo Chatbot

**Feature**: Phase III AI Chatbot
**Date**: 2025-12-22
**Purpose**: Technology decisions and integration patterns for stateless conversational AI

## 1. OpenAI Agents SDK Integration

### Decision
Use **OpenAI Agents SDK** (`openai-agents` Python package) with `Runner.run_streamed()` and `stream_agent_response()`.

### Rationale
- **Official SDK**: `openai-agents` is the official Python library with streaming support
- **Streaming**: `Runner.run_streamed()` enables real-time response streaming
- **Agent Context**: `AgentContext` passes thread, store, and request context to tools
- **Session Memory**: `SQLiteSession` maintains conversation history per thread

### Integration Pattern
```python
from agents import Runner, SQLiteSession
from chatkit.agents import AgentContext, stream_agent_response

class TaskChatKitServer(ChatKitServer):
    async def respond(self, thread, input, context) -> AsyncIterator[ThreadStreamEvent]:
        user_id = context.get("user_id")
        if not user_id:
            return

        # Create session for conversation memory (user + thread)
        session = SQLiteSession(f"user_{user_id}_thread_{thread.id}", "chat_sessions.db")

        # Add system context for first message
        if not await session.get_items():
            await session.add_items([{
                "role": "system",
                "content": f"The user's name is {context.get('user_name', 'there')}. "
                          f"NEVER mention user_id ({user_id}) in responses."
            }])

        # Run agent with streaming AND session
        async with self.mcp_server:
            result = Runner.run_streamed(
                self.agent,
                user_message,  # String input (required with session)
                context=AgentContext(thread=thread, store=self.store, request_context=context),
                session=session,  # Enables conversation memory
            )
            async for event in stream_agent_response(context, result):
                yield event
```

### Key Configuration
- **Model**: `gpt-4o-mini` (fast, cost-effective)
- **Timeout**: 30 seconds
- **Context**: `user_id` and `user_name` passed via context
- **Session**: SQLiteSession for per-thread memory

### Multi-Provider Factory
```python
class LLMProvider(Enum):
    OPENAI = "openai"
    GEMINI = "gemini"
    GROQ = "groq"
    OPENROUTER = "openrouter"

class TodoAgent:
    PROVIDER_CONFIGS = {
        LLMProvider.OPENAI: {"model": "gpt-4o-mini", "api_key": "OPENAI_API_KEY"},
        LLMProvider.GEMINI: {"model": "gemini-2.5-flash", "api_key": "GEMINI_API_KEY"},
        LLMProvider.GROQ: {"model": "llama-3.3-70b-versatile", "api_key": "GROQ_API_KEY"},
        LLMProvider.OPENROUTER: {"model": "openai/gpt-4o-mini", "api_key": "OPENROUTER_API_KEY"},
    }
```

**Selected**: OpenAI Agents SDK for streaming and session memory support.

---

## 2. Official MCP Python SDK

### Decision
Use **Official MCP Python SDK** (`mcp` Python package) for implementing Model Context Protocol server and tools.

### Rationale
- **Standard Compliance**: Official SDK ensures compliance with MCP specification
- **Tool Registration**: Simple decorator-based tool registration pattern
- **Type Safety**: Built-in validation for tool input/output schemas using Pydantic
- **Security**: User context support for validating tool calls against authenticated user
- **Compatibility**: Designed to work seamlessly with OpenAI Agents SDK tool calling

### Tool Implementation Pattern
```python
from mcp import MCPServer, tool
from pydantic import BaseModel

server = MCPServer(name="todo-task-server")

class AddTaskInput(BaseModel):
    user_id: str
    title: str
    description: str | None = None
    priority: str | None = None

class AddTaskOutput(BaseModel):
    task_id: str
    status: str
    message: str

@server.tool(name="add_task")
async def add_task_tool(input: AddTaskInput, context: dict) -> AddTaskOutput:
    # Validate user_id against authenticated user from context
    if input.user_id != context.get("user_id"):
        raise PermissionError("User validation failed")

    # Delegate to existing TaskService (service layer reuse)
    task = await task_service.create_task(
        user_id=input.user_id,
        title=input.title,
        description=input.description,
        priority=input.priority or "medium"
    )

    return AddTaskOutput(
        task_id=str(task.id),
        status="success",
        message=f"Created task '{task.title}'"
    )
```

### Tool Registration
All 5 tools follow the same pattern:
1. Define Pydantic input schema with `user_id` required
2. Define Pydantic output schema (JSON-serializable)
3. Decorate function with `@server.tool(name="snake_case_name")`
4. Validate user_id against context
5. Delegate to existing service layer (`TaskService`)
6. Return structured response

### Security Pattern
```python
def validate_user(input_user_id: str, context: dict) -> None:
    """Validate tool call is authorized for user."""
    authenticated_user_id = context.get("user_id")
    if not authenticated_user_id:
        raise AuthenticationError("No user context provided")
    if input_user_id != authenticated_user_id:
        raise PermissionError("User ID mismatch - unauthorized access attempt")
```

### Alternatives Considered
- **Custom Tool Implementation**: Would require writing JSON schema validation, routing logic, error handling from scratch
- **Third-Party MCP Libraries**: Unofficial, less maintained, compatibility risks
- **Direct Function Calls**: Would bypass MCP standard, lose tool introspection capabilities

**Selected**: Official MCP Python SDK for standard compliance, security, and developer experience.

---

## 3. OpenAI ChatKit Protocol Integration

### Decision
Use **OpenAI ChatKit Protocol** with official `ChatKitServer` backend and `@openai/chatkit-react` frontend.

### Rationale
- **Official Protocol**: `ChatKitServer` handles threads, messages, widgets, and persistence automatically
- **Frontend**: Official ChatKit React components with JWT authentication
- **Memory**: SQLiteSession for conversation context within threads
- **Multi-Provider**: Factory pattern supports OpenAI, Gemini, Groq, OpenRouter

### Backend: ChatKitServer
```python
from chatkit.server import ChatKitServer, ThreadMetadata, ThreadStreamEvent
from chatkit.agents import AgentContext, stream_agent_response
from agents import Runner, SQLiteSession

class TaskChatKitServer(ChatKitServer):
    def __init__(self, store: Store, session_db_path: str = "chat_sessions.db"):
        super().__init__(store)
        self.todo_agent = TodoAgent()
        self.agent = self.todo_agent.get_agent()
        self.mcp_server = self.todo_agent.mcp_server
        self.session_db_path = session_db_path

    async def respond(self, thread, input, context) -> AsyncIterator[ThreadStreamEvent]:
        user_id = context.get("user_id")
        if not user_id:
            return

        session = SQLiteSession(f"user_{user_id}_thread_{thread.id}", self.session_db_path)

        # First message: add system context
        if not await session.get_items():
            await session.add_items([{
                "role": "system",
                "content": f"The user's name is {context.get('user_name', 'there')}. "
                          f"NEVER mention user_id ({user_id}) in responses."
            }])

        async with self.mcp_server:
            result = Runner.run_streamed(
                self.agent, user_message,
                context=AgentContext(thread=thread, store=self.store, request_context=context),
                session=session,
            )
            async for event in stream_agent_response(context, result):
                yield event
```

### Frontend: ChatKit Widget
```typescript
import { useChatKit, ChatKit } from "@openai/chatkit-react";

function ChatKitWidget({ jwtToken }: { jwtToken: string }) {
  const chatkit = useChatKit({
    api: {
      url: `${API_BASE_URL}/api/chatkit`,
      domainKey: process.env.NEXT_PUBLIC_OPENAI_DOMAIN_KEY || "local-dev",
      fetch: async (input, init) => fetch(input, {
        ...init,
        headers: { ...init?.headers, Authorization: `Bearer ${jwtToken}` },
      }),
    },
    onThreadChange: ({ threadId }) => console.log("Thread:", threadId),
    onResponseStart: () => console.log("Response started"),
    onResponseEnd: () => console.log("Response ended"),
    onError: ({ error }) => console.error("ChatKit error:", error),
  });

  return <ChatKit control={chatkit.control} />;
}
```

### Endpoint
- **Backend**: `POST /api/chatkit` (official ChatKit protocol)
- **Authentication**: JWT via `Authorization: Bearer` header

**Selected**: OpenAI ChatKit Protocol for official support and seamless integration.

---

## 4. Database Schema for Conversations

### Decision
Two-table schema: `conversations` (thread metadata) and `messages` (chat history with chatkit_item_id).

### Schema Design

#### Conversations Table
```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL UNIQUE,  -- ChatKit's thread ID (required, NOT NULL)
    user_id UUID NOT NULL,
    title VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,  -- Soft delete flag
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_thread_id ON conversations(thread_id);
```

**Rationale**:
- `thread_id`: ChatKit's UUID (required, unique) - links to frontend
- `is_active`: Soft delete for conversation archival
- Naive datetime (`TIMESTAMP WITHOUT TIME ZONE`) for compatibility

#### Messages Table
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chatkit_item_id UUID NOT NULL,  -- Preserves frontend message ID
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,  -- Denormalized for user isolation queries
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    tool_calls JSONB,  -- MCP tool invocations for debugging
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() + INTERVAL '2 days'),
);

CREATE INDEX idx_messages_chatkit_item_id ON messages(chatkit_item_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);  -- For retention cleanup
```

**Rationale**:
- `chatkit_item_id`: Preserves frontend message ID (prevents "first message disappears" bug)
- `user_id`: Denormalized for user isolation without joins
- `expires_at`: 2-day retention with automatic expiration
- `tool_calls`: JSONB for MCP tool debugging

### SQLModel Implementation
```python
class Conversation(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    thread_id: UUID = Field(unique=True, nullable=False)  # ChatKit's thread ID
    user_id: str = Field(nullable=False, index=True)
    title: str | None = None
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Message(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    chatkit_item_id: str = Field(index=True)  # Preserved ChatKit ID
    conversation_id: UUID = Field(foreign_key="conversations.id", index=True)
    user_id: str = Field(nullable=False, index=True)
    role: str = Field(nullable=False)  # "user" | "assistant" | "system"
    content: str = Field(nullable=False)
    tool_calls: dict | None = Field(default=None, sa_column=Column(JSONB))
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    expires_at: datetime = Field(default_factory=lambda: datetime.utcnow() + timedelta(days=2))

    @property
    def is_expired(self) -> bool:
        return datetime.utcnow() > self.expires_at
```

### Retention Cleanup Strategy
```python
async def cleanup_expired_messages(session: AsyncSession) -> int:
    """Delete messages older than 2 days."""
    cutoff = datetime.utcnow() - timedelta(days=2)
    result = await session.execute(
        delete(Message).where(Message.expires_at < cutoff)
    )
    await session.commit()
    return result.rowcount
```

**Scheduled**: Optional cron job for production cleanup.

### Conversation Limit (Soft Enforcement)
- Maximum 100 conversations per user (soft limit for performance)
- `is_active` flag for soft-delete (archived conversations not shown in list)

**Selected**: Two-table schema with chatkit_item_id preservation and 2-day retention.

---

## 5. Natural Language Priority Detection

### Decision
Use **prompt engineering** in agent system prompt to map urgency keywords to priority levels.

### Strategy

#### System Prompt Instructions
```markdown
## Task Priority Detection

When users create tasks, analyze their language for urgency indicators:

**High Priority** - Assign when you detect:
- Explicit urgency: "urgent", "ASAP", "critical", "emergency", "high priority"
- Time pressure: "right now", "immediately", "today", "this morning"
- Importance: "important", "must", "need to ASAP"

**Low Priority** - Assign when you detect:
- Casualness: "when you have time", "someday", "eventually", "low priority"
- Optionality: "if possible", "would be nice", "maybe"
- Future indefinite: "sometime", "later"

**Medium Priority** (default) - Assign when:
- No urgency indicators present
- Neutral task description
- User doesn't specify priority

Examples:
- "add urgent task to fix the payment bug" → high priority
- "add task to read that article when you have time" → low priority
- "add task to buy groceries" → medium priority (default)

Always extract and use the detected priority when calling the add_task tool.
```

### Implementation in MCP Tool
```python
@server.tool(name="add_task")
async def add_task_tool(input: AddTaskInput, context: dict) -> AddTaskOutput:
    # Agent passes priority extracted from natural language
    # If not provided, default to medium
    priority = input.priority or "medium"

    # Validate priority value
    if priority not in ["high", "medium", "low"]:
        priority = "medium"  # Fallback for invalid values

    task = await task_service.create_task(
        user_id=input.user_id,
        title=input.title,
        description=input.description,
        priority=priority  # Extracted from natural language or default
    )

    return AddTaskOutput(...)
```

### Keyword Patterns
Documented urgency indicators for agent:

| Priority | Keywords |
|----------|----------|
| **High** | urgent, ASAP, critical, emergency, important, must, high priority, right now, immediately, today |
| **Low** | when you have time, someday, eventually, low priority, if possible, would be nice, maybe, sometime, later |
| **Medium** | (default when no indicators present) |

### Accuracy Validation
- **Success Criterion**: 90% accuracy on priority detection (SC-008)
- **Test Strategy**: Unit tests with 50+ natural language examples covering all keyword patterns
- **Example Test Cases**:
  - "add critical task to backup database" → high
  - "add task to organize files when you have time" → low
  - "add task to buy milk" → medium

### Alternatives Considered
- **Keyword Regex Matching**: Simple but inflexible, doesn't handle context (e.g., "not urgent" would match "urgent")
- **NLP Library (spaCy)**: Overkill for simple keyword detection, adds dependency and latency
- **Separate Priority Classifier Model**: Unnecessary complexity, GPT-4o already excellent at intent extraction

**Selected**: Prompt engineering for simplicity, accuracy, and zero additional dependencies.

---

## 6. Stateless Conversation Loading

### Decision
**Full history load** approach - load all messages for a conversation on every request.

### Rationale
- **Simplicity**: Single query loads entire conversation context
- **Statelessness**: No caching required, perfect alignment with FR-027 (zero in-memory state)
- **Agent Context**: Agent SDK requires full conversation history for context-aware responses
- **Performance**: With 500 messages max per conversation (SC-013), full load is acceptable (estimated 50-100KB per conversation)

### Query Pattern
```python
from sqlmodel import select

async def load_conversation_history(
    session: AsyncSession,
    conversation_id: UUID,
    user_id: UUID
) -> list[dict]:
    """Load full conversation history in chronological order."""

    # Validate user owns conversation (security)
    conversation = await session.get(Conversation, conversation_id)
    if not conversation or conversation.user_id != user_id:
        raise PermissionError("Conversation not found or unauthorized")

    # Load all messages ordered chronologically
    stmt = (
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())  # Oldest to newest
    )
    messages = await session.execute(stmt)

    # Convert to OpenAI message format
    return [
        {
            "role": msg.role,
            "content": msg.content,
            "timestamp": msg.created_at.isoformat()
        }
        for msg in messages.scalars().all()
    ]
```

### Performance Characteristics
- **Query Time**: <100ms for 500 messages (with composite index on conversation_id + created_at)
- **Data Transfer**: ~100KB for 500 messages (2000 chars max per user message, avg 500 chars)
- **Success Criterion**: Must load within 2 seconds (SC-006) - **easily achieved**

### Optimization Opportunities (Future)
If performance issues arise with very long conversations:
1. **Pagination**: Load recent N messages, fetch older on demand
2. **Summarization**: Summarize old messages into context, load recent messages verbatim
3. **Read Replica**: Route conversation reads to database replica to reduce load on primary

**Current Decision**: Full load is sufficient for MVP (500 messages max, 2-second budget).

### Database Query Optimization
```sql
-- Composite index ensures efficient chronological retrieval
CREATE INDEX idx_messages_conversation_created
ON messages(conversation_id, created_at);

-- Query execution plan (expected):
-- Index Scan using idx_messages_conversation_created
-- Filter: conversation_id = $1
-- Rows: ~500 (worst case)
-- Cost: <10ms
```

### Caching Considerations
**Decision**: No caching for MVP.

**Rationale**:
- Violates statelessness requirement (FR-027)
- Adds complexity (cache invalidation, TTL management)
- Performance already acceptable without caching
- Horizontal scaling easier without shared cache

**Future**: If needed, consider Redis cache with conversation_id as key, invalidate on new message.

### Alternatives Considered
- **Pagination**: Load recent 50 messages, load more on scroll - rejected for added complexity, agent needs full context
- **Lazy Loading**: Load messages on demand as user scrolls - rejected because agent needs full history upfront
- **Message Summarization**: Summarize old messages - deferred to future (not needed for 500-message limit)

**Selected**: Full conversation history load for simplicity, statelessness, and acceptable performance.

---

## Technology Stack Summary

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Agent Orchestration** | OpenAI Agents SDK | Official SDK, streaming support, stateless |
| **Tool Protocol** | Official MCP Python SDK | Standard compliance, security, Pydantic validation |
| **Chat UI** | OpenAI ChatKit | Official widget, streaming display, minimal setup |
| **Database Schema** | Two tables (conversations, messages) | Normalized, indexed, efficient cleanup |
| **Priority Detection** | Prompt engineering | Simple, accurate, zero dependencies |
| **Conversation Loading** | Full history load | Stateless, performant for 500 messages |

---

## Implementation Readiness

All technology decisions finalized. Ready to proceed to Phase 1 (Design & Contracts):
- ✅ Agent SDK integration pattern documented
- ✅ MCP tool implementation pattern defined
- ✅ ChatKit frontend integration pattern specified
- ✅ Database schema designed with indexes
- ✅ Priority detection strategy documented
- ✅ Conversation loading approach validated

**Next**: Generate data-model.md, contracts/, and quickstart.md.
