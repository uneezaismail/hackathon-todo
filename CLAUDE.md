# Hackathon II - The Evolution of Todo

## Project Overview
This is a Full-Stack, Spec-Driven Development project evolving from a console app to a Cloud-Native AI system.
**Current Phase:** Phase II (Full-Stack Web Application).

## Core Principles
1.  **Spec-Driven Development:** ALWAYS read/reference specifications in `specs/` before writing code.
2.  **AI-Native:** Use Claude Code and Spec-Kit Plus workflows.
3.  **Monorepo:** Frontend and Backend live in the same repo but are deployed independently.
4.  **Strict Isolation:** Users can ONLY access their own data (enforced via JWT & URL params).

## Technology Stack
| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), Tailwind CSS, Shadcn UI, Better Auth |
| **Backend** | Python 3.13+, FastAPI, SQLModel, Alembic, UV |
| **Database** | Neon Serverless PostgreSQL (Drizzle for Auth, SQLModel for Tasks) |
| **Auth** | Better Auth (Frontend) + JWT Shared Secret (Backend Verification) |

## Project Structure
```text
hackathon-todo/
├── frontend/               # Next.js 16 Web App
│   ├── app/                # App Router
│   ├── components/         # Shadcn UI & Features
│   ├── lib/                # Auth & API clients
│   └── actions/            # Server Actions (Backend Comms)
├── backend/                # FastAPI Service
│   ├── src/                # Application Source
│   ├── tests/              # Pytest Suite
│   └── alembic/            # Database Migrations
├── specs/                  # Specification Documentation
│   ├── 001-todo-console-app/
│   ├── 002-fastapi-backend/
│   └── 003-nextjs-frontend/
└── CLAUDE.md               # This file
```

## Global Development Workflow
1.  **Read Spec:** Check `specs/` for the feature definition.
2.  **Plan:** Break down tasks using `/sp.plan` or `write_todos`.
3.  **Implement:** Code in `frontend/` or `backend/` contexts.
4.  **Verify:** Run strict linting, type-checking, and tests.

## Key Commands
| Context | Command | Description |
| :--- | :--- | :--- |
| **Root** | `cd frontend && npm install` | Install frontend deps |
| **Root** | `cd backend && uv sync` | Install backend deps |
| **Frontend** | `npm run dev` | Start Next.js (Port 3000) |
| **Backend** | `uv run uvicorn src.main:app --reload --port 8000` | Start FastAPI (Port 8000) |
| **Database** | `npx drizzle-kit push` | Push Frontend Schema (Auth) |
| **Database** | `uv run alembic upgrade head` | Push Backend Schema (Tasks) |
| **Docker** | `docker-compose up --build` | Build and start all services |

## Authentication Architecture
- **Frontend:** Better Auth handles Login/Signup -> Stores in `user`, `session`, `account` tables.
- **Handshake:** Frontend mints a JWT signed with `BETTER_AUTH_SECRET`.
- **Backend:** Receives JWT -> Verifies signature -> Extracts User ID -> Validates against URL `{user_id}` -> Filters Data.
- **Shared Secret:** `BETTER_AUTH_SECRET` MUST match in both `.env` files.
- **User Isolation:** All API endpoints use format `/api/{user_id}/tasks` and validate JWT user_id matches URL user_id.
