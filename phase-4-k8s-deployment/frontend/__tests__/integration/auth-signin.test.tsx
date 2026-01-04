/**
 * Integration Test: Sign-In Flow
 *
 * Tests the complete sign-in flow including:
 * - Form rendering and validation
 * - Better Auth sign-in integration
 * - Error handling for invalid credentials
 * - Successful redirect to dashboard
 *
 * @test T047: Integration test for sign-in flow
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import SignInForm from '@/components/auth/sign-in-form'

// Mock Better Auth client
vi.mock('@/lib/auth-client', () => ({
  signIn: {
    email: vi.fn(),
  },
  useSession: vi.fn(() => ({ data: null, isPending: false })),
}))

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('Sign-In Flow Integration Test', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render sign-in form with all required fields', () => {
    render(<SignInForm />)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in|log in/i })).toBeInTheDocument()
  })

  it('should validate required fields before submission', async () => {
    const user = userEvent.setup()
    render(<SignInForm />)

    const submitButton = screen.getByRole('button', { name: /sign in|log in/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/email/i)).toBeInTheDocument()
    })
  })

  it('should validate email format', async () => {
    const user = userEvent.setup()
    render(<SignInForm />)

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'invalid-email')
    await user.tab()

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
    })
  })

  it('should validate password is not empty', async () => {
    const user = userEvent.setup()
    render(<SignInForm />)

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'user@example.com')
    await user.tab()
    await user.tab()

    await waitFor(() => {
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  it('should successfully submit valid sign-in form', async () => {
    const { signIn } = await import('@/lib/auth-client')
    const mockSignIn = signIn.email as ReturnType<typeof vi.fn>
    mockSignIn.mockResolvedValue({
      data: { user: { id: '1', email: 'user@example.com' } },
      error: null
    })

    const user = userEvent.setup()
    render(<SignInForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in|log in/i })

    await user.type(emailInput, 'user@example.com')
    await user.type(passwordInput, 'SecurePass123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'SecurePass123',
      })
    })
  })

  it('should show loading state during submission', async () => {
    const { signIn } = await import('@/lib/auth-client')
    const mockSignIn = signIn.email as ReturnType<typeof vi.fn>
    mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))

    const user = userEvent.setup()
    render(<SignInForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in|log in/i })

    await user.type(emailInput, 'user@example.com')
    await user.type(passwordInput, 'SecurePass123')
    await user.click(submitButton)

    expect(submitButton).toBeDisabled()
  })

  it('should display error message for invalid credentials', async () => {
    const { signIn } = await import('@/lib/auth-client')
    const { toast } = await import('sonner')
    const mockSignIn = signIn.email as ReturnType<typeof vi.fn>
    mockSignIn.mockResolvedValue({
      data: null,
      error: { message: 'Invalid email or password' }
    })

    const user = userEvent.setup()
    render(<SignInForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in|log in/i })

    await user.type(emailInput, 'wrong@example.com')
    await user.type(passwordInput, 'WrongPass123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Invalid email or password'))
    })
  })

  it('should display error message for account not found', async () => {
    const { signIn } = await import('@/lib/auth-client')
    const { toast } = await import('sonner')
    const mockSignIn = signIn.email as ReturnType<typeof vi.fn>
    mockSignIn.mockResolvedValue({
      data: null,
      error: { message: 'Account not found' }
    })

    const user = userEvent.setup()
    render(<SignInForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in|log in/i })

    await user.type(emailInput, 'nonexistent@example.com')
    await user.type(passwordInput, 'SecurePass123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Account not found'))
    })
  })

  it('should redirect to dashboard after successful sign-in', async () => {
    const { signIn } = await import('@/lib/auth-client')
    const { useRouter } = await import('next/navigation')
    const mockSignIn = signIn.email as ReturnType<typeof vi.fn>
    const mockRouter = { push: vi.fn(), replace: vi.fn() }
    vi.mocked(useRouter).mockReturnValue(mockRouter as unknown)

    mockSignIn.mockResolvedValue({
      data: { user: { id: '1', email: 'user@example.com' } },
      error: null
    })

    const user = userEvent.setup()
    render(<SignInForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in|log in/i })

    await user.type(emailInput, 'user@example.com')
    await user.type(passwordInput, 'SecurePass123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('should handle network errors gracefully', async () => {
    const { signIn } = await import('@/lib/auth-client')
    const { toast } = await import('sonner')
    const mockSignIn = signIn.email as ReturnType<typeof vi.fn>
    mockSignIn.mockRejectedValue(new Error('Network error'))

    const user = userEvent.setup()
    render(<SignInForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in|log in/i })

    await user.type(emailInput, 'user@example.com')
    await user.type(passwordInput, 'SecurePass123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled()
    })
  })
})
