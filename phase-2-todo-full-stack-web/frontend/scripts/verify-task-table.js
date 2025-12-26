import postgres from 'postgres'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env.local') })

const DATABASE_URL = process.env.DATABASE_URL

async function verify() {
  const sql = postgres(DATABASE_URL, { max: 1, onnotice: () => {} })

  try {
    const tables = await sql`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `

    console.log('📋 All tables:')
    tables.forEach(t => console.log(`  - ${t.tablename}`))

    const tasksExists = tables.some(t => t.tablename === 'tasks')

    if (tasksExists) {
      const columns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'tasks'
        ORDER BY ordinal_position
      `

      console.log('\n✅ Tasks table structure:')
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`)
      })
    } else {
      console.log('\n❌ Tasks table does NOT exist')
    }

  } finally {
    await sql.end()
  }
}

verify()
