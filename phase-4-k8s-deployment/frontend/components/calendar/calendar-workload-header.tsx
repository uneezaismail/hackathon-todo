/**
 * Calendar Workload Header Component - Phase 8 (US6)
 *
 * Displays workload indicators at the top of the calendar:
 * - Summary statistics for visible date range
 * - Visual workload distribution bar
 * - Productivity insights
 */

'use client'

import * as React from 'react'
import { Task } from '@/types/task'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Calendar,
} from 'lucide-react'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

interface CalendarWorkloadHeaderProps {
  tasks: Task[]
  currentDate: Date
  view: 'month' | 'week' | 'day' | 'agenda'
  className?: string
}

interface WorkloadMetrics {
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  overdueTasks: number
  highPriorityTasks: number
  busiestDay: { date: Date; count: number } | null
  workloadLevel: 'light' | 'moderate' | 'busy' | 'overloaded'
}

function getDateRange(currentDate: Date, view: string): { start: Date; end: Date } {
  switch (view) {
    case 'week':
      return { start: startOfWeek(currentDate), end: endOfWeek(currentDate) }
    case 'day':
      return { start: currentDate, end: currentDate }
    case 'month':
    default:
      return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) }
  }
}

function calculateWorkloadMetrics(tasks: Task[], start: Date, end: Date): WorkloadMetrics {
  const now = new Date()

  // Filter tasks within date range (by due_date)
  const tasksInRange = tasks.filter(task => {
    if (!task.due_date) return false
    const dueDate = parseISO(task.due_date)
    return isWithinInterval(dueDate, { start, end })
  })

  const completedTasks = tasksInRange.filter(t => t.completed).length
  const pendingTasks = tasksInRange.filter(t => !t.completed).length
  const overdueTasks = tasksInRange.filter(t => {
    if (t.completed || !t.due_date) return false
    return parseISO(t.due_date) < now
  }).length
  const highPriorityTasks = tasksInRange.filter(t => t.priority === 'High' && !t.completed).length

  // Find busiest day
  const dayCountMap = new Map<string, { date: Date; count: number }>()
  tasksInRange.forEach(task => {
    if (!task.due_date) return
    const dateStr = task.due_date.substring(0, 10)
    const existing = dayCountMap.get(dateStr)
    if (existing) {
      existing.count++
    } else {
      dayCountMap.set(dateStr, { date: parseISO(task.due_date), count: 1 })
    }
  })

  let busiestDay: { date: Date; count: number } | null = null
  dayCountMap.forEach(value => {
    if (!busiestDay || value.count > busiestDay.count) {
      busiestDay = value
    }
  })

  // Calculate workload level
  const avgTasksPerDay = pendingTasks / Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  let workloadLevel: WorkloadMetrics['workloadLevel'] = 'light'
  if (avgTasksPerDay > 5) workloadLevel = 'overloaded'
  else if (avgTasksPerDay > 3) workloadLevel = 'busy'
  else if (avgTasksPerDay > 1) workloadLevel = 'moderate'

  return {
    totalTasks: tasksInRange.length,
    completedTasks,
    pendingTasks,
    overdueTasks,
    highPriorityTasks,
    busiestDay,
    workloadLevel,
  }
}

const workloadColors = {
  light: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10',
  moderate: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10',
  busy: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10',
  overloaded: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/10',
}

const workloadLabels = {
  light: 'Light Load',
  moderate: 'Moderate',
  busy: 'Busy',
  overloaded: 'Overloaded',
}

export function CalendarWorkloadHeader({
  tasks,
  currentDate,
  view,
  className,
}: CalendarWorkloadHeaderProps) {
  const { start, end } = React.useMemo(
    () => getDateRange(currentDate, view),
    [currentDate, view]
  )

  const metrics = React.useMemo(
    () => calculateWorkloadMetrics(tasks, start, end),
    [tasks, start, end]
  )

  const dateRangeLabel = React.useMemo(() => {
    if (view === 'day') {
      return format(currentDate, 'MMMM d, yyyy')
    } else if (view === 'week') {
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
    } else {
      return format(currentDate, 'MMMM yyyy')
    }
  }, [currentDate, view, start, end])

  return (
    <Card className={cn(
      'mb-4 border-2 transition-all duration-200',
      'bg-white dark:bg-[#1a1a2e]/95',
      'border-gray-200 dark:border-[#2a2a3e]',
      'shadow-md dark:shadow-[0_0_20px_rgba(168,85,247,0.05)]',
      className
    )}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          {/* Date range label */}
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar className={cn(
              'h-4 w-4 shrink-0',
              'text-purple-600 dark:text-purple-400'
            )} />
            <span className={cn(
              'text-sm sm:text-base font-semibold',
              'text-gray-900 dark:text-white'
            )}>
              {dateRangeLabel}
            </span>
            <Badge
              variant="secondary"
              className={cn(
                'text-xs font-medium',
                workloadColors[metrics.workloadLevel]
              )}
            >
              {workloadLabels[metrics.workloadLevel]}
            </Badge>
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-1.5">
              <div className={cn(
                'p-1 rounded shrink-0',
                'bg-blue-100 dark:bg-blue-500/10'
              )}>
                <Clock className={cn(
                  'h-3 w-3 sm:h-3.5 sm:w-3.5',
                  'text-blue-600 dark:text-blue-400'
                )} />
              </div>
              <span className={cn(
                'text-gray-600 dark:text-gray-400 whitespace-nowrap'
              )}>
                {metrics.pendingTasks} pending
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <div className={cn(
                'p-1 rounded shrink-0',
                'bg-emerald-100 dark:bg-emerald-500/10'
              )}>
                <CheckCircle2 className={cn(
                  'h-3 w-3 sm:h-3.5 sm:w-3.5',
                  'text-emerald-600 dark:text-emerald-400'
                )} />
              </div>
              <span className={cn(
                'text-gray-600 dark:text-gray-400 whitespace-nowrap'
              )}>
                {metrics.completedTasks} done
              </span>
            </div>

            {metrics.overdueTasks > 0 && (
              <div className="flex items-center gap-1.5">
                <div className={cn(
                  'p-1 rounded shrink-0',
                  'bg-red-100 dark:bg-red-500/10'
                )}>
                  <AlertTriangle className={cn(
                    'h-3 w-3 sm:h-3.5 sm:w-3.5',
                    'text-red-600 dark:text-red-400'
                  )} />
                </div>
                <span className={cn(
                  'font-medium whitespace-nowrap',
                  'text-red-600 dark:text-red-400'
                )}>
                  {metrics.overdueTasks} overdue
                </span>
              </div>
            )}

            {metrics.highPriorityTasks > 0 && (
              <div className="flex items-center gap-1.5">
                <div className={cn(
                  'p-1 rounded shrink-0',
                  'bg-amber-100 dark:bg-amber-500/10'
                )}>
                  <TrendingUp className={cn(
                    'h-3 w-3 sm:h-3.5 sm:w-3.5',
                    'text-amber-600 dark:text-amber-400'
                  )} />
                </div>
                <span className={cn(
                  'text-amber-600 dark:text-amber-400 whitespace-nowrap'
                )}>
                  {metrics.highPriorityTasks} high priority
                </span>
              </div>
            )}

            {metrics.busiestDay && view !== 'day' && (
              <div className={cn(
                'hidden sm:flex items-center gap-1.5 text-xs border-l pl-3 sm:pl-4',
                'text-gray-600 dark:text-gray-400',
                'border-gray-300 dark:border-[#2a2a3e]'
              )}>
                Busiest: {format(metrics.busiestDay.date, 'MMM d')} ({metrics.busiestDay.count} tasks)
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
