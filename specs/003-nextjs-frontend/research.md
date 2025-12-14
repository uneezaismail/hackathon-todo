# Technology Research: Next.js 16 Frontend

**Feature**: 003-nextjs-frontend
**Date**: 2025-12-12
**Purpose**: Document research findings and technology decisions for Phase 2 frontend implementation

---

## 1. Next.js 16 App Router Patterns

### Server Components vs Client Components

**Decision**: Use Server Components by default, Client Components only for interactivity

**Research Findings**:
- **Server Components** (default in App Router):
  - Zero JavaScript shipped to client
  - Direct database/API access
  - Better SEO, faster initial load
  - Cannot use hooks (useState, useEffect) or browser APIs

- **Client Components** (`"use client"` directive):
  - Required for interactivity (onClick, onChange)
  - Can use React hooks
  - Hydrated on client-side
  - Increases bundle size

**Our Usage**:
- Server Components: Landing page, task list display, headers/footers
- Client Components: Forms, task items (checkboxes), filters, dropdowns

**Best Practices**:
1. Keep Client Components as leaf nodes in component tree
2. Pass Server Component as children to Client Components
3. Use Server Actions for mutations instead of client-side fetch

---

### Dynamic Parameter Handling

**Decision**: Use Promise-based params with `await` in Server Components, `use()` in Client

**Research Findings** (Next.js 16 Breaking Change):
```typescript
// ❌ OLD (Next.js 15 and earlier)
export default function Page({ params }: { params: { id: string } }) {
  return <div>{params.id}</div>
}

// ✅ NEW (Next.js 16)
export default async function Page({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <div>{id}</div>
}

// ✅ NEW in Client Components
"use client"
import { use } from "react"

export default function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <div>{id}</div>
}
```

**Impact on Our App**:
- Dashboard route: `/dashboard` (no params)
- Auth routes: `/sign-in`, `/sign-up` (no params)
- Landing page: `/` (no params)
- **Conclusion**: Minimal impact - no dynamic routes in Phase 2

---

### Server Actions for Backend Communication

**Decision**: Use Server Actions for all task CRUD operations

**Rationale**:
1. **Type Safety**: Full TypeScript end-to-end
2. **Progressive Enhancement**: Works without JavaScript
3. **Automatic Revalidation**: Next.js cache updates automatically
4. **Security**: Runs server-side, can access secrets
5. **Simpler**: No need for separate API routes

**Pattern**:
```typescript
// actions/tasks.ts
"use server"

import { revalidatePath } from "next/cache"

export async function createTask(formData: FormData) {
  const session = await getSession()
  if (!session) throw new Error("Unauthorized")

  const title = formData.get("title") as string
  const response = await fetch(`${process.env.API_URL}/api/${session.user.id}/tasks`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${session.token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ title })
  })

  if (!response.ok) throw new Error("Failed to create task")

  revalidatePath("/dashboard") // Auto-refresh
  return response.json()
}
```

**Alternatives Considered**:
- ❌ Client-side fetch: Extra client bundle, no automatic revalidation
- ❌ API Routes (`app/api/`): Extra indirection, same server-side execution
- ❌ tRPC: Overkill for simple CRUD, learning curve

---

### Route Protection Strategies

**Decision**: Use Next.js proxy for route protection (Next.js 16 replaces deprecated middleware.ts)

**Breaking Change in Next.js 16**:
- `middleware.ts` is DEPRECATED and renamed to `proxy.ts`
- Function name changed from `middleware` to `proxy`
- Uses Node.js runtime (edge runtime NOT supported in proxy)
- Codemod available: `npx @next/codemod@canary middleware-to-proxy .`

**Pattern**:
```typescript
// proxy.ts (Next.js 16 - replaces middleware.ts)
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSession } from "@/lib/auth"

export async function proxy(request: NextRequest) {
  const protectedPaths = ["/dashboard"]

  if (protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    const session = await getSession(request)

    if (!session) {
      const signInUrl = new URL("/sign-in", request.url)
      signInUrl.searchParams.set("callbackUrl", request.nextUrl.pathname)
      return NextResponse.redirect(signInUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"]
}
```

