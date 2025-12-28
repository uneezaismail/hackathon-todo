/**
 * Day Workload Indicator Component - Phase 8 (US6)
 *
 * Visual indicator for daily task workload:
 * - Colored background based on task count
 * - Priority breakdown tooltip
 * - Overdue warning
 */

'use client'

import * as React from 'react'
import { Task } from '@/types/task'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { format, isSameDay, parseISO } from 'date-fns'

interface DayWorkloadIndicatorProps {
  date: Date
  tasks: Task[]
  className?: string
}

interface DayMetrics {
  total: number
  completed: number
  pending: number
  overdue: number
  highPriority: number
  mediumPriority: number
  lowPriority: number
  recurring: number
}

function calculateDayMetrics(date: Date, tasks: Task[]): DayMetrics {
  const now = new Date()
  const dayTasks = tasks.filter(task => {
    if (!task.due_date) return false
    return isSameDay(parseISO(task.due_date), date)
  })

  return {
    total: dayTasks.length,
    completed: dayTasks.filter(t => t.completed).length,
    pending: dayTasks.filter(t => !t.completed).length,
    overdue: dayTasks.filter(t => !t.completed && parseISO(t.due_date!) < now).length,
    highPriority: dayTasks.filter(t => t.priority === 'High' && !t.completed).length,
    mediumPriority: dayTasks.filter(t => t.priority === 'Medium' && !t.completed).length,
    lowPriority: dayTasks.filter(t => t.priority === 'Low' && !t.completed).length,
    recurring: dayTasks.filter(t => t.is_recurring).length,
  }
}

function getWorkloadColor(pending: number, overdue: number): string {
  if (overdue > 0) return 'bg-red-500/20'
  if (pending === 0) return 'bg-transparent'
  if (pending === 1) return 'bg-emerald-500/10'
  if (pending === 2) return 'bg-emerald-500/20'
  if (pending <= 4) return 'bg-amber-500/20'
  return 'bg-red-500/15'
}

function getWorkloadDot(pending: number, overdue: number): string {
  if (overdue > 0) return 'bg-red-500'
  if (pending === 0) return 'bg-transparent'
  if (pending <= 2) return 'bg-emerald-500'
  if (pending <= 4) return 'bg-amber-500'
  return 'bg-red-500'
}

export function DayWorkloadIndicator({ date, tasks, className }: DayWorkloadIndicatorProps) {
  const metrics = React.useMemo(
    () => calculateDayMetrics(date, tasks),
    [date, tasks]
  )

  if (metrics.total === 0) {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'absolute inset-0 pointer-events-none',
              getWorkloadColor(metrics.pending, metrics.overdue),
              className
            )}
          >
            {/* Workload indicator dot */}
            <div className="absolute bottom-1 right-1 flex items-center gap-0.5">
              <div
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  getWorkloadDot(metrics.pending, metrics.overdue)
                )}
              />
              {metrics.pending > 3 && (
                <span className="text-[9px] text-muted-foreground font-medium">
                  {metrics.pending}
                </span>
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <div className="font-medium">
              {format(date, 'EEEE, MMMM d')}
            </div>
            <div className="text-xs space-y-1">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Total tasks:</span>
                <span className="font-medium">{metrics.total}</span>
              </div>
              {metrics.pending > 0 && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Pending:</span>
                  <span className="text-amber-500">{metrics.pending}</span>
                </div>
              )}
              {metrics.completed > 0 && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Completed:</span>
                  <span className="text-emerald-500">{metrics.completed}</span>
                </div>
              )}
              {metrics.overdue > 0 && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Overdue:</span>
                  <span className="text-red-500 font-medium">{metrics.overdue}</span>
                </div>
              )}
              {metrics.highPriority > 0 && (
                <div className="flex justify-between gap-4 pt-1 border-t">
                  <span className="text-muted-foreground">High priority:</span>
                  <span className="text-red-400">{metrics.highPriority}</span>
                </div>
              )}
              {metrics.recurring > 0 && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Recurring:</span>
                  <span className="text-purple-400">{metrics.recurring}</span>
                </div>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Calculate workload data for a range of dates
 * Useful for rendering a mini heatmap or workload overview
 */
export interface DailyWorkload {
  date: Date
  dateStr: string
  metrics: DayMetrics
  level: 0 | 1 | 2 | 3 | 4
}

export function calculateWorkloadRange(
  tasks: Task[],
  startDate: Date,
  days: number
): DailyWorkload[] {
  const result: DailyWorkload[] = []

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)

    const metrics = calculateDayMetrics(date, tasks)
    const pending = metrics.pending

    // Calculate level (0-4) based on pending tasks
    let level: DailyWorkload['level'] = 0
    if (pending > 0) {
      if (pending === 1) level = 1
      else if (pending === 2) level = 2
      else if (pending <= 4) level = 3
      else level = 4
    }

    result.push({
      date,
      dateStr: format(date, 'yyyy-MM-dd'),
      metrics,
      level,
    })
  }

  return result
}
