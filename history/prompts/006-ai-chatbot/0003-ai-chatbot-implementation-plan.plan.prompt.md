---
id: 0003
title: ai-chatbot-implementation-plan
stage: plan
date: 2025-12-22T00:00:00Z
surface: CLI
model: claude-sonnet-4-5
feature: 006-ai-chatbot
branch: 006-ai-chatbot
user: uneezaismail
command: /sp.plan
labels: [planning, architecture, mcp, chatbot, stateless]
links:
  spec: specs/006-ai-chatbot/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - path: specs/006-ai-chatbot/plan.md
    status: created
    type: plan
  - path: specs/006-ai-chatbot/research.md
    status: created
    type: research
  - path: specs/006-ai-chatbot/data-model.md
    status: created
    type: data-model
  - path: specs/006-ai-chatbot/contracts/chat-api.yaml
    status: created
    type: contract
  - path: specs/006-ai-chatbot/contracts/mcp-tools.yaml
    status: created
    type: contract
  - path: specs/006-ai-chatbot/contracts/agent-prompt.md
    status: created
    type: contract
  - path: specs/006-ai-chatbot/quickstart.md
    status: created
    type: quickstart
  - path: CLAUDE.md
    status: modified
    type: agent-context
tests:
  - type: validation
    status: passed
    description: All Constitution gates pass pre and post-design
  - type: design-completeness
    status: passed
    description: All research decisions resolved, all contracts complete
---

## Prompt

/sp.plan

Create complete implementation plan for Phase 3 AI Chatbot. we will use the phase-3-todo-ai-chatbot and write phase 3 code there. we will use subagents in implementation  - chatkit-backend-engineer with its skills and  - chatkit-frontend-engineer with its skills for the implementation.

## Response snapshot

Created comprehensive implementation plan for AI-Powered Todo Chatbot with complete Phase 0 (Research) and Phase 1 (Design & Contracts) deliverables:

**Planning Structure**:
- **Technical Context**: Defined Python 3.13+/TypeScript stack, OpenAI Agents SDK, Official MCP Python SDK, OpenAI ChatKit, Neon PostgreSQL
- **Constitution Check**: All 17 gates passed (pre and post-design validation)
- **Project Structure**: Detailed directory layout for phase-3-todo-ai-chatbot with backend (MCP server, tools, models, services) and frontend (ChatKit integration)

**Phase 0 Research** (research.md - 6 technology decisions):
1. **OpenAI Agents SDK Integration**: FastAPI dependency injection, streaming support, 30-second timeout, stateless design
2. **Official MCP Python SDK**: Tool registration with Pydantic schemas, user_id validation, service delegation pattern
3. **OpenAI ChatKit Frontend**: Widget setup, Better Auth JWT integration, streaming display configuration
4. **Database Schema**: Two-table design (conversations, messages) with indexes, retention cleanup, FIFO enforcement
5. **Priority Detection**: Prompt engineering strategy for high/medium/low priority extraction from natural language
6. **Conversation Loading**: Full history load approach (stateless, performant for 500 messages)

**Phase 1 Design** (data-model.md, contracts/, quickstart.md):

1. **Data Model** (data-model.md):
   - Conversation entity: UUID, user_id, timestamps, 100-conversation limit
   - Message entity: UUID, conversation_id, role (user/assistant), content (2000 char limit), created_at
   - Task entity extension: priority field (high/medium/low)
   - Alembic migration: 002_add_chat_tables.py
   - Indexes: 6 total for optimized queries
   - Retention service: 2-day message expiration

2. **API Contracts** (contracts/):
   - **chat-api.yaml**: POST /api/v1/chat with SSE streaming, JWT auth, 30-second timeout, error handling
   - **mcp-tools.yaml**: 5 MCP tools (add_task, list_tasks, complete_task, delete_task, update_task) with Pydantic schemas, user validation, security model
   - **agent-prompt.md**: Complete system prompt with personality, priority detection rules, error handling, conversation continuity

3. **Quickstart Guide** (quickstart.md):
   - 10 phases: Environment setup, Backend setup, Frontend setup, Testing, Development tasks, Troubleshooting, Performance optimization, Example conversations, Next steps
   - Environment variables for backend and frontend
   - Database migration commands
   - Test execution instructions
   - Detailed example conversations

**Implementation Phases** (for /sp.tasks reference):
- Phase 1: Backend Foundation (database, models, MCP server)
- Phase 2: MCP Tools (5 tools with user validation)
- Phase 3: Agent Integration (OpenAI Agents SDK, streaming)
- Phase 4: Frontend Chat Interface (ChatKit widget)
- Phase 5: Edge Cases & Resilience (queuing, retries, limits)
- Phase 6: Data Retention & Cleanup
- Phase 7: Testing & Quality
- Phase 8: Polish & Documentation

**Agent Context Update**: Successfully updated CLAUDE.md with Phase 3 technologies (OpenAI Agents SDK, MCP, ChatKit, Neon conversations/messages tables)

## Outcome

- ✅ Impact: Complete implementation plan created for Phase III with 7 design artifacts (plan, research, data-model, 3 contracts, quickstart). All 6 research decisions resolved, database schema finalized, 5 MCP tools fully specified, agent prompt engineered, local development workflow documented.
- 🧪 Tests: Constitution validation - all 17 gates passed both pre and post-design. Design completeness validation passed - all technical unknowns resolved, all contracts implementable.
- 📁 Files: Created plan.md (451 lines), research.md (542 lines), data-model.md (597 lines), chat-api.yaml (195 lines), mcp-tools.yaml (314 lines), agent-prompt.md (372 lines), quickstart.md (709 lines). Updated CLAUDE.md with Phase 3 context.
- 🔁 Next prompts: /sp.tasks to generate task breakdown for 8 implementation phases using chatkit-backend-engineer and chatkit-frontend-engineer subagents
- 🧠 Reflection: Research-first approach resolved all ambiguities before design. Contracts provide sufficient detail for autonomous code generation. Stateless architecture enforced through database schema design. Constitutional alignment verified twice (pre/post-design).

## Evaluation notes (flywheel)

- Failure modes observed: None - all design decisions made decisively, no circular dependencies or contradictions detected
- Graders run and results (PASS/FAIL): Constitution Check (pre-design) - PASS (17/17 gates), Constitution Check (post-design) - PASS (17/17 gates), Design Completeness - PASS (all research resolved, all contracts complete)
- Prompt variant (if applicable): Standard /sp.plan workflow with user specification of subagents (chatkit-backend-engineer, chatkit-frontend-engineer)
- Next experiment (smallest change to try): Consider adding performance benchmarks section to plan.md for tracking success criteria metrics (95% accuracy, 1s streaming start, 2s history load)