**Alternatives Considered**:
- ❌ Component-level checks: Flicker on unauthorized access
- ❌ Layout-based checks: Still allows page load before redirect
- ✅ Middleware: Runs before page render, cleanest UX

---

## 2. Better Auth JWT Integration

### JWT Plugin Configuration with HS256

**Decision**: Use Better Auth JWT plugin with HS256 shared secret

**Configuration**:
```typescript
// lib/auth.ts
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { jwt } from "better-auth/plugins"
import { db } from "./db"

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.NEXT_PUBLIC_BASE_URL!,

  plugins: [
    jwt({
      algorithm: "HS256",
      secret: process.env.BETTER_AUTH_SECRET!,
      expiresIn: "7d",
    })
  ],

  session: {
    cookieCache: {
      enabled: true,
      maxAge: 7 * 24 * 60 * 60, // 7 days
    }
  }
})
```

**Why HS256 (Symmetric)**:
1. **Shared Secret**: Frontend and backend use same BETTER_AUTH_SECRET
2. **Simpler**: No public/private key management
3. **Sufficient**: Both frontend and backend are trusted (not third-party JWT)
4. **Backend Compatibility**: FastAPI backend validates with same secret

**HS256 vs RS256**:
- HS256: Symmetric (same secret for sign and verify) ✅ Our choice
- RS256: Asymmetric (private key signs, public key verifies) ❌ Unnecessary complexity for Phase 2

---

### Shared Secret Coordination with FastAPI

**Critical Requirement**: BETTER_AUTH_SECRET must be identical in:
1. Frontend `.env.local`: `BETTER_AUTH_SECRET=your-secret-here`
2. Backend `.env`: `BETTER_AUTH_SECRET=your-secret-here`

**Validation Strategy**:
```typescript
// lib/auth.ts
if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET environment variable is required")
}

if (process.env.BETTER_AUTH_SECRET.length < 32) {
  throw new Error("BETTER_AUTH_SECRET must be at least 32 characters")
}
```

**Secret Generation**:
```bash
# Generate cryptographically secure secret
openssl rand -base64 32
```

---

### Client-Side vs Server-Side Session Management

**Decision**: Hybrid approach - session in httpOnly cookie, token extraction server-side

**Flow**:
1. User signs in → Better Auth creates session → httpOnly cookie set
2. Client requests protected route → Cookie sent automatically
3. Server Action/Middleware → Extracts session → Gets JWT token
4. Server Action → Includes JWT in Authorization header → Calls FastAPI

**Session Storage**:
```typescript
// Client-side (lib/auth-client.ts)
import { createAuthClient } from "better-auth/client"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL!,
})

export async function getSession() {
  return await authClient.getSession()
}

// Server-side (lib/auth.ts)
import { auth } from "./auth"

export async function getServerSession(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  return session
}
```

**Why httpOnly Cookies**:
- ✅ XSS protection (JavaScript cannot access)
- ✅ Automatic sending with requests
- ✅ CSRF protection with SameSite attribute

---

### Token Refresh Strategies

**Decision**: 7-day token expiration with automatic refresh on activity

**Better Auth Automatic Refresh**:
```typescript
// Configured in lib/auth.ts
session: {
  cookieCache: {
    enabled: true,
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  updateAge: 24 * 60 * 60, // Refresh after 24 hours of activity
}
```

**Behavior**:
- Token expires after 7 days of inactivity
- After 24 hours of activity, token refreshed automatically on next request
- User sees seamless experience (no login prompts during active use)

**Expired Token Handling**:
```typescript
// proxy.ts (Next.js 16)
if (!session || session.expiresAt < Date.now()) {
  return NextResponse.redirect(new URL("/sign-in", request.url))
}
```

---

## 3. Drizzle ORM Setup

### Neon Serverless Connection Pooling

**Decision**: Use `@neondatabase/serverless` with Drizzle adapter

**Configuration**:
```typescript
// lib/db.ts
import { drizzle } from "drizzle-orm/neon-serverless"
import { Pool } from "@neondatabase/serverless"

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
export const db = drizzle(pool)
```

**Neon Benefits**:
- Serverless-optimized (scales to zero)
- WebSocket connections (works in edge runtime)
- Automatic connection pooling
- Low latency (<10ms cold start)

