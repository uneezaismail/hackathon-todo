/**
 * Sign-Up Page (Server Component)
 *
 * Public route for user registration.
 * Renders the SignUpForm client component within a centered layout.
 *
 * @page T051: Sign-up page
 */

import SignUpForm from '@/components/auth/sign-up-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Up - Todo App',
  description: 'Create a new account to start managing your tasks',
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <SignUpForm />
    </div>
  )
}
