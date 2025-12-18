/**
 * Sign-In Form Component (Client Component)
 *
 * Implements user authentication with:
 * - Email and password fields
 * - Zod validation with real-time error display
 * - Better Auth integration for sign-in
 * - Loading states during submission
 * - Error handling with toast notifications
 * - Automatic redirect to /dashboard on success
 * - Futuristic design matching landing page
 *
 * @component T050: Sign-in form component
 * @component T054: Form validation with Zod
 * @component T056: Error handling and display
 * @component T057: Redirect logic after authentication
 * @component T058: Loading states
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { signIn } from '@/lib/auth-client'
import { signInSchema, type SignInFormData } from '@/lib/validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SignInForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof SignInFormData, string>>>({})
  const [authError, setAuthError] = useState<string>('')
  const [formData, setFormData] = useState<SignInFormData>({
    email: '',
    password: '',
  })

  // T063: Get callback URL from query parameters
  const getCallbackUrl = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return params.get('callbackUrl') || '/dashboard'
    }
    return '/dashboard'
  }

  /**
   * Validate a single field
   */
  const validateField = (field: keyof SignInFormData, value: string) => {
    try {
      // Validate single field using Zod schema
      signInSchema.shape[field].parse(value)
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    } catch (err) {
      const zodError = err as { errors?: Array<{ message?: string }> }
      const errorMessage = zodError.errors?.[0]?.message || 'Invalid value'
      setErrors((prev) => ({ ...prev, [field]: errorMessage }))
    }
  }

  /**
   * Handle input change with validation
   */
  const handleChange = (field: keyof SignInFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
    // Clear authentication error when user starts typing
    if (authError) {
      setAuthError('')
    }
  }

  /**
   * Handle input blur - validate field
   */
  const handleBlur = (field: keyof SignInFormData) => () => {
    validateField(field, formData[field])
  }

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all fields
    try {
      signInSchema.parse(formData)
      setErrors({})
    } catch (err) {
      const zodError = err as { errors?: Array<{ path: string[]; message: string }> }
      const validationErrors: Partial<Record<keyof SignInFormData, string>> = {}
      zodError.errors?.forEach((zodErr) => {
        const field = zodErr.path[0] as keyof SignInFormData
        validationErrors[field] = zodErr.message
      })
      setErrors(validationErrors)
      return
    }

    // Submit form
    setIsLoading(true)
    setAuthError('') // Clear any previous auth errors

    try {
      const result = await signIn.email({
        email: formData.email,
        password: formData.password,
      })

      if (result.error) {
        // Show inline error instead of toast
        setAuthError('Invalid email or password. Please check your credentials and try again.')
        setIsLoading(false)
        return
      }

      // Success - redirect to callback URL or dashboard
      toast.success('Signed in successfully!')
      const callbackUrl = getCallbackUrl()
      router.push(callbackUrl)
    } catch (err) {
      console.error('Sign-in error:', err)
      const error = err as Error
      // Show inline error instead of toast
      setAuthError(error.message || 'An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      {/* Form Card */}
      <div
        className={cn(
          'relative rounded-3xl p-8 sm:p-10',
          'border-2 border-[#00d4b8]/30 bg-[#131929]/95',
          'backdrop-blur-xl',
          'shadow-[0_0_80px_rgba(0,212,184,0.15)]',
          'transition-all duration-500',
          'hover:border-[#00d4b8]/50 hover:shadow-[0_0_100px_rgba(0,212,184,0.25)]'
        )}
      >
        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h1
              className="text-3xl sm:text-4xl font-bold text-white mb-3"
              style={{
                textShadow: '0 0 30px rgba(0, 229, 204, 0.3)',
              }}
            >
              Welcome Back
            </h1>
            <p className="text-white/60 text-sm sm:text-base">
              Sign in to continue to your dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Authentication Error Message */}
            {authError && (
              <div
                className={cn(
                  'flex items-start gap-3 p-4 rounded-xl',
                  'bg-red-500/10 border-2 border-red-500/30',
                  'animate-fade-in'
                )}
                role="alert"
              >
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-400">
                    Authentication Failed
                  </p>
                  <p className="text-sm text-red-300/80 mt-1">
                    {authError}
                  </p>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/90 font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40 pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange('email')}
                  onBlur={handleBlur('email')}
                  disabled={isLoading}
                  className={cn(
                    'pl-12 pr-4 h-12 rounded-xl',
                    'bg-[#1a2332]/80 border-2 text-white placeholder:text-white/40',
                    'transition-all duration-300',
                    'border-white/10 focus:bg-[#1a2332] focus:border-[#00d4b8]/60 focus:shadow-[0_0_20px_rgba(0,212,184,0.2)]',
                    errors.email
                      ? 'border-red-500/60 focus:border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                      : ''
                  )}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <div
                  id="email-error"
                  className="flex items-center gap-2 text-sm text-red-400 animate-fade-in"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errors.email}</span>
                </div>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/90 font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40 pointer-events-none z-10" />
                <PasswordInput
                  id="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange('password')}
                  onBlur={handleBlur('password')}
                  disabled={isLoading}
                  className={cn(
                    'pl-12 h-12 rounded-xl',
                    'bg-[#1a2332]/80 border-2 text-white placeholder:text-white/40',
                    'transition-all duration-300',
                    'border-white/10 focus:bg-[#1a2332] focus:border-[#00d4b8]/60 focus:shadow-[0_0_20px_rgba(0,212,184,0.2)]',
                    errors.password
                      ? 'border-red-500/60 focus:border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                      : ''
                  )}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  autoComplete="current-password"
                />
              </div>
              {errors.password && (
                <div
                  id="password-error"
                  className="flex items-center gap-2 text-sm text-red-400 animate-fade-in"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errors.password}</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full h-12 rounded-xl',
                'bg-[#00d4b8] text-[#0f1729] font-semibold',
                'border-2 border-[#00d4b8]/50',
                'hover:bg-[#00e5cc] hover:border-[#00e5cc]',
                'hover:shadow-[0_0_30px_rgba(0,212,184,0.5)]',
                'transition-all duration-300',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'active:scale-95',
                'group'
              )}
            >
              <span className="flex items-center justify-center gap-2">
                {isLoading ? 'Signing In...' : 'Sign In'}
                {!isLoading && (
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                )}
              </span>
            </Button>

            {/* Sign Up Link */}
            <div className="text-center pt-4 border-t border-white/10">
              <p className="text-sm text-white/60">
                Don&apos;t have an account?{' '}
                <Link
                  href="/sign-up"
                  className="text-[#00d4b8] hover:text-[#00e5cc] font-medium transition-colors duration-200 hover:underline"
                >
                  Create account
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Back to Home Link */}
      <div className="text-center mt-6">
        <Link
          href="/"
          className="text-sm text-white/60 hover:text-white/80 transition-colors duration-200 inline-flex items-center gap-1"
        >
          <ArrowRight className="h-4 w-4 rotate-180" />
          Back to home
        </Link>
      </div>
    </div>
  )
}
