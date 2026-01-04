/**
 * Database Cleanup Script
 *
 * Drops conflicting backend tables to allow Better Auth schema
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

async function cleanupDatabase() {
  const sql = postgres(DATABASE_URL, {
    max: 1,
    onnotice: () => {} // Suppress notices
  })

  try {
    console.log('🧹 Cleaning up conflicting database tables...\n')

    // Drop conflicting tables
    await sql.unsafe('DROP TABLE IF EXISTS task CASCADE')
    console.log('✓ Dropped task table')

    await sql.unsafe('DROP TABLE IF EXISTS tasks CASCADE')
    console.log('✓ Dropped tasks table')

    await sql.unsafe('DROP TABLE IF EXISTS "user" CASCADE')
    console.log('✓ Dropped user table')

    await sql.unsafe('DROP TABLE IF EXISTS alembic_version CASCADE')
    console.log('✓ Dropped alembic_version table')

    // List remaining tables
    const tables = await sql`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `

    console.log('\n📋 Remaining tables:')
    if (tables.length === 0) {
      console.log('  (none - ready for Drizzle push)')
    } else {
      tables.forEach(t => console.log(`  - ${t.tablename}`))
    }

    console.log('\n✅ Cleanup complete!')
    console.log('\nNext steps:')
    console.log('  1. Run: npx drizzle-kit push')
    console.log('  2. Start dev server: npm run dev')
    console.log('  3. Test sign-up: http://localhost:3000/sign-up')

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error.message)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

cleanupDatabase()
