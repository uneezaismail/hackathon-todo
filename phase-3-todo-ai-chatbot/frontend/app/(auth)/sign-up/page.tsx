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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Futuristic background matching landing page */}
      <div className="absolute inset-0 bg-linear-to-br from-[#0f1729] via-[#131929] to-[#1a2332]" />

      {/* Diagonal lines pattern */}
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="diagonal-lines-auth"
              patternUnits="userSpaceOnUse"
              width="60"
              height="60"
              patternTransform="rotate(-45)"
            >
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="60"
                stroke="#00d4b8"
                strokeWidth="0.5"
                opacity="0.4"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diagonal-lines-auth)" />
        </svg>
      </div>

      {/* Ambient glows */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-[#00d4b8]/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#8b5cf6]/10 rounded-full blur-[100px] animate-pulse [animation-delay:2s]" />

      {/* Form container */}
      <div className="relative z-10 w-full">
        <SignUpForm />
      </div>
    </div>
  )
}
