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

## MCP Servers for Accurate Implementation

**CRITICAL: Always use context7 MCP server for up-to-date documentation**

Before implementing features with external libraries/frameworks, MUST use context7 to get current, accurate documentation:

1. **Resolve Library ID**: Use `mcp__context7__resolve-library-id` to find the correct library
2. **Query Documentation**: Use `mcp__context7__query-docs` with the library ID to get implementation guidance

**When to Use:**
- FastAPI endpoints and patterns
- Next.js 16 App Router features
- SQLModel ORM operations
- Better Auth integration
- OpenAI Agents SDK usage
- Dapr building blocks (Pub/Sub, State Store, Service Invocation)
- Kafka producer/consumer patterns
- Kubernetes/Helm configurations
- Any external library or framework

**Example Workflow:**
```
1. User asks to implement Dapr Pub/Sub
2. Resolve library: mcp__context7__resolve-library-id("dapr")
3. Query docs: mcp__context7__query-docs("/dapr/docs", "How to implement pub/sub in Python")
4. Implement using the up-to-date patterns from context7
```

**Better Auth MCP Server:**

For Better Auth authentication implementation, use the Better Auth MCP server:

- `mcp__better-auth__search`: Search Better Auth knowledge base for specific authentication patterns
- `mcp__better-auth__chat`: Ask questions about Better Auth implementation
- `mcp__better-auth__list_files`: Browse available Better Auth documentation
- `mcp__better-auth__get_file`: Retrieve specific Better Auth documentation files

**When implementing authentication features:**
1. Search Better Auth docs first: `mcp__better-auth__search("JWT validation with shared secret")`
2. Get implementation guidance for Next.js frontend and FastAPI backend
3. Follow Better Auth patterns (NOT NextAuth - they are different frameworks)

This ensures implementations follow current best practices and avoid deprecated patterns.

## Recent Changes

- Phase V: Constitution updated to v2.0.0 with event-driven architecture, Dapr, Kafka requirements

## Phase 5 Skills
**MUST use these skills for Phase 5 implementation:**

| Skill | Purpose |
|-------|---------|
| `dapr-integration` | Dapr 1.12+ integration (Pub/Sub, State, Jobs API, Service Invocation, Secrets) |
| `kafka-event-driven` | Kafka 3.x event-driven architecture, topic management, consumer groups |
| `microservices-patterns` | Event-driven microservices, loose coupling, fault tolerance |
| `kubernetes-helm-deployment` | Helm chart updates for Dapr sidecar injection |
| `terraform-infrastructure` | Infrastructure-as-Code templates for OKE/GKE/AKS provisioning |
| `rrule-recurring-tasks` | RRULE (RFC 5545) pattern parsing and next occurrence calculation |

## Phase 5 SubAgent

- **Phase 5 Agent** : phase5-cloud-deployment-engineer for cloud deployment, Dapr, Kafka, Kubernetes, Helm, Terraform tasks

**Usage:** Before any Phase 5 implementation task, use the appropriate skill and subagent above for guidance on patterns and best practices.
