/**
 * Enhanced Dashboard Home Component - Server Component
 *
 * Production-ready dashboard with:
 * - Real-time statistics
 * - Completion trends chart (7 days)
 * - Today's focus (actionable tasks)
 * - Upcoming deadlines widget
 * - Productivity metrics (streaks, rates)
 * - Priority distribution chart
 * - Skeleton loaders
 * - Error boundaries
 * - Best practices
 */

import * as React from 'react'
import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { fetchTasks } from '@/actions/tasks'
import { filterOutPatterns } from '@/lib/task-utils'
import { DashboardStats } from './dashboard-stats'
import { CompletionTrendsChart } from './completion-trends-chart'
import { TodaysFocus } from './todays-focus'
import { UpcomingDeadlines } from './upcoming-deadlines'
import { ProductivityMetrics } from './productivity-metrics'
import { PriorityDistribution } from './priority-distribution'
import {
  DashboardStatsSkeleton,
  ChartCardSkeleton,
  TodaysFocusSkeleton,
  UpcomingDeadlinesSkeleton,
  ProductivityMetricsSkeleton,
  PriorityDistributionSkeleton
} from './dashboard-skeleton'

export async function DashboardHomeEnhanced() {
  // Get session for welcome message
  const session = await auth.api.getSession({
    headers: await headers()
  })

  // Fetch all tasks for analytics (limit to 100 for performance)
  const tasksResult = await fetchTasks({
    limit: 100,
    sort_by: 'created',
    sort_direction: 'desc'
  })

  // Todoist-style: Filter out only legacy patterns (if any)
  // New recurring tasks are single tasks with shifting due_date
  const tasks = filterOutPatterns(tasksResult.tasks || [])

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground">
          Welcome back, {session?.user?.name?.split(' ')[0] || 'User'}! 👋
        </h1>
        <p className="text-muted-foreground text-lg">
          Here&apos;s your productivity overview for today
        </p>
      </div>

      {/* Stats Grid */}
      <Suspense fallback={<DashboardStatsSkeleton />}>
        <DashboardStats />
      </Suspense>

      {/* Two Column Layout - Chart and Today's Focus */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<ChartCardSkeleton />}>
          <CompletionTrendsChart tasks={tasks} days={7} />
        </Suspense>

        <Suspense fallback={<TodaysFocusSkeleton />}>
          <TodaysFocus tasks={tasks} />
        </Suspense>
      </div>

      {/* Three Column Layout - Deadlines, Metrics, Priority */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Suspense fallback={<UpcomingDeadlinesSkeleton />}>
          <UpcomingDeadlines tasks={tasks} limit={5} />
        </Suspense>

        <Suspense fallback={<ProductivityMetricsSkeleton />}>
          <ProductivityMetrics tasks={tasks} />
        </Suspense>

        <Suspense fallback={<PriorityDistributionSkeleton />}>
          <PriorityDistribution tasks={tasks} />
        </Suspense>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <a
          href="/dashboard/tasks?status=pending&priority=High"
          className="flex-1 p-4 rounded-xl border-2 bg-card backdrop-blur-md transition-all duration-200 group border-red-500/20 hover:bg-red-50 hover:border-red-500/40 dark:border-red-400/20 dark:bg-[#131929]/40 dark:hover:bg-red-400/5 dark:hover:border-red-400/40 dark:hover:shadow-[0_0_20px_rgba(239,68,68,0.1)]"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold mb-1 text-red-600 dark:text-red-400">High Priority Tasks</h4>
              <p className="text-xs text-muted-foreground">Focus on what matters most</p>
            </div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {tasks.filter(t => t.priority === 'High' && !t.completed).length}
            </div>
          </div>
        </a>

        <a
          href="/dashboard/tasks?status=pending"
          className="flex-1 p-4 rounded-xl border-2 bg-card backdrop-blur-md transition-all duration-200 group border-teal-500/20 hover:bg-teal-50 hover:border-teal-500/40 dark:border-[#00d4b8]/20 dark:bg-[#131929]/40 dark:hover:bg-[#00d4b8]/5 dark:hover:border-[#00d4b8]/40 dark:hover:shadow-[0_0_20px_rgba(0,212,184,0.1)]"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold mb-1 text-teal-600 dark:text-[#00d4b8]">All Active Tasks</h4>
              <p className="text-xs text-muted-foreground">View your complete task list</p>
            </div>
            <div className="text-2xl font-bold text-teal-600 dark:text-[#00d4b8]">
              {tasks.filter(t => !t.completed).length}
            </div>
          </div>
        </a>

        <a
          href="/dashboard/tasks?status=completed"
          className="flex-1 p-4 rounded-xl border-2 bg-card backdrop-blur-md transition-all duration-200 group border-green-500/20 hover:bg-green-50 hover:border-green-500/40 dark:border-green-400/20 dark:bg-[#131929]/40 dark:hover:bg-green-400/5 dark:hover:border-green-400/40 dark:hover:shadow-[0_0_20px_rgba(34,197,94,0.1)]"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold mb-1 text-green-600 dark:text-green-400">Completed Tasks</h4>
              <p className="text-xs text-muted-foreground">See what you&apos;ve accomplished</p>
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {tasks.filter(t => t.completed).length}
            </div>
          </div>
        </a>
      </div>
    </div>
  )
}
