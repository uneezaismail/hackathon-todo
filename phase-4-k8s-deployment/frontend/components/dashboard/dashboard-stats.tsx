/**
 * Dashboard Stats - Server Component
 *
 * Fetches real task statistics from backend API
 */

import { StatCard } from './stat-card'
import { fetchTasks } from '@/actions/tasks'

export async function DashboardStats() {
  // Fetch all tasks to calculate statistics (backend max is 100)
  const result = await fetchTasks({
    limit: 100,
  })

  const tasks = result.tasks || []

  // Calculate statistics
  const total = tasks.length
  const completed = tasks.filter(task => task.completed).length
  const pending = tasks.filter(task => !task.completed).length

  // Calculate overdue tasks (pending tasks with due_date in the past)
  const now = new Date()
  const overdue = tasks.filter(task => {
    if (task.completed) return false
    if (!task.due_date) return false
    return new Date(task.due_date) < now
  }).length

  // Calculate completion rate
  const completionRate = total > 0
    ? Math.round((completed / total) * 100)
    : 0

  // Calculate trend (compare with last calculation - placeholder for now)
  const completionTrend = completionRate > 50 ? 12 : -8

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Tasks"
        value={total}
        iconName="ListTodo"
        description="All tasks in system"
      />
      <StatCard
        title="Completed"
        value={completed}
        iconName="CheckCircle2"
        description={`${completionRate}% completion rate`}
        trend={{
          value: Math.abs(completionTrend),
          isPositive: completionTrend > 0
        }}
      />
      <StatCard
        title="In Progress"
        value={pending}
        iconName="Clock"
        description="Currently active"
      />
      <StatCard
        title="Overdue"
        value={overdue}
        iconName="AlertCircle"
        description="Needs attention"
        trend={overdue > 0 ? {
          value: overdue,
          isPositive: false
        } : undefined}
      />
    </div>
  )
}
