/**
 * Analytics Dashboard Component - Phase 7 (US5)
 *
 * Main client component that orchestrates all analytics features:
 * - Date range filtering
 * - Completion heatmap
 * - Recurring task statistics
 * - Tag analytics
 * - Summary cards
 */

'use client'

import * as React from 'react'
import { Suspense } from 'react'
import { Task } from '@/types/task'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AnalyticsDateFilter } from './analytics-date-filter'
import { CompletionHeatmap } from './completion-heatmap'
import { RecurringStatsCard } from './recurring-stats-card'
import { TagStatsCard } from './tag-stats-card'
import { PriorityDistribution } from './priority-distribution'
import { filterTasksByDateRange, calculateProductivityMetrics, getRecurringTaskStats } from '@/lib/analytics'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  CheckCircle2,
  Clock,
  Flame,
  Calendar,
  Minus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChartCardSkeleton } from './modern-skeletons'

interface AnalyticsDashboardProps {
  tasks: Task[]
  userName: string
}

export function AnalyticsDashboard({ tasks, userName }: AnalyticsDashboardProps) {
  const [startDate, setStartDate] = React.useState<Date | null>(null)
  const [endDate, setEndDate] = React.useState<Date | null>(null)

  // Filter tasks by date range
  const filteredTasks = React.useMemo(
    () => filterTasksByDateRange(tasks, startDate, endDate),
    [tasks, startDate, endDate]
  )

  // Calculate metrics for filtered tasks
  const metrics = React.useMemo(
    () => calculateProductivityMetrics(filteredTasks),
    [filteredTasks]
  )

  // Recurring stats for filtered tasks
  const recurringStats = React.useMemo(
    () => getRecurringTaskStats(filteredTasks),
    [filteredTasks]
  )

  const handleDateChange = (start: Date | null, end: Date | null) => {
    setStartDate(start)
    setEndDate(end)
  }

  // Calculate quick stats
  const totalTasks = filteredTasks.length
  const completedTasks = filteredTasks.filter(t => t.completed).length
  const pendingTasks = filteredTasks.filter(t => !t.completed).length
  const overdueTasks = filteredTasks.filter(t => {
    if (t.completed || !t.due_date) return false
    return new Date(t.due_date) < new Date()
  }).length

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold dark:text-white light:text-gray-900 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600/10 dark:bg-purple-600/10 light:bg-purple-50">
              <BarChart3 className="h-7 w-7 text-purple-500 dark:text-purple-400 light:text-purple-600" />
            </div>
            Analytics
          </h1>
          <p className="dark:text-gray-400 light:text-gray-600 text-lg">
            Track your productivity patterns and task completion trends
          </p>
        </div>

        {/* Date Filter */}
        <AnalyticsDateFilter
          startDate={startDate}
          endDate={endDate}
          onDateChange={handleDateChange}
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickStatCard
          title="Total Tasks"
          value={totalTasks}
          icon={Target}
          color="blue"
        />
        <QuickStatCard
          title="Completed"
          value={completedTasks}
          icon={CheckCircle2}
          color="emerald"
          subtitle={`${metrics.completionRate}% rate`}
        />
        <QuickStatCard
          title="Pending"
          value={pendingTasks}
          icon={Clock}
          color="amber"
        />
        <QuickStatCard
          title="Overdue"
          value={overdueTasks}
          icon={Calendar}
          color="red"
        />
      </div>

      {/* Productivity Trend Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TrendCard
          title="Completion Rate"
          value={`${metrics.completionRate}%`}
          trend={metrics.completionRateTrend}
          description="vs last week"
        />
        <TrendCard
          title="Current Streak"
          value={`${metrics.currentStreak} days`}
          icon={<Flame className="h-5 w-5 text-orange-500" />}
          description={`Longest: ${metrics.longestStreak} days`}
        />
        <TrendCard
          title="Avg Completion Time"
          value={`${metrics.avgCompletionTime} days`}
          description="from creation to done"
        />
      </div>

      {/* Main Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap - Full width on mobile, 2 cols on desktop */}
        <div className="lg:col-span-2">
          <CompletionHeatmap tasks={filteredTasks} weeks={12} />
        </div>

        {/* Recurring Stats */}
        <RecurringStatsCard tasks={filteredTasks} />
      </div>

      {/* Tag Analytics and Priority Distribution - Side by side, responsive */}
      <Suspense fallback={<ChartCardSkeleton />}> 
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TagStatsCard tasks={filteredTasks} limit={5} className="w-full" />
        <PriorityDistribution tasks={filteredTasks} />
      </div>
      </Suspense>

      {/* Weekly Activity Summary */}
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
          <CardTitle className="text-lg font-semibold flex items-center gap-2 dark:text-white light:text-gray-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/10 dark:bg-purple-600/10 light:bg-purple-50">
              <Calendar className="h-5 w-5 text-purple-500 dark:text-purple-400 light:text-purple-600" />
            </div>
            This Week&apos;s Activity
          </CardTitle>
          <CardDescription className="dark:text-gray-400 light:text-gray-600">
            Quick summary of your weekly productivity
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={cn(
              "text-center p-4 rounded-xl border transition-colors",
              "dark:border-[#2a2a3e] light:border-[#e5e5ea]",
              "hover:bg-purple-500/5"
            )}>
              <div className="text-3xl font-bold text-emerald-500 dark:text-emerald-400 light:text-emerald-600 mb-2">
                {metrics.tasksCompletedThisWeek}
              </div>
              <div className="text-xs dark:text-gray-400 light:text-gray-600 uppercase tracking-wide font-medium">
                Completed this week
              </div>
            </div>
            <div className={cn(
              "text-center p-4 rounded-xl border transition-colors",
              "dark:border-[#2a2a3e] light:border-[#e5e5ea]",
              "hover:bg-purple-500/5"
            )}>
              <div className="text-3xl font-bold text-blue-500 dark:text-blue-400 light:text-blue-600 mb-2">
                {metrics.tasksCompletedToday}
              </div>
              <div className="text-xs dark:text-gray-400 light:text-gray-600 uppercase tracking-wide font-medium">
                Completed today
              </div>
            </div>
            <div className={cn(
              "text-center p-4 rounded-xl border transition-colors",
              "dark:border-[#2a2a3e] light:border-[#e5e5ea]",
              "hover:bg-purple-500/5"
            )}>
              <div className="text-3xl font-bold text-purple-500 dark:text-purple-400 light:text-purple-600 mb-2">
                {recurringStats.activeRecurringTasks}
              </div>
              <div className="text-xs dark:text-gray-400 light:text-gray-600 uppercase tracking-wide font-medium">
                Active recurring patterns
              </div>
            </div>
            <div className={cn(
              "text-center p-4 rounded-xl border transition-colors",
              "dark:border-[#2a2a3e] light:border-[#e5e5ea]",
              "hover:bg-purple-500/5"
            )}>
              <div className="text-3xl font-bold text-amber-500 dark:text-amber-400 light:text-amber-600 mb-2">
                {recurringStats.completedOccurrences}
              </div>
              <div className="text-xs dark:text-gray-400 light:text-gray-600 uppercase tracking-wide font-medium">
                Recurring completions
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Quick Stat Card Component
interface QuickStatCardProps {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: 'blue' | 'emerald' | 'amber' | 'red' | 'purple'
  subtitle?: string
}

function QuickStatCard({ title, value, icon: Icon, color, subtitle }: QuickStatCardProps) {
  const colorClasses = {
    blue: 'text-blue-500 dark:text-blue-400 light:text-blue-600 bg-blue-500/10 dark:bg-blue-500/10 light:bg-blue-50',
    emerald: 'text-emerald-500 dark:text-emerald-400 light:text-emerald-600 bg-emerald-500/10 dark:bg-emerald-500/10 light:bg-emerald-50',
    amber: 'text-amber-500 dark:text-amber-400 light:text-amber-600 bg-amber-500/10 dark:bg-amber-500/10 light:bg-amber-50',
    red: 'text-red-500 dark:text-red-400 light:text-red-600 bg-red-500/10 dark:bg-red-500/10 light:bg-red-50',
    purple: 'text-purple-500 dark:text-purple-400 light:text-purple-600 bg-purple-500/10 dark:bg-purple-500/10 light:bg-purple-50',
  }

  return (
    <Card className={cn(
      "border transition-all duration-300",
      "dark:bg-[#1a1a2e] dark:border-[#2a2a3e]",
      "light:bg-white light:border-[#e5e5ea]",
      "hover:shadow-lg dark:hover:shadow-purple-500/10 light:hover:shadow-purple-500/5"
    )}>
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          <div className={cn('p-3 rounded-xl', colorClasses[color])}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <div className="text-3xl font-bold dark:text-white light:text-gray-900">{value}</div>
            <div className="text-xs dark:text-gray-400 light:text-gray-600 uppercase tracking-wide font-medium mt-1">{title}</div>
            {subtitle && (
              <div className="text-xs dark:text-gray-500 light:text-gray-500 mt-0.5">{subtitle}</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Trend Card Component
interface TrendCardProps {
  title: string
  value: string
  trend?: number
  icon?: React.ReactNode
  description?: string
}

function TrendCard({ title, value, trend, icon, description }: TrendCardProps) {
  return (
    <Card className={cn(
      "border transition-all duration-300",
      "dark:bg-[#1a1a2e] dark:border-[#2a2a3e]",
      "light:bg-white light:border-[#e5e5ea]",
      "hover:shadow-lg dark:hover:shadow-purple-500/10 light:hover:shadow-purple-500/5"
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm dark:text-gray-400 light:text-gray-600 uppercase tracking-wide font-medium">{title}</div>
          {icon && <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/10 dark:bg-purple-600/10 light:bg-purple-50">{icon}</div>}
          {trend !== undefined && (
            <div
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold',
                trend > 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 light:text-emerald-700 border border-emerald-500/20' :
                trend < 0 ? 'bg-red-500/10 text-red-600 dark:text-red-400 light:text-red-700 border border-red-500/20' :
                'bg-purple-500/10 text-purple-600 dark:text-purple-400 light:text-purple-700 border border-purple-500/20'
              )}
            >
              {trend > 0 ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : trend < 0 ? (
                <TrendingDown className="h-3.5 w-3.5" />
              ) : (
                <Minus className="h-3.5 w-3.5" />
              )}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <div className="text-3xl font-bold dark:text-white light:text-gray-900 mb-2">{value}</div>
        {description && (
          <div className="text-sm dark:text-gray-500 light:text-gray-500">{description}</div>
        )}
      </CardContent>
    </Card>
  )
}
