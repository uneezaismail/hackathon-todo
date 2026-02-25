# Phase III - AI-Powered Todo Chatbot

## Project Overview
This is a Full-Stack AI-powered Todo application with natural language task management via ChatKit.
**Current Phase:** Phase III (AI Chatbot Integration).

## Core Principles
1. **Spec-Driven Development:** ALWAYS read/reference specifications in `specs/006-ai-chatbot/` before writing code.
2. **AI-Native:** Uses OpenAI Agents SDK with MCP tools for task operations.
3. **Stateless Architecture:** No in-memory sessions - all state persists in database.
4. **Strict Isolation:** Users can ONLY access their own data (enforced via JWT).

## Technology Stack
| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), Tailwind CSS, Shadcn UI, Better Auth, OpenAI ChatKit |
| **Backend** | Python 3.13+, FastAPI, SQLModel, Alembic, UV, OpenAI Agents SDK |
| **AI/LLM** | Multi-provider support (OpenAI, Gemini, Groq, OpenRouter) |
| **Database** | Neon Serverless PostgreSQL (Drizzle for Auth, SQLModel for Tasks + Chat) |
| **Auth** | Better Auth (Frontend) + JWT Shared Secret (Backend Verification) |
| **Protocol** | ChatKit Protocol with MCP (Model Context Protocol) tools |

## Project Structure
```text
phase-3-todo-ai-chatbot/
├── frontend/                    # Next.js 16 Web App
│   ├── app/                     # App Router (dashboard, chat, auth)
│   ├── components/              # Shadcn UI & Features
│   │   ├── chat/                # ChatKit widget, global chat button
│   │   ├── dashboard/           # Dashboard components
│   │   ├── tasks/               # Task management components
│   │   └── ui/                  # Shadcn UI primitives
│   ├── lib/                     # Auth & API clients
│   └── actions/                 # Server Actions (Backend Comms)
├── backend/                     # FastAPI + AI Service
│   ├── src/
│   │   ├── api/                 # REST & ChatKit endpoints
│   │   ├── auth/                # JWT validation
│   │   ├── db/                  # Database sessions (sync + async)
│   │   ├── models/              # SQLModel entities (Task, Conversation, Message)
│   │   ├── schemas/             # Pydantic schemas
│   │   ├── services/            # Business logic (TaskService, ChatKitServer)
│   │   └── tasks/               # Background tasks (message cleanup)
│   ├── mcp_server/              # MCP tools (add_task, list_tasks, etc.)
│   ├── tests/                   # Pytest Suite
│   └── alembic/                 # Database Migrations
└── CLAUDE.md                    # This file
```

## AI Chatbot Features
- **Natural Language Task Management:** "Add a task to buy groceries", "Show my pending tasks"
- **Priority Detection:** Automatic priority from language ("urgent task" → High)
- **Conversational Personality:** Friendly greetings, gratitude acknowledgment, off-topic handling
- **Persistent Conversations:** History saved in database, resumes across sessions
- **Real-time Streaming:** Responses stream progressively via SSE
- **Data Retention:** Messages auto-expire after 2 days

## Global Development Workflow
1. **Read Spec:** Check `specs/006-ai-chatbot/` for feature definition.
2. **Plan:** Break down tasks using `/sp.plan` or `write_todos`.
3. **Implement:** Code in `frontend/` or `backend/` contexts.
4. **Verify:** Run strict linting, type-checking, and tests.

## Key Commands
| Context | Command | Description |
| :--- | :--- | :--- |
| **Root** | `cd frontend && npm install` | Install frontend deps |
| **Root** | `cd backend && uv sync` | Install backend deps |
| **Frontend** | `npm run dev` | Start Next.js (Port 3000) |
| **Backend** | `uv run uvicorn src.main:app --reload --port 8000` | Start FastAPI (Port 8000) |
| **Database** | `npx drizzle-kit push` | Push Frontend Schema (Auth) |
| **Database** | `uv run alembic upgrade head` | Push Backend Schema (Tasks + Chat) |
| **Docker** | `docker-compose up --build` | Build and start all services |
| **Tests** | `cd backend && uv run pytest` | Run backend tests |
| **Tests** | `cd frontend && npm test` | Run frontend tests |

## Authentication Architecture
- **Frontend:** Better Auth handles Login/Signup → Stores in `user`, `session`, `account` tables.
- **Handshake:** Frontend sends JWT in Authorization header to backend.
- **Backend:** Receives JWT → Verifies signature → Extracts User ID → Filters Data.
- **Shared Secret:** `BETTER_AUTH_SECRET` MUST match in both `.env` files.
- **User Isolation:** All API endpoints and MCP tools validate `jwt_user_id` before operations.

## ChatKit Integration
- **Endpoint:** `POST /api/chatkit` - Official ChatKit protocol endpoint
- **Frontend Widget:** Global floating chat button on all authenticated pages
- **MCP Tools:** 7 tools (add_task, list_tasks, complete_task, delete_task, update_task, set_priority, get_task)
- **Memory:** SQLiteSession for conversation persistence per user+thread
- **Streaming:** SSE responses with progressive text rendering

## Environment Variables

### Frontend (.env.local)
```bash
DATABASE_URL=postgresql://...              # Neon connection string
BETTER_AUTH_SECRET=your-secret-key         # MUST match backend
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000  # Backend URL
NEXT_PUBLIC_CHATKIT_URL=http://localhost:8000/api/chatkit
```

### Backend (.env)
```bash
DATABASE_URL=postgresql://...              # Neon connection string
BETTER_AUTH_SECRET=your-secret-key         # MUST match frontend
CORS_ORIGINS=http://localhost:3000
LLM_PROVIDER=openai                        # openai | gemini | groq | openrouter
OPENAI_API_KEY=sk-...                      # Or other provider key
```

## Recent Changes
- 006-ai-chatbot: Added AI chatbot with ChatKit, OpenAI Agents SDK, MCP tools
- Multi-provider LLM support (OpenAI, Gemini, Groq, OpenRouter)
- Conversation persistence with 2-day retention
- Global floating chat button on authenticated pages
