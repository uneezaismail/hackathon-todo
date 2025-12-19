/**
 * Drizzle Schema for Better Auth Tables
 *
 * This schema defines ONLY authentication-related tables used by Better Auth.
 * Task data is NOT stored here - tasks are fetched from the FastAPI backend.
 *
 * Tables:
 * - user: User accounts with email, name, and hashed password
 * - session: Active user sessions with JWT tokens
 * - account: OAuth provider accounts (for future social auth)
 */

import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core'

/**
 * User table - stores user account information
 * Used by Better Auth for authentication
 */
export const user = pgTable('user', {
  id: text('id').primaryKey(), // Better Auth uses string IDs
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

/**
 * Session table - stores active user sessions with JWT tokens
 * Used by Better Auth for session management
 */
export const session = pgTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

/**
 * Account table - stores both OAuth provider accounts AND email/password credentials
 * Used by Better Auth for authentication
 *
 * For email/password auth: password field is populated (hashed)
 * For OAuth providers: password field is null, provider tokens are populated
 */
export const account = pgTable('account', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  password: text('password'), // Hashed password for email/password auth (nullable for OAuth)
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Export types for TypeScript
export type User = typeof user.$inferSelect
export type NewUser = typeof user.$inferInsert
export type Session = typeof session.$inferSelect
export type NewSession = typeof session.$inferInsert
export type Account = typeof account.$inferSelect
export type NewAccount = typeof account.$inferInsert
