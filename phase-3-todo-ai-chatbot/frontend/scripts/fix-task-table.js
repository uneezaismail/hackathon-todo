/**
 * Fix Task Table Migration
 *
 * Drops the incorrect 'task' table and creates the correct 'tasks' table
 * matching the backend SQLModel schema:
 * - Table name: 'tasks' (plural)
 * - ID type: UUID (not SERIAL)
 * - user_id: TEXT
 */

import postgres from 'postgres'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable not set')
  process.exit(1)
}

async function fixTaskTable() {
  const sql = postgres(DATABASE_URL, {
    max: 1,
    onnotice: () => {} // Suppress notices
  })

  try {
    console.log('🔨 Fixing task table schema to match backend model...\n')

    // Step 1: Drop the incorrectly named 'task' table if it exists
    console.log('📋 Dropping incorrect "task" table (if exists)...')
    await sql.unsafe(`DROP TABLE IF EXISTS task CASCADE`)
    console.log('✓ Dropped "task" table\n')

    // Step 2: Create the correct 'tasks' table with UUID id
    console.log('📋 Creating correct "tasks" table with UUID id...')
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `)
    console.log('✓ Created tasks table with UUID id')

    // Step 3: Create indexes matching backend model
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS ix_tasks_user_id ON tasks(user_id)`)
    console.log('✓ Created index: ix_tasks_user_id')

    await sql.unsafe(`CREATE INDEX IF NOT EXISTS ix_tasks_created_at ON tasks(created_at DESC)`)
    console.log('✓ Created index: ix_tasks_created_at')

    await sql.unsafe(`CREATE INDEX IF NOT EXISTS ix_tasks_user_id_completed ON tasks(user_id, completed)`)
    console.log('✓ Created index: ix_tasks_user_id_completed')

    // Step 4: Display table structure
    const columns = await sql`
      SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'tasks'
      ORDER BY ordinal_position
    `

    console.log('\n📋 Tasks table structure:')
    columns.forEach(col => {
      const length = col.character_maximum_length ? `(${col.character_maximum_length})` : ''
      const nullable = col.is_nullable === 'YES' ? '' : ' NOT NULL'
      const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : ''
      console.log(`  - ${col.column_name}: ${col.data_type}${length}${nullable}${defaultVal}`)
    })

    console.log('\n✅ Tasks table fixed successfully!')
    console.log('\n📊 Verifying all tables in database...')

    // Step 5: List all tables
    const tables = await sql`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `

    console.log('\n📋 All tables in database:')
    tables.forEach(t => console.log(`  - ${t.tablename}`))

    console.log('\n✅ Database schema now matches backend model!')
    console.log('\nBackend expects:')
    console.log('  - Table: tasks (plural) ✓')
    console.log('  - ID: UUID ✓')
    console.log('  - user_id: TEXT ✓')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

fixTaskTable()
