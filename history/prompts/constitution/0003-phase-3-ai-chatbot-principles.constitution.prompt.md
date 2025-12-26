---
id: 0003
title: phase-3-ai-chatbot-principles
stage: constitution
date: 2025-12-19
surface: Claude Code
model: claude-sonnet-4-5
feature: none
branch: master
user: uneezaismail
command: /sp.constitution
labels: [phase-3, ai-chatbot, mcp-server, openai-agents-sdk]
links:
  spec: N/A
  ticket: N/A
  adr: N/A
  pr: N/A
files:
  - path: .specify/memory/constitution.md
    status: modified
    lines_added: 63
    lines_removed: 5
tests:
  - N/A (constitution update, no tests)
---

## Prompt

```text
Add Phase 3 AI Chatbot principles:

1. All chatbot functionality must use OpenAI Agents SDK and Official MCP Python SDK
2. Chat endpoints must be completely stateless - fetch conversation history from database on every request
3. MCP tools must be stateless, single-purpose, and reuse existing backend services
4. Every MCP tool must validate user_id matches authenticated user for security
5. Conversations and messages must persist in Neon database tables
6. Agent responses must be deterministic and testable
7. All MCP tools require unit tests and integration tests with mock agent

Keep all existing Phase 1 and Phase 2 principles.
```

## Response snapshot

Successfully updated constitution from version 1.1.0 to 1.2.0 with Phase III AI Chatbot principles.

**Added Sections:**
- Section XIII: Conversational AI Architecture (OpenAI Agents SDK, MCP Server patterns)
- Section XIV: Stateless Service Pattern (Database-backed conversation state)
- Section XV: MCP Tool Design Standards (Tool naming, parameters, security)
- Section XVI: AI Safety and User Isolation (Agent security and user data protection)
- Section XVII: Conversation Management (Chat history persistence and retrieval)

**Modified Sections:**
- Section VIII: Automated Testing (added AI/MCP testing requirements)
- Section 4: Immutable Tech Stack (added OpenAI ChatKit for Phase III)

All existing Phase 1 and Phase 2 principles preserved intact. Version bumped to 1.2.0 (MINOR) as new architectural sections were added without breaking existing principles.

## Outcome

- ✅ Impact: Constitution successfully updated for Phase III with 5 new sections covering AI chatbot architecture, stateless design, MCP tools, agent safety, and conversation management
- 🧪 Tests: N/A (constitutional amendment, no code changes)
- 📁 Files: Modified .specify/memory/constitution.md (version 1.1.0 → 1.2.0)
- 🔁 Next prompts: /sp.specify (create Phase 3 feature spec), /sp.plan (generate implementation plan), /sp.tasks (break into atomic tasks)
- 🧠 Reflection: The Phase III principles extend the existing Evolutionary Architecture and User Isolation patterns to the AI/conversational layer, ensuring consistency and security across all phases

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): N/A (constitutional update)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
