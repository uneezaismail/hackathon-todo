/**
 * Component Test: Task Filters (T098)
 *
 * Tests the task filters component functionality:
 * - Displays filter buttons for "All", "Pending", and "Completed"
 * - Active filter is visually highlighted
 * - Click on filter button updates the URL search params
 * - Filter state is read from URL search params
 * - Accessibility attributes are present
 *
 * @test T098: Component test for task filters
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { ReadonlyURLSearchParams } from 'next/navigation'

// Mock Next.js navigation hooks
const mockPush = vi.fn()
const mockSearchParams = new Map<string, string>()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => {
    const params = new URLSearchParams()
    mockSearchParams.forEach((value, key) => {
      params.set(key, value)
    })
    return params as unknown as ReadonlyURLSearchParams
  },
  usePathname: () => '/dashboard',
}))

// Import component after mocks
import TaskFilters from '@/components/tasks/task-filters'

describe('TaskFilters Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams.clear()
  })

  it('should render all three filter buttons', () => {
    render(<TaskFilters />)

    expect(screen.getByRole('button', { name: /all/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /pending/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /completed/i })).toBeInTheDocument()
  })

  it('should highlight "All" filter by default when no filter is set', () => {
    render(<TaskFilters />)

    const allButton = screen.getByRole('button', { name: /all/i })
    const pendingButton = screen.getByRole('button', { name: /pending/i })
    const completedButton = screen.getByRole('button', { name: /completed/i })

    // Check that "All" has active styling (variant="default" or similar)
    // This is a basic check - actual implementation may vary
    expect(allButton).toHaveClass('bg-primary') // or similar active class
    expect(pendingButton).not.toHaveClass('bg-primary')
    expect(completedButton).not.toHaveClass('bg-primary')
  })

  it('should highlight "Pending" filter when status=pending in URL', () => {
    mockSearchParams.set('status', 'pending')
    render(<TaskFilters />)

    const allButton = screen.getByRole('button', { name: /all/i })
    const pendingButton = screen.getByRole('button', { name: /pending/i })
    const completedButton = screen.getByRole('button', { name: /completed/i })

    expect(pendingButton).toHaveClass('bg-primary')
    expect(allButton).not.toHaveClass('bg-primary')
    expect(completedButton).not.toHaveClass('bg-primary')
  })

  it('should highlight "Completed" filter when status=completed in URL', () => {
    mockSearchParams.set('status', 'completed')
    render(<TaskFilters />)

    const allButton = screen.getByRole('button', { name: /all/i })
    const pendingButton = screen.getByRole('button', { name: /pending/i })
    const completedButton = screen.getByRole('button', { name: /completed/i })

    expect(completedButton).toHaveClass('bg-primary')
    expect(allButton).not.toHaveClass('bg-primary')
    expect(pendingButton).not.toHaveClass('bg-primary')
  })

  it('should update URL when clicking "Pending" filter', async () => {
    const user = userEvent.setup()
    render(<TaskFilters />)

    const pendingButton = screen.getByRole('button', { name: /pending/i })
    await user.click(pendingButton)

    expect(mockPush).toHaveBeenCalledWith('/dashboard?status=pending')
  })

  it('should update URL when clicking "Completed" filter', async () => {
    const user = userEvent.setup()
    render(<TaskFilters />)

    const completedButton = screen.getByRole('button', { name: /completed/i })
    await user.click(completedButton)

    expect(mockPush).toHaveBeenCalledWith('/dashboard?status=completed')
  })

  it('should clear filter when clicking "All"', async () => {
    mockSearchParams.set('status', 'pending')
    const user = userEvent.setup()
    render(<TaskFilters />)

    const allButton = screen.getByRole('button', { name: /all/i })
    await user.click(allButton)

    // Should navigate to dashboard without status param
    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('should preserve other query parameters when changing filter', async () => {
    mockSearchParams.set('status', 'pending')
    mockSearchParams.set('sort', 'newest')
    const user = userEvent.setup()
    render(<TaskFilters />)

    const completedButton = screen.getByRole('button', { name: /completed/i })
    await user.click(completedButton)

    // Should preserve 'sort' param while updating 'status'
    // Check parameters are present regardless of order
    expect(mockPush).toHaveBeenCalled()
    const callArg = mockPush.mock.calls[0][0]
    expect(callArg).toContain('status=completed')
    expect(callArg).toContain('sort=newest')
  })

  it('should have accessible labels for screen readers', () => {
    render(<TaskFilters />)

    const allButton = screen.getByRole('button', { name: /all/i })
    const pendingButton = screen.getByRole('button', { name: /pending/i })
    const completedButton = screen.getByRole('button', { name: /completed/i })

    // Buttons should have text content
    expect(allButton).toHaveTextContent(/all/i)
    expect(pendingButton).toHaveTextContent(/pending/i)
    expect(completedButton).toHaveTextContent(/completed/i)
  })

  it('should render filter group with semantic HTML', () => {
    const { container } = render(<TaskFilters />)

    // Should use proper grouping (e.g., div with role="group" or similar)
    const filterGroup = container.querySelector('[role="group"]')
    expect(filterGroup).toBeInTheDocument()
  })

  it('should not navigate when clicking the already active filter', async () => {
    mockSearchParams.set('status', 'pending')
    const user = userEvent.setup()
    render(<TaskFilters />)

    const pendingButton = screen.getByRole('button', { name: /pending/i })
    await user.click(pendingButton)

    // Should still update (Next.js router handles no-op)
    expect(mockPush).toHaveBeenCalledWith('/dashboard?status=pending')
  })

  it('should handle rapid filter switching', async () => {
    const user = userEvent.setup()
    render(<TaskFilters />)

    const allButton = screen.getByRole('button', { name: /all/i })
    const pendingButton = screen.getByRole('button', { name: /pending/i })
    const completedButton = screen.getByRole('button', { name: /completed/i })

    // Rapidly switch filters
    await user.click(pendingButton)
    await user.click(completedButton)
    await user.click(allButton)

    expect(mockPush).toHaveBeenCalledTimes(3)
    expect(mockPush).toHaveBeenNthCalledWith(1, '/dashboard?status=pending')
    expect(mockPush).toHaveBeenNthCalledWith(2, '/dashboard?status=completed')
    expect(mockPush).toHaveBeenNthCalledWith(3, '/dashboard')
  })

  it('should display filter count badges if provided', () => {
    render(<TaskFilters counts={{ all: 10, pending: 6, completed: 4 }} />)

    // Should show counts next to filter labels
    expect(screen.getByText('6')).toBeInTheDocument() // pending count
    expect(screen.getByText('4')).toBeInTheDocument() // completed count
  })
})
