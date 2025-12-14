/**
 * Route Protection Proxy (Next.js 16 Pattern)
 *
 * This file replaces the deprecated middleware.ts in Next.js 16.
 * It protects the /dashboard route by checking for a valid Better Auth session.
 *
 * Features:
 * - Session validation using Better Auth
 * - Automatic session expiry detection
 * - Callback URL preservation for post-login redirect
 * - Graceful error handling
 *
 * CRITICAL: This runs on every request matching the config.matcher pattern.
 *
 * @implementation T061: Session validation logic
 * @implementation T062: Redirect to /sign-in for unauthenticated access
 * @implementation T063: Callback URL preservation
 * @implementation T064: Session expiry detection and redirect
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

/**
 * Validate session expiry
 * Returns true if session is valid (not expired), false otherwise
 */
function isSessionValid(session: any): boolean {
  // Check if session object exists
  if (!session) {
    return false
  }

  // Check if user exists
  if (!session.user) {
    return false
  }

  // Check if session data exists
  if (!session.session) {
    return false
  }

  // Check if expiresAt exists
  if (!session.session.expiresAt) {
    return false
  }

  // Parse expiresAt (handle both Date objects and ISO strings)
  const expiresAt = session.session.expiresAt instanceof Date
    ? session.session.expiresAt
    : new Date(session.session.expiresAt)

  // Check if session is expired
  const now = new Date()
  if (expiresAt <= now) {
    return false
  }

  // Session is valid
  return true
}

/**
 * Proxy function that checks authentication status
 * Redirects to /sign-in if user is not authenticated or session is expired
 */
export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Check if the route requires authentication
  if (pathname.startsWith('/dashboard')) {
    try {
      // T061: Verify session using Better Auth
      const session = await auth.api.getSession({
        headers: request.headers,
      })

      // T061 & T064: Validate session (existence and expiry)
      if (!isSessionValid(session)) {
        // T062 & T063: Redirect to /sign-in with callback URL
        const signInUrl = new URL('/sign-in', request.url)

        // T063: Preserve full path including query parameters for post-login redirect
        const callbackUrl = `${pathname}${request.nextUrl.search}`
        signInUrl.searchParams.set('callbackUrl', callbackUrl)

        return NextResponse.redirect(signInUrl)
      }

      // Session is valid and not expired - allow request to proceed
      return NextResponse.next()
    } catch (error) {
      // T064: On error (invalid token, network error, etc.), redirect to sign-in
      console.error('Session verification error:', error)

      // T063: Preserve callback URL even on error
      const signInUrl = new URL('/sign-in', request.url)
      const callbackUrl = `${pathname}${request.nextUrl.search}`
      signInUrl.searchParams.set('callbackUrl', callbackUrl)

      return NextResponse.redirect(signInUrl)
    }
  }

  // Allow all other requests (public routes like /, /sign-in, /sign-up)
  return NextResponse.next()
}

/**
 * Matcher configuration
 * Specifies which routes this middleware should run on
 */
export const config = {
  matcher: [
    '/dashboard/:path*', // Protect all dashboard routes
  ],
}
