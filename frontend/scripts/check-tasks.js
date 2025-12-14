import postgres from 'postgres'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env.local') })

const DATABASE_URL = process.env.DATABASE_URL

async function checkTasks() {
  const sql = postgres(DATABASE_URL, { max: 1, onnotice: () => {} })

  try {
    console.log('📊 Checking tasks in database...\n')

    // Get all tasks
    const tasks = await sql`
      SELECT id, user_id, title, description, completed, created_at, updated_at
      FROM tasks
      ORDER BY created_at DESC
      LIMIT 10
    `

    console.log(`Total tasks found: ${tasks.length}\n`)

    if (tasks.length === 0) {
      console.log('❌ No tasks found in database')
      console.log('\nPossible reasons:')
      console.log('  1. Tasks were not created successfully')
      console.log('  2. Tasks were created in a different table')
      console.log('  3. Tasks were deleted')
    } else {
      console.log('✅ Tasks in database:')
      console.log('----------------------------------------')

      tasks.forEach((task, index) => {
        console.log(`\n${index + 1}. Task ID: ${task.id}`)
        console.log(`   User ID: ${task.user_id}`)
        console.log(`   Title: ${task.title}`)
        console.log(`   Description: ${task.description || '(none)'}`)
        console.log(`   Completed: ${task.completed}`)
        console.log(`   Created: ${task.created_at}`)
      })

      console.log('\n----------------------------------------')

      // Get unique user_ids
      const userIds = [...new Set(tasks.map(t => t.user_id))]
      console.log(`\n👤 Unique user IDs found: ${userIds.length}`)
      userIds.forEach((uid, i) => {
        const count = tasks.filter(t => t.user_id === uid).length
        console.log(`   ${i + 1}. ${uid} (${count} tasks)`)
      })

      // Get user from auth tables
      console.log('\n👥 Checking Better Auth users...')
      const users = await sql`
        SELECT id, name, email, created_at
        FROM "user"
        ORDER BY created_at DESC
        LIMIT 5
      `

      console.log(`\nTotal users in Better Auth: ${users.length}`)
      users.forEach((user, i) => {
        console.log(`   ${i + 1}. ID: ${user.id}`)
        console.log(`       Name: ${user.name || '(no name)'}`)
        console.log(`       Email: ${user.email}`)
      })

      // Check if user IDs match
      console.log('\n🔍 User ID Match Check:')
      const authUserIds = users.map(u => u.id)
      const taskUserIds = userIds

      taskUserIds.forEach(taskUid => {
        const hasMatch = authUserIds.includes(taskUid)
        const status = hasMatch ? '✅ MATCH' : '❌ NO MATCH'
        console.log(`   Task user_id "${taskUid}": ${status}`)
      })
    }

    console.log('\n✨ Check complete!')

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error)
  } finally {
    await sql.end()
  }
}

checkTasks()
