/**
 * Component Test: User Menu with Avatar Initials
 *
 * Tests the user menu component functionality:
 * - Avatar displays user initials correctly
 * - Dropdown menu opens on click
 * - User info (name and email) is displayed
 * - Logout option is available
 * - Click outside closes the dropdown
 *
 * @test T089: Component test for user-menu with avatar initials
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

describe('UserMenu Component - Avatar Initials', () => {
  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display user avatar with correct initials', () => {
    mockUseSession.mockReturnValue({
      data: { user: mockUser },
      isPending: false,
    })

    render(<UserMenu />)

    // Avatar should show initials "JD" (first letter of first and last name)
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('should display correct initials for single name', () => {
    mockUseSession.mockReturnValue({
      data: { user: { ...mockUser, name: 'John' } },
      isPending: false,
    })

    render(<UserMenu />)

    // Avatar should show "J" for single name
    expect(screen.getByText('J')).toBeInTheDocument()
  })

  it('should display correct initials for multiple names', () => {
    mockUseSession.mockReturnValue({
      data: { user: { ...mockUser, name: 'John Michael Doe' } },
      isPending: false,
    })

    render(<UserMenu />)

    // Avatar should show "JD" (first and last name only)
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('should open dropdown menu on avatar click', async () => {
    mockUseSession.mockReturnValue({
      data: { user: mockUser },
      isPending: false,
    })

    const user = userEvent.setup()
    render(<UserMenu />)

    const avatar = screen.getByText('JD')
    await user.click(avatar)

    await waitFor(() => {
      // User name and email should be visible in dropdown
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument()
    })
  })

  it('should display logout option in dropdown', async () => {
    mockUseSession.mockReturnValue({
      data: { user: mockUser },
      isPending: false,
    })

    const user = userEvent.setup()
    render(<UserMenu />)

    const avatar = screen.getByText('JD')
    await user.click(avatar)

    await waitFor(() => {
      expect(screen.getByText(/log out|logout/i)).toBeInTheDocument()
    })
  })

  it('should close dropdown on click outside', async () => {
    mockUseSession.mockReturnValue({
      data: { user: mockUser },
      isPending: false,
    })

    const user = userEvent.setup()
    render(
      <div>
        <UserMenu />
        <div data-testid="outside">Outside element</div>
      </div>
    )

    // Open dropdown
    const avatar = screen.getByText('JD')
    await user.click(avatar)

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Click outside
    const outside = screen.getByTestId('outside')
    await user.click(outside)

    await waitFor(() => {
      // Dropdown should close (user info should not be visible)
      expect(screen.queryByText('john.doe@example.com')).not.toBeInTheDocument()
    })
  })

  it('should render nothing if user is not authenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: false,
    })

    const { container } = render(<UserMenu />)

    // Component should not render anything
    expect(container.firstChild).toBeNull()
  })

  it('should show loading state while session is pending', () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: true,
    })

    const { container } = render(<UserMenu />)

    // Should not render while loading
    expect(container.firstChild).toBeNull()
  })

  it('should handle user with no name gracefully', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: '1', email: 'user@example.com', name: null } },
      isPending: false,
    })

    render(<UserMenu />)

    // Should show default initials (e.g., "U" from email)
    expect(screen.getByText('U')).toBeInTheDocument()
  })

  it('should display user avatar with aria-label for accessibility', () => {
    mockUseSession.mockReturnValue({
      data: { user: mockUser },
      isPending: false,
    })

    render(<UserMenu />)

    // Avatar button should have accessible label
    const avatarButton = screen.getByRole('button', { name: /user menu|account/i })
    expect(avatarButton).toBeInTheDocument()
  })

  it('should toggle dropdown on multiple clicks', async () => {
    mockUseSession.mockReturnValue({
      data: { user: mockUser },
      isPending: false,
    })

    const user = userEvent.setup()
    render(<UserMenu />)

    const avatar = screen.getByText('JD')

    // Open dropdown
    await user.click(avatar)
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Close dropdown
    await user.click(avatar)
    await waitFor(() => {
      expect(screen.queryByText('john.doe@example.com')).not.toBeInTheDocument()
    })

    // Open again
    await user.click(avatar)
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })
  })
})
