/**
 * Completion Heatmap Component - Phase 7
 *
 * GitHub-style activity heatmap showing task completion patterns over time.
 * Displays the last 12 weeks (84 days) of completion activity.
 */

'use client'

import * as React from 'react'
import { Task } from '@/types/task'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { calculateHeatmapData, HeatmapCell } from '@/lib/analytics'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

interface CompletionHeatmapProps {
  tasks: Task[]
  weeks?: number
  className?: string
}

const LEVEL_COLORS = {
  0: 'bg-gray-200/30 dark:bg-gray-800/20',
  1: 'bg-purple-200 dark:bg-purple-900/50',
  2: 'bg-purple-400 dark:bg-purple-700/70',
  3: 'bg-purple-500 dark:bg-purple-500',
  4: 'bg-purple-600 dark:bg-purple-400',
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function CompletionHeatmap({ tasks, weeks = 12, className }: CompletionHeatmapProps) {
  const heatmapData = React.useMemo(() => calculateHeatmapData(tasks, weeks), [tasks, weeks])
  const [hoveredCell, setHoveredCell] = React.useState<HeatmapCell | null>(null)

  // Get month labels for the header
  const monthLabels = React.useMemo(() => {
    const labels: { month: string; weekIndex: number }[] = []
    let lastMonth = ''

    heatmapData.weeks.forEach((week, weekIndex) => {
      // Check the first day of each week
      const firstCell = week.cells[0]
      if (firstCell) {
        const date = parseISO(firstCell.date)
        const month = format(date, 'MMM')
        if (month !== lastMonth) {
          labels.push({ month, weekIndex })
          lastMonth = month
        }
      }
    })

    return labels
  }, [heatmapData.weeks])

  return (
    <Card className={cn(
      "border transition-all duration-300",
      "dark:bg-[#1a1a2e] dark:border-[#2a2a3e]",
      "light:bg-white light:border-[#e5e5ea]",
      "hover:shadow-lg dark:hover:shadow-purple-500/10 light:hover:shadow-purple-500/5",
      className
    )}>
      <CardHeader className={cn(
        "pb-3 border-b",
        "dark:border-[#2a2a3e]",
        "light:border-[#e5e5ea]"
      )}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-lg font-semibold dark:text-white light:text-gray-900">Completion Activity</CardTitle>
            <CardDescription className="dark:text-gray-400 light:text-gray-600">
              {heatmapData.totalCompleted} tasks completed in the last {weeks} weeks
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 text-xs dark:text-gray-400 light:text-gray-600">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={cn(
                  "w-3 h-3 rounded-sm",
                  LEVEL_COLORS[level as keyof typeof LEVEL_COLORS]
                )}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Month labels */}
        <div className="flex mb-2 pl-8">
          {monthLabels.map(({ month, weekIndex }, idx) => (
            <div
              key={`${month}-${idx}`}
              className="text-xs dark:text-gray-400 light:text-gray-600 font-medium"
              style={{
                marginLeft: idx === 0 ? `${weekIndex * 14}px` : undefined,
                width: idx < monthLabels.length - 1
                  ? `${(monthLabels[idx + 1].weekIndex - weekIndex) * 14}px`
                  : undefined,
              }}
            >
              {month}
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="flex gap-0.5">
          {/* Day labels */}
          <div className="flex flex-col gap-0.5 mr-1">
            {DAY_LABELS.map((day, index) => (
              <div
                key={day}
                className={cn(
                  "h-3 text-[10px] dark:text-gray-400 light:text-gray-600 flex items-center font-medium",
                  index % 2 === 0 ? "opacity-100" : "opacity-0"
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Weeks grid */}
          {heatmapData.weeks.map((week) => (
            <div key={week.weekNumber} className="flex flex-col gap-0.5">
              {week.cells.map((cell) => (
                <div
                  key={cell.date}
                  className={cn(
                    "w-3 h-3 rounded-sm cursor-pointer transition-all duration-150",
                    LEVEL_COLORS[cell.level],
                    hoveredCell?.date === cell.date && "ring-2 ring-foreground/50 ring-offset-1"
                  )}
                  onMouseEnter={() => setHoveredCell(cell)}
                  onMouseLeave={() => setHoveredCell(null)}
                  title={`${format(parseISO(cell.date), 'MMM d, yyyy')}: ${cell.count} task${cell.count !== 1 ? 's' : ''} completed`}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Hover tooltip */}
        {hoveredCell && (
          <div className="mt-3 text-sm text-center dark:text-gray-400 light:text-gray-600">
            <span className="font-semibold text-purple-600 dark:text-purple-400 light:text-purple-700">
              {hoveredCell.count} task{hoveredCell.count !== 1 ? 's' : ''}
            </span>{' '}
            completed on {format(parseISO(hoveredCell.date), 'MMMM d, yyyy')}
          </div>
        )}

        {/* Stats summary */}
        <div className={cn(
          "mt-6 pt-6 border-t grid grid-cols-1 sm:grid-cols-3 gap-6 text-center",
          "dark:border-[#A855F7]/20",
          "light:border-[#A855F7]/10"
        )}>
          <div className="space-y-2">
            <div className="text-3xl font-bold bg-linear-to-r from-purple-500 to-purple-400 bg-clip-text text-transparent dark:from-purple-400 dark:to-purple-300">
              {heatmapData.totalCompleted}
            </div>
            <div className="text-xs dark:text-gray-400 light:text-gray-600 uppercase tracking-widest font-semibold">Tasks Completed</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold bg-linear-to-r from-purple-500 to-purple-400 bg-clip-text text-transparent dark:from-purple-400 dark:to-purple-300">
              {heatmapData.activeDays}
            </div>
            <div className="text-xs dark:text-gray-400 light:text-gray-600 uppercase tracking-widest font-semibold">Active Days</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold bg-linear-to-r from-purple-500 to-purple-400 bg-clip-text text-transparent dark:from-purple-400 dark:to-purple-300">
              {heatmapData.activeDays > 0
                ? (heatmapData.totalCompleted / heatmapData.activeDays).toFixed(1)
                : '0'}
            </div>
            <div className="text-xs dark:text-gray-400 light:text-gray-600 uppercase tracking-widest font-semibold">Avg/Day</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
