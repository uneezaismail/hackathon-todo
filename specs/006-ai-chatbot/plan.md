# Implementation Plan: AI-Powered Todo Chatbot

**Branch**: `006-ai-chatbot` | **Date**: 2025-12-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-ai-chatbot/spec.md`

## Summary

Build an AI-powered chatbot interface for the Todo application that enables users to manage tasks through natural language conversations. The system uses OpenAI Agents SDK for AI orchestration with ChatKitServer backend, exposes task operations as 8 MCP (Model Context Protocol) tools, and maintains conversation memory via SQLiteSession per thread. The chatbot supports natural language task CRUD operations, automatic priority detection from urgency indicators, real-time streaming responses via ChatKit protocol, and multi-day conversation persistence with automatic retention cleanup.

**Technical Approach**: Implement ChatKit protocol endpoint in FastAPI backend using official ChatKitServer class. SQLiteSession maintains conversation history per thread, MCP tools delegate to existing TaskService, and ChatKit frontend widget provides the chat UI. System uses OpenAI Agents SDK for agent orchestration with multi-provider support (OpenAI, Gemini, Groq, OpenRouter).

## Technical Context

**Language/Version**: Python 3.13+ (Backend), TypeScript (Frontend), Node.js 20+ (Frontend Runtime)
**Primary Dependencies**:
- Backend: FastAPI, SQLModel, OpenAI Agents SDK, Official MCP Python SDK, Pydantic
- Frontend: Next.js 16+ (App Router), OpenAI ChatKit, Better Auth Client, Tailwind CSS
**Storage**: Neon Serverless PostgreSQL (conversations, messages, existing tasks tables)
**Testing**:
- Backend: pytest with async support, MCP tool unit tests, agent integration tests
- Frontend: Vitest, Playwright E2E tests for chat interface
**Target Platform**:
- Backend: Linux server (containerized with Docker for later K8s deployment)
- Frontend: Web browsers (desktop and mobile responsive)
**Project Type**: Web application (full-stack) with existing Phase 2 backend/frontend structure
**Performance Goals**:
- AI response streaming starts within 1 second
- Conversation history loads within 2 seconds
- 100 concurrent conversations support
- 95% task operation accuracy from natural language
**Constraints**:
- Complete statelessness (zero in-memory sessions)
- 30-second timeout for AI response generation
- 2000 character maximum per user message
- 2-day message retention policy
- 100 conversations maximum per user
**Scale/Scope**:
- 8 MCP tools (task CRUD + priority, bulk operations)
- 2 new database tables (conversations, messages) with ChatKit fields
- 1 ChatKit protocol endpoint (official protocol)
- 6 user stories (3 P1, 2 P2, 1 P3)
- Support for 500 messages per conversation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Gate Evaluation (Pre-Research)

| Gate | Status | Evidence |
|------|--------|----------|
| **I. Spec-First Development** | ✅ PASS | Complete specification exists at specs/006-ai-chatbot/spec.md with 35 functional requirements, 6 user stories, 15 success criteria |
| **II. No Manual Code** | ✅ PASS | Implementation will use chatkit-backend-engineer and chatkit-frontend-engineer subagents with their skills |
| **III. Reusable Intelligence** | ✅ PASS | Plan includes research.md for technology decisions, PHR creation for session capture |
| **IV. Evolutionary Architecture** | ✅ PASS | Extends Phase 2 architecture (same database, auth, task service layer) while adding chat layer. Stateless design supports K8s deployment in future phases |
| **V. Single Responsibility** | ✅ PASS | Clear separation: MCP tools (business logic), chat endpoint (orchestration), ChatKit (UI), database (persistence) |
| **VI. User Experience First** | ✅ PASS | Natural language interface, streaming responses, friendly personality, graceful error handling |
| **VIII. Automated Testing** | ✅ PASS | Spec requires MCP tool unit tests, agent integration tests, and E2E chat tests |
| **IX. Strict Type Safety** | ✅ PASS | Python type hints required, TypeScript strict mode enabled |
| **X. Strict Error Handling** | ✅ PASS | FR-023 requires user-friendly error messages, timeout handling, database retry logic |
| **XI. 12-Factor Configuration** | ✅ PASS | OpenAI API key, database credentials via environment variables |
| **XII. AI Sub-Agents and Skills** | ✅ PASS | User explicitly specified chatkit-backend-engineer and chatkit-frontend-engineer subagents |
| **XIII. Conversational AI Architecture** | ✅ PASS | OpenAI Agents SDK for orchestration, Official MCP Python SDK for tools, natural language mapping |
| **XIV. Stateless Service Pattern** | ✅ PASS | FR-027 requires zero in-memory state, FR-004 requires database load on every request, FR-028 requires horizontal scalability |
| **XV. MCP Tool Design Standards** | ✅ PASS | 8 single-purpose tools (add/list/complete/delete/update/set_priority/list_by_priority/bulk_update), user_id validation required |
| **XVI. AI Safety and User Isolation** | ✅ PASS | FR-011 requires user validation on every tool call, FR-010 requires user isolation, FR-023 requires user-friendly errors |
| **XVII. Conversation Management** | ✅ PASS | Unique conversation IDs, message persistence with role/content/timestamp, history loading, chronological ordering |

**Overall Status**: ✅ **ALL GATES PASS** - Proceed to Phase 0 Research

### Constitution-Driven Design Decisions

1. **Stateless Architecture (Gate XIV)**: All conversation state stored in `conversations` and `messages` tables. Chat endpoint loads history from DB on every request, enabling server restarts and horizontal scaling.

2. **MCP Tool Security (Gate XVI)**: Each tool accepts `user_id` parameter, validates against JWT token, and filters all database queries by user_id to enforce data isolation.

3. **Service Layer Reuse (Gate XV)**: MCP tools delegate to existing `TaskService` from Phase 2 instead of duplicating business logic.

4. **Evolutionary Path (Gate IV)**: Chat layer sits above existing REST API. Same task entities, same business logic, new conversational interface. Database schema extends with conversations/messages tables.

---

### Gate Re-Evaluation (Post-Design)

*Required after Phase 1 design completion*

| Gate | Status | Evidence |
|------|--------|----------|
| **I. Spec-First Development** | ✅ PASS | All design artifacts (research.md, data-model.md, contracts/) created based on specification |
| **II. No Manual Code** | ✅ PASS | Implementation will use chatkit-backend-engineer and chatkit-frontend-engineer subagents |
| **III. Reusable Intelligence** | ✅ PASS | Research decisions documented in research.md for future reference |
| **IV. Evolutionary Architecture** | ✅ PASS | Design extends Phase 2 with minimal changes - adds tables, reuses services, preserves existing APIs |
| **V. Single Responsibility** | ✅ PASS | Clear module boundaries: MCP tools (src/mcp/), chat service (src/services/chat_service.py), ChatKit widget (components/chat/) |
| **VI. User Experience First** | ✅ PASS | Agent prompt designed for natural conversation, streaming UX, friendly error messages |
| **VIII. Automated Testing** | ✅ PASS | Test strategy defined in data-model.md and mcp-tools.yaml (unit, integration, E2E) |
| **IX. Strict Type Safety** | ✅ PASS | SQLModel with type hints, Pydantic schemas for MCP tools, TypeScript strict mode |
| **X. Strict Error Handling** | ✅ PASS | Error handling patterns documented in agent-prompt.md (user-friendly messages, no stack traces) |
| **XI. 12-Factor Configuration** | ✅ PASS | All configuration via environment variables (documented in quickstart.md) |
| **XII. AI Sub-Agents and Skills** | ✅ PASS | Subagents specified for implementation (chatkit-backend-engineer, chatkit-frontend-engineer) |
| **XIII. Conversational AI Architecture** | ✅ PASS | OpenAI Agents SDK integration pattern documented in research.md, MCP tools use Official Python SDK |
| **XIV. Stateless Service Pattern** | ✅ PASS | Database schema designed for full history load on every request (data-model.md), no in-memory sessions |
| **XV. MCP Tool Design Standards** | ✅ PASS | All 8 tools follow single-purpose pattern with user_id validation (contracts/mcp-tools.yaml) |
| **XVI. AI Safety and User Isolation** | ✅ PASS | Security model documented in mcp-tools.yaml - user validation on every tool call, filtered queries |
| **XVII. Conversation Management** | ✅ PASS | Database schema includes unique IDs, role/content/timestamp, chronological ordering (data-model.md) |

**Overall Status**: ✅ **ALL GATES PASS POST-DESIGN** - Ready for `/sp.tasks`

**Design Quality Assessment**:
- **Completeness**: All technical decisions resolved in research.md
- **Traceability**: Each functional requirement maps to concrete design elements
- **Implementability**: Contracts provide sufficient detail for code generation
- **Testability**: Clear test strategy with specific test cases identified
- **Consistency**: Design aligns perfectly with constitutional principles

## Project Structure

### Documentation (this feature)

```text
specs/006-ai-chatbot/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output (technology decisions, MCP SDK patterns, ChatKit integration)
├── data-model.md        # Phase 1 output (Conversation, Message entities with relationships)
├── quickstart.md        # Phase 1 output (local setup, environment variables, running chatbot)
├── contracts/           # Phase 1 output (MCP tool schemas, ChatKit protocol spec)
│   ├── mcp-tools.yaml   # MCP tool definitions (8 tools: add/list/complete/delete/update/set_priority/list_by_priority/bulk_update)
│   └── chat-api.yaml    # ChatKit protocol endpoint contract (POST /api/chatkit)
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
phase-3-todo-ai-chatbot/
├── backend/
│   ├── src/
│   │   ├── mcp/                    # NEW: MCP Server and Tools
│   │   │   ├── __init__.py
│   │   │   ├── server.py          # MCP Server using FastMCP
│   │   │   ├── tools/             # MCP Tool implementations (8 tools)
│   │   │   │   ├── __init__.py
│   │   │   │   ├── add_task.py
│   │   │   │   ├── list_tasks.py
│   │   │   │   ├── complete_task.py
│   │   │   │   ├── delete_task.py
│   │   │   │   ├── update_task.py
│   │   │   │   ├── set_priority.py
│   │   │   │   ├── list_tasks_by_priority.py
│   │   │   │   └── bulk_update_tasks.py
│   │   │   └── schemas.py         # MCP tool input/output schemas
│   │   ├── chatkit/               # NEW: ChatKit Server integration
│   │   │   ├── __init__.py
│   │   │   ├── server.py          # TaskChatKitServer (extends ChatKitServer)
│   │   │   ├── agent.py           # TodoAgent with OpenAI Agents SDK
│   │   │   └── streaming.py       # stream_agent_response utility
│   │   ├── models/                # EXTEND: Add conversation models
│   │   │   ├── conversation.py    # NEW: Conversation SQLModel (with thread_id)
│   │   │   ├── message.py         # NEW: Message SQLModel (with chatkit_item_id, expires_at)
│   │   │   └── task.py            # EXISTING: From Phase 2
│   │   ├── services/              # EXTEND: Add chat service
│   │   │   ├── chat_service.py    # NEW: Orchestrates ChatKitServer, loads history
│   │   │   ├── task_service.py    # EXISTING: Reused by MCP tools
│   │   │   └── retention_service.py # NEW: Message cleanup (2-day expiration)
│   │   ├── api/
│   │   │   └── chatkit.py         # NEW: ChatKit protocol endpoint (POST /api/chatkit)
│   │   ├── auth/                  # EXISTING: JWT validation from Phase 2
│   │   ├── db/                    # EXISTING: Database engine/session from Phase 2
│   │   └── config.py              # EXTEND: Add LLM provider config (multi-provider)
│   ├── alembic/
│   │   └── versions/
│   │       └── 002_add_chat_tables.py  # NEW: Migration for conversations/messages
│   └── tests/
│       ├── unit/
│       │   └── test_mcp_tools.py  # NEW: Unit tests for each MCP tool
│       └── integration/
│           ├── test_chatkit_endpoint.py  # NEW: ChatKit protocol integration tests
│           └── test_agent_behavior.py # NEW: Mock agent responses, test tool routing
│
└── frontend/
    ├── app/
    │   ├── chat/                  # NEW: Chat page route
    │   │   └── page.tsx          # Chat interface using ChatKit widget
    │   └── dashboard/            # EXISTING: From Phase 2
    ├── components/
    │   └── chat/                 # NEW: Chat components
    │       ├── chatkit-widget.tsx  # ChatKit integration wrapper
    │       └── chat-layout.tsx     # Layout for chat page
    ├── lib/
    │   ├── chatkit-client.ts     # NEW: ChatKit configuration with JWT auth
    │   └── auth-client.ts        # EXISTING: Better Auth from Phase 2
    └── __tests__/
        └── e2e/
            ├── chat-task-creation.spec.ts  # NEW: E2E test for creating tasks via chat
            └── chat-streaming.spec.ts      # NEW: E2E test for response streaming
