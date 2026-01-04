/**
 * Verify Database Schema
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

async function verifySchema() {
  const sql = postgres(DATABASE_URL, {
    max: 1,
    onnotice: () => {} // Suppress notices
  })

  try {
    console.log('🔍 Verifying database schema...\n')

    // List all tables
    const tables = await sql`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `

    console.log('📋 Tables in database:')
    tables.forEach(t => console.log(`  ✓ ${t.tablename}`))

    // Check user table structure
    console.log('\n👤 User table structure:')
    const userColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'user'
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `

    if (userColumns.length === 0) {
      console.log('  ❌ User table not found!')
    } else {
      userColumns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`)
      })
    }

    // Check session table
    console.log('\n🔐 Session table structure:')
    const sessionColumns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'session'
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `

    sessionColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`)
    })

    // Check account table
    console.log('\n🔑 Account table structure:')
    const accountColumns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'account'
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `

    accountColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`)
    })

    console.log('\n✅ Schema verification complete!')

  } catch (error) {
    console.error('\n❌ Error during verification:', error.message)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

verifySchema()
