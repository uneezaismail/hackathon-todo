/**
 * Better Auth Client Configuration
 *
 * This file creates the Better Auth client instance for use in Client Components.
 * Provides hooks and methods for authentication operations.
 *
 * JWT tokens are generated via /api/auth/token route (HS256, compatible with FastAPI backend)
 */

import { createAuthClient } from 'better-auth/react'

// Auto-detect URL based on environment
const getBaseURL = (): string => {
  // Priority 1: Explicit environment variable
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Priority 2: Vercel's automatic URL (production)
  if (typeof process !== "undefined" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Priority 3: Browser-side: use current location
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.host}`;
  }

  // Priority 4: Fallback to localhost for development
  return "http://localhost:3000";
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
})

// Export commonly used hooks and methods
export const {
  useSession,
  signIn,
  signUp,
  signOut,
  getSession,
} = authClient

/**
 * Get JWT token for backend API authentication.
 *
 * Calls /api/auth/token which generates an HS256 JWT using BETTER_AUTH_SECRET.
 * This token is compatible with the FastAPI backend's jwt.py verification.
 *
 * @returns Promise<{data?: {token: string}, error?: any}>
 */
export async function getToken(): Promise<{ data?: { token: string }; error?: unknown }> {
  try {
    const baseUrl = getBaseURL();
    const response = await fetch(`${baseUrl}/api/auth/token`, {
      method: 'GET',
      credentials: 'include', // Include cookies for session
    });

    if (!response.ok) {
      const error = await response.json();
      return { error };
    }

    const result = await response.json();
    return { data: result.data };
  } catch (error) {
    return { error };
  }
}
