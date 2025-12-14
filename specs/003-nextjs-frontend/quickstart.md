# Quickstart Guide: Next.js 16 Frontend

**Feature**: 003-nextjs-frontend
**Date**: 2025-12-12
**Purpose**: Get the Phase 2 frontend running in development and production

---

## Prerequisites

Before starting, ensure you have:

- **Node.js**: v20.9+ (LTS)
- **npm/pnpm/yarn/bun**: Latest version
- **Git**: For version control
- **Neon PostgreSQL**: Database account (for auth tables)
- **FastAPI Backend**: Running and accessible (see `002-fastapi-backend`)

---

## Quick Start (5 minutes)

### 1. Clone and Navigate

```bash
cd /path/to/hackathon-todo
cd frontend
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
# or
yarn install
# or
bun install
```

### 3. Environment Setup

Create `.env.local` file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Database (Neon PostgreSQL - for auth tables only)
DATABASE_URL="postgresql://user:password@your-project.neon.tech/main?sslmode=require"

# Better Auth Configuration
BETTER_AUTH_SECRET="your-shared-secret-here-32-chars-minimum"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# FastAPI Backend
NEXT_PUBLIC_API_BASE_URL="http://localhost:8000"

# Node Environment
NODE_ENV="development"
```

**CRITICAL**: The `BETTER_AUTH_SECRET` MUST match the secret in your FastAPI backend for JWT validation to work!

### 4. Database Migration

Run Drizzle migrations to create auth tables:

```bash
npm run db:generate   # Generate migration from schema
npm run db:migrate    # Apply migration to database
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Detailed Setup Instructions

### Database Setup (Neon PostgreSQL)

#### 1. Create Neon Project

