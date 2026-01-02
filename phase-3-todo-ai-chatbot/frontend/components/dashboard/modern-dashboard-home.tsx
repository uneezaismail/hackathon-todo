/**
 * Modern Dashboard Home - 2025 Best Practices
 *
 * Features:
 * - LinkedIn Wrapped purple theme (light & dark)
 * - Proper skeleton loaders with shimmer
 * - Responsive grid layout
 * - Modern stat cards with gradients
 * - Activity feed
 * - Chart widgets
 * - Mobile-first design
 */

import * as React from 'react'
import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { fetchTasks } from '@/actions/tasks'
import { filterOutPatterns } from '@/lib/task-utils'
import { StatCard } from './stat-card'
import { ActivityFeed } from './activity-feed'
import { ChartWidget } from './chart-widget'
import {
  StatsGridSkeleton,
  ActivityFeedSkeleton,
  ChartCardSkeleton,
  TaskListSkeleton
} from './modern-skeletons'
import { CheckCircle2, ListTodo, Clock, AlertCircle, TrendingUp, Calendar, Repeat } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export async function ModernDashboardHome() {
  // Get session for welcome message
  const session = await auth.api.getSession({
    headers: await headers()
  })

  // Fetch all tasks for analytics
  const tasksResult = await fetchTasks({
    limit: 100,
    sort_by: 'created',
    sort_direction: 'desc'
  })

  // Keep original tasks for recurring patterns, then filter for stats
  const allTasks = tasksResult.tasks || []
  const tasks = filterOutPatterns(allTasks)

  // Recurring tasks - get patterns from original unfiltered tasks
  const recurringPatterns = allTasks
    .filter(t => t.is_recurring && t.is_pattern)
    .slice(0, 5)

  // Count total recurring instances from filtered tasks
  const recurringInstancesCount = tasks.filter(t => t.is_recurring && !t.is_pattern).length

  // Calculate stats
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.completed).length
  const pendingTasks = tasks.filter(t => !t.completed && !isOverdue(t.due_date)).length
  const overdueTasks = tasks.filter(t => !t.completed && isOverdue(t.due_date)).length

  // Calculate completion rate for trend
  const now = Date.now()
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000
  const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000

  const lastWeekCompleted = tasks.filter(t =>
    t.completed &&
    t.updated_at &&
    new Date(t.updated_at).getTime() > oneWeekAgo
  ).length
  const previousWeekCompleted = tasks.filter(t =>
    t.completed &&
    t.updated_at &&
    new Date(t.updated_at).getTime() > twoWeeksAgo &&
    new Date(t.updated_at).getTime() <= oneWeekAgo
  ).length
  const completionTrend = previousWeekCompleted > 0
    ? ((lastWeekCompleted - previousWeekCompleted) / previousWeekCompleted) * 100
    : 0

  // Prepare chart data (last 7 days)
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    const dayTasks = tasks.filter(t => {
      if (!t.completed || !t.updated_at) return false
      const completedDate = new Date(t.updated_at)
      return completedDate.toDateString() === date.toDateString()
    })
    return {
      name: date.toLocaleDateString('en-US', { weekday: 'short' }),
      value: dayTasks.length
    }
  })

  // Recent activity (last 10 tasks modified/created)
  const recentActivity = tasks
    .slice(0, 10)
    .map(task => ({
      id: task.id.toString(),
      type: task.completed ? 'completed' as const :
            isOverdue(task.due_date) ? 'overdue' as const :
            task.created_at === task.updated_at ? 'created' as const : 'updated' as const,
      title: task.title,
      timestamp: new Date(task.updated_at || task.created_at)
    }))

  // Today's focus (high priority pending tasks)
  const todaysFocus = tasks
    .filter(t => !t.completed && t.priority === 'High')
    .slice(0, 5)

  // Upcoming deadlines (next 7 days)
  const upcomingDeadlines = tasks
    .filter(t => !t.completed && t.due_date)
    .filter(t => {
      const dueDate = new Date(t.due_date!)
      const today = new Date()
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      return dueDate >= today && dueDate <= nextWeek
    })
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold dark:text-white light:text-gray-900">
          Welcome back, {session?.user?.name?.split(' ')[0] || 'User'}! 👋
        </h1>
        <p className="dark:text-gray-400 light:text-gray-600 text-lg">
          Here's your productivity overview for today
        </p>
      </div>

      {/* Stats Grid */}
      <Suspense fallback={<StatsGridSkeleton />}>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Tasks"
            value={totalTasks}
            iconName="ListTodo"
            description="All tasks in your list"
            delay={0}
          />
          <StatCard
            title="Completed"
            value={completedTasks}
            iconName="CheckCircle2"
            description="Tasks you've finished"
            trend={{
              value: Math.round(completionTrend),
              isPositive: completionTrend > 0
            }}
            delay={0.1}
          />
          <StatCard
            title="In Progress"
            value={pendingTasks}
            iconName="Clock"
            description="Tasks you're working on"
            delay={0.2}
          />
          <StatCard
            title="Overdue"
            value={overdueTasks}
            iconName="AlertCircle"
            description="Tasks past their deadline"
            delay={0.3}
          />
        </div>
      </Suspense>

      {/* Two Column Layout - Chart and Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<ChartCardSkeleton />}>
          <ChartWidget
            title="Weekly Progress"
            description="Tasks completed this week"
            data={chartData}
            delay={0.4}
          />
        </Suspense>

        <Suspense fallback={<ActivityFeedSkeleton />}>
          <ActivityFeed activities={recentActivity} delay={0.5} />
        </Suspense>
      </div>

      {/* Two Column Layout - Today's Focus and Upcoming Deadlines */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Focus */}
        <Suspense fallback={<TaskListSkeleton count={5} />}>
          <Card className={cn(
            "border transition-all duration-300",
            "dark:bg-[#1a1a2e] dark:border-[#2a2a3e]",
            "light:bg-white light:border-[#e5e5ea]",
            "hover:shadow-lg dark:hover:shadow-purple-500/10 light:hover:shadow-purple-500/5"
          )}>
            <CardHeader className={cn(
              "border-b",
              "dark:border-[#2a2a3e]",
              "light:border-[#e5e5ea]"
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="dark:text-white light:text-gray-900">Today&apos;s Focus</CardTitle>
                  <CardDescription className="dark:text-gray-400 light:text-gray-600">High priority tasks</CardDescription>
                </div>
                <TrendingUp className="h-5 w-5 text-purple-500 dark:text-purple-400 light:text-purple-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {todaysFocus.length === 0 ? (
                <p className="text-sm dark:text-gray-400 light:text-gray-600 text-center py-8">
                  No high priority tasks 🎉
                </p>
              ) : (
                <div className="space-y-3">
                  {todaysFocus.map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border transition-colors",
                        "dark:border-[#2a2a3e] light:border-[#e5e5ea]",
                        "hover:bg-purple-500/5"
                      )}
                    >
                      <div className="flex h-5 w-5 items-center justify-center rounded border-2 border-purple-500 dark:border-purple-400 light:border-purple-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium dark:text-white light:text-gray-900 truncate">
                          {task.title}
                        </p>
                        {task.due_date && (
                          <p className="text-xs dark:text-gray-400 light:text-gray-600">
                            Due {new Date(task.due_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 light:text-purple-700 px-2 py-1 bg-purple-500/10 dark:bg-purple-500/10 light:bg-purple-50 rounded-full">
                        HIGH
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6">
                <Button asChild variant="outline" className={cn(
                  "w-full transition-all",
                  "dark:text-white dark:border-[#2a2a3e] dark:hover:bg-purple-500/10 dark:hover:text-purple-400 dark:hover:border-purple-500/40",
                  "light:text-gray-900 light:border-[#e5e5ea] light:hover:bg-purple-50 light:hover:text-purple-700 light:hover:border-purple-300"
                )}>
                  <Link href="/dashboard/tasks?priority=High&status=pending">
                    View All High Priority →
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </Suspense>

        {/* Upcoming Deadlines */}
        <Suspense fallback={<TaskListSkeleton count={5} />}>
          <Card className={cn(
            "border transition-all duration-300",
            "dark:bg-[#1a1a2e] dark:border-[#2a2a3e]",
            "light:bg-white light:border-[#e5e5ea]",
            "hover:shadow-lg dark:hover:shadow-purple-500/10 light:hover:shadow-purple-500/5"
          )}>
            <CardHeader className={cn(
              "border-b",
              "dark:border-[#2a2a3e]",
              "light:border-[#e5e5ea]"
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="dark:text-white light:text-gray-900">Upcoming Deadlines</CardTitle>
                  <CardDescription className="dark:text-gray-400 light:text-gray-600">Next 7 days</CardDescription>
                </div>
                <Calendar className="h-5 w-5 text-purple-500 dark:text-purple-400 light:text-purple-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {upcomingDeadlines.length === 0 ? (
                <p className="text-sm dark:text-gray-400 light:text-gray-600 text-center py-8">
                  No upcoming deadlines
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingDeadlines.map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border transition-colors",
                        "dark:border-[#2a2a3e] light:border-[#e5e5ea]",
                        "hover:bg-purple-500/5"
                      )}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 dark:bg-purple-500/10 light:bg-purple-50 shrink-0">
                        <Calendar className="h-5 w-5 text-purple-500 dark:text-purple-400 light:text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium dark:text-white light:text-gray-900 truncate">
                          {task.title}
                        </p>
                        <p className="text-xs dark:text-gray-400 light:text-gray-600">
                          Due {new Date(task.due_date!).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6">
                <Button asChild variant="outline" className={cn(
                  "w-full transition-all",
                  "dark:text-white dark:border-[#2a2a3e] dark:hover:bg-purple-500/10 dark:hover:text-purple-400 dark:hover:border-purple-500/40",
                  "light:text-gray-900 light:border-[#e5e5ea] light:hover:bg-purple-50 light:hover:text-purple-700 light:hover:border-purple-300"
                )}>
                  <Link href="/dashboard/calendar">
                    View Calendar →
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </Suspense>
      </div>

      {/* Two Column Layout - Recurring Tasks and Priority Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recurring Tasks Section */}
        {recurringPatterns.length > 0 && (
          <Suspense fallback={<TaskListSkeleton count={5} />}>
            <Card className={cn(
              "border transition-all duration-300",
              "dark:bg-[#1a1a2e] dark:border-[#2a2a3e]",
              "light:bg-white light:border-[#e5e5ea]",
              "hover:shadow-lg dark:hover:shadow-purple-500/10 light:hover:shadow-purple-500/5"
            )}>
              <CardHeader className={cn(
                "border-b",
                "dark:border-[#2a2a3e]",
                "light:border-[#e5e5ea]"
              )}>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="dark:text-white light:text-gray-900">Recurring Tasks</CardTitle>
                    <CardDescription className="dark:text-gray-400 light:text-gray-600">
                      {recurringPatterns.length} active patterns • {recurringInstancesCount} instances
                    </CardDescription>
                  </div>
                  <Repeat className="h-5 w-5 text-purple-500 dark:text-purple-400 light:text-purple-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {recurringPatterns.map((task) => {
                    const recurrenceLabel = task.recurrence_type
                      ? task.recurrence_interval === 1
                        ? task.recurrence_type.charAt(0).toUpperCase() + task.recurrence_type.slice(1)
                        : `Every ${task.recurrence_interval} ${task.recurrence_type}`
                      : 'Custom'

                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border transition-colors",
                          "dark:border-[#2a2a3e] light:border-[#e5e5ea]",
                          "hover:bg-purple-500/5"
                        )}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 dark:bg-purple-500/10 light:bg-purple-50 shrink-0">
                          <Repeat className="h-5 w-5 text-purple-500 dark:text-purple-400 light:text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium dark:text-white light:text-gray-900 truncate">
                            {task.title}
                          </p>
                          <p className="text-xs dark:text-gray-400 light:text-gray-600">
                            {recurrenceLabel} • {task.occurrence_count} occurrences
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 light:text-purple-700 px-2 py-1 bg-purple-500/10 dark:bg-purple-500/10 light:bg-purple-50 rounded-full">
                          {task.recurrence_type?.toUpperCase()}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-6">
                  <Button asChild variant="outline" className={cn(
                    "w-full transition-all",
                    "dark:text-white dark:border-[#2a2a3e] dark:hover:bg-purple-500/10 dark:hover:text-purple-400 dark:hover:border-purple-500/40",
                    "light:text-gray-900 light:border-[#e5e5ea] light:hover:bg-purple-50 light:hover:text-purple-700 light:hover:border-purple-300"
                  )}>
                    <Link href="/dashboard/analytics">
                      View Analytics →
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Suspense>
        )}
      </div>

      {/* Quick Actions - All Purple Theme */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/dashboard/tasks?status=pending&priority=High"
          className={cn(
            "group p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02]",
            "dark:bg-[#1a1a2e] dark:border-[#2a2a3e] dark:hover:border-purple-500/40",
            "light:bg-white light:border-[#e5e5ea] light:hover:border-purple-300",
            "hover:shadow-lg dark:hover:shadow-purple-500/10 light:hover:shadow-purple-500/5"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600/10 dark:bg-purple-600/10 light:bg-purple-50">
              <AlertCircle className="h-6 w-6 text-purple-500 dark:text-purple-400 light:text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 light:text-purple-700">
              {tasks.filter(t => t.priority === 'High' && !t.completed).length}
            </div>
          </div>
          <h4 className="text-lg font-semibold dark:text-white light:text-gray-900 mb-1">
            High Priority
          </h4>
          <p className="text-sm dark:text-gray-400 light:text-gray-600">
            Focus on what matters most
          </p>
        </Link>

        <Link
          href="/dashboard/tasks?status=pending"
          className={cn(
            "group p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02]",
            "dark:bg-[#1a1a2e] dark:border-[#2a2a3e] dark:hover:border-purple-500/40",
            "light:bg-white light:border-[#e5e5ea] light:hover:border-purple-300",
            "hover:shadow-lg dark:hover:shadow-purple-500/10 light:hover:shadow-purple-500/5"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600/10 dark:bg-purple-600/10 light:bg-purple-50">
              <Clock className="h-6 w-6 text-purple-500 dark:text-purple-400 light:text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 light:text-purple-700">
              {pendingTasks}
            </div>
          </div>
          <h4 className="text-lg font-semibold dark:text-white light:text-gray-900 mb-1">
            Active Tasks
          </h4>
          <p className="text-sm dark:text-gray-400 light:text-gray-600">
            Your complete task list
          </p>
        </Link>

        <Link
          href="/dashboard/analytics"
          className={cn(
            "group p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02]",
            "dark:bg-[#1a1a2e] dark:border-[#2a2a3e] dark:hover:border-purple-500/40",
            "light:bg-white light:border-[#e5e5ea] light:hover:border-purple-300",
            "hover:shadow-lg dark:hover:shadow-purple-500/10 light:hover:shadow-purple-500/5"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600/10 dark:bg-purple-600/10 light:bg-purple-50">
              <TrendingUp className="h-6 w-6 text-purple-500 dark:text-purple-400 light:text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 light:text-purple-700">
              {completedTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
            </div>
          </div>
          <h4 className="text-lg font-semibold dark:text-white light:text-gray-900 mb-1">
            Completion Rate
          </h4>
          <p className="text-sm dark:text-gray-400 light:text-gray-600">
            View detailed analytics
          </p>
        </Link>
      </div>
    </div>
  )
}

// Helper function to check if a task is overdue
function isOverdue(dueDate: string | null | undefined): boolean {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}
