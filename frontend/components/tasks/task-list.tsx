/**
 * Task List Component (T077)
 *
 * Server Component that fetches and displays all tasks
 * Delegates rendering to TaskItem client components
 */

import { fetchTasks } from '@/actions/tasks'
import { TaskItem } from './task-item'
import { EmptyState } from './empty-state'

interface TaskListProps {
  status?: string
  limit?: number
  offset?: number
}

/**
 * T077: Task List Server Component
 * Fetches tasks from the server and renders them
 */
export async function TaskList({ status, limit, offset }: TaskListProps) {
  // Fetch tasks using server action
  const result = await fetchTasks({ status, limit, offset })

  // Handle error state
  if (result.error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{result.error}</p>
        <p className="text-sm text-muted-foreground">
          Please try refreshing the page or contact support if the problem persists.
        </p>
      </div>
    )
  }

  const tasks = result.tasks || []

  // Handle empty state
  if (tasks.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="space-y-4" role="list">
      {tasks.map((task) => (
        <div key={task.id} role="listitem">
          <TaskItem task={task} />
        </div>
      ))}
    </div>
  )
}
