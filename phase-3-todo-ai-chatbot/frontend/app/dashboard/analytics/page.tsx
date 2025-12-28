/**
 * Analytics Dashboard Page - Phase 7 (US5)
 *
 * Comprehensive analytics view featuring:
 * - GitHub-style completion heatmap
 * - Date range filtering
 * - Recurring task statistics
 * - Tag analytics
 * - Summary metrics
 */

import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { fetchTasks } from '@/actions/tasks'
import { AnalyticsDashboard } from '@/components/dashboard/analytics-dashboard'
import { redirect } from 'next/navigation'
import { filterOutPatterns } from '@/lib/task-utils'

export const metadata = {
  title: 'Analytics | TaskFlow',
  description: 'View your productivity analytics and task completion patterns',
}

export default async function AnalyticsPage() {
  // Get session for user validation
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    redirect('/sign-in')
  }

  // Fetch all tasks for analytics (use max allowed by backend)
  const tasksResult = await fetchTasks({
    limit: 100,  // Max allowed by backend
    sort_by: 'created',
    sort_direction: 'desc'
  })

  // Filter out recurring task patterns - analytics should only count instances
  const tasks = filterOutPatterns(tasksResult.tasks || [])

  return <AnalyticsDashboard tasks={tasks} userName={session.user.name || 'User'} />
}
