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
import { Task } from '@/types/task'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AnalyticsDateFilter } from './analytics-date-filter'
import { CompletionHeatmap } from './completion-heatmap'
import { RecurringStatsCard } from './recurring-stats-card'
import { TagStatsCard } from './tag-stats-card'
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-purple-500" />
            Analytics
          </h1>
          <p className="text-muted-foreground">
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

      {/* Tag Analytics - Full width */}
      <TagStatsCard tasks={filteredTasks} limit={8} className="w-full" />

      {/* Weekly Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            This Week&apos;s Activity
          </CardTitle>
          <CardDescription>
            Quick summary of your weekly productivity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <div className="text-3xl font-bold text-emerald-500">
                {metrics.tasksCompletedThisWeek}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Completed this week
              </div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <div className="text-3xl font-bold text-blue-500">
                {metrics.tasksCompletedToday}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Completed today
              </div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <div className="text-3xl font-bold text-purple-500">
                {recurringStats.activeRecurringTasks}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Active recurring patterns
              </div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <div className="text-3xl font-bold text-amber-500">
                {recurringStats.completedOccurrences}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
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
    blue: 'text-blue-500 bg-blue-500/10',
    emerald: 'text-emerald-500 bg-emerald-500/10',
    amber: 'text-amber-500 bg-amber-500/10',
    red: 'text-red-500 bg-red-500/10',
    purple: 'text-purple-500 bg-purple-500/10',
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg', colorClasses[color])}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground">{title}</div>
            {subtitle && (
              <div className="text-xs text-muted-foreground/70">{subtitle}</div>
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
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">{title}</div>
          {icon && icon}
          {trend !== undefined && (
            <div
              className={cn(
                'flex items-center gap-1 text-xs font-medium',
                trend > 0 ? 'text-emerald-500' : trend < 0 ? 'text-red-500' : 'text-muted-foreground'
              )}
            >
              {trend > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : trend < 0 ? (
                <TrendingDown className="h-3 w-3" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <div className="text-2xl font-bold mt-2">{value}</div>
        {description && (
          <div className="text-xs text-muted-foreground mt-1">{description}</div>
        )}
      </CardContent>
    </Card>
  )
}
