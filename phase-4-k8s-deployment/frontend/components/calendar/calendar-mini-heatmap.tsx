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
  0: 'bg-[#A855F7]/20 hover:bg-[#A855F7]/30',
  1: 'bg-emerald-500/40 hover:bg-emerald-500/50',
  2: 'bg-emerald-500/60 hover:bg-emerald-500/70',
  3: 'bg-amber-500/60 hover:bg-amber-500/70',
  4: 'bg-red-500/60 hover:bg-red-500/70',
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
    <Card className={cn(
      'border-2 border-[#A855F7]/20 bg-gradient-to-br from-[#A855F7]/5 to-[#A855F7]/2 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl hover:border-[#A855F7]/40 transition-all duration-300',
      className
    )}>
      <CardHeader className="pb-2 border-b border-[#A855F7]/20">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20">
            <Activity className="h-4 w-4 text-purple-400" />
          </div>
          This Week&apos;s Workload
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1 mb-3">
          {DAY_NAMES.map((name, i) => (
            <div key={name} className="text-center">
              <div className="text-[10px] text-gray-400 mb-2 font-medium">{name}</div>
              <button
                onClick={() => onDayClick?.(weekData[i].date)}
                className={cn(
                  'w-full aspect-square rounded-lg flex items-center justify-center transition-all font-semibold text-white',
                  LEVEL_COLORS[weekData[i].level],
                  isToday(weekData[i].date) && 'ring-2 ring-[#A855F7] ring-offset-2 ring-offset-[#1a1a2e]',
                  'cursor-pointer hover:scale-105'
                )}
                title={`${format(weekData[i].date, 'MMM d')}: ${weekData[i].pendingTasks} pending, ${weekData[i].completedTasks} done`}
              >
                <span className="text-sm font-bold">
                  {format(weekData[i].date, 'd')}
                </span>
              </button>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-xs mb-3">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-medium">Less</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={cn('w-3 h-3 rounded-sm border border-white/10', LEVEL_COLORS[level as keyof typeof LEVEL_COLORS])}
              />
            ))}
            <span className="text-gray-400 font-medium">More</span>
          </div>
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between pt-3 border-t border-[#A855F7]/15 text-xs">
          <span className="text-gray-300 font-medium">
            {totalPending} pending this week
          </span>
          {totalOverdue > 0 && (
            <span className="text-red-400 font-semibold">
              {totalOverdue} overdue
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