**Connection String Format**:
```
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
```

---

### Schema Design for Better Auth Tables

**Decision**: Use Better Auth's expected schema structure

**Required Tables**:
```typescript
// db/schema.ts
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core"

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  expiresAt: timestamp("expiresAt"),
  password: text("password"), // For email/password auth
})
```

**Why These Tables**:
- `user`: Core user identity
- `session`: Active sessions with expiration
- `account`: Auth provider linkage (email/password stored here)

---

### Migration Strategy

**Decision**: Use Drizzle Kit for migrations

**Setup**:
```typescript
// drizzle.config.ts
import type { Config } from "drizzle-kit"

export default {
  schema: "./db/schema.ts",
  out: "./db/migrations",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config
```

**Commands**:
```bash
# Generate migration
pnpm drizzle-kit generate:pg

# Apply migration
pnpm drizzle-kit push:pg

# Studio (view data)
pnpm drizzle-kit studio
```

---

### Type Safety with Drizzle Types

**Decision**: Use Drizzle's infer types for full type safety

**Pattern**:
```typescript
// types/auth.ts
import type { InferSelectModel, InferInsertModel } from "drizzle-orm"
import { user, session } from "@/db/schema"

export type User = InferSelectModel<typeof user>
export type NewUser = InferInsertModel<typeof user>
export type Session = InferSelectModel<typeof session>
export type NewSession = InferInsertModel<typeof session>
```

**Benefits**:
- Schema changes automatically update types
- No manual type maintenance
- Compile-time errors for schema mismatches

---

## 4. Server Actions vs API Routes

### When to Use Server Actions

**Decision Matrix**:

| Use Case | Use Server Action | Use API Route |
|----------|-------------------|---------------|
| Form submission | ✅ | ❌ |
| CRUD operations | ✅ | ❌ |
| Database queries | ✅ | ❌ |
| Revalidation needed | ✅ | ❌ |
| Third-party webhooks | ❌ | ✅ |
| Public API endpoints | ❌ | ✅ |
| Non-Next.js clients | ❌ | ✅ |

**Our Usage**:
- ✅ Server Actions: All task CRUD (getTasks, createTask, updateTask, deleteTask, toggleComplete)
- ✅ API Route: Better Auth endpoints only (`/api/auth/[...all]/route.ts`)

---

### Error Handling in Server Actions

**Pattern**:
```typescript
// actions/tasks.ts
"use server"

export async function createTask(data: { title: string }) {
  try {
    const session = await getSession()
    if (!session) {
      return { error: "Unauthorized" }
    }

    const response = await fetch(`${process.env.API_URL}/api/${session.user.id}/tasks`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${session.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { error: errorData.detail || "Failed to create task" }
    }

    revalidatePath("/dashboard")
    return { success: true, data: await response.json() }
  } catch (error) {
    console.error("Create task error:", error)
    return { error: "An unexpected error occurred" }
  }
}
```

**Error Response Pattern**:
```typescript
// Return type
type ActionResponse<T> =
  | { success: true; data: T }
  | { error: string }

// Usage in component
const result = await createTask({ title: "New task" })
if ("error" in result) {
  toast.error(result.error)
} else {
  toast.success("Task created!")
}
```

---

### Data Revalidation Patterns

**Automatic Cache Revalidation**:
```typescript
import { revalidatePath, revalidateTag } from "next/cache"

// Revalidate specific page
export async function createTask(data) {
  // ... create task
  revalidatePath("/dashboard") // Refresh dashboard
}

// Revalidate by tag (for granular control)
export async function updateTask(id, data) {
  // ... update task
  revalidateTag(`task-${id}`) // Only refresh this task
}

// Revalidate entire layout
export async function deleteTask(id) {
  // ... delete task
  revalidatePath("/dashboard", "layout") // Refresh layout and all nested pages
}
```

**Our Strategy**:
- Create/Update/Delete tasks → `revalidatePath("/dashboard")`
- Toggle complete → `revalidatePath("/dashboard")` (optimistic UI handles immediate update)

---

### Type-Safe Backend Communication

**Pattern with Zod Validation**:
```typescript
// lib/validation.ts
import { z } from "zod"

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
})

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>

// actions/tasks.ts
export async function createTask(input: CreateTaskInput) {
  // Validate input
  const validated = CreateTaskSchema.parse(input)

  // ... rest of implementation
}
```

