/**
 * Authentication Server Actions
 *
 * Server-side actions for authentication operations:
 * - Logout action (wrapper around Better Auth)
 *
 * Note: Better Auth handles most auth operations client-side,
 * but we provide server actions for consistency and future flexibility.
 *
 * @task T094: Implement logout Server Action
 */

'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

/**
 * Logout Server Action
 *
 * Clears the Better Auth session cookie and redirects to landing page.
 * This is a server-side complement to the client-side signOut.
 *
 * @task T094: Implement logout Server Action
 */
export async function logout() {
  try {
    // Clear Better Auth session cookie
    const cookieStore = await cookies()

    // Better Auth uses cookies with the prefix "better-auth"
    // We need to clear the session token cookie
    const sessionCookieName = 'better-auth.session_token'

    cookieStore.delete(sessionCookieName)

    // Also clear any other Better Auth cookies
    const allCookies = cookieStore.getAll()
    allCookies.forEach(cookie => {
      if (cookie.name.startsWith('better-auth')) {
        cookieStore.delete(cookie.name)
      }
    })
  } catch (error) {
    console.error('Error clearing session cookies:', error)
    // Continue with redirect even if cookie clearing fails
  }

  // Redirect to landing page
  redirect('/')
}

/**
 * Get current session (server-side)
 *
 * Helper function to get the current user session on the server.
 * This is useful for Server Components that need to check auth state.
 */
export async function getServerSession() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('better-auth.session_token')

    if (!sessionToken) {
      return null
    }

    // In a real implementation, you would validate the session token here
    // For now, we just check if it exists
    return { token: sessionToken.value }
  } catch (error) {
    console.error('Error getting server session:', error)
    return null
  }
}

/**
 * Check if user is authenticated (server-side)
 *
 * Helper function for Server Components to check auth state.
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getServerSession()
  return session !== null
}
