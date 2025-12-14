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
import { toast } from 'sonner'
import { signIn } from '@/lib/auth-client'
import { signInSchema, type SignInFormData } from '@/lib/validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function SignInForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof SignInFormData, string>>>({})
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
    } catch (error: any) {
      const errorMessage = error.errors?.[0]?.message || 'Invalid value'
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
    } catch (error: any) {
      const validationErrors: Partial<Record<keyof SignInFormData, string>> = {}
      error.errors?.forEach((err: any) => {
        const field = err.path[0] as keyof SignInFormData
        validationErrors[field] = err.message
      })
      setErrors(validationErrors)
      return
    }

    // Submit form
    setIsLoading(true)

    try {
      const result = await signIn.email({
        email: formData.email,
        password: formData.password,
      })

      if (result.error) {
        toast.error(result.error.message || 'Invalid email or password. Please try again.')
        setIsLoading(false)
        return
      }

      // Success - redirect to callback URL or dashboard
      toast.success('Signed in successfully!')
      const callbackUrl = getCallbackUrl()
      router.push(callbackUrl)
    } catch (error: any) {
      console.error('Sign-in error:', error)
      toast.error(error.message || 'An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
        <CardDescription>Welcome back! Sign in to your account</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={handleChange('email')}
              onBlur={handleBlur('email')}
              disabled={isLoading}
              className={errors.email ? 'border-red-500' : ''}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              autoComplete="email"
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-red-500">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange('password')}
              onBlur={handleBlur('password')}
              disabled={isLoading}
              className={errors.password ? 'border-red-500' : ''}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              autoComplete="current-password"
            />
            {errors.password && (
              <p id="password-error" className="text-sm text-red-500">
                {errors.password}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>

          <p className="text-sm text-center text-muted-foreground">
            Don&apos;t have an account?{' '}
            <a href="/sign-up" className="text-primary hover:underline">
              Create account
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
