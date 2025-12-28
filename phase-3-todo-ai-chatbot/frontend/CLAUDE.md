# Frontend Guidelines (Next.js 16 + ChatKit)

## Overview
Next.js 16 (App Router) application with AI-powered chatbot using OpenAI ChatKit.
Manages Authentication via Drizzle/Neon and communicates with Python Backend for Task data and AI chat.

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (Strict)
- **Auth:** Better Auth (JWT Strategy)
- **UI:** Tailwind CSS + Shadcn UI
- **AI Chat:** OpenAI ChatKit (@openai/chatkit-ui)
- **Data Fetching:** Server Actions (for mutations/fetching from Backend)
- **Database:** Neon (Drizzle ORM for Auth tables ONLY)

## Architecture
- **Auth Data:** Stored in Neon `user`, `session`, `account` tables via Drizzle.
- **Task Data:** Fetched from FastAPI Backend (`http://localhost:8000`). **NEVER** accessed directly via DB.
- **AI Chat:** ChatKit widget communicates with backend `/api/chatkit` endpoint.
- **Route Protection:** `proxy.ts` (Next.js 16 Middleware replacement) protects `/dashboard`.

## Key Components

### Chat Components (`components/chat/`)
- **ChatKitWidget:** Main ChatKit widget wrapper with Better Auth JWT integration
- **GlobalChatButton:** Floating chat button on all authenticated pages
- **chat-widget.tsx:** Alternative chat widget (reference implementation)

### ChatKit Configuration
```typescript
// In chatkit-widget.tsx
const config = {
  api: {
    url: process.env.NEXT_PUBLIC_CHATKIT_URL,  // Backend ChatKit endpoint
    headers: { Authorization: `Bearer ${token}` }
  },
  branding: { showPoweredBy: false },
  assistant: { name: "Todo AI Assistant" },
  startScreen: {
    title: "Todo AI Assistant",
    prompts: [
      { title: "Add a task", content: "Add a task to buy groceries" },
      { title: "Show tasks", content: "Show my pending tasks" }
    ]
  },
  history: { enabled: true, showRename: true, showDelete: true }
};
```

## Key Patterns

### 1. Server Actions (`frontend/actions/`)
- Used for ALL backend API calls (Create, Read, Update, Delete).
- Must extract JWT from session and pass in `Authorization: Bearer` header.
- Must revalidate paths (e.g., `revalidatePath('/dashboard')`) after mutations.

### 2. Client Components (`'use client'`)
- Use only for interactivity (Forms, Toggles, Dropdowns, Modals, ChatKit Widget).
- Push state up or use Server Actions for logic.
- Examples: TaskForm, TaskItem, TaskTable, ChatKitWidget, GlobalChatButton

### 3. ChatKit Integration
- ChatKit CDN loaded in `app/layout.tsx` via Next.js Script component
- Widget mounted only after first open (lazy loading for performance)
- Conversations persist - widget stays mounted when modal closed

### 4. API Clients
- `lib/auth.ts`: Better Auth server config
- `lib/auth-client.ts`: Better Auth client hooks
- `actions/tasks.ts`: Main bridge to Backend Task API
- ChatKit handles chat API calls internally via configured endpoint

## Commands
```bash
# Development
npm run dev          # Start server on 3000
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript check

# Build
npm run build        # Production build with Next.js standalone output

# Database (Auth Tables Only)
npx drizzle-kit push      # Push schema changes to Neon
npx drizzle-kit studio    # View DB data

# Testing
npm test             # Run all tests
npm run test:e2e     # Run Playwright E2E tests

# Docker
docker build -t todo-frontend .           # Build Docker image
docker run -p 3000:3000 todo-frontend     # Run container
```

## Environment Variables

### Development (.env.local)
```bash
DATABASE_URL=postgresql://...              # Neon connection (Direct/Pooled)
BETTER_AUTH_SECRET=your-secret-key         # CRITICAL: Must match Backend
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000  # Backend URL for task API
NEXT_PUBLIC_CHATKIT_URL=http://localhost:8000/api/chatkit  # ChatKit endpoint
NEXT_PUBLIC_APP_URL=http://localhost:3000  # App URL for metadata
```

### Docker/Production
```bash
NEXT_PUBLIC_API_URL=http://backend:8000              # Use docker service name
NEXT_PUBLIC_CHATKIT_URL=http://backend:8000/api/chatkit
# All other variables same as development
```

## Docker Setup
The frontend uses a multi-stage Dockerfile with Next.js standalone output:
1. **deps stage**: Installs dependencies
2. **builder stage**: Builds the Next.js application
3. **runner stage**: Minimal production image with standalone output

**Important:** The `.dockerignore` excludes node_modules, .next, tests, and other unnecessary files.

## Routes

### Public Routes
- `/` - Landing page
- `/sign-in` - Sign in page
- `/sign-up` - Sign up page

### Protected Routes (require authentication)
- `/dashboard` - Main dashboard with stats and widgets
- `/dashboard/tasks` - Full task management page
- `/dashboard/settings` - User settings
- `/chat` - Dedicated chat page (optional, chat also available via floating button)

## Chat Integration Points
- **Global Chat Button:** Floating button appears on all `/dashboard/*` routes
- **Hidden on:** Landing page, sign-in, sign-up, dedicated /chat route
- **Persistence:** Chat state preserved when modal closed (widget stays mounted)
- **Auth Required:** Button only shows for authenticated users
