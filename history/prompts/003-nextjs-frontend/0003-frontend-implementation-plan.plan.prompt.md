---
id: 0003
title: Frontend Implementation Plan
stage: plan
date: 2025-12-12
surface: agent
model: claude-sonnet-4-5
feature: 003-nextjs-frontend
branch: 003-nextjs-frontend
user: uneezaismail
command: /sp.plan
labels: ["phase-2", "nextjs-16", "planning", "architecture", "better-auth"]
links:
  spec: specs/003-nextjs-frontend/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/003-nextjs-frontend/plan.md (554 lines)
  - specs/003-nextjs-frontend/research.md (technology research)
tests:
  - Constitution compliance check (all 12 gates passed)
---

## Prompt

/sp.plan

Create a comprehensive technical implementation plan for the Frontend Web Application (Phase II).

Architecture & Stack Strategy:
- **Framework:** Next.js 16 (App Router) using Server Components by default and Client Components only for interactivity.
- **Authentication:** Integrate Better Auth using the "Shared Secret" strategy to match the Backend. Map the client to `lib/auth-client.ts` and server config to `lib/auth.ts`.
- **UI System:** Tailwind CSS and Shadcn UI for all components.
- **Database Access:**
  - **Auth Data:** Use **Drizzle ORM** with `@neondatabase/serverless` strictly for managing Auth tables (User, Session, Account).
  - **Task Data:** Use **Server Actions** (`actions/tasks.ts`) to communicate with the Python Backend API. NEVER query the Task table directly from the Frontend.

## Response snapshot

Created comprehensive implementation plan with Phase 0 research completed:

**Plan Document** (`plan.md` - 554 lines):
- Summary: Public marketing site + auth flow + private dashboard with optimistic UI
- Technical Context: Next.js 16, Better Auth JWT (HS256), Drizzle (auth only), shadcn/ui
- Constitution Check: ✅ All 12 gates passed (Spec-first, No manual code, Reusable intelligence, etc.)
- Project Structure: Detailed frontend/ directory with app/, components/, lib/, actions/, middleware
- 5 ADRs identified: Server Components default, JWT shared secret, Server Actions pattern, Drizzle limited scope, shadcn/ui choice
- Risk Analysis: 6 risks identified with mitigation strategies
- 12 Success Criteria: Tests pass, Lighthouse >90, TypeScript strict, responsive design, etc.

**Research Document** (`research.md`):
1. **Next.js 16 Patterns**: Server vs Client Components, Promise-based params, Server Actions, middleware routing
2. **Better Auth JWT**: HS256 configuration, shared secret coordination, session management, auto-refresh
3. **Drizzle ORM**: Neon connection pooling, auth schema (User/Session/Account), migrations, type inference
4. **Server Actions**: Decision matrix, error handling, revalidation patterns, type-safe communication
5. **shadcn/ui**: Component installation, Tailwind theming, accessibility, React Hook Form integration

**Key Architectural Decisions**:
- Server Components default (zero JS for static content)
- Server Actions for all backend communication (type-safe, auto-revalidation)
- JWT HS256 with BETTER_AUTH_SECRET shared between frontend/backend
- Drizzle ORM strictly for auth tables, never for tasks (enforces backend ownership)
- middleware.ts for route protection (runs before render)
- Optimistic UI with useOptimistic hook for instant feedback

**Project Structure Highlights**:
```
frontend/
├── app/ (App Router: landing, auth, dashboard)
├── components/ (ui/, layout/, auth/, tasks/)
├── lib/ (auth.ts, auth-client.ts, api-client.ts, db.ts)
├── actions/ (tasks.ts Server Actions)
├── middleware.ts (route protection)
├── db/schema.ts (Drizzle auth schema)
└── __tests__/ (component, integration, e2e)
```

**Constitution Compliance**: All 12 sections verified and passed.

## Outcome

- ✅ Impact: Complete technical plan with architecture decisions, research findings, and implementation roadmap for Next.js 16 frontend
- 🧪 Tests: Constitution compliance check passed (12/12 gates)
- 📁 Files: Created plan.md (554 lines), research.md (530+ lines with 5 detailed research areas)
- 🔁 Next prompts: Generate Phase 1 artifacts (data-model.md, contracts/, quickstart.md), then run /sp.tasks for task breakdown
- 🧠 Reflection: Plan successfully integrates Next.js 16 breaking changes (Promise params), Better Auth JWT shared secret strategy, and clear separation between auth (Drizzle) and task data (Server Actions to backend). Constitution gates ensured spec-first approach and identified 5 ADRs for documentation.

## Evaluation notes (flywheel)

- Failure modes observed: None - all planning phases completed successfully
- Graders run and results (PASS/FAIL): Constitution compliance PASS (12/12 sections)
- Prompt variant (if applicable): Standard /sp.plan with Phase 2 user-provided architecture constraints
- Next experiment (smallest change to try): Proceed to Phase 1 artifact generation (data-model.md, contracts/) then /sp.tasks command for atomic task breakdown
