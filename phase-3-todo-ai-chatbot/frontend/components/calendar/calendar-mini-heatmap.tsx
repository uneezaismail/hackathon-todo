/**
 * Calendar Mini Heatmap Component - Phase 8 (US6)
 *
 * Compact weekly heatmap showing workload distribution:
 * - 7-day view of task density
 * - Color-coded by workload level
 * - Click to navigate to specific day
 */

'use client'

import * as React from 'react'
import { Task } from '@/types/task'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format, startOfWeek, addDays, isSameDay, parseISO, isToday } from 'date-fns'
import { cn } from '@/lib/utils'
import { Activity } from 'lucide-react'

interface CalendarMiniHeatmapProps {
  tasks: Task[]
  currentDate: Date
  onDayClick?: (date: Date) => void
  className?: string
}

interface DayData {
  date: Date
  totalTasks: number
  pendingTasks: number
  completedTasks: number
  overdueTasks: number
  level: 0 | 1 | 2 | 3 | 4
}

const LEVEL_COLORS = {
  0: 'bg-muted/30 hover:bg-muted/50',
  1: 'bg-emerald-500/20 hover:bg-emerald-500/30',
  2: 'bg-emerald-500/40 hover:bg-emerald-500/50',
  3: 'bg-amber-500/40 hover:bg-amber-500/50',
  4: 'bg-red-500/40 hover:bg-red-500/50',
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function calculateWeekData(tasks: Task[], currentDate: Date): DayData[] {
  const weekStart = startOfWeek(currentDate)
  const now = new Date()
  const data: DayData[] = []

  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart, i)
    const dayTasks = tasks.filter(task => {
      if (!task.due_date) return false
      return isSameDay(parseISO(task.due_date), date)
    })

    const totalTasks = dayTasks.length
    const pendingTasks = dayTasks.filter(t => !t.completed).length
    const completedTasks = dayTasks.filter(t => t.completed).length
    const overdueTasks = dayTasks.filter(t => {
      if (t.completed || !t.due_date) return false
      return parseISO(t.due_date) < now
    }).length

    // Calculate level based on pending tasks
    let level: DayData['level'] = 0
    if (pendingTasks > 0) {
      if (pendingTasks === 1) level = 1
      else if (pendingTasks === 2) level = 2
      else if (pendingTasks <= 4) level = 3
      else level = 4
    }

    data.push({
      date,
      totalTasks,
      pendingTasks,
      completedTasks,
      overdueTasks,
      level,
    })
  }

  return data
}

export function CalendarMiniHeatmap({
  tasks,
  currentDate,
  onDayClick,
  className,
}: CalendarMiniHeatmapProps) {
  const weekData = React.useMemo(
    () => calculateWeekData(tasks, currentDate),
    [tasks, currentDate]
  )

  const totalPending = weekData.reduce((sum, d) => sum + d.pendingTasks, 0)
  const totalOverdue = weekData.reduce((sum, d) => sum + d.overdueTasks, 0)

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4 text-purple-500" />
          This Week&apos;s Workload
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1 mb-3">
          {DAY_NAMES.map((name, i) => (
            <div key={name} className="text-center">
              <div className="text-[10px] text-muted-foreground mb-1">{name}</div>
              <button
                onClick={() => onDayClick?.(weekData[i].date)}
                className={cn(
                  'w-full aspect-square rounded-md flex items-center justify-center transition-all',
                  LEVEL_COLORS[weekData[i].level],
                  isToday(weekData[i].date) && 'ring-2 ring-primary ring-offset-1 ring-offset-background',
                  'cursor-pointer'
                )}
                title={`${format(weekData[i].date, 'MMM d')}: ${weekData[i].pendingTasks} pending, ${weekData[i].completedTasks} done`}
              >
                <span className="text-xs font-medium">
                  {format(weekData[i].date, 'd')}
                </span>
              </button>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Less</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={cn('w-2.5 h-2.5 rounded-sm', LEVEL_COLORS[level as keyof typeof LEVEL_COLORS])}
              />
            ))}
            <span className="text-muted-foreground">More</span>
          </div>
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs">
          <span className="text-muted-foreground">
            {totalPending} pending this week
          </span>
          {totalOverdue > 0 && (
            <span className="text-red-400 font-medium">
              {totalOverdue} overdue
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
