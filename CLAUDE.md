# hackathon-todo Development Guidelines

## Project Overview

**"Evolution of Todo"** - 5-phase hackathon project using Spec-Driven Development (SDD) with Spec-Kit Plus.

## 5 Phases

Each phase continues from the previous one but in a separate folder. Phase I code evolves into Phase II, which evolves into Phase III, and so on.

**Phase I** - In-Memory Python Console App (`phase-1-python-console/`). Basic todo operations (add, delete, update, view, complete) via command-line using Python, typer for CLI, and rich for beautiful tables.

**Phase II** - Full-Stack Web Application (`phase-2-todo-full-stack-web/`). REST API backend with FastAPI, Next.js 16 frontend, SQLModel ORM with Neon Serverless PostgreSQL, and Better Auth for user authentication.

**Phase III** - AI-Powered Todo Chatbot (`phase-3-todo-ai-chatbot/`). Natural language task management through conversational interface using OpenAI ChatKit (frontend UI), OpenAI Agents SDK (AI logic), and Official MCP SDK (tools for AI to manage tasks).

**Phase IV** - Local Kubernetes Deployment (`phase-4-k8s-deployment/`). Containerize applications with Docker, deploy locally using Minikube, create Helm charts for packaging, and use kubectl-ai and kagent for AI-assisted Kubernetes operations.

**Phase V** - Advanced Cloud Deployment (`phase-5-cloud-deployment/`). Event-driven architecture using Kafka for messaging, Dapr for distributed application runtime, and deploy to DigitalOcean Kubernetes (DOKS) in the cloud.

**Status:** Phase I & II (Completed) | Phase III (**ACTIVE**) | Phase IV & V (Future)

## Active Technologies (Phase III)

- **Backend**: Python 3.13+, FastAPI, SQLModel, OpenAI Agents SDK, Official MCP SDK
- **Frontend**: TypeScript, Next.js 16 (App Router), OpenAI ChatKit
- **Database**: Neon Serverless PostgreSQL
- **Auth**: Better Auth with JWT

## Spec-Kit Plus Commands (Must Follow Sequentially)

```
sp.constitution → sp.specify → sp.plan → sp.tasks → sp.implement
```

| Command | When | Creates |
|---------|------|---------|
| `sp.constitution` | Begin feature/phase | Principles & constraints |
| `sp.specify` | After constitution | Requirements (WHAT) |
| `sp.plan` | After spec | Architecture (HOW) |
| `sp.tasks` | After plan | Task breakdown |
| `sp.implement` | After tasks | Code changes |

**Additional Commands:** `sp.adr` (ADRs), `sp.analyze` (validate), `sp.checklist`, `sp.clarify`, `sp.phr` (PHR records)

## PHR (Prompt History Record)

Create PHR after each command using `sp.phr`. Location: `history/prompts/`

## Code Style

Python 3.13+: PEP 8, type hints, async/await
TypeScript: Strict mode, interfaces over types

## Recent Changes

- Phase III: AI chatbot, recurring tasks, calendar, analytics dashboard