```

**Structure Decision**: Extend existing Phase 2 full-stack web application structure. Backend adds `mcp/` directory for MCP Server and tools, new models for conversations/messages, chat service layer, and streaming chat endpoint. Frontend adds `/chat` route with ChatKit widget integration. This approach maximizes code reuse (task service, auth, database) while cleanly separating chat-specific code.

## Complexity Tracking

> No Constitution violations requiring justification. All gates pass cleanly.

## Phase 0: Research & Technology Decisions

### Research Tasks

1. **OpenAI Agents SDK Integration Pattern**
   - Research: How to initialize OpenAI Agents SDK in FastAPI
   - Research: Streaming response patterns with Agents SDK
   - Research: Error handling and timeout configuration (30-second limit)
   - Output: Document initialization code pattern, streaming API usage

2. **Official MCP Python SDK Usage**
   - Research: MCP Server setup with Official Python SDK
   - Research: Tool registration patterns and schemas
   - Research: User context passing in MCP tools (for user_id validation)
   - Research: JSON-serializable response formats
   - Output: Document MCP Server boilerplate, tool registration template

3. **OpenAI ChatKit Frontend Integration**
   - Research: ChatKit widget installation and configuration
   - Research: Authentication integration with Better Auth JWT
   - Research: Streaming response display in ChatKit
   - Research: Custom styling and theming options
   - Output: Document ChatKit setup, API endpoint configuration

4. **Database Schema for Conversations**
   - Research: Conversation/message table design patterns
   - Research: Indexing strategies for conversation history queries
   - Research: Retention cleanup implementation (2-day expiration)
   - Research: Relationship modeling (user → conversations → messages)
   - Output: Document table schemas, indexes, foreign key constraints

5. **Natural Language Priority Detection**
   - Research: Prompt engineering for priority extraction
   - Research: Urgency keyword patterns ("urgent", "ASAP", "when you have time")
   - Research: Default priority assignment logic
   - Output: Document prompt template for priority detection

6. **Stateless Conversation Loading**
   - Research: Efficient conversation history loading (pagination vs full load)
   - Research: SQLModel query patterns for chronological message ordering
   - Research: Caching strategies (if any) while maintaining statelessness
   - Output: Document query patterns, performance considerations

### Expected Outputs

**File**: `specs/006-ai-chatbot/research.md`

**Content Structure**:
```markdown
# Research: AI-Powered Todo Chatbot

