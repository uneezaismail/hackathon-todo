/**
 * Check Account Table Schema
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

async function checkAccountSchema() {
  const sql = postgres(DATABASE_URL, {
    max: 1,
    onnotice: () => {} // Suppress notices
  })

  try {
    console.log('🔍 Checking account table structure...\n')

    // Check account table structure
    const accountColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'account'
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `

    console.log('📋 Account table columns:')
    accountColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`)
    })

    const hasPassword = accountColumns.some(col => col.column_name === 'password')
    console.log(`\n✅ Password column exists: ${hasPassword}`)

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

checkAccountSchema()
