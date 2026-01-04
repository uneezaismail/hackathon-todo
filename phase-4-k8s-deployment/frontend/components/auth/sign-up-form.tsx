/**
 * Sign-Up Form Component (Client Component)
 * Modern Split-Screen Design 2025
 *
 * Implements user registration with:
 * - Name, email, and password fields
 * - Zod validation with real-time error display
 * - Better Auth integration for sign-up
 * - Loading states during submission
 * - Error handling with toast notifications
 * - Automatic redirect to /dashboard on success
 * - Modern split-screen design with purple theme
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
import { motion } from 'framer-motion'
import { signUp } from '@/lib/auth-client'
import { signUpSchema, type SignUpFormData } from '@/lib/validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { User, Mail, Lock, ArrowRight, AlertCircle, Sparkles, CheckCircle2, Zap, Shield, Clock } from 'lucide-react'
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
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Branding & Design (Hidden on mobile, shown on lg+) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700  to-purple-900">
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
              <span>Start Your Journey</span>
            </div>

            {/* Main heading */}
            <h1 className="text-5xl xl:text-6xl font-bold mb-6 leading-tight">
              Transform How You
              <span className="block mt-2 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Manage Tasks
              </span>
            </h1>

            <p className="text-xl text-purple-100 mb-12 leading-relaxed max-w-md">
              Join thousands of users who organize their work with AI-powered intelligence.
            </p>

            {/* Benefits list */}
            <div className="space-y-5">
              {[
                { icon: Zap, text: 'Get started in 30 seconds' },
                { icon: Shield, text: 'Enterprise-grade security' },
                { icon: Clock, text: 'Save 2+ hours per day' },
                { icon: CheckCircle2, text: 'No credit card required' }
              ].map((item, index) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-lg text-purple-100">{item.text}</span>
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
              Create Account
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Start managing your tasks efficiently
            </p>
          </div>

          {/* Form Card */}
          <div className="space-y-6">
            {/* Desktop header */}
            <div className="hidden lg:block">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Create Account
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Get started with your free account
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
                      Registration Failed
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-300/80 mt-1">
                      {authError}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-900 dark:text-white">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
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
                      'bg-gray-50 dark:bg-[#1a1a2e] border-2 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500',
                      'transition-all duration-300',
                      'border-gray-200 dark:border-[#2a2a3e]',
                      'focus:bg-white dark:focus:bg-[#1a1a2e] focus:border-purple-500 dark:focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10',
                      errors.name
                        ? 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500/10'
                        : ''
                    )}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                  />
                </div>
                {errors.name && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    id="name-error"
                    className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{errors.name}</span>
                  </motion.div>
                )}
              </div>

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
                    placeholder="Create a secure password"
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
                  />
                </div>

                {/* Password Strength Indicator */}
                {passwordStrength && !errors.password && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                          className={cn('h-full transition-all duration-500', passwordStrength.color)}
                        />
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400 font-medium min-w-[60px] text-right">
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className={cn('flex items-center gap-1.5', formData.password.length >= 8 ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500')}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>8+ characters</span>
                      </div>
                      <div className={cn('flex items-center gap-1.5', /[A-Z]/.test(formData.password) ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500')}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Uppercase</span>
                      </div>
                      <div className={cn('flex items-center gap-1.5', /[a-z]/.test(formData.password) ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500')}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Lowercase</span>
                      </div>
                      <div className={cn('flex items-center gap-1.5', /[0-9]/.test(formData.password) ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500')}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Number</span>
                      </div>
                    </div>
                  </motion.div>
                )}

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
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </span>
              </Button>

              {/* Sign In Link */}
              <div className="text-center pt-6 border-t border-gray-200 dark:border-[#2a2a3e]">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Already have an account?{' '}
                  <Link
                    href="/sign-in"
                    className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold transition-colors duration-200 hover:underline"
                  >
                    Sign in
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