1. Go to [neon.tech](https://neon.tech)
2. Sign in or create account
3. Create new project: `hackathon-todo-frontend`
4. Select region closest to you
5. Copy connection string

#### 2. Configure Connection String

Format: `postgresql://user:password@host/database?sslmode=require`

Example:
```
postgresql://john:abc123@ep-cool-name-123456.us-east-2.aws.neon.tech/main?sslmode=require
```

Add to `.env.local`:
```env
DATABASE_URL="your-connection-string-here"
```

#### 3. Test Connection

```bash
npm run db:push  # Push schema to database (dev only)
```

If successful, you'll see:
```
✓ Tables created successfully
```

### Better Auth Setup

#### 1. Generate Shared Secret

Generate a strong secret (must be identical in frontend AND backend):

```bash
openssl rand -base64 32
```

Example output:
```
Kv8JX2mN9pL4qR7sT0uV3wY6zA8bC1dE5fG9hI2jK4lM
```

#### 2. Configure Frontend

Add to `.env.local`:
```env
BETTER_AUTH_SECRET="Kv8JX2mN9pL4qR7sT0uV3wY6zA8bC1dE5fG9hI2jK4lM"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

#### 3. Configure Backend (CRITICAL)

**The backend MUST use the SAME secret!**

In your FastAPI `.env` file:
```env
BETTER_AUTH_SECRET="Kv8JX2mN9pL4qR7sT0uV3wY6zA8bC1dE5fG9hI2jK4lM"
```

⚠️ **If secrets don't match, JWT validation will fail and users cannot access protected routes!**

### Backend API Connection

#### 1. Verify Backend is Running

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-12T10:30:00Z"
}
```

#### 2. Configure API Base URL

Add to `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL="http://localhost:8000"
```

#### 3. Test API Connection

After starting the dev server, sign up for an account and try creating a task.

---

## Development Workflow

### Running the Development Server

```bash
npm run dev
```

Features:
- **Hot reload**: Changes apply instantly
- **Turbopack**: Fast rebuilds (default in Next.js 16)
- **Error overlay**: Helpful error messages
- **Next.js DevTools MCP**: Runtime diagnostics available

### Database Commands

```bash
# Generate migration from schema changes
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Push schema directly (dev only, no migration files)
npm run db:push

# Open Drizzle Studio (visual database editor)
npm run db:studio
```

### Code Quality

```bash
# Run TypeScript type checking
npm run type-check

# Run ESLint
npm run lint

# Fix ESLint issues automatically
npm run lint:fix

# Format code with Prettier
npm run format
```

### Testing

```bash
# Run all tests
npm test

# Run component tests (Vitest)
npm run test:unit

# Run E2E tests (Playwright)
npm run test:e2e

# Run tests in watch mode
npm run test:watch
```

---

## Project Structure Overview

```
frontend/
├── app/                     # Next.js App Router
│   ├── (auth)/             # Auth route group (sign-in, sign-up)
│   ├── dashboard/          # Protected dashboard
│   ├── api/auth/           # Better Auth API routes
│   ├── layout.tsx          # Root layout (header, footer)
│   └── page.tsx            # Landing page
│
├── components/             # React components
│   ├── ui/                # shadcn/ui components
│   ├── layout/            # Header, footer, user menu
│   ├── auth/              # Sign-in/sign-up forms
│   └── tasks/             # Task list, item, form, filters
│
├── actions/               # Server Actions (backend communication)
│   ├── tasks.ts          # Task CRUD operations
│   └── auth.ts           # Auth helper actions
│
├── lib/                   # Utility libraries
│   ├── auth.ts           # Better Auth server config
│   ├── auth-client.ts    # Better Auth client
│   ├── api-client.ts     # HTTP client with JWT headers
│   ├── db.ts             # Drizzle client (auth tables)
│   └── validation.ts     # Zod schemas
│
├── db/                    # Database (auth only)
│   ├── schema.ts         # Drizzle auth schema
│   └── migrations/       # Generated migrations
│
├── types/                 # TypeScript types
│   ├── auth.ts           # Auth types
│   ├── task.ts           # Task types
│   └── api.ts            # API response types
│
├── proxy.ts               # Route protection (Next.js 16 - replaces middleware.ts)
│
└── .env.local            # Local environment variables
```

---

## Common Tasks

### Create a New User

1. Start dev server: `npm run dev`
2. Navigate to [http://localhost:3000](http://localhost:3000)
3. Click "Get Started" button
4. Fill in sign-up form:
   - Name: "John Doe"
   - Email: "john@example.com"
   - Password: "securepassword123"
5. Submit form
6. Redirected to `/dashboard` with JWT token

### Add a New shadcn/ui Component

```bash
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add dialog
```

Components are added to `components/ui/` directory.

### Create a Server Action

```typescript
// actions/example.ts
"use server"

import { getSession } from "@/lib/auth-client"
import { apiClient } from "@/lib/api-client"

export async function exampleAction(data: { foo: string }) {
  const session = await getSession()
  if (!session) throw new Error("Unauthorized")

  const response = await apiClient.post(`/api/${session.user.id}/example`, data)
  return response.data
}
```

### Add a Protected Route

Protected routes are handled automatically by `proxy.ts`.

To protect a new route:

```typescript
// proxy.ts
export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*"] // Add new paths here
}
```

---

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `BETTER_AUTH_SECRET` | Shared secret for JWT (MUST match backend) | `32+ character string` |
| `BETTER_AUTH_URL` | Frontend base URL | `http://localhost:3000` |
| `NEXT_PUBLIC_BASE_URL` | Public frontend URL | `http://localhost:3000` |
| `NEXT_PUBLIC_API_BASE_URL` | FastAPI backend URL | `http://localhost:8000` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Dev server port | `3000` |

### Production Variables (Vercel)

```env
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="..."
BETTER_AUTH_URL="https://yourdomain.com"
NEXT_PUBLIC_BASE_URL="https://yourdomain.com"
NEXT_PUBLIC_API_BASE_URL="https://api.yourdomain.com"
NODE_ENV="production"
```

---

## Troubleshooting

### Issue: "Invalid or missing authentication token"

**Cause**: JWT shared secret mismatch between frontend and backend.

**Solution**:
1. Check `BETTER_AUTH_SECRET` in frontend `.env.local`
2. Check `BETTER_AUTH_SECRET` in backend `.env`
3. Ensure they are IDENTICAL
4. Restart both servers

### Issue: "Database connection failed"

**Cause**: Invalid `DATABASE_URL` or Neon project not accessible.

**Solution**:
1. Verify connection string format
2. Check Neon project is active (not paused)
3. Test connection: `npm run db:push`
4. Check firewall/network settings

### Issue: "Module not found: @/components/..."

**Cause**: TypeScript path mapping not configured.

**Solution**:
Check `tsconfig.json` has correct paths:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Issue: "Failed to fetch tasks"

**Cause**: Backend API not running or CORS misconfigured.

**Solution**:
1. Verify backend is running: `curl http://localhost:8000/health`
2. Check `NEXT_PUBLIC_API_BASE_URL` in `.env.local`
3. Verify backend CORS settings allow `http://localhost:3000`

### Issue: "Proxy not found" or "middleware deprecated"

**Cause**: Using Next.js 16 with old middleware.ts file.

**Solution**:
Run migration codemod:
```bash
npx @next/codemod@canary middleware-to-proxy .
```

---

## Building for Production

### Local Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Deploy to Vercel (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Add Environment Variables** in Vercel Dashboard:
   - `DATABASE_URL`
   - `BETTER_AUTH_SECRET`
   - `BETTER_AUTH_URL`
   - `NEXT_PUBLIC_BASE_URL`
   - `NEXT_PUBLIC_API_BASE_URL`

5. **Redeploy** after adding env vars:
   ```bash
   vercel --prod
   ```

---

## Next Steps

1. ✅ **Development Setup Complete**: Frontend running locally
2. ⏭️ **Run Tests**: `npm test` to verify everything works
3. ⏭️ **Explore Features**: Sign up, create tasks, test optimistic UI
4. ⏭️ **Review Documentation**: Read `plan.md`, `research.md`, `data-model.md`
5. ⏭️ **Deploy to Production**: Follow Vercel deployment guide

---

## Helpful Links

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Better Auth Docs](https://www.better-auth.com/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Neon PostgreSQL Docs](https://neon.tech/docs)

---

## Getting Help

If you encounter issues:

1. Check this quickstart guide
2. Review `troubleshooting` section above
3. Read `plan.md` and `research.md` for architecture details
4. Check Next.js 16 upgrade guide for breaking changes
5. Verify backend is running and accessible

---

**Last Updated**: 2025-12-12
**Next Review**: After Phase 1 artifacts generated
