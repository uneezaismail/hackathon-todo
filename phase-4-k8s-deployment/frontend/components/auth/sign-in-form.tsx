/**
 * Sign-In Form Component (Client Component)
 * Modern Split-Screen Design 2025
 *
 * Implements user authentication with:
 * - Email and password fields
 * - Zod validation with real-time error display
 * - Better Auth integration for sign-in
 * - Loading states during submission
 * - Error handling with toast notifications
 * - Automatic redirect to /dashboard on success
 * - Modern split-screen design with purple theme
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
import { motion } from 'framer-motion'
import { signIn } from '@/lib/auth-client'
import { signInSchema, type SignInFormData } from '@/lib/validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { Mail, Lock, ArrowRight, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react'
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
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Branding & Design (Hidden on mobile, shown on lg+) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-
     purple-900">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(168,85,247,0.3),rgba(139,92,246,0))]" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }} />
        </div>

        {/* Floating orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 left-20 w-72 h-72 bg-purple-400/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-20 right-20 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl"
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-4 py-2 text-sm font-medium border border-white/20 mb-6">
              <Sparkles className="h-4 w-4" />
              <span>AI-Powered Productivity</span>
            </div>

            {/* Main heading */}
            <h1 className="text-5xl xl:text-6xl font-bold mb-6 leading-tight">
              Welcome Back to Your
              <span className="block mt-2 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Productivity Hub
              </span>
            </h1>

            <p className="text-xl text-purple-100 mb-12 leading-relaxed max-w-md">
              Continue managing your tasks with AI-powered insights and effortless organization.
            </p>

            {/* Features list */}
            <div className="space-y-4">
              {[
                'AI-powered task suggestions',
                'Smart prioritization & scheduling',
                'Collaborative workspace',
                'Real-time sync across devices'
              ].map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-purple-100">{feature}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 bg-white dark:bg-[#0A0A1F]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Mobile header (only shown on mobile) */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Sign in to continue to your dashboard
            </p>
          </div>

          {/* Form Card */}
          <div className="space-y-6">
            {/* Desktop header */}
            <div className="hidden lg:block">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Sign In
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Enter your credentials to access your account
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Authentication Error Message */}
              {authError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className={cn(
                    'flex items-start gap-3 p-4 rounded-xl',
                    'bg-red-50 dark:bg-red-500/10 border-2 border-red-200 dark:border-red-500/30'
                  )}
                  role="alert"
                >
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800 dark:text-red-400">
                      Authentication Failed
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-300/80 mt-1">
                      {authError}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-900 dark:text-white">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
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
                      'bg-gray-50 dark:bg-[#1a1a2e] border-2 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500',
                      'transition-all duration-300',
                      'border-gray-200 dark:border-[#2a2a3e]',
                      'focus:bg-white dark:focus:bg-[#1a1a2e] focus:border-purple-500 dark:focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10',
                      errors.email
                        ? 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500/10'
                        : ''
                    )}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    id="email-error"
                    className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{errors.email}</span>
                  </motion.div>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-900 dark:text-white">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 pointer-events-none z-10" />
                  <PasswordInput
                    id="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange('password')}
                    onBlur={handleBlur('password')}
                    disabled={isLoading}
                    className={cn(
                      'pl-12 h-12 rounded-xl',
                      'bg-gray-50 dark:bg-[#1a1a2e] border-2 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500',
                      'transition-all duration-300',
                      'border-gray-200 dark:border-[#2a2a3e]',
                      'focus:bg-white dark:focus:bg-[#1a1a2e] focus:border-purple-500 dark:focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10',
                      errors.password
                        ? 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500/10'
                        : ''
                    )}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    autoComplete="current-password"
                  />
                </div>
                {errors.password && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    id="password-error"
                    className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{errors.password}</span>
                  </motion.div>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className={cn(
                  'w-full h-12 rounded-xl mt-2',
                  'bg-purple-600 text-white font-semibold',
                  'hover:bg-purple-700',
                  'shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30',


                  'transition-all duration-300',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'active:scale-[0.98]',
                  'group'
                )}
              >
                <span className="flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      Signing In...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </span>
              </Button>

              {/* Sign Up Link */}
              <div className="text-center pt-6 border-t border-gray-200 dark:border-[#2a2a3e]">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Don&apos;t have an account?{' '}
                  <Link
                    href="/sign-up"
                    className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold transition-colors duration-200 hover:underline"
                  >
                    Create account
                  </Link>
                </p>
              </div>
            </form>
          </div>

          {/* Back to Home Link */}
          <div className="text-center mt-8">
            <Link
              href="/"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200 inline-flex items-center gap-1"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              Back to home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
