/**
 * Sign-In Page (Server Component)
 *
 * Public route for user authentication.
 * Renders the SignInForm client component within a centered layout.
 *
 * @page T052: Sign-in page
 */

import SignInForm from '@/components/auth/sign-in-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In - Todo App',
  description: 'Sign in to your account to manage your tasks',
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <SignInForm />
    </div>
  )
}
