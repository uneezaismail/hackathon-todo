/**
 * Integration Test: Sign-Up Flow
 *
 * Tests the complete sign-up flow including:
 * - Form rendering and validation
 * - Better Auth sign-up integration
 * - Error handling
 * - Successful redirect to dashboard
 *
 * @test T046: Integration test for sign-up flow
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import SignUpForm from '@/components/auth/sign-up-form'

// Mock Better Auth client
vi.mock('@/lib/auth-client', () => ({
  signUp: {
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

describe('Sign-Up Flow Integration Test', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render sign-up form with all required fields', () => {
    render(<SignUpForm />)

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up|create account/i })).toBeInTheDocument()
  })

  it('should validate required fields before submission', async () => {
    const user = userEvent.setup()
    render(<SignUpForm />)

    const submitButton = screen.getByRole('button', { name: /sign up|create account/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/name/i)).toBeInTheDocument()
    })
  })

  it('should validate name minimum length', async () => {
    const user = userEvent.setup()
    render(<SignUpForm />)

    const nameInput = screen.getByLabelText(/name/i)
    await user.type(nameInput, 'a')
    await user.tab()

    await waitFor(() => {
      expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument()
    })
  })

  it('should validate email format', async () => {
    const user = userEvent.setup()
    render(<SignUpForm />)

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'invalid-email')
    await user.tab()

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
    })
  })

  it('should validate password strength requirements', async () => {
    const user = userEvent.setup()
    render(<SignUpForm />)

    const passwordInput = screen.getByLabelText(/password/i)
    await user.type(passwordInput, 'weak')
    await user.tab()

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
    })
  })

  it('should validate password contains uppercase, lowercase, and number', async () => {
    const user = userEvent.setup()
    render(<SignUpForm />)

    const passwordInput = screen.getByLabelText(/password/i)
    await user.type(passwordInput, 'nouppercase1')
    await user.tab()

    await waitFor(() => {
      expect(screen.getByText(/password must contain.*uppercase.*lowercase.*number/i)).toBeInTheDocument()
    })
  })

  it('should successfully submit valid sign-up form', async () => {
    const { signUp } = await import('@/lib/auth-client')
    const mockSignUp = signUp.email as ReturnType<typeof vi.fn>
    mockSignUp.mockResolvedValue({ data: { user: { id: '1' } }, error: null })

    const user = userEvent.setup()
    render(<SignUpForm />)

    const nameInput = screen.getByLabelText(/name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign up|create account/i })

    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'john@example.com')
    await user.type(passwordInput, 'SecurePass123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'SecurePass123',
        name: 'John Doe',
      })
    })
  })

  it('should show loading state during submission', async () => {
    const { signUp } = await import('@/lib/auth-client')
    const mockSignUp = signUp.email as ReturnType<typeof vi.fn>
    mockSignUp.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))

    const user = userEvent.setup()
    render(<SignUpForm />)

    const nameInput = screen.getByLabelText(/name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign up|create account/i })

    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'john@example.com')
    await user.type(passwordInput, 'SecurePass123')
    await user.click(submitButton)

    expect(submitButton).toBeDisabled()
  })

  it('should display error message for existing email', async () => {
    const { signUp } = await import('@/lib/auth-client')
    const { toast } = await import('sonner')
    const mockSignUp = signUp.email as ReturnType<typeof vi.fn>
    mockSignUp.mockResolvedValue({
      data: null,
      error: { message: 'Email already exists' }
    })

    const user = userEvent.setup()
    render(<SignUpForm />)

    const nameInput = screen.getByLabelText(/name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign up|create account/i })

    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'existing@example.com')
    await user.type(passwordInput, 'SecurePass123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Email already exists'))
    })
  })

  it('should redirect to dashboard after successful sign-up', async () => {
    const { signUp } = await import('@/lib/auth-client')
    const { useRouter } = await import('next/navigation')
    const mockSignUp = signUp.email as ReturnType<typeof vi.fn>
    const mockRouter = { push: vi.fn(), replace: vi.fn() }
    vi.mocked(useRouter).mockReturnValue(mockRouter as unknown)

    mockSignUp.mockResolvedValue({
      data: { user: { id: '1', email: 'john@example.com', name: 'John Doe' } },
      error: null
    })

    const user = userEvent.setup()
    render(<SignUpForm />)

    const nameInput = screen.getByLabelText(/name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign up|create account/i })

    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'john@example.com')
    await user.type(passwordInput, 'SecurePass123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
    })
  })
})
