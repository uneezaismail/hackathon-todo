# Implementation Plan: Production-Ready Next.js 16 Frontend for Todo App

**Branch**: `003-nextjs-frontend` | **Date**: 2025-12-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-nextjs-frontend/spec.md`

## Summary

Build a production-grade Next.js 16 frontend with App Router featuring:
1. **Public Marketing Site**: Landing page with responsive header/footer
2. **Authentication Flow**: Better Auth integration with JWT (shared secret HS256)
3. **Private Dashboard**: User-specific task management with CRUD operations and optimistic UI (dynamically scoped to authenticated user via `/api/{user_id}/tasks`)
4. **Security**: Route protection via proxy.ts, JWT-based API communication with FastAPI backend, per-user data isolation

**Technical Approach**: Server Components by default, Client Components for interactivity, Drizzle ORM for auth tables only, Server Actions for backend API communication, shadcn/ui + Tailwind CSS for UI. All task operations dynamically scoped to authenticated user ID.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 16.0.0+
**Primary Dependencies**:
- `next@16.0.0+` (App Router, Server Components, Server Actions)
- `better-auth@1.x` (JWT plugin with HS256)
- `drizzle-orm@latest` + `@neondatabase/serverless` (Auth tables only)
- `tailwindcss@3.x` + `shadcn/ui` (UI system)
- React 19 (bundled with Next.js 16)

**Storage**:
- Auth Data: Neon PostgreSQL via Drizzle ORM (User, Session, Account tables)
- Task Data: Fetched via Server Actions from FastAPI backend (NO direct DB queries)

**Testing**: Vitest + React Testing Library (component tests), Playwright (E2E)

**Target Platform**: Vercel deployment (Node.js 18+ runtime)

**Project Type**: Web frontend (monorepo with existing backend)

**Performance Goals**:
- First Contentful Paint (FCP) < 1.5s
- Time to Interactive (TTI) < 3.5s
- Lighthouse score > 90 (Performance, Accessibility, Best Practices)
- Task operations: 100ms optimistic UI, 2s network confirmation

**Constraints**:
- Must use Next.js 16 dynamic params as Promises (await in Server Components, use() in Client)
- JWT tokens must be HS256 with shared BETTER_AUTH_SECRET
- NO direct task table queries from frontend
- Mobile-first responsive (320px+)

**Scale/Scope**:
- Single-user focused (Phase 2), < 100 authenticated users initially
- 5 primary routes (/, /sign-in, /sign-up, /dashboard, error pages)
- 15-20 UI components (shadcn + custom)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Spec-First Development (Section I) ✅
- [x] Specification exists: `specs/003-nextjs-frontend/spec.md`
- [x] Clarifications resolved: 3 questions answered in spec
- [x] All implementation will be based on this approved specification

### No Manual Code (Section II) ✅
- [x] All code will be generated via Claude Code with specialized subagents:
  - `frontend-expert` subagent (Next.js 16 expertise)
  - `better-auth` skill (JWT integration)
  - `nextjs16-development`, `shadcn-ui-development`, `tailwindcss-styling` skills
- [x] Manual exceptions: `.env.local` configuration only

### Reusable Intelligence (Section III) ✅
- [x] ADRs required for: Next.js 16 App Router structure, Better Auth JWT strategy, Server Actions vs API Routes
- [x] PHRs: Planning session, implementation sessions recorded
- [x] Subagents: Leveraging existing `frontend-expert` agent

### Evolutionary Architecture (Section IV) ✅
- [x] Phase 2 frontend integrates with existing Phase 2 FastAPI backend
- [x] Auth abstraction allows future provider changes
- [x] Server Actions pattern enables easy API endpoint changes

### Single Responsibility (Section V) ✅
- [x] Clear separation:
  - UI Components (`components/`) - presentation only
  - Server Actions (`actions/`) - backend communication
  - Auth logic (`lib/auth.ts`, `lib/auth-client.ts`) - authentication only
  - API client (`lib/api-client.ts`) - centralized HTTP logic

### User Experience First (Section VI) ✅
- [x] Optimistic UI for immediate feedback
- [x] Dismissible error banners (user control)
- [x] Responsive design (320px-2560px)
- [x] Consistent task vocabulary (Add, Update, Delete, Complete)

### The Checkpoint Pattern (Section VII) ✅
- [x] Implementation will follow atomic task commits
- [x] Each task from tasks.md = one commit
- [x] Human review before each commit

### Automated Testing (Section VIII) ✅
- [x] Component tests for all UI components (Vitest + React Testing Library)
- [x] Integration tests for auth flow and task operations
- [x] E2E tests for critical user journeys (Playwright)
- [x] JWT authentication validation in tests
- [x] All tests must pass before merge

### Immutable Tech Stack (Section IX) ✅
- [x] Frontend: Next.js 16+ (App Router) ✓
- [x] Styling: Tailwind CSS ✓
- [x] Auth: Better Auth (JWT Plugin) ✓
- [x] Database: Neon (auth tables only) ✓
- [x] TypeScript strict mode ✓

### Strict Type Safety (Section IX) ✅
- [x] TypeScript `strict: true` mode enforced
- [x] All function signatures typed
- [x] Zod schemas for runtime validation

### Strict Error Handling (Section X) ✅
- [x] No silent failures - all errors caught and displayed
- [x] User-friendly error messages in dismissible banners
- [x] Server-side errors logged, client sees generic message

### 12-Factor Configuration (Section XI) ✅
- [x] All secrets via environment variables
- [x] `.env.example` template provided
- [x] No hardcoded API URLs or secrets

### AI Sub-Agents and Skills (Section XII) ✅
- [x] Using `frontend-expert` subagent with defined skills
- [x] Subagent follows spec-driven workflow
- [x] Skills: `nextjs16-development`, `better-auth`, `shadcn-ui-development`, `tailwindcss-styling`

**Constitution Compliance**: ✅ PASS - All gates satisfied

## Project Structure

### Documentation (this feature)

```text
specs/003-nextjs-frontend/
├── spec.md              # Feature specification (completed)
├── plan.md              # This file (Phase 0 output)
├── research.md          # Technology research & decisions (Phase 0)
├── data-model.md        # Auth schema & API contracts (Phase 1)
├── quickstart.md        # Developer setup guide (Phase 1)
├── contracts/           # API contracts & type definitions (Phase 1)
│   ├── backend-api.ts   # FastAPI endpoint types
│   ├── auth-schema.ts   # Drizzle schema for auth tables
│   └── task-types.ts    # Task entity types
└── tasks.md             # Implementation tasks (Phase 2 - via /sp.tasks)
```

### Source Code (repository root)

```text
frontend/                           # Next.js 16 application
├── .env.example                    # Environment template
├── .env.local                      # Local secrets (gitignored)
├── next.config.ts                  # Next.js configuration
├── tailwind.config.ts              # Tailwind CSS config
├── tsconfig.json                   # TypeScript strict config
├── drizzle.config.ts               # Drizzle ORM config (auth only)
├── vitest.config.ts                # Vitest test config
│
├── app/                            # Next.js App Router
│   ├── layout.tsx                  # Root layout (Header + Footer)
│   ├── page.tsx                    # Landing page (/)
│   ├── not-found.tsx               # Custom 404 page
│   ├── error.tsx                   # Global error boundary
│   │
│   ├── (auth)/                     # Auth route group
│   │   ├── sign-in/
│   │   │   └── page.tsx            # Sign-in page
│   │   └── sign-up/
│   │       └── page.tsx            # Sign-up page
│   │
│   ├── dashboard/
│   │   ├── layout.tsx              # Dashboard layout (protected)
│   │   └── page.tsx                # Task management dashboard
│   │
│   └── api/
│       └── auth/
│           └── [...all]/
│               └── route.ts        # Better Auth API routes
│
├── components/                     # React components
│   ├── ui/                         # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── avatar.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── dialog.tsx
│   │   ├── toast.tsx
│   │   └── ... (other shadcn components)
│   │
│   ├── layout/
│   │   ├── header.tsx              # Global header (dynamic auth state)
│   │   ├── footer.tsx              # Global footer
│   │   └── user-menu.tsx           # Avatar dropdown menu
│   │
│   ├── auth/
│   │   ├── sign-in-form.tsx        # Sign-in form (Client Component)
│   │   └── sign-up-form.tsx        # Sign-up form (Client Component)
│   │
│   └── tasks/
│       ├── task-list.tsx           # Task list (Server Component)
│       ├── task-item.tsx           # Individual task (Client Component)
│       ├── task-form.tsx           # Create/edit form (Client Component)
│       ├── task-filters.tsx        # Filter controls (Client Component)
│       └── empty-state.tsx         # Empty state message
│
├── lib/                            # Utility libraries
│   ├── auth.ts                     # Better Auth server config
│   ├── auth-client.ts              # Better Auth client
│   ├── api-client.ts               # HTTP client with JWT headers
│   ├── db.ts                       # Drizzle client (auth tables)
│   ├── utils.ts                    # General utilities
│   └── validation.ts               # Zod schemas
│
├── actions/                        # Server Actions
│   ├── tasks.ts                    # Task CRUD via FastAPI backend
│   └── auth.ts                     # Auth helper actions
│
├── proxy.ts                        # Route protection proxy (Node.js runtime)
│
├── db/                             # Database migrations (auth only)
│   └── schema.ts                   # Drizzle auth schema
│
├── types/                          # TypeScript types
│   ├── auth.ts                     # Auth types
│   ├── task.ts                     # Task types
│   └── api.ts                      # API response types
│
└── __tests__/                      # Tests
    ├── components/                 # Component tests
    ├── integration/                # Integration tests
    └── e2e/                        # Playwright E2E tests
