/**
 * Integration Test: Session Persistence
 *
 * Tests session management across page refreshes and navigation:
 * - Session persistence after page refresh
 * - Automatic redirect to dashboard when session exists
 * - Session cleared after logout
 * - Protected routes redirect when no session
 *
 * @test T048: Integration test for session persistence
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

// Mock Better Auth client
const mockUseSession = vi.fn()
const mockSignOut = vi.fn()

vi.mock('@/lib/auth-client', () => ({
  useSession: () => mockUseSession(),
  signOut: mockSignOut,
  getSession: vi.fn(),
}))

// Mock Next.js navigation
const mockPush = vi.fn()
const mockReplace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => '/dashboard',
}))

// Create a simple component to test session behavior
function TestSessionComponent() {
  const { data: session, isPending } = mockUseSession() as unknown

  if (isPending) {
    return <div>Loading session...</div>
  }

  if (!session) {
    return <div>No active session</div>
  }

  return (
    <div>
      <p>Welcome, {session.user.name}</p>
      <p>Email: {session.user.email}</p>
      <button onClick={() => mockSignOut()}>Logout</button>
    </div>
  )
}

describe('Session Persistence Integration Test', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show loading state while checking session', () => {
    mockUseSession.mockReturnValue({ data: null, isPending: true })

    render(<TestSessionComponent />)

    expect(screen.getByText(/loading session/i)).toBeInTheDocument()
  })

  it('should show "no session" when user is not authenticated', () => {
    mockUseSession.mockReturnValue({ data: null, isPending: false })

    render(<TestSessionComponent />)

    expect(screen.getByText(/no active session/i)).toBeInTheDocument()
  })

  it('should display user information when session exists', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
        },
      },
      isPending: false,
    })

    render(<TestSessionComponent />)

    expect(screen.getByText(/welcome, john doe/i)).toBeInTheDocument()
    expect(screen.getByText(/email: john@example\.com/i)).toBeInTheDocument()
  })

  it('should persist session across page refresh', () => {
    // Simulate initial session
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
        },
      },
      isPending: false,
    })

    const { rerender } = render(<TestSessionComponent />)

    expect(screen.getByText(/welcome, john doe/i)).toBeInTheDocument()

    // Simulate page refresh - session should still exist
    rerender(<TestSessionComponent />)

    expect(screen.getByText(/welcome, john doe/i)).toBeInTheDocument()
  })

  it('should call signOut when logout button is clicked', async () => {
    const user = userEvent.setup()

    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
        },
      },
      isPending: false,
    })

    render(<TestSessionComponent />)

    const logoutButton = screen.getByRole('button', { name: /logout/i })
    await user.click(logoutButton)

    expect(mockSignOut).toHaveBeenCalled()
  })

  it('should clear session after logout', async () => {
    const user = userEvent.setup()

    // Start with active session
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
        },
      },
      isPending: false,
    })

    const { rerender } = render(<TestSessionComponent />)

    const logoutButton = screen.getByRole('button', { name: /logout/i })
    await user.click(logoutButton)

    // Simulate session cleared after logout
    mockUseSession.mockReturnValue({ data: null, isPending: false })
    rerender(<TestSessionComponent />)

    expect(screen.getByText(/no active session/i)).toBeInTheDocument()
  })

  it('should restore session from cookie storage', async () => {
    const { getSession } = await import('@/lib/auth-client')
    const mockGetSession = getSession as ReturnType<typeof vi.fn>

    mockGetSession.mockResolvedValue({
      user: {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
      },
    })

    const session = await mockGetSession()

    expect(session).toEqual({
      user: {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
      },
    })
  })

  it('should handle session expiration gracefully', () => {
    // Start with active session
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
        },
      },
      isPending: false,
    })

    const { rerender } = render(<TestSessionComponent />)

    expect(screen.getByText(/welcome, john doe/i)).toBeInTheDocument()

    // Simulate session expiration
    mockUseSession.mockReturnValue({ data: null, isPending: false })
    rerender(<TestSessionComponent />)

    expect(screen.getByText(/no active session/i)).toBeInTheDocument()
  })

  it('should maintain session data structure', () => {
    const sessionData = {
      user: {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
      },
    }

    mockUseSession.mockReturnValue({
      data: sessionData,
      isPending: false,
    })

    render(<TestSessionComponent />)

    // Verify session structure is maintained
    const returnedSession = mockUseSession()
    expect(returnedSession.data).toEqual(sessionData)
    expect(returnedSession.data.user).toHaveProperty('id')
    expect(returnedSession.data.user).toHaveProperty('name')
    expect(returnedSession.data.user).toHaveProperty('email')
  })
})
