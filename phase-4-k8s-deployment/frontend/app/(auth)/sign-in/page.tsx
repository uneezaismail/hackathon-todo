/**
 * Sign-In Page (Server Component)
 *
 * Public route for user authentication.
 * Renders the SignInForm client component with modern split-screen design.
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
  return <SignInForm />
}
