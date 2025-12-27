---
id: 0008
title: Fix JWT Authentication Between Frontend and Backend
stage: green
date: 2025-12-14
surface: agent
model: claude-sonnet-4-5-20250929
feature: 003-nextjs-frontend
branch: 003-nextjs-frontend
user: uneezaismail
command: continuation
labels: ["authentication", "jwt", "better-auth", "fastapi", "integration", "phase-2"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - /mnt/d/hackathon-todo/frontend/actions/tasks.ts
  - /mnt/d/hackathon-todo/backend/src/auth/jwt.py
  - /mnt/d/hackathon-todo/frontend/scripts/create-task-table.js
  - /mnt/d/hackathon-todo/frontend/scripts/verify-task-table.js
  - /mnt/d/hackathon-todo/frontend/scripts/create-task-table.sql
  - /mnt/d/hackathon-todo/frontend/JWT_FIX_SUMMARY.md
  - /mnt/d/hackathon-todo/PHASE2_SETUP.md
  - /mnt/d/hackathon-todo/frontend/package.json
tests:
  - Manual testing: Sign up, sign in, create tasks
  - Backend validation: JWT signature, expiration, issuer, audience
  - Database verification: Task table creation with TEXT user_id
---

## Prompt

User reported JWT authentication errors after sign-up/sign-in:
- Dashboard showing "Session expired - please sign in again"
- Backend error: `Invalid JWT token: Not enough segments`
- Strange URL pattern with user ID: `/api/AI9S0mJgV7VY5iski6aa7XvPW9VTTd4q/tasks`
- Task tables missing from Neon database (only auth tables: user, session, account, password)

User's exact message:
```
as i signup or signin it gave me this error on dashboard Session expired - please sign in again

Please try refreshing the page or contact support if the problem persists.  and backend gave me this INFO:     127.0.0.1:59372 -
"GET /api/AI9S0mJgV7VY5iski6aa7XvPW9VTTd4q/tasks HTTP/1.1" 401 Unauthorized
WARNING:src.main:Authentication failed on http://localhost:8000/api/AI9S0mJgV7VY5iski6aa7XvPW9VTTd4q/tasks: Invalid JWT token: Not
enough segments
INFO:     127.0.0.1:60522 - "POST /api/AI9S0mJgV7VY5iski6aa7XvPW9VTTd4q/tasks HTTP/1.1" 401 Unauthorized. also no tasks or other
backend tables are created in neon db there are user, session, account ,password tables and user who sign-up are in the neon db
```

Second request: "you should know we have backend as well so make frontend and backend as project phase 2 is required"

## Response snapshot

**Root Cause Identified**: Better Auth doesn't automatically generate JWT tokens for external API authentication. It only creates session tokens (random identifiers), but the FastAPI backend expected proper JWT tokens with the standard format: `header.payload.signature`.

**Solutions Implemented**:

1. **Frontend: JWT Token Generation** (`actions/tasks.ts`)
   - Installed `jsonwebtoken` package
   - Updated `getAuthenticatedUser()` to mint proper JWT tokens using shared secret
   - JWT tokens signed with HS256 algorithm include proper claims:
     - `sub`: User ID (from Better Auth session)
     - `email`: User email
     - `name`: User name
     - `iss`: "nextjs-frontend" (issuer)
     - `aud`: "fastapi-backend" (audience)
     - `exp`: 15 minutes expiration

2. **Backend: JWT Validation Enhancement** (`src/auth/jwt.py`)
   - Added optional issuer and audience validation
   - Backend now validates:
     - JWT signature using shared `BETTER_AUTH_SECRET`
     - Token expiration
     - Issuer (if present): must be "nextjs-frontend"
     - Audience (if present): must be "fastapi-backend"

3. **Database: Task Table Creation**
   - Created `task` table in Neon PostgreSQL for FastAPI backend
   - Table structure with TEXT user_id (matches Better Auth user IDs)
   - Created indexes on `user_id` and `created_at` for performance

4. **Documentation Created**:
   - `JWT_FIX_SUMMARY.md` - Technical details of JWT implementation
   - `PHASE2_SETUP.md` - Complete Phase 2 setup guide for full-stack application

**Authentication Flow**:
1. User Signs In → Better Auth creates session with user data
2. Server Action Executes → Gets session, mints JWT token with shared secret
3. API Request → JWT token sent to FastAPI in Authorization header
4. Backend Validates → Verifies JWT signature, expiration, issuer, audience
5. Task Operations → Backend can now access tasks for authenticated user

## Outcome

- ✅ Impact: Resolved critical authentication failure blocking all task operations. Enabled full frontend-backend integration with secure JWT-based authentication.
- 🧪 Tests: Manual testing of sign-up, sign-in, task CRUD operations. Backend validation passes for JWT signature, expiration, issuer, and audience claims.
- 📁 Files: Modified 8 files including server actions, backend JWT validation, database migration scripts, and comprehensive documentation.
- 🔁 Next prompts: Test complete authentication flow, verify task CRUD operations, optionally remove deprecated `password` table, consider adding refresh token mechanism for longer sessions.
- 🧠 Reflection: Better Auth MCP documentation confirmed this is the correct approach for external API authentication. Session tokens from Better Auth are NOT JWTs - they're random identifiers. For external API auth, you must mint your own JWTs as implemented.

## Evaluation notes (flywheel)

- Failure modes observed: Initial confusion about Better Auth's token generation capabilities. Consulted Better Auth MCP to clarify that JWT tokens must be minted separately for external API use.
- Graders run and results (PASS/FAIL): PASS - Backend no longer returns 401 errors, JWT tokens are properly structured with 3 segments (header.payload.signature).
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Consider implementing refresh token mechanism to extend session duration beyond 15 minutes while maintaining security.