```

**Structure Decision**: Web application frontend in monorepo. The `frontend/` directory contains the complete Next.js 16 application with App Router structure. Server Components are default; Client Components explicitly marked with `"use client"` directive. Server Actions in `actions/` communicate with FastAPI backend for task data. Drizzle ORM is confined to `lib/db.ts` and `db/schema.ts` for auth tables only. Route protection implemented via `proxy.ts` (Next.js 16 replaces deprecated `middleware.ts`).

## Complexity Tracking

> **No violations detected** - Implementation follows constitutional guidelines without requiring additional complexity.

---

## Phase 0: Research & Technology Decisions

### Research Areas

1. **Next.js 16 App Router Patterns**
   - Server Components vs Client Components split
   - Dynamic parameter handling (Promise-based params)
   - Server Actions for backend communication
   - Route protection with proxy.ts (replaces deprecated middleware.ts)

2. **Better Auth JWT Integration**
   - JWT plugin configuration with HS256
   - Shared secret coordination with FastAPI
   - Client-side vs server-side session management
   - Token refresh strategies

3. **Drizzle ORM Setup**
   - Neon serverless connection pooling
   - Schema design for Better Auth tables
   - Migration strategy
   - Type safety with Drizzle types

4. **Server Actions vs API Routes**
   - When to use Server Actions vs Route Handlers
   - Error handling in Server Actions
   - Data revalidation patterns
   - Type-safe backend communication

5. **shadcn/ui Integration**
   - Component installation and customization
   - Tailwind CSS theming
   - Accessibility patterns
   - Form handling with React Hook Form

### Technology Decisions Required

1. **State Management**: React state + Server Actions (no Redux/Zustand needed for Phase 2)
2. **Form Handling**: React Hook Form + Zod validation
3. **HTTP Client**: Native fetch with JWT interceptor in api-client.ts
4. **Error Boundaries**: Next.js error.tsx + React Error Boundaries
5. **Testing Strategy**: Vitest (unit/component) + Playwright (E2E)

---

## Phase 1: Design Artifacts

### Required Deliverables

1. **data-model.md**
   - Drizzle schema for auth tables (User, Session, Account)
   - Task entity types (consumed from backend API)
   - Session state management

2. **contracts/backend-api.ts**
   - TypeScript interfaces for FastAPI endpoints
   - Request/response type definitions
   - Error response structures

3. **contracts/auth-schema.ts**
   - Drizzle schema definitions
   - Better Auth table requirements
   - Migration scripts

4. **contracts/task-types.ts**
   - Task entity interface
   - Filter and sort types
   - CRUD operation payloads

5. **quickstart.md**
   - Environment setup instructions
   - Dependency installation
   - Database migration steps
   - Development server commands
   - Testing commands

---

## Architecture Decisions Requiring ADRs

1. **ADR-001: Next.js 16 App Router with Server Components Default**
   - Decision: Use Server Components by default, Client Components only for interactivity
   - Rationale: Better performance, reduced bundle size, improved SEO
   - Alternatives: All Client Components (rejected - unnecessary hydration), Pages Router (rejected - outdated)

2. **ADR-002: Better Auth with JWT Shared Secret (HS256)**
   - Decision: Use Better Auth JWT plugin with HS256 shared secret
   - Rationale: Matches backend FastAPI validation strategy, stateless auth
   - Alternatives: Session-based auth (rejected - requires database coupling), RS256 (rejected - key management complexity for Phase 2)

3. **ADR-003: Server Actions for Backend API Communication**
   - Decision: Use Server Actions instead of client-side fetch for task operations
   - Rationale: Type-safe, progressive enhancement, automatic revalidation
   - Alternatives: Client-side API routes (rejected - extra hop), tRPC (rejected - overkill for Phase 2)

4. **ADR-004: Drizzle ORM Limited to Auth Tables Only**
   - Decision: Use Drizzle ORM only for Better Auth tables, never for tasks
   - Rationale: Enforces architectural separation, tasks owned by backend
   - Alternatives: Query tasks directly (rejected - violates backend ownership), no ORM (rejected - Better Auth requires schema management)

5. **ADR-005: shadcn/ui Component Library**
   - Decision: Use shadcn/ui as component foundation with Tailwind CSS
   - Rationale: Unstyled, customizable, accessible, copy-paste ownership
   - Alternatives: Material UI (rejected - opinionated styling), Chakra UI (rejected - bundle size), custom from scratch (rejected - time constraint)

---

## Implementation Phases

### Phase 0: Research (This Document)
**Status**: ✅ Complete
**Output**: This plan.md document with technical decisions

### Phase 1: Design & Contracts
**Status**: ⏳ Next
**Tasks**:
1. Create `research.md` with detailed technology findings
2. Create `data-model.md` with auth schema and types
3. Create `contracts/` with API type definitions
4. Create `quickstart.md` with setup instructions
5. Run `.specify/scripts/bash/update-agent-context.sh claude`

**Deliverables**:
- `research.md`
- `data-model.md`
- `contracts/backend-api.ts`
- `contracts/auth-schema.ts`
- `contracts/task-types.ts`
- `quickstart.md`
- Updated `CLAUDE.md` in frontend/

### Phase 2: Task Breakdown
**Status**: ⏭️ Future (via `/sp.tasks`)
**Output**: `tasks.md` with atomic implementation tasks

### Phase 3-6: Implementation
**Status**: ⏭️ Future (via task execution)
**Approach**: Checkpoint pattern - one task, one commit

---

## Key Technical Patterns

### 1. Authentication Flow

```typescript
// Server-side (lib/auth.ts)
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "./db"

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  secret: process.env.BETTER_AUTH_SECRET!,
  plugins: [
    jwt({
      algorithm: "HS256",
      secret: process.env.BETTER_AUTH_SECRET!,
    })
  ]
})

