/**
 * Better Auth Server Configuration
 *
 * This file configures Better Auth on the server side with:
 * - JWT plugin enabled for token generation (/api/auth/token endpoint)
 * - Shared secret (BETTER_AUTH_SECRET) for token signing/verification
 * - Drizzle adapter for auth tables in Neon PostgreSQL
 *
 * CRITICAL: BETTER_AUTH_SECRET must match the backend FastAPI configuration
 */

import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { db } from '@/lib/db'
import { user, session, account } from '@/db/schema'

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error('BETTER_AUTH_SECRET environment variable is required')
}

export const auth = betterAuth({
  // Database adapter using Drizzle ORM
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user,
      session,
      account, // Contains password field for email/password auth
    },
  }),

  // Email and password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Phase 2: No email verification
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  // Secret for signing tokens
  secret: process.env.BETTER_AUTH_SECRET,

  // Base URL for auth routes - auto-detect from environment
  baseURL: process.env.NEXT_PUBLIC_APP_URL ||
           (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),

  // Next.js integration plugin
  plugins: [nextCookies()],

  // Advanced options
  advanced: {
    // Use secure cookies in production
    useSecureCookies: process.env.NODE_ENV === 'production',

    // Cookie options
    cookiePrefix: 'better-auth',

    // Default cookie domain (auto-detected)
    defaultCookieAttributes: {
      sameSite: 'lax',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    },
  },

  // Trusted origins for CORS - support both local development and production
  trustedOrigins: [
    // Localhost for port-forward access
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    // Backend API
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    // Minikube IP (will be set via NEXT_PUBLIC_APP_URL in deployment)
    ...(process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL] : []),
    // Vercel deployment
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ],
})

// Export types for TypeScript
export type Auth = typeof auth
