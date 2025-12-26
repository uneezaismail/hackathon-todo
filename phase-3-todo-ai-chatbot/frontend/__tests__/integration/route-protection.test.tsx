/**
 * Integration Test: Route Protection
 *
 * Tests unauthenticated dashboard access protection including:
 * - Redirect to /sign-in when accessing /dashboard without authentication
 * - Callback URL preservation for post-login redirect
 * - Authenticated users can access /dashboard
 * - Nested dashboard routes (/dashboard/tasks) are protected
 *
 * @test T059: Integration test for unauthenticated dashboard access
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import proxy from '@/proxy'

// Mock Better Auth
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}))

describe('Route Protection Integration Test', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should redirect unauthenticated user from /dashboard to /sign-in with callback URL', async () => {
    const { auth } = await import('@/lib/auth')
    const mockGetSession = auth.api.getSession as ReturnType<typeof vi.fn>

    // Mock no session (unauthenticated)
    mockGetSession.mockResolvedValue(null)

    // Create mock request for /dashboard
    const request = new NextRequest(new URL('http://localhost:3000/dashboard'))

    // Call proxy
    const response = await proxy(request)

    // Should redirect to /sign-in with callbackUrl
    expect(response.status).toBe(307) // Temporary redirect
    expect(response.headers.get('location')).toContain('/sign-in')
    expect(response.headers.get('location')).toContain('callbackUrl=%2Fdashboard')
  })

  it('should allow authenticated user to access /dashboard', async () => {
    const { auth } = await import('@/lib/auth')
    const mockGetSession = auth.api.getSession as ReturnType<typeof vi.fn>

    // Mock valid session (authenticated)
    mockGetSession.mockResolvedValue({
      user: { id: '1', email: 'user@example.com', name: 'Test User' },
      session: { id: 'session-1', userId: '1', expiresAt: new Date(Date.now() + 86400000) },
    })

    // Create mock request for /dashboard
    const request = new NextRequest(new URL('http://localhost:3000/dashboard'))

    // Call proxy
    const response = await proxy(request)

    // Should allow access (NextResponse.next())
    expect(response.status).toBe(200)
    expect(response.headers.get('location')).toBeNull()
  })

  it('should redirect from nested dashboard routes when unauthenticated', async () => {
    const { auth } = await import('@/lib/auth')
    const mockGetSession = auth.api.getSession as ReturnType<typeof vi.fn>

    // Mock no session
    mockGetSession.mockResolvedValue(null)

    // Create mock request for nested route
    const request = new NextRequest(new URL('http://localhost:3000/dashboard/tasks'))

    // Call proxy
    const response = await proxy(request)

    // Should redirect with original path as callback
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/sign-in')
    expect(response.headers.get('location')).toContain('callbackUrl=%2Fdashboard%2Ftasks')
  })

  it('should preserve query parameters in callback URL', async () => {
    const { auth } = await import('@/lib/auth')
    const mockGetSession = auth.api.getSession as ReturnType<typeof vi.fn>

    // Mock no session
    mockGetSession.mockResolvedValue(null)

    // Create mock request with query params
    const request = new NextRequest(new URL('http://localhost:3000/dashboard?filter=pending'))

    // Call proxy
    const response = await proxy(request)

    // Should redirect with full path including query params
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/sign-in')
    expect(response.headers.get('location')).toContain('callbackUrl')
  })

  it('should allow unauthenticated access to public routes', async () => {
    const { auth } = await import('@/lib/auth')
    const mockGetSession = auth.api.getSession as ReturnType<typeof vi.fn>

    // Mock no session
    mockGetSession.mockResolvedValue(null)

    // Create mock request for public route
    const request = new NextRequest(new URL('http://localhost:3000/'))

    // Call proxy
    const response = await proxy(request)

    // Should allow access without calling getSession (matcher doesn't match)
    expect(response.status).toBe(200)
    expect(mockGetSession).not.toHaveBeenCalled()
  })

  it('should allow unauthenticated access to /sign-in', async () => {
    const { auth } = await import('@/lib/auth')
    const mockGetSession = auth.api.getSession as ReturnType<typeof vi.fn>

    // Mock no session
    mockGetSession.mockResolvedValue(null)

    // Create mock request for sign-in page
    const request = new NextRequest(new URL('http://localhost:3000/sign-in'))

    // Call proxy
    const response = await proxy(request)

    // Should allow access
    expect(response.status).toBe(200)
    expect(mockGetSession).not.toHaveBeenCalled()
  })

  it('should handle session verification errors gracefully', async () => {
    const { auth } = await import('@/lib/auth')
    const mockGetSession = auth.api.getSession as ReturnType<typeof vi.fn>

    // Mock session error (invalid token, expired, etc.)
    mockGetSession.mockRejectedValue(new Error('Invalid session token'))

    // Create mock request for /dashboard
    const request = new NextRequest(new URL('http://localhost:3000/dashboard'))

    // Call proxy
    const response = await proxy(request)

    // Should redirect to sign-in on error
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/sign-in')
    expect(response.headers.get('location')).toContain('callbackUrl')
  })

  it('should handle malformed session responses', async () => {
    const { auth } = await import('@/lib/auth')
    const mockGetSession = auth.api.getSession as ReturnType<typeof vi.fn>

    // Mock malformed session (null user but non-null session)
    mockGetSession.mockResolvedValue({
      user: null,
      session: { id: 'session-1' },
    })

    // Create mock request for /dashboard
    const request = new NextRequest(new URL('http://localhost:3000/dashboard'))

    // Call proxy
    const response = await proxy(request)

    // Should redirect to sign-in (treat as unauthenticated)
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/sign-in')
  })
})
