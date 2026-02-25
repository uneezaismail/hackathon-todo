/**
 * Create Task Table Migration
 *
 * This script creates the task table for the FastAPI backend in Neon PostgreSQL.
 * The task table was dropped during frontend database cleanup and needs to be recreated.
 */

import postgres from 'postgres'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable not set')
  process.exit(1)
}

async function createTaskTable() {
  const sql = postgres(DATABASE_URL, {
    max: 1,
    onnotice: () => {} // Suppress notices
  })

  try {
    console.log('🔨 Creating task table for FastAPI backend...\n')

    // Create task table directly
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS task (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `)

    console.log('✓ Created task table')

    // Create indexes
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_task_user_id ON task(user_id)`)
    console.log('✓ Created index on user_id')

    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_task_created_at ON task(created_at DESC)`)
    console.log('✓ Created index on created_at')

    // Display table structure
    const columns = await sql`
      SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'task'
      ORDER BY ordinal_position
    `

    console.log('\n📋 Task table structure:')
    columns.forEach(col => {
      const length = col.character_maximum_length ? `(${col.character_maximum_length})` : ''
      const nullable = col.is_nullable === 'YES' ? '' : ' NOT NULL'
      const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : ''
      console.log(`  - ${col.column_name}: ${col.data_type}${length}${nullable}${defaultVal}`)
    })

    console.log('\n✅ Task table created successfully!')
    console.log('\n📊 Verifying tables in database...')

    // List all tables
    const tables = await sql`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `

    console.log('\n📋 Current tables:')
    tables.forEach(t => console.log(`  - ${t.tablename}`))

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

createTaskTable()
