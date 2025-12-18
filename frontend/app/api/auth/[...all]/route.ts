/**
 * Better Auth API Route Handler
 *
 * This file handles all Better Auth API routes:
 * - POST /api/auth/sign-in/email
 * - POST /api/auth/sign-up/email
 * - POST /api/auth/sign-out
 * - GET /api/auth/get-session
 *
 * Next.js 16 pattern: Export GET and POST handlers from the auth instance
 * IMPORTANT: Uses [[...all]] (optional catch-all) to handle /api/auth base path
 */

import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'

// Force dynamic rendering for auth routes
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export const { GET, POST, PATCH, PUT, DELETE } = toNextJsHandler(auth)
