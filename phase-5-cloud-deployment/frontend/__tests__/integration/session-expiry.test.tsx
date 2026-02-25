/**
 * Integration Test: Session Expiration Redirect
 *
 * Tests automatic session expiry detection and redirect including:
 * - Expired session redirects to /sign-in
 * - Session expiring soon allows access but may trigger refresh
 * - Callback URL preserved on session expiry
 * - Multiple expired session checks don't cause loops
 *
 * @test T060: Integration test for session expiration redirect
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

describe('Session Expiration Integration Test', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should redirect when session is expired', async () => {
    const { auth } = await import('@/lib/auth')
    const mockGetSession = auth.api.getSession as ReturnType<typeof vi.fn>

    // Mock expired session (expiresAt in the past)
    mockGetSession.mockResolvedValue({
      user: { id: '1', email: 'user@example.com', name: 'Test User' },
      session: {
        id: 'session-1',
        userId: '1',
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      },
    })

    // Create mock request for /dashboard
    const request = new NextRequest(new URL('http://localhost:3000/dashboard'))

    // Call proxy
    const response = await proxy(request)

    // Should redirect to /sign-in with callback URL
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/sign-in')
    expect(response.headers.get('location')).toContain('callbackUrl=%2Fdashboard')
  })

  it('should allow access when session is valid (not expired)', async () => {
    const { auth } = await import('@/lib/auth')
    const mockGetSession = auth.api.getSession as ReturnType<typeof vi.fn>

    // Mock valid session (expiresAt in the future)
    mockGetSession.mockResolvedValue({
      user: { id: '1', email: 'user@example.com', name: 'Test User' },
      session: {
        id: 'session-1',
        userId: '1',
        expiresAt: new Date(Date.now() + 86400000), // Expires in 24 hours
      },
    })

    // Create mock request for /dashboard
    const request = new NextRequest(new URL('http://localhost:3000/dashboard'))

    // Call proxy
    const response = await proxy(request)

    // Should allow access
    expect(response.status).toBe(200)
    expect(response.headers.get('location')).toBeNull()
  })

  it('should redirect when session object is null', async () => {
    const { auth } = await import('@/lib/auth')
    const mockGetSession = auth.api.getSession as ReturnType<typeof vi.fn>

    // Mock session with null session object
    mockGetSession.mockResolvedValue({
      user: { id: '1', email: 'user@example.com', name: 'Test User' },
      session: null,
    })

    // Create mock request for /dashboard
    const request = new NextRequest(new URL('http://localhost:3000/dashboard'))

    // Call proxy
    const response = await proxy(request)

    // Should redirect to /sign-in
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/sign-in')
  })

  it('should handle session without expiresAt gracefully', async () => {
    const { auth } = await import('@/lib/auth')
    const mockGetSession = auth.api.getSession as ReturnType<typeof vi.fn>

    // Mock session without expiresAt (malformed)
    mockGetSession.mockResolvedValue({
      user: { id: '1', email: 'user@example.com', name: 'Test User' },
      session: {
        id: 'session-1',
        userId: '1',
        // expiresAt is missing
      },
    })

    // Create mock request for /dashboard
    const request = new NextRequest(new URL('http://localhost:3000/dashboard'))

    // Call proxy
    const response = await proxy(request)

    // Should redirect to sign-in (treat as invalid)
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/sign-in')
  })

  it('should preserve callback URL when session expires on nested route', async () => {
    const { auth } = await import('@/lib/auth')
    const mockGetSession = auth.api.getSession as ReturnType<typeof vi.fn>

    // Mock expired session
    mockGetSession.mockResolvedValue({
      user: { id: '1', email: 'user@example.com', name: 'Test User' },
      session: {
        id: 'session-1',
        userId: '1',
        expiresAt: new Date(Date.now() - 5000), // Expired 5 seconds ago
      },
    })

    // Create mock request for nested route
    const request = new NextRequest(new URL('http://localhost:3000/dashboard/tasks?filter=pending'))

    // Call proxy
    const response = await proxy(request)

    // Should redirect with full callback URL
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/sign-in')
    expect(response.headers.get('location')).toContain('callbackUrl')
    // Should preserve the nested path
    expect(response.headers.get('location')).toContain('dashboard')
  })

  it('should handle session close to expiration (edge case)', async () => {
    const { auth } = await import('@/lib/auth')
    const mockGetSession = auth.api.getSession as ReturnType<typeof vi.fn>

    // Mock session expiring in 1 second (edge case)
    mockGetSession.mockResolvedValue({
      user: { id: '1', email: 'user@example.com', name: 'Test User' },
      session: {
        id: 'session-1',
        userId: '1',
        expiresAt: new Date(Date.now() + 1000), // Expires in 1 second
      },
    })

    // Create mock request for /dashboard
    const request = new NextRequest(new URL('http://localhost:3000/dashboard'))

    // Call proxy
    const response = await proxy(request)

    // Should allow access (still valid, even if close to expiry)
    expect(response.status).toBe(200)
    expect(response.headers.get('location')).toBeNull()
  })

  it('should handle concurrent session checks gracefully', async () => {
    const { auth } = await import('@/lib/auth')
    const mockGetSession = auth.api.getSession as ReturnType<typeof vi.fn>

    // Mock valid session
    mockGetSession.mockResolvedValue({
      user: { id: '1', email: 'user@example.com', name: 'Test User' },
      session: {
        id: 'session-1',
        userId: '1',
        expiresAt: new Date(Date.now() + 3600000), // Valid for 1 hour
      },
    })

    // Create multiple concurrent requests
    const request1 = new NextRequest(new URL('http://localhost:3000/dashboard'))
    const request2 = new NextRequest(new URL('http://localhost:3000/dashboard/tasks'))

    // Call proxy concurrently
    const [response1, response2] = await Promise.all([
      proxy(request1),
      proxy(request2),
    ])

    // Both should succeed
    expect(response1.status).toBe(200)
    expect(response2.status).toBe(200)
    expect(mockGetSession).toHaveBeenCalledTimes(2)
  })

  it('should redirect when session validation throws error', async () => {
    const { auth } = await import('@/lib/auth')
    const mockGetSession = auth.api.getSession as ReturnType<typeof vi.fn>

    // Mock session validation error
    mockGetSession.mockRejectedValue(new Error('Session validation failed'))

    // Create mock request for /dashboard
    const request = new NextRequest(new URL('http://localhost:3000/dashboard'))

    // Call proxy
    const response = await proxy(request)

    // Should redirect to /sign-in
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/sign-in')
    expect(response.headers.get('location')).toContain('callbackUrl')
  })

  it('should handle different date formats for expiresAt', async () => {
    const { auth } = await import('@/lib/auth')
    const mockGetSession = auth.api.getSession as ReturnType<typeof vi.fn>

    // Mock session with string date (ISO format)
    const futureDate = new Date(Date.now() + 86400000).toISOString()
    mockGetSession.mockResolvedValue({
      user: { id: '1', email: 'user@example.com', name: 'Test User' },
      session: {
        id: 'session-1',
        userId: '1',
        expiresAt: futureDate as unknown, // String instead of Date
      },
    })

    // Create mock request for /dashboard
    const request = new NextRequest(new URL('http://localhost:3000/dashboard'))

    // Call proxy
    const response = await proxy(request)

    // Should handle string date and allow access
    expect(response.status).toBe(200)
    expect(response.headers.get('location')).toBeNull()
  })
})