**Benefits**:
- Runtime validation + TypeScript types from single source
- Input sanitization before API call
- Clear error messages for invalid data

---

## 5. shadcn/ui Integration

### Component Installation and Customization

**Setup**:
```bash
# Initialize shadcn/ui
pnpx shadcn-ui@latest init

# Install components
pnpx shadcn-ui@latest add button
pnpx shadcn-ui@latest add input
pnpx shadcn-ui@latest add avatar
pnpx shadcn-ui@latest add dropdown-menu
pnpx shadcn-ui@latest add dialog
pnpx shadcn-ui@latest add toast
pnpx shadcn-ui@latest add form
```

**Why shadcn/ui**:
1. **Copy-Paste Ownership**: Components live in your codebase, fully customizable
2. **Unstyled Foundation**: Radix UI primitives (accessible, headless)
3. **Tailwind Integration**: Styled with utility classes
4. **No Package Dependencies**: No runtime dependency on shadcn package
5. **Tree-Shakeable**: Only install components you use

**Customization Example**:
```tsx
// components/ui/button.tsx (copied into project)
import { cn } from "@/lib/utils"

export function Button({ className, variant = "default", ...props }) {
  return (
    <button
      className={cn(
        "rounded-md px-4 py-2",
        variant === "primary" && "bg-blue-600 text-white",
        variant === "secondary" && "bg-gray-200 text-gray-900",
        className
      )}
      {...props}
    />
  )
}
```

---

### Tailwind CSS Theming

**Configuration**:
```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... other color definitions
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
```

**CSS Variables**:
```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    /* ... other variables */
  }
}
```

---

### Accessibility Patterns

**shadcn/ui Accessibility**:
- Built on Radix UI (WAI-ARIA compliant)
- Keyboard navigation (Tab, Enter, Escape, Arrow keys)
- Screen reader support (ARIA labels, roles, states)
- Focus management (focus trapping in modals)

**Our Additions**:
```tsx
// Ensure all interactive elements have accessible names
<Button aria-label="Add new task">
  <PlusIcon />
</Button>

// Form labels
<label htmlFor="task-title" className="sr-only">
  Task Title
</label>
<Input id="task-title" placeholder="Enter task title" />

// Error announcements
<div role="alert" aria-live="polite">
  {error && <p>{error}</p>}
</div>
```

---

### Form Handling with React Hook Form

**Decision**: Use React Hook Form + shadcn/ui Form component

**Pattern**:
```tsx
// components/auth/sign-in-form.tsx
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export function SignInForm() {
  const form = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(data: z.infer<typeof signInSchema>) {
    const result = await authClient.signIn.email(data)
    if (result.error) {
      form.setError("root", { message: result.error })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <p className="text-sm text-red-600">{form.formState.errors.root.message}</p>
        )}

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Signing in..." : "Sign In"}
        </Button>
      </form>
    </Form>
  )
}
```

---

## Summary of Technology Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| **Component Model** | Server Components default, Client for interactivity | Performance, SEO, smaller bundles |
| **Data Fetching** | Server Actions for mutations | Type-safe, progressive enhancement, auto-revalidation |
| **Authentication** | Better Auth JWT (HS256) | Shared secret with backend, stateless |
| **Database** | Drizzle + Neon (auth only) | Serverless-optimized, type-safe, Better Auth compatible |
| **State Management** | React state + Server Actions | No Redux needed for Phase 2 |
| **Forms** | React Hook Form + Zod | Type-safe validation, great DX |
| **UI Library** | shadcn/ui + Tailwind | Accessible, customizable, no vendor lock-in |
| **Testing** | Vitest + Playwright | Fast, modern, E2E coverage |
| **Route Protection** | Next.js proxy (proxy.ts) | Runs before render, cleanest UX, Node.js runtime |

---

## References

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Better Auth Documentation](https://www.better-auth.com/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [React Hook Form Documentation](https://react-hook-form.com/)
- [Neon Serverless Documentation](https://neon.tech/docs)

---

**Research Complete**: 2025-12-12
**Next Phase**: Generate data-model.md and contracts/
