# Frontend Guidelines (Next.js 16)

## Overview
Next.js 16 (App Router) application using Better Auth and Shadcn UI.
It acts as the UI layer, managing Authentication via Drizzle/Neon and communicating with the Python Backend for Task data.

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (Strict)
- **Auth:** Better Auth (JWT Strategy)
- **UI:** Tailwind CSS + Shadcn UI
- **Data Fetching:** Server Actions (for mutations/fetching from Backend)
- **Database:** Neon (Drizzle ORM for Auth tables ONLY)

## Architecture
- **Auth Data:** Stored in Neon `user`, `session`, `account` tables via Drizzle.
- **Task Data:** Fetched from FastAPI Backend (`http://localhost:8000`). **NEVER** accessed directly via DB.
- **Route Protection:** `proxy.ts` (Next.js 16 Middleware replacement) protects `/dashboard`.

## Key Patterns
### 1. Server Actions (`frontend/actions/`)
- Used for ALL backend API calls (Create, Read, Update, Delete).
- Must extract JWT from session and pass in `Authorization: Bearer` header.
- Must revalidate paths (e.g., `revalidatePath('/dashboard')`) after mutations.

### 2. Client Components (`'use client'`)
- Use only for interactivity (Forms, Toggles, Dropdowns, Modals, etc.).
- Push state up or use Server Actions for logic.
- Examples: TaskForm, TaskItem, TaskTable, PrioritySelector, DueDatePicker

### 3. API Client
- `frontend/lib/auth.ts`: Better Auth server config.
- `frontend/lib/auth-client.ts`: Better Auth client hooks.
- `frontend/actions/tasks.ts`: Main bridge to Backend API.

## Commands
```bash
# Development
npm run dev          # Start server on 3000
npm run lint         # Run ESLint (fixes all errors and warnings)
npm run type-check   # Run TypeScript check

# Build
npm run build        # Production build with Next.js standalone output

# Database (Auth Tables Only)
npx drizzle-kit push      # Push schema changes to Neon
npx drizzle-kit studio    # View DB data

# Testing
npm test             # Run all tests

# Docker
docker build -t todo-frontend .           # Build Docker image
docker run -p 3000:3000 todo-frontend     # Run container
```

## Environment Variables

### Development (.env.local)
- `DATABASE_URL`: Connection string for Neon (Direct/Pooled).
- `BETTER_AUTH_SECRET`: **CRITICAL**. Must match Backend.
- `BETTER_AUTH_URL`: `http://localhost:3000`
- `NEXT_PUBLIC_API_URL`: `http://localhost:8000` (Backend URL for local dev)

### Docker/Production
- `NEXT_PUBLIC_API_URL`: Use service name in docker-compose (`http://backend:8000`) or full production URL
- All other variables same as development

## Docker Setup
The frontend uses a multi-stage Dockerfile with Next.js standalone output:
1. **deps stage**: Installs dependencies
2. **builder stage**: Builds the Next.js application
3. **runner stage**: Minimal production image with standalone output

**Important:** The `.dockerignore` excludes node_modules, .next, tests, and other unnecessary files.