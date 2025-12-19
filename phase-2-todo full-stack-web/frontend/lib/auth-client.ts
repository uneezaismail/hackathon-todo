/**
 * Better Auth Client Configuration
 *
 * This file creates the Better Auth client instance for use in Client Components.
 * Provides hooks and methods for authentication operations.
 */

import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
})

// Export commonly used hooks and methods
export const {
  useSession,
  signIn,
  signUp,
  signOut,
  getSession,
} = authClient
