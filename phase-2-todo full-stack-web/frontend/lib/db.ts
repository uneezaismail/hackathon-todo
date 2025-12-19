/**
 * Drizzle Database Client
 *
 * This file creates the Drizzle ORM client instance connected to Neon PostgreSQL.
 * This client is ONLY used for Better Auth tables (user, session, account).
 *
 * IMPORTANT: Task data is NOT queried through this client.
 * All task operations go through Server Actions that call the FastAPI backend.
 *
 * NOTE: Using Neon Serverless Pool for Better Auth compatibility
 */

import { drizzle } from 'drizzle-orm/neon-serverless'
import { Pool } from '@neondatabase/serverless'
import * as schema from '@/db/schema'

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL environment variable is required for Drizzle client'
  )
}

// Create Neon connection pool for serverless environments
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

// Create Drizzle client with schema
export const db = drizzle(pool, { schema })
