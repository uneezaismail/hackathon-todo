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
- Use only for interactivity (Forms, Toggles, Dropdowns).
- Push state up or use Server Actions for logic.

### 3. API Client
- `frontend/lib/auth.ts`: Better Auth server config.
- `frontend/lib/auth-client.ts`: Better Auth client hooks.
- `frontend/actions/tasks.ts`: Main bridge to Backend API.

## Commands
```bash
# Development
npm run dev          # Start server on 3000
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript check

# Database (Auth Tables Only)
npx drizzle-kit push      # Push schema changes to Neon
npx drizzle-kit studio    # View DB data

# Testing
npm test             # Run all tests
```

## Environment Variables (.env.local)
- `DATABASE_URL`: Connection string for Neon (Direct/Pooled).
- `BETTER_AUTH_SECRET`: **CRITICAL**. Must match Backend.
- `BETTER_AUTH_URL`: `http://localhost:3000`
- `NEXT_PUBLIC_API_URL`: `http://localhost:8000` (Backend URL)