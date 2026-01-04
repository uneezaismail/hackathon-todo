/**
 * Sign-Up Page (Server Component)
 *
 * Public route for user registration.
 * Renders the SignUpForm client component with modern split-screen design.
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
  return <SignUpForm />
}
