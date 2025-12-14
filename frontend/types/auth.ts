/**
 * Authentication Type Definitions
 *
 * These types define the shape of authentication-related data structures
 * used throughout the application.
 */

import type { User, Session } from '@/db/schema'

/**
 * Sign-up form data
 */
export interface SignUpFormData {
  name: string
  email: string
  password: string
}

/**
 * Sign-in form data
 */
export interface SignInFormData {
  email: string
  password: string
}

/**
 * Better Auth session data
 * Extends the base Session with user information
 */
export interface AuthSession {
  user: User
  session: Session
}

/**
 * JWT token payload structure
 * Used for server-side token validation
 */
export interface JWTPayload {
  sub: string // User ID
  email: string
  name: string
  iat: number // Issued at
  exp: number // Expiration
}

/**
 * Authentication error types
 */
export type AuthError =
  | 'INVALID_CREDENTIALS'
  | 'USER_ALREADY_EXISTS'
  | 'SESSION_EXPIRED'
  | 'INVALID_TOKEN'
  | 'UNAUTHORIZED'
  | 'UNKNOWN_ERROR'

/**
 * Authentication error response
 */
export interface AuthErrorResponse {
  error: AuthError
  message: string
}

/**
 * User profile data (subset of User for display)
 */
export interface UserProfile {
  id: string
  name: string
  email: string
  image?: string | null
}
