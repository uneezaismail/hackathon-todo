# Tasks: AI-Powered Todo Chatbot (ChatKit Protocol)

**Input**: Design documents from `/specs/006-ai-chatbot/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/
**Implementation**: Will use **chatkit-backend-engineer** and **chatkit-frontend-engineer** subagents with their skills

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Tests**: Tests are explicitly requested in the specification (FR-008) - all test tasks are included with TDD approach.

## Format: `- [ ] [ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a full-stack web application following Phase 3 structure:
- **Backend**: `phase-3-todo-ai-chatbot/backend/src/`, `phase-3-todo-ai-chatbot/backend/tests/`
- **Frontend**: `phase-3-todo-ai-chatbot/frontend/`, `phase-3-todo-ai-chatbot/frontend/__tests__/`

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Create project structure and initialize dependencies

- [ ] T001 Create project directory structure at phase-3-todo-ai-chatbot/ with backend/ and frontend/ subdirectories per plan.md
- [ ] T002 [P] Initialize backend Python project with uv at phase-3-todo-ai-chatbot/backend/ - Python 3.13+, FastAPI, SQLModel, OpenAI Agents SDK, FastMCP dependencies in pyproject.toml
- [ ] T003 [P] Initialize frontend Next.js project at phase-3-todo-ai-chatbot/frontend/ - Next.js 16+, TypeScript, @openai/chatkit-react, Better Auth client, Tailwind CSS dependencies in package.json
- [ ] T004 [P] Configure backend linting tools (Ruff) and type checking (mypy) in phase-3-todo-ai-chatbot/backend/pyproject.toml
- [ ] T005 [P] Configure frontend linting (ESLint) and type checking (TypeScript strict mode) in phase-3-todo-ai-chatbot/frontend/tsconfig.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story implementation

**CRITICAL**: No user story work can begin until this phase is complete

### Backend Foundation

- [ ] T006 Copy existing Phase 2 backend configuration to phase-3-todo-ai-chatbot/backend/ - database connection (db/), authentication (auth/), task service (services/task_service.py), config.py
- [ ] T007 Create Alembic migration 002_add_chat_tables.py in phase-3-todo-ai-chatbot/backend/alembic/versions/ for conversations and messages tables per data-model.md (includes thread_id, is_active, chatkit_item_id, expires_at, tool_calls, priority column for tasks)
- [ ] T008 Run Alembic migration to create conversations and messages tables in Neon database
- [ ] T009 [P] Create Conversation SQLModel in phase-3-todo-ai-chatbot/backend/src/models/conversation.py with id, thread_id, user_id, title, is_active, created_at, updated_at fields and indexes (see data-model.md)
- [ ] T010 [P] Create Message SQLModel in phase-3-todo-ai-chatbot/backend/src/models/message.py with id, chatkit_item_id, conversation_id, user_id, role, content, tool_calls, created_at, expires_at fields (see data-model.md)
- [ ] T011 [P] Install asyncpg driver and create async_session.py with AsyncSession for Phase 3 chat endpoints
- [ ] T012 Add priority field (enum: high/medium/low) to existing Task model if not present (from Phase 2)
- [ ] T013 [P] Create LLM provider factory in phase-3-todo-ai-chatbot/backend/src/chatkit/agent.py for multi-provider support (OpenAI, Gemini, Groq, OpenRouter)

### ChatKit Server Foundation

- [ ] T014 [P] Create ChatKitServer base class integration in phase-3-todo-ai-chatbot/backend/src/chatkit/server.py extending ChatKitServer
- [ ] T015 [P] Create TodoAgent class in phase-3-todo-ai-chatbot/backend/src/chatkit/agent.py with OpenAI Agents SDK initialization
- [ ] T016 [P] Create stream_agent_response utility in phase-3-todo-ai-chatbot/backend/src/chatkit/streaming.py for ChatKit event streaming
- [ ] T017 Create MCP Server initialization using FastMCP in phase-3-todo-ai-chatbot/backend/src/mcp/server.py

### Frontend Foundation

- [ ] T018 Copy existing Phase 2 frontend configuration to phase-3-todo-ai-chatbot/frontend/ - Better Auth client (lib/auth-client.ts), authentication pages (app/(auth)/), layout components
- [ ] T019 Install and configure OpenAI ChatKit packages in phase-3-todo-ai-chatbot/frontend/ - @openai/chatkit and @openai/chatkit-react dependencies installed
- [ ] T020 Create ChatKit client configuration in phase-3-todo-ai-chatbot/frontend/lib/chatkit-client.ts with API URL (NEXT_PUBLIC_CHATKIT_URL), Better Auth JWT authentication, domain key

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 4 - Persistent Conversation History (Priority: P1) 🎯 MVP Component

**Goal**: Conversations persist across browser sessions and server restarts via database storage (stateless architecture foundation)

**Independent Test**: Start conversation, create tasks, close browser, restart server, reopen browser - verify all messages visible and conversation continues seamlessly

**Why First**: This is the architectural foundation - stateless conversation loading is required for all other stories to work correctly. Without this, US1 cannot function.

### Tests for User Story 4

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T021 [P] [US4] Unit test for Conversation model validation in phase-3-todo-ai-chatbot/backend/tests/unit/test_conversation_model.py - creation, thread_id, relationships, timestamps, user_id indexing, is_active flag
- [ ] T022 [P] [US4] Unit test for Message model validation in phase-3-todo-ai-chatbot/backend/tests/unit/test_message_model.py - role enum, chatkit_item_id, expires_at, is_expired property, tool_calls JSONB, relationships
- [ ] T023 [P] [US4] Integration test for conversation persistence in phase-3-todo-ai-chatbot/backend/tests/integration/test_conversation_persistence.py - CRUD operations, chronological order, user isolation, 100-conversation FIFO limit with is_active
- [ ] T024 [US4] E2E test for browser session persistence in phase-3-todo-ai-chatbot/frontend/__tests__/e2e/conversation-persistence.spec.ts - browser close/reopen, navigation, refresh, multiple conversations, chronological loading

### Implementation for User Story 4

- [ ] T025 [P] [US4] Implement async ConversationService in phase-3-todo-ai-chatbot/backend/src/services/conversation_service.py with get_or_create_conversation, add_message, get_conversation_history methods using AsyncSession
- [ ] T026 [US4] Add user isolation validation to all ConversationService methods - all methods filter by user_id matching JWT, raise PermissionError on access violations
- [ ] T027 [US4] Implement conversation limit enforcement (100 max, FIFO deletion with is_active flag) in ConversationService._enforce_conversation_limit method, called before creating new conversation
- [ ] T028 [US4] Implement SQLiteSession setup for ChatKit in phase-3-todo-ai-chatbot/backend/src/chatkit/session.py - session per user+thread, conversation memory persistence
- [ ] T029 [US4] Add thread_id mapping between ChatKit and database Conversation in ChatKitServer.respond() method
- [ ] T030 [US4] Implement database query for chronological message loading with composite index optimization in ConversationService.get_conversation_history (uses idx_messages_conversation_created)
- [ ] T031 [US4] Add conversation timestamp updates (updated_at field) when new messages added in ConversationService.add_message and get_or_create_conversation

**Checkpoint**: Conversations now persist in database with ChatKit thread_id mapping. Messages load via SQLiteSession (stateless). Ready for agent integration (US1).

---

## Phase 4: User Story 1 - Natural Language Task Management (Priority: P1) 🎯 MVP Core

**Goal**: Users manage tasks through conversational AI that interprets natural language and executes task operations

**Independent Test**: Send "add task to buy groceries", "show my tasks", "mark task complete" - verify AI correctly interprets intent and executes operations

**Why Second**: This is the core value proposition. Now that persistence works (US4), we can add the AI brain that makes it useful.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T032 [P] [US1] Unit test for add_task MCP tool in phase-3-todo-ai-chatbot/backend/tests/unit/test_mcp_tools.py - test success, user validation, priority parameter, TaskService delegation
- [ ] T033 [P] [US1] Unit test for list_tasks MCP tool in phase-3-todo-ai-chatbot/backend/tests/unit/test_mcp_tools.py - test status filtering, user isolation, empty results
- [ ] T034 [P] [US1] Unit test for complete_task MCP tool in phase-3-todo-ai-chatbot/backend/tests/unit/test_mcp_tools.py - test success, not found error, already completed handling
- [ ] T035 [P] [US1] Unit test for delete_task MCP tool in phase-3-todo-ai-chatbot/backend/tests/unit/test_mcp_tools.py - test success, permission denied, not found
- [ ] T036 [P] [US1] Unit test for update_task MCP tool in phase-3-todo-ai-chatbot/backend/tests/unit/test_mcp_tools.py - test title update, description update, validation errors
- [ ] T037 [P] [US1] Unit test for set_priority MCP tool in phase-3-todo-ai-chatbot/backend/tests/unit/test_mcp_tools.py - test priority update, enum validation
- [ ] T038 [P] [US1] Unit test for list_tasks_by_priority MCP tool in phase-3-todo-ai-chatbot/backend/tests/unit/test_mcp_tools.py - test grouping by priority levels
- [ ] T039 [P] [US1] Unit test for bulk_update_tasks MCP tool in phase-3-todo-ai-chatbot/backend/tests/unit/test_mcp_tools.py - test bulk status update, validation
- [ ] T040 [US1] Integration test for agent task creation in phase-3-todo-ai-chatbot/backend/tests/integration/test_agent_behavior.py - send "add task to X", verify add_task called with correct args
- [ ] T041 [US1] Integration test for agent task listing in phase-3-todo-ai-chatbot/backend/tests/integration/test_agent_behavior.py - send "show my tasks", verify list_tasks called, response includes task titles
- [ ] T042 [US1] E2E test for chat task creation in phase-3-todo-ai-chatbot/frontend/__tests__/e2e/chat-task-creation.spec.ts - type "add task to buy groceries", verify task appears in backend database

### Implementation for User Story 1 - MCP Tools (8 tools)

- [ ] T043 [P] [US1] Implement add_task MCP tool in phase-3-todo-ai-chatbot/backend/src/mcp/tools/add_task.py with user_id validation, priority parameter, TaskService delegation
- [ ] T044 [P] [US1] Implement list_tasks MCP tool in phase-3-todo-ai-chatbot/backend/src/mcp/tools/list_tasks.py with user_id validation, status_filter parameter, TaskService delegation
- [ ] T045 [P] [US1] Implement complete_task MCP tool in phase-3-todo-ai-chatbot/backend/src/mcp/tools/complete_task.py with user_id validation, task_id parameter, TaskService delegation
- [ ] T046 [P] [US1] Implement delete_task MCP tool in phase-3-todo-ai-chatbot/backend/src/mcp/tools/delete_task.py with user_id validation, task_id parameter, TaskService delegation
- [ ] T047 [P] [US1] Implement update_task MCP tool in phase-3-todo-ai-chatbot/backend/src/mcp/tools/update_task.py with user_id validation, title/description parameters, TaskService delegation
- [ ] T048 [P] [US1] Implement set_priority MCP tool in phase-3-todo-ai-chatbot/backend/src/mcp/tools/set_priority.py with user_id validation, task_id, priority parameters
- [ ] T049 [P] [US1] Implement list_tasks_by_priority MCP tool in phase-3-todo-ai-chatbot/backend/src/mcp/tools/list_tasks_by_priority.py with user_id validation, returns grouped by priority
- [ ] T050 [P] [US1] Implement bulk_update_tasks MCP tool in phase-3-todo-ai-chatbot/backend/src/mcp/tools/bulk_update_tasks.py with user_id validation, task_ids array, status parameter

### Implementation for User Story 1 - ChatKit Server Integration

- [ ] T051 [US1] Register all 8 MCP tools with TodoAgent in phase-3-todo-ai-chatbot/backend/src/chatkit/agent.py via FastMCP transport
- [ ] T052 [US1] Configure agent system prompt with personality, capabilities, boundaries, priority detection in phase-3-todo-ai-chatbot/backend/src/chatkit/agent.py
- [ ] T053 [US1] Implement ChatKit protocol endpoint POST /api/chatkit in phase-3-todo-ai-chatbot/backend/src/api/chatkit.py with JWT authentication, TaskChatKitServer.respond()
- [ ] T054 [US1] Add user context injection (user_id from JWT) to ChatKitServer.respond() - context_variables passed to agent
- [ ] T055 [US1] Implement conversation initialization with system prompt on first message in SQLiteSession

**Checkpoint**: Users can now manage tasks via natural language chat using ChatKit protocol. All 8 operations work (add/list/complete/delete/update/set_priority/list_by_priority/bulk_update).

---

## Phase 5: User Story 2 - Context-Aware Priority Detection (Priority: P2)

**Goal**: AI automatically detects task priority from urgency keywords without explicit specification

**Independent Test**: Create tasks with phrases like "urgent task", "when you have time", verify high/low priority assigned automatically

**Why Third**: Enhances US1 with intelligent priority assignment. Builds on working task creation.

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T056 [P] [US2] Unit test for high priority detection in phase-3-todo-ai-chatbot/backend/tests/unit/test_priority_detection.py - test keywords: urgent, ASAP, critical, emergency, immediately, important, right now
- [ ] T057 [P] [US2] Unit test for low priority detection in phase-3-todo-ai-chatbot/backend/tests/unit/test_priority_detection.py - test keywords: when you have time, someday, eventually, maybe, low priority, if possible
- [ ] T058 [P] [US2] Unit test for medium priority default in phase-3-todo-ai-chatbot/backend/tests/unit/test_priority_detection.py - test neutral descriptions with no indicators
- [ ] T059 [US2] Integration test for agent priority detection in phase-3-todo-ai-chatbot/backend/tests/integration/test_agent_behavior.py - send "add urgent task to X", verify add_task called with priority="high"

### Implementation for User Story 2

- [ ] T060 [US2] Add priority detection keywords to agent system prompt in phase-3-todo-ai-chatbot/backend/src/chatkit/agent.py - high priority indicators, low priority indicators, default medium
- [ ] T061 [US2] Add priority detection examples to agent prompt per contracts/agent-prompt.md priority section
- [ ] T062 [US2] Verify add_task tool accepts optional priority parameter and defaults to "medium" if not provided
- [ ] T063 [US2] Add priority validation (high/medium/low enum) to add_task tool input schema
- [ ] T064 [US2] Test priority detection with 30+ example phrases covering all three levels (high/medium/low) to validate 90% accuracy requirement (SC-008)

**Checkpoint**: Tasks now automatically receive appropriate priority based on urgency language.

---

## Phase 6: User Story 3 - Conversational Personality and Boundaries (Priority: P2)

**Goal**: AI maintains friendly personality, greets users, acknowledges gratitude, politely declines off-topic requests

**Independent Test**: Send "hello", "thank you", "what's the weather?" - verify appropriate warm greeting, acknowledgment, and polite decline with redirect

**Why Fourth**: Improves user experience with natural conversation. Independent of task operations.

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T065 [P] [US3] Integration test for greeting handling in phase-3-todo-ai-chatbot/backend/tests/integration/test_agent_behavior.py - send "hello", verify warm greeting response without tool calls
- [ ] T066 [P] [US3] Integration test for gratitude acknowledgment in phase-3-todo-ai-chatbot/backend/tests/integration/test_agent_behavior.py - complete task, send "thank you", verify polite acknowledgment
- [ ] T067 [P] [US3] Integration test for off-topic decline in phase-3-todo-ai-chatbot/backend/tests/integration/test_agent_behavior.py - send "what's the weather?", verify polite decline with explanation + redirect to task management
- [ ] T068 [P] [US3] Integration test for capabilities explanation in phase-3-todo-ai-chatbot/backend/tests/integration/test_agent_behavior.py - send "what can you do?", verify list of 8 task operations

### Implementation for User Story 3

- [ ] T069 [US3] Add personality guidelines to agent system prompt in phase-3-todo-ai-chatbot/backend/src/chatkit/agent.py - friendly, professional, concise, positive tone
- [ ] T070 [US3] Add greeting handling instructions to agent system prompt - respond warmly to "hi"/"hello"/"hey" with offer to help
- [ ] T071 [US3] Add gratitude handling instructions to agent system prompt - acknowledge "thank you"/"thanks" politely
- [ ] T072 [US3] Add off-topic handling instructions to agent system prompt - politely decline weather/jokes/cooking with explanation and redirect to task capabilities
- [ ] T073 [US3] Add capabilities explanation to agent system prompt - "what can you do?" should list all 8 operations clearly

**Checkpoint**: Chatbot now has friendly personality and clear boundaries. 100% off-topic handling success (SC-009).

---

## Phase 7: User Story 5 - Real-Time Streaming Responses (Priority: P2)

**Goal**: AI responses stream progressively word-by-word rather than appearing all at once

**Independent Test**: Send complex query requiring multi-step reasoning, observe text appearing progressively instead of waiting for complete response

**Why Fifth**: Enhances perceived performance of existing chat. Requires streaming infrastructure.

### Tests for User Story 5

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T074 [P] [US5] Integration test for streaming response in phase-3-todo-ai-chatbot/backend/tests/integration/test_chatkit_endpoint.py - send message, verify ChatKit events arrive progressively
- [ ] T075 [P] [US5] Integration test for tool call streaming in phase-3-todo-ai-chatbot/backend/tests/integration/test_chatkit_endpoint.py - verify tool_call and tool_result events in stream
- [ ] T076 [US5] E2E test for streaming display in phase-3-todo-ai-chatbot/frontend/__tests__/e2e/chat-streaming.spec.ts - send message, verify text appears progressively in ChatKit widget

### Implementation for User Story 5

- [ ] T077 [US5] Implement ChatKit event streaming in phase-3-todo-ai-chatbot/backend/src/chatkit/streaming.py - chunk, tool_call, tool_result, done events
- [ ] T078 [US5] Configure Runner.run_streamed() for streaming mode in TodoAgent with async context manager
- [ ] T079 [US5] Verify ChatKit widget streaming configuration in phase-3-todo-ai-chatbot/frontend/lib/chatkit-client.ts - streaming: true, progressive text rendering

**Checkpoint**: Responses now stream in real-time via ChatKit protocol. Streaming starts within 1 second (SC-005).

---

## Phase 8: User Story 6 - Data Retention and Privacy Compliance (Priority: P3)

**Goal**: Messages automatically expire after 2 days per retention policy

**Independent Test**: Create messages with backdated timestamps, run cleanup job, verify messages older than 2 days are deleted

**Why Sixth**: Data governance feature. Independent of core functionality. Can be added last.

### Tests for User Story 6

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T080 [P] [US6] Unit test for retention cleanup logic in phase-3-todo-ai-chatbot/backend/tests/unit/test_retention_service.py - create messages with backdated expires_at, run cleanup, verify only expired messages deleted
- [ ] T081 [P] [US6] Unit test for retention policy preservation in phase-3-todo-ai-chatbot/backend/tests/unit/test_retention_service.py - create messages 1 day old and 3 days old, run cleanup, verify 1-day-old remains
- [ ] T082 [US6] Integration test for scheduled cleanup in phase-3-todo-ai-chatbot/backend/tests/integration/test_retention_cleanup.py - test APScheduler job execution with backdated data

### Implementation for User Story 6

- [ ] T083 [P] [US6] Create message cleanup task in phase-3-todo-ai-chatbot/backend/src/services/retention_service.py with cleanup_expired_messages function
- [ ] T084 [US6] Implement message deletion query with expires_at field (messages older than 2 days auto-expire) in retention service
- [ ] T085 [US6] Add cron job configuration for daily cleanup at 2 AM or optional APScheduler integration
- [ ] T086 [US6] Add logging to cleanup_expired_messages - log deleted count and timestamp
- [ ] T087 [US6] Create optional admin endpoint POST /admin/cleanup/messages for manual cleanup trigger

**Checkpoint**: Message retention policy active. Messages with expires_at < NOW() automatically deleted daily.

---

## Phase 9: Frontend Chat Interface (ChatKit Integration)

**Purpose**: User-facing chat UI with ChatKit widget

**Note**: This can be developed in parallel with backend phases after Phase 2 completes

### Tests for Frontend

- [ ] T088 [P] E2E test for chat page rendering in phase-3-todo-ai-chatbot/frontend/__tests__/e2e/chat-page.spec.ts - navigate to /chat, verify ChatKit widget loads
- [ ] T089 [P] E2E test for authentication requirement in phase-3-todo-ai-chatbot/frontend/__tests__/e2e/chat-auth.spec.ts - access /chat without auth, verify redirect to sign-in
- [ ] T090 E2E test for message submission in phase-3-todo-ai-chatbot/frontend/__tests__/e2e/chat-message-submit.spec.ts - type message, press enter, verify message appears and response streams

### Implementation for Frontend

- [ ] T091 [P] Create /chat route page in phase-3-todo-ai-chatbot/frontend/app/chat/page.tsx with authentication check and ChatKit widget
- [ ] T092 [P] Create ChatKit widget wrapper component in phase-3-todo-ai-chatbot/frontend/components/chat/chatkit-widget.tsx with Better Auth JWT integration
- [ ] T093 [P] Create chat page layout in phase-3-todo-ai-chatbot/frontend/components/chat/chat-layout.tsx with responsive design
- [ ] T094 Create getBetterAuthToken function in phase-3-todo-ai-chatbot/frontend/lib/chatkit-client.ts to retrieve JWT from Better Auth session
- [ ] T095 Configure ChatKit widget in chatkit-widget.tsx - apiUrl from NEXT_PUBLIC_CHATKIT_URL, authToken from getBetterAuthToken, streaming enabled, maxMessageLength 2000, theme matching app design
- [ ] T096 Add NEXT_PUBLIC_CHATKIT_URL environment variable to frontend .env.local pointing to backend /api/chatkit endpoint
- [ ] T097 Add error handling to ChatKit widget - onError callback with user-friendly messages for timeout, unauthorized, network errors
- [ ] T098 Add character counter UI for message input showing remaining characters out of 2000 (FR-032 requirement)

**Checkpoint**: Chat UI fully functional. Users can interact with AI through ChatKit widget.

---

## Phase 10: Edge Cases & Resilience

**Purpose**: Handle edge cases from FR-031 to FR-035

### Tests for Edge Cases

- [ ] T099 [P] Integration test for 30-second timeout in phase-3-todo-ai-chatbot/backend/tests/integration/test_edge_cases_timeout.py - mock slow agent response, verify timeout error after 30s
- [ ] T100 [P] Integration test for 2000 char limit in phase-3-todo-ai-chatbot/backend/tests/integration/test_edge_cases_char_limit.py - send 2001 char message, verify 422 validation error
- [ ] T101 [P] Integration test for message queueing in phase-3-todo-ai-chatbot/backend/tests/integration/test_edge_cases_queueing.py - send rapid consecutive messages, verify sequential processing
- [ ] T102 [P] Integration test for database retry logic in phase-3-todo-ai-chatbot/backend/tests/integration/test_edge_cases_db_retry.py - mock database unavailable, verify 3 retry attempts with exponential backoff
- [ ] T103 Integration test for 100-conversation limit in phase-3-todo-ai-chatbot/backend/tests/integration/test_edge_cases_conversation_limit.py - create 101 conversations, verify oldest deleted (FIFO with is_active)

### Implementation for Edge Cases

- [ ] T104 [P] Add timeout handling to ChatKitServer.respond() - catch asyncio.TimeoutError, return error event (FR-031)
- [ ] T105 [P] Add message length validation to ChatKit protocol - max 2000 chars for user messages, return error if exceeded (FR-032)
- [ ] T106 [P] Implement message queueing for rapid consecutive submissions in ChatKit widget frontend (FR-033)
- [ ] T107 [P] Add database retry logic with exponential backoff in async_session.py - 3 attempts with 1s, 2s, 4s delays (FR-034)
- [ ] T108 Verify 100-conversation limit enforcement in ConversationService.get_or_create_conversation with FIFO deletion and is_active flag (FR-035)
- [ ] T109 Add client-side character counter to frontend message input - show remaining/2000 chars, disable submit when exceeded
- [ ] T110 Add "message queued" UI indicator to frontend ChatKit widget for pending messages awaiting AI processing

**Checkpoint**: All edge cases handled. System resilient to timeouts, limits, and rapid input.

---

## Phase 11: Testing & Quality

**Purpose**: Comprehensive testing across all user stories

### Backend Testing

- [ ] T111 [P] Run all MCP tool unit tests in phase-3-todo-ai-chatbot/backend/tests/unit/ - verify all 8 tools work correctly
- [ ] T112 [P] Run all agent behavior integration tests in phase-3-todo-ai-chatbot/backend/tests/integration/ - verify ChatKit protocol, streaming, timeout
- [ ] T113 [P] Run chat endpoint integration tests - verify ChatKit protocol compliance
- [ ] T114 Run backend test coverage report with pytest --cov - target 70%+ coverage
- [ ] T115 Performance test: Load 500 messages for conversation, verify loads within 2 seconds (SC-006)
- [ ] T116 Performance test: 100 concurrent chat requests, verify system handles without degradation (SC-007)
- [ ] T117 Accuracy test: Priority detection accuracy test - 30+ examples, verify 90%+ correct assignment (SC-008)

### Frontend Testing

- [ ] T118 [P] Run all E2E tests in phase-3-todo-ai-chatbot/frontend/__tests__/e2e/ - verify chat page, task creation, streaming, persistence
- [ ] T119 [P] Run frontend component tests with Vitest - verify ChatKit integration, error handling, character counter
- [ ] T120 Browser compatibility test: Verify ChatKit widget works in Chrome, Firefox, Safari, Edge
- [ ] T121 Mobile responsiveness test: Verify chat interface works on mobile screen sizes (viewport < 768px)

### Cross-Cutting Testing

- [ ] T122 Security test: Verify user isolation - attempt to access other user's conversations and tasks, confirm permission denied
- [ ] T123 Security test: Verify JWT validation - send chat request without token, with invalid token, with expired token, confirm 401 errors
- [ ] T124 Stateless verification test: Create conversation, add messages, restart backend server, verify conversation loads correctly without in-memory state
- [ ] T125 Horizontal scaling test: Run multiple backend instances behind load balancer, verify any instance can handle any user's request (SC-012)

**Checkpoint**: All tests pass. System meets success criteria SC-001 through SC-015.

---

## Phase 12: Polish & Documentation

**Purpose**: Final improvements and documentation updates

- [ ] T126 [P] Update quickstart.md in specs/006-ai-chatbot/ with actual setup steps from implementation
- [ ] T127 [P] Create demo conversation examples in quickstart.md showing typical user interactions
- [ ] T128 [P] Add deployment documentation in DEPLOYMENT.md - environment variables, database setup, production configuration
- [ ] T129 [P] Update CLAUDE.md with Phase 3 implementation notes and agent context
- [ ] T130 Code review: Review all backend services against specification FR-001 through FR-035
- [ ] T131 Code review: Review all MCP tools for security (user validation on every tool call)
- [ ] T132 Code review: Verify stateless architecture - no in-memory sessions, all state in database
- [ ] T133 Performance optimization: Add database query logging, identify slow queries, optimize with indexes if needed
- [ ] T134 Performance optimization: Profile chat endpoint response time, optimize conversation loading if exceeds 2s budget
- [ ] T135 Create example chat conversations for manual testing - cover all 6 user stories and edge cases
- [ ] T136 Run final constitution compliance check - verify all gates still pass after implementation

**Checkpoint**: Phase III complete. AI chatbot fully functional, tested, and documented.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - **US4 (Persistent History)**: Can start after Phase 2 - No other dependencies
  - **US1 (Task Management)**: Depends on US4 (needs conversation persistence)
  - **US2 (Priority Detection)**: Depends on US1 (enhances task creation)
  - **US3 (Personality)**: Depends on US1 (enhances conversation, independent of tasks)
  - **US5 (Streaming)**: Depends on US1 (enhances response delivery)
  - **US6 (Retention)**: Independent - can start after Phase 2
- **Frontend (Phase 9)**: Can start after Phase 2, integrates with backend user stories
- **Edge Cases (Phase 10)**: Depends on US1, US4, US5 completion
- **Testing (Phase 11)**: Depends on all desired user stories being complete
- **Polish (Phase 12)**: Depends on all testing passing

### User Story Dependencies (for parallel execution)

```
Phase 2 (Foundational) →
    ├→ US4 (Persistent History) [P1] → US1 (Task Management) [P1] → US2 (Priority Detection) [P2]
    │                                                             ├→ US3 (Personality) [P2]
    │                                                             └→ US5 (Streaming) [P2]
    └→ US6 (Retention) [P3] (independent)
```

### Critical Path (for MVP)

1. Phase 1: Setup (T001-T005)
2. Phase 2: Foundational (T006-T020) ⚠️ BLOCKING
3. Phase 3: US4 Persistent History (T021-T031)
4. Phase 4: US1 Task Management (T032-T055)
5. Phase 9: Frontend Chat Interface (T088-T098)
6. Phase 11: Core Testing (T111-T117, T118-T121)

**MVP Delivery**: After critical path complete, system has core value - natural language task management with persistence via ChatKit protocol.

### Parallel Opportunities

**After Phase 2 completes**, these can run in parallel:
- US4 tests (T021-T024)
- US4 implementation (T025-T031)
- US6 implementation (T083-T087) - completely independent
- Frontend foundation (T091-T093)

**After US1 completes**, these can run in parallel:
- US2 (Priority Detection) - T056-T064
- US3 (Personality) - T065-T073
- US5 (Streaming) - T074-T079

---

## Parallel Example: User Story 1 (Task Management)

```bash
# Tests (write first, ensure they fail):
Task: "Unit test for add_task MCP tool" (T032)
Task: "Unit test for list_tasks MCP tool" (T033)
Task: "Unit test for complete_task MCP tool" (T034)
Task: "Unit test for delete_task MCP tool" (T035)
Task: "Unit test for update_task MCP tool" (T036)
Task: "Unit test for set_priority MCP tool" (T037)
Task: "Unit test for list_tasks_by_priority MCP tool" (T038)
Task: "Unit test for bulk_update_tasks MCP tool" (T039)
# → All 8 tests can be written in parallel

# MCP Tools Implementation:
Task: "Implement add_task MCP tool" (T043)
Task: "Implement list_tasks MCP tool" (T044)
Task: "Implement complete_task MCP tool" (T045)
Task: "Implement delete_task MCP tool" (T046)
Task: "Implement update_task MCP tool" (T047)
Task: "Implement set_priority MCP tool" (T048)
Task: "Implement list_tasks_by_priority MCP tool" (T049)
Task: "Implement bulk_update_tasks MCP tool" (T050)
# → All 8 tools can be implemented in parallel (different files)
```

---

## Implementation Strategy

### MVP First (Critical Path Only)

1. Complete Phase 1: Setup (5 tasks)
2. Complete Phase 2: Foundational (20 tasks) - CRITICAL BLOCKER
3. Complete Phase 3: US4 Persistent History (11 tasks)
4. Complete Phase 4: US1 Task Management (24 tasks)
5. Complete Phase 9: Frontend Chat Interface (11 tasks)
6. Run core tests (Phase 11: T111-T121)
7. **STOP and VALIDATE**: Full natural language task management works with ChatKit protocol
8. Deploy/demo if ready

**Total MVP Tasks**: ~82 tasks

### Incremental Delivery (Recommended)

1. MVP: Setup + Foundational + US4 + US1 + Frontend → **Core ChatKit chatbot works**
2. Add US2: Priority Detection → **Smart priority assignment**
3. Add US3: Personality → **Friendly conversation experience**
4. Add US5: Streaming → **Real-time response feel**
5. Add US6: Retention → **Data governance compliance**
6. Add Phase 10: Edge Cases → **Production resilience**
7. Polish with Phase 12 → **Production ready**

Each increment adds value without breaking previous functionality.

### Using Subagents and Skills

**Backend Implementation** (chatkit-backend-engineer subagent):
- Use **new-openai-chatkit-backend-python** skill (PRIMARY) - ChatKitServer, TodoAgent, stream_agent_response, 8 MCP tools
- Use **openai-agents-mcp-integration** skill - MCP server patterns with FastMCP
- Use **fastapi-development** skill for API endpoint patterns
- Use **neon-serverless-postgresql** skill for database operations
- Use **better-auth** skill for JWT validation
- Use **task-service** skill for task CRUD operations

**Frontend Implementation** (chatkit-frontend-engineer subagent):
- Use **openai-chatkit-frontend-embed-skill** for ChatKit widget integration
- Use **nextjs16-development** skill for App Router and page components
- Use **shadcn-ui-development** skill for UI components
- Use **tailwindcss-styling** skill for responsive design
- Use **better-auth** skill for authentication client

---

## Notes

- **[P]** tasks = different files, no dependencies within that phase
- **[Story]** label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Tests written first per TDD approach - ensure they FAIL before implementation
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Use chatkit-backend-engineer and chatkit-frontend-engineer subagents with their skills

---

## Total Task Count

- **Setup**: 5 tasks
- **Foundational**: 20 tasks
- **US4 (Persistent History)**: 11 tasks
- **US1 (Task Management)**: 24 tasks
- **US2 (Priority Detection)**: 9 tasks
- **US3 (Personality)**: 8 tasks
- **US5 (Streaming)**: 6 tasks
- **US6 (Retention)**: 8 tasks
- **Frontend**: 13 tasks
- **Edge Cases**: 11 tasks
- **Testing**: 15 tasks
- **Polish**: 11 tasks

**Total**: 141 tasks

**Parallel Opportunities**: 72 tasks marked [P] can run in parallel within their phases
**MVP Scope**: 82 tasks (Setup + Foundational + US4 + US1 + Frontend + Core Tests)
**Independent Test Criteria**: 6 user stories each have clear independent test validation
