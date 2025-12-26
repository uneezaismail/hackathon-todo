/**
 * Sign-Up Form Component (Client Component)
 *
 * Implements user registration with:
 * - Name, email, and password fields
 * - Zod validation with real-time error display
 * - Better Auth integration for sign-up
 * - Loading states during submission
 * - Error handling with toast notifications
 * - Automatic redirect to /dashboard on success
 * - Futuristic design matching landing page
 *
 * @component T049: Sign-up form component
 * @component T053: Form validation with Zod
 * @component T055: Error handling and display
 * @component T057: Redirect logic after authentication
 * @component T058: Loading states
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { signUp } from '@/lib/auth-client'
import { signUpSchema, type SignUpFormData } from '@/lib/validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { User, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SignUpForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof SignUpFormData, string>>>({})
  const [authError, setAuthError] = useState<string>('')
  const [formData, setFormData] = useState<SignUpFormData>({
    name: '',
    email: '',
    password: '',
  })

  /**
   * Validate a single field
   */
  const validateField = (field: keyof SignUpFormData, value: string) => {
    try {
      // Validate single field using Zod schema
      signUpSchema.shape[field].parse(value)
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
  const handleChange = (field: keyof SignUpFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
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
  const handleBlur = (field: keyof SignUpFormData) => () => {
    validateField(field, formData[field])
  }

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all fields
    try {
      signUpSchema.parse(formData)
      setErrors({})
    } catch (err) {
      const zodError = err as { errors?: Array<{ path: string[]; message: string }> }
      const validationErrors: Partial<Record<keyof SignUpFormData, string>> = {}
      zodError.errors?.forEach((zodErr) => {
        const field = zodErr.path[0] as keyof SignUpFormData
        validationErrors[field] = zodErr.message
      })
      setErrors(validationErrors)
      return
    }

    // Submit form
    setIsLoading(true)
    setAuthError('') // Clear any previous auth errors

    try {
      const result = await signUp.email({
        email: formData.email,
        password: formData.password,
        name: formData.name,
      })

      if (result.error) {
        // Show inline error instead of toast
        setAuthError(result.error.message || 'Failed to create account. This email may already be registered.')
        setIsLoading(false)
        return
      }

      // Success - redirect to dashboard
      toast.success('Account created successfully!')
      router.push('/dashboard')
    } catch (err) {
      console.error('Sign-up error:', err)
      const error = err as Error
      // Show inline error instead of toast
      setAuthError(error.message || 'An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  // Password strength indicator
  const getPasswordStrength = () => {
    const password = formData.password
    if (!password) return null

    let strength = 0
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++

    return {
      score: strength,
      label: strength <= 2 ? 'Weak' : strength === 3 ? 'Good' : 'Strong',
      color: strength <= 2 ? 'bg-red-500' : strength === 3 ? 'bg-yellow-500' : 'bg-green-500'
    }
  }

  const passwordStrength = getPasswordStrength()

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
              Create Account
            </h1>
            <p className="text-white/60 text-sm sm:text-base">
              Start managing your tasks efficiently
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
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
                    Registration Failed
                  </p>
                  <p className="text-sm text-red-300/80 mt-1">
                    {authError}
                  </p>
                </div>
              </div>
            )}

            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white/90 font-medium">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40 pointer-events-none" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange('name')}
                  onBlur={handleBlur('name')}
                  disabled={isLoading}
                  className={cn(
                    'pl-12 pr-4 h-12 rounded-xl',
                    'bg-[#1a2332]/80 border-2 text-white placeholder:text-white/40',
                    'transition-all duration-300',
                    'border-white/10 focus:bg-[#1a2332] focus:border-[#00d4b8]/60 focus:shadow-[0_0_20px_rgba(0,212,184,0.2)]',
                    errors.name
                      ? 'border-red-500/60 focus:border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                      : ''
                  )}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
              </div>
              {errors.name && (
                <div
                  id="name-error"
                  className="flex items-center gap-2 text-sm text-red-400 animate-fade-in"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errors.name}</span>
                </div>
              )}
            </div>

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
                  placeholder="Create a secure password"
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
                />
              </div>

              {/* Password Strength Indicator */}
              {passwordStrength && !errors.password && (
                <div className="space-y-2 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full transition-all duration-500', passwordStrength.color)}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-white/60 font-medium min-w-15">
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                    <div className={cn('flex items-center gap-1', formData.password.length >= 8 ? 'text-green-400' : 'text-white/40')}>
                      <CheckCircle2 className="h-3 w-3" />
                      <span>8+ chars</span>
                    </div>
                    <div className={cn('flex items-center gap-1', /[A-Z]/.test(formData.password) ? 'text-green-400' : 'text-white/40')}>
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Uppercase</span>
                    </div>
                    <div className={cn('flex items-center gap-1', /[a-z]/.test(formData.password) ? 'text-green-400' : 'text-white/40')}>
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Lowercase</span>
                    </div>
                    <div className={cn('flex items-center gap-1', /[0-9]/.test(formData.password) ? 'text-green-400' : 'text-white/40')}>
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Number</span>
                    </div>
                  </div>
                </div>
              )}

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
                'w-full h-12 rounded-xl mt-6',
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
                {isLoading ? 'Creating Account...' : 'Create Account'}
                {!isLoading && (
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                )}
              </span>
            </Button>

            {/* Sign In Link */}
            <div className="text-center pt-4 border-t border-white/10">
              <p className="text-sm text-white/60">
                Already have an account?{' '}
                <Link
                  href="/sign-in"
                  className="text-[#00d4b8] hover:text-[#00e5cc] font-medium transition-colors duration-200 hover:underline"
                >
                  Sign in
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
