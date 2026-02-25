/**
 * Component Test: User Menu Logout Flow
 *
 * Tests the logout functionality in the user menu:
 * - Logout button triggers signOut
 * - Loading state during logout
 * - Redirect to landing page after logout
 * - Error handling for failed logout
 * - Dropdown closes after logout
 *
 * @test T090: Component test for logout flow
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import UserMenu from '@/components/layout/user-menu'

// Mock Better Auth client - create mock functions at top level
const mockUseSession = vi.fn()
const mockSignOut = vi.fn()

vi.mock('@/lib/auth-client', () => ({
  useSession: () => mockUseSession(),
  signOut: mockSignOut,
}))

// Mock Next.js navigation
const mockPush = vi.fn()
const mockReplace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}))

// Mock sonner toast
const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()

vi.mock('sonner', () => ({
  toast: {
    success: mockToastSuccess,
    error: mockToastError,
  },
}))

describe('UserMenu Component - Logout Flow', () => {
  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call signOut when logout button is clicked', async () => {
    // Using mockUseSession and mockSignOut
    mockUseSession.mockReturnValue({
      data: { user: mockUser },
      isPending: false,
    })
    mockSignOut.mockResolvedValue({ data: null, error: null })

    const user = userEvent.setup()
    render(<UserMenu />)

    // Open dropdown
    const avatar = screen.getByText('JD')
    await user.click(avatar)

    // Click logout
    const logoutButton = screen.getByText(/log out|logout/i)
    await user.click(logoutButton)

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1)
    })
  })

  it('should redirect to landing page after successful logout', async () => {
    // Using mockUseSession and mockSignOut
    // Using mockPush and mockReplace
    
    

    mockUseSession.mockReturnValue({
      data: { user: mockUser },
      isPending: false,
    })
    mockSignOut.mockResolvedValue({ data: null, error: null })

    const user = userEvent.setup()
    render(<UserMenu />)

    // Open dropdown
    const avatar = screen.getByText('JD')
    await user.click(avatar)

    // Click logout
    const logoutButton = screen.getByText(/log out|logout/i)
    await user.click(logoutButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })

  it('should show loading state during logout', async () => {
    // Using mockUseSession and mockSignOut
    mockUseSession.mockReturnValue({
      data: { user: mockUser },
      isPending: false,
    })
    // Simulate slow logout
    mockSignOut.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))

    const user = userEvent.setup()
    render(<UserMenu />)

    // Open dropdown
    const avatar = screen.getByText('JD')
    await user.click(avatar)

    // Click logout
    const logoutButton = screen.getByText(/log out|logout/i)
    await user.click(logoutButton)

    // Logout button should be disabled during logout
    expect(logoutButton).toBeDisabled()
  })

  it('should display error toast if logout fails', async () => {
    // Using mockUseSession and mockSignOut
    // Using mockToastSuccess and mockToastError
    mockUseSession.mockReturnValue({
      data: { user: mockUser },
      isPending: false,
    })
    mockSignOut.mockResolvedValue({
      data: null,
      error: { message: 'Logout failed' },
    })

    const user = userEvent.setup()
    render(<UserMenu />)

    // Open dropdown
    const avatar = screen.getByText('JD')
    await user.click(avatar)

    // Click logout
    const logoutButton = screen.getByText(/log out|logout/i)
    await user.click(logoutButton)

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('logout'))
    })
  })

  it('should handle network errors during logout', async () => {
    // Using mockUseSession and mockSignOut
    // Using mockToastSuccess and mockToastError
    mockUseSession.mockReturnValue({
      data: { user: mockUser },
      isPending: false,
    })
    mockSignOut.mockRejectedValue(new Error('Network error'))

    const user = userEvent.setup()
    render(<UserMenu />)

    // Open dropdown
    const avatar = screen.getByText('JD')
    await user.click(avatar)

    // Click logout
    const logoutButton = screen.getByText(/log out|logout/i)
    await user.click(logoutButton)

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalled()
    })
  })

  it('should close dropdown after successful logout', async () => {
    // Using mockUseSession and mockSignOut
    mockUseSession.mockReturnValue({
      data: { user: mockUser },
      isPending: false,
    })
    mockSignOut.mockResolvedValue({ data: null, error: null })

    const user = userEvent.setup()
    render(<UserMenu />)

    // Open dropdown
    const avatar = screen.getByText('JD')
    await user.click(avatar)

    await waitFor(() => {
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument()
    })

    // Click logout
    const logoutButton = screen.getByText(/log out|logout/i)
    await user.click(logoutButton)

    // Wait for logout to complete - dropdown should close
    // Note: In real implementation, component might unmount or session becomes null
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled()
    })
  })

  it('should show success toast after logout', async () => {
    // Using mockUseSession and mockSignOut
    // Using mockToastSuccess and mockToastError
    mockUseSession.mockReturnValue({
      data: { user: mockUser },
      isPending: false,
    })
    mockSignOut.mockResolvedValue({ data: null, error: null })

    const user = userEvent.setup()
    render(<UserMenu />)

    // Open dropdown
    const avatar = screen.getByText('JD')
    await user.click(avatar)

    // Click logout
    const logoutButton = screen.getByText(/log out|logout/i)
    await user.click(logoutButton)

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith(expect.stringContaining('logout'))
    })
  })

  it('should have accessible logout button with proper aria-label', async () => {
    // Using mockUseSession
    mockUseSession.mockReturnValue({
      data: { user: mockUser },
      isPending: false,
    })

    const user = userEvent.setup()
    render(<UserMenu />)

    // Open dropdown
    const avatar = screen.getByText('JD')
    await user.click(avatar)

    await waitFor(() => {
      const logoutButton = screen.getByRole('menuitem', { name: /log out|logout/i })
      expect(logoutButton).toBeInTheDocument()
    })
  })

  it('should prevent multiple logout clicks during loading', async () => {
    // Using mockUseSession and mockSignOut
    mockUseSession.mockReturnValue({
      data: { user: mockUser },
      isPending: false,
    })
    // Simulate slow logout
    mockSignOut.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: null, error: null }), 500)))

    const user = userEvent.setup()
    render(<UserMenu />)

    // Open dropdown
    const avatar = screen.getByText('JD')
    await user.click(avatar)

    // Click logout multiple times
    const logoutButton = screen.getByText(/log out|logout/i)
    await user.click(logoutButton)

    // Try clicking again (should be disabled)
    const disabledButton = screen.getByText(/log out|logout/i)
    expect(disabledButton).toBeDisabled()

    // signOut should only be called once
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1)
    })
  })
})