## 1. OpenAI Agents SDK Integration

**Decision**: Use OpenAI Agents SDK with FastAPI dependency injection
**Rationale**: [Research findings on SDK initialization, streaming, error handling]
**Alternatives Considered**: [Other agent frameworks, direct OpenAI API calls]

## 2. Official MCP Python SDK

**Decision**: Use Official MCP Python SDK for tool server
**Rationale**: [Research findings on server setup, tool patterns, validation]
**Alternatives Considered**: [Custom tool implementation, other MCP libraries]

## 3. ChatKit Frontend Integration

**Decision**: Use OpenAI ChatKit widget with Next.js
**Rationale**: [Research findings on setup, auth, streaming display]
**Alternatives Considered**: [Custom chat UI, other chat widgets]

## 4. Database Schema

**Decision**: [Schema design with tables, indexes, relationships]
**Rationale**: [Research findings on performance, retention cleanup]

## 5. Priority Detection Strategy

**Decision**: [Prompt engineering approach for extracting priority]
**Rationale**: [Research findings on keyword matching, default values]

## 6. Conversation Loading Strategy

**Decision**: [Full history load vs pagination approach]
**Rationale**: [Research findings on performance with 500 messages]
```

## Phase 1: Design & Contracts

### 1. Data Model Design

**File**: `specs/006-ai-chatbot/data-model.md`

**Entities to Define**:

1. **Conversation**
   - Fields: id (UUID), user_id (FK to users), created_at, updated_at
   - Relationships: One-to-many with Message, Many-to-one with User
   - Constraints: Maximum 100 per user (enforced in application logic)
   - Indexes: user_id, created_at (for FIFO cleanup)

2. **Message**
   - Fields: id (UUID), conversation_id (FK), role (enum: user/assistant), content (text, max 2000 chars for user), created_at
   - Relationships: Many-to-one with Conversation
   - Constraints: Content length validation, 2-day TTL (cleanup via scheduled job)
   - Indexes: conversation_id + created_at (for chronological ordering), created_at (for retention cleanup)

3. **Task** (existing, extended)
   - Add: priority field (enum: high/medium/low) if not present
   - No structural changes needed - MCP tools use existing TaskService

### 2. API Contracts

**File**: `specs/006-ai-chatbot/contracts/chat-api.yaml`

**Endpoint**: `POST /api/chatkit`
- Protocol: Official OpenAI ChatKit protocol
- Authentication: Bearer JWT token (Better Auth)
- Response: ChatKit streaming events (chunk, tool_call, tool_result, done)
- Thread Management: ChatKit handles thread creation/loading automatically
- Session Memory: SQLiteSession maintains conversation history per thread

**File**: `specs/006-ai-chatbot/contracts/mcp-tools.yaml`

**MCP Tools** (8 tools):
1. `add_task(user_id: str, title: str, description?: str, priority?: str) → { task_id, status, message }`
2. `list_tasks(user_id: str, status_filter?: str) → { tasks: [...], count }`
3. `complete_task(user_id: str, task_id: str) → { task_id, status, message }`
4. `delete_task(user_id: str, task_id: str) → { task_id, status, message }`
5. `update_task(user_id: str, task_id: str, title?: str, description?: str) → { task_id, status, message }`
6. `set_priority(user_id: str, task_id: str, priority: str) → { task_id, status, message }`
7. `list_tasks_by_priority(user_id: str) → { high: [...], medium: [...], low: [...] }`
8. `bulk_update_tasks(user_id: str, task_ids: str[], status: str) → { updated_count, status }`

**File**: `specs/006-ai-chatbot/contracts/agent-prompt.md`

**System Prompt**: Instructions for AI agent behavior
- Personality: Friendly, professional, task-focused
- Capabilities: Task management only, polite decline for off-topic
- Priority detection: Map urgency keywords to high/low priority
- Error handling: User-friendly messages, no technical details

### 3. Quickstart Guide

**File**: `specs/006-ai-chatbot/quickstart.md`

**Content**:
- Environment variables setup (OpenAI API key, database credentials)
- Database migration for conversations/messages tables
- Backend service startup (FastAPI with MCP server)
- Frontend development server (Next.js with ChatKit)
- Testing: How to run unit tests, integration tests, E2E tests
- Example chat interactions for manual testing

### 4. Agent Context Update

**Action**: Run `.specify/scripts/bash/update-agent-context.sh` (auto-detects Claude)

**Expected Updates**:
- Add OpenAI Agents SDK patterns to backend context
- Add Official MCP Python SDK patterns to backend context
- Add OpenAI ChatKit integration patterns to frontend context
- Preserve existing Phase 2 context (FastAPI, Next.js, Better Auth)

## Phase 2: Task Generation (Not in this command)

This phase is handled by the `/sp.tasks` command, which generates `tasks.md` based on this plan.

## Implementation Phases (For /sp.tasks reference)

### Phase 1: Backend Foundation (ChatKit Protocol Infrastructure)
- Database migrations (conversations, messages tables with ChatKit fields)
- Conversation/Message SQLModels (thread_id, chatkit_item_id, expires_at, is_active)
- ChatKitServer integration (TaskChatKitServer extends ChatKitServer)
- SQLiteSession setup for conversation memory per thread
- LLM provider factory (OpenAI, Gemini, Groq, OpenRouter)

### Phase 2: MCP Tools (Task Operations)
- Implement 8 MCP tools using FastMCP
  - add_task, list_tasks, complete_task, delete_task, update_task
  - set_priority, list_tasks_by_priority, bulk_update_tasks
- User validation on each tool call (user_id from JWT)
- Service layer delegation to existing TaskService
- Unit tests for each tool

### Phase 3: Agent Integration (OpenAI Agents SDK)
- Initialize OpenAI Agents SDK with ChatKitServer
- Register MCP tools with agent via FastMCP transport
- System prompt configuration (personality, boundaries, priority detection)
- stream_agent_response utility for ChatKit events
- Timeout handling (30 seconds)

### Phase 4: Frontend Chat Interface (ChatKit Widget)
- Install and configure @openai/chatkit-react
- Create /chat route in Next.js
- Integrate Better Auth for JWT authentication
- Configure ChatKit widget with backend endpoint URL
- Display streaming responses from ChatKit widget

### Phase 5: Edge Cases & Resilience
- Message queuing for rapid consecutive submissions
- Database retry logic (3 attempts, exponential backoff)
- Client-side character counter (2000 char limit)
- Conversation limit enforcement (100 max, FIFO deletion with is_active flag)
- Error handling and user-friendly messages

### Phase 6: Data Retention & Cleanup
- Retention service implementation (2-day expires_at expiration)
- Scheduled cleanup job (cron or background task)
- Testing retention logic with backdated messages

### Phase 7: Testing & Quality
- MCP tool unit tests (all 8 tools)
- Agent integration tests (mock agent behavior)
- ChatKit protocol integration tests (events, streaming, timeout)
- E2E tests (task creation via chat, response streaming)
- Performance testing (100 concurrent conversations)

### Phase 8: Polish & Documentation
- Final code review against specification
- Update quickstart.md with actual setup steps
- Create demo conversation examples
- Performance optimization if needed
- Deployment documentation

## Success Validation

Before marking this feature complete, verify all success criteria from spec.md:

- [ ] SC-001: 95% task operation accuracy (measured via test suite)
- [ ] SC-002: Conversations resume after browser restart (E2E test)
- [ ] SC-003: Conversations resume after server restart (E2E test)
- [ ] SC-004: Zero cross-user data leakage (integration tests)
- [ ] SC-005: AI responses stream within 1 second (performance test)
- [ ] SC-006: Conversation history loads within 2 seconds (performance test)
- [ ] SC-007: 100 concurrent conversations supported (load test)
- [ ] SC-008: 90% priority detection accuracy (unit tests)
- [ ] SC-009: Off-topic requests handled correctly (integration tests)
- [ ] SC-010: 95% task operation accuracy (duplicate of SC-001)
- [ ] SC-011: Message retention cleanup works (unit tests with backdated data)
- [ ] SC-012: True stateless operation (horizontal scaling test)
- [ ] SC-013: 500 messages per conversation handled (performance test)
- [ ] SC-014: All 8 task operations work via chat (E2E tests)
- [ ] SC-015: Chat interface responsive during streaming (E2E test)

## Next Steps

1. **Immediate**: Execute Phase 0 research to resolve all technology decision points
2. **After Research**: Generate data-model.md, contracts/, and quickstart.md (Phase 1)
3. **After Design**: Run `/sp.tasks` to generate task breakdown for implementation
4. **Implementation**: Use chatkit-backend-engineer and chatkit-frontend-engineer subagents as specified by user