// Client-side (lib/auth-client.ts)
import { createAuthClient } from "better-auth/client"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL!,
})
```

### 2. Server Action Pattern

```typescript
// actions/tasks.ts
"use server"

import { getSession } from "@/lib/auth-client"
import { apiClient } from "@/lib/api-client"

export async function getTasks(filter: "all" | "pending" | "completed") {
  const session = await getSession()
  if (!session) throw new Error("Unauthorized")

  const response = await apiClient.get(`/api/${session.user.id}/tasks`, {
    params: { status: filter === "all" ? undefined : filter }
  })

  return response.data
}

export async function createTask(data: { title: string; description?: string }) {
  const session = await getSession()
  if (!session) throw new Error("Unauthorized")

  const response = await apiClient.post(`/api/${session.user.id}/tasks`, data)
  return response.data
}
```

### 3. Route Protection

```typescript
// proxy.ts (Next.js 16 - replaces deprecated middleware.ts)
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  const session = await getSession(request)

  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    if (!session) {
      return NextResponse.redirect(new URL("/sign-in", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"]
}
```

### 4. Optimistic UI Pattern

```typescript
// components/tasks/task-item.tsx
"use client"

import { useOptimistic } from "react"
import { toggleTaskComplete } from "@/actions/tasks"

export function TaskItem({ task }) {
  const [optimisticTask, setOptimisticTask] = useOptimistic(task)

  async function handleToggle() {
    // Immediate UI update
    setOptimisticTask({ ...task, completed: !task.completed })

    try {
      // Network request
      await toggleTaskComplete(task.id)
    } catch (error) {
      // Revert on error
      setOptimisticTask(task)
      showError("Failed to update task")
    }
  }

  return (
    <div>
      <input
        type="checkbox"
        checked={optimisticTask.completed}
        onChange={handleToggle}
      />
      <span>{optimisticTask.title}</span>
    </div>
  )
}
```

---

## Risk Analysis

| Risk | Impact | Mitigation |
|------|--------|------------|
| Next.js 16 dynamic params learning curve | Medium | Use frontend-expert subagent with Next.js 16 expertise |
| JWT shared secret mismatch frontend/backend | High | Environment variable validation on startup |
| Drizzle schema drift with Better Auth | Medium | Lock Better Auth version, test migrations |
| Server Actions error handling complexity | Medium | Centralized error boundary and toast notifications |
| Optimistic UI state management bugs | Medium | Comprehensive integration tests for all CRUD operations |
| Route protection bypass | High | Proxy tests (proxy.ts), manual security review |

---

## Success Criteria

Implementation is complete when:

1. ✅ All tests pass (component, integration, E2E)
2. ✅ Lighthouse score > 90 across all metrics
3. ✅ All 6 user stories validated with acceptance scenarios
4. ✅ No TypeScript errors (`tsc --noEmit`)
5. ✅ No ESLint warnings
6. ✅ JWT authentication working with backend
7. ✅ Route protection functioning correctly
8. ✅ Optimistic UI updates with error rollback
9. ✅ Responsive on mobile (320px), tablet (768px), desktop (1024px+)
10. ✅ Error messages display in dismissible banners
11. ✅ Tasks ordered newest-first by default
12. ✅ Avatar shows user initials

---

## Next Steps

1. ✅ **Phase 0 Complete**: This plan.md created
2. ⏳ **Generate Phase 1 Artifacts**: Run research and design document generation
3. ⏭️ **Update Agent Context**: Add Next.js 16, Better Auth, Drizzle to CLAUDE.md
4. ⏭️ **Create ADRs**: Document 5 architectural decisions
5. ⏭️ **Run `/sp.tasks`**: Generate atomic task breakdown

---

**Plan Version**: 1.0.0
**Created**: 2025-12-12
**Next Review**: After Phase 1 artifacts generated