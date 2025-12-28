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
  0: 'bg-muted/30 dark:bg-muted/20',
  1: 'bg-emerald-200 dark:bg-emerald-900',
  2: 'bg-emerald-400 dark:bg-emerald-700',
  3: 'bg-emerald-500 dark:bg-emerald-500',
  4: 'bg-emerald-600 dark:bg-emerald-400',
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
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Completion Activity</CardTitle>
            <CardDescription>
              {heatmapData.totalCompleted} tasks completed in the last {weeks} weeks
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
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
      <CardContent>
        {/* Month labels */}
        <div className="flex mb-1 pl-8">
          {monthLabels.map(({ month, weekIndex }, idx) => (
            <div
              key={`${month}-${idx}`}
              className="text-xs text-muted-foreground"
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
        <div className="flex gap-[2px]">
          {/* Day labels */}
          <div className="flex flex-col gap-[2px] mr-1">
            {DAY_LABELS.map((day, index) => (
              <div
                key={day}
                className={cn(
                  "h-3 text-[10px] text-muted-foreground flex items-center",
                  index % 2 === 0 ? "opacity-100" : "opacity-0"
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Weeks grid */}
          {heatmapData.weeks.map((week) => (
            <div key={week.weekNumber} className="flex flex-col gap-[2px]">
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
          <div className="mt-3 text-sm text-center text-muted-foreground">
            <span className="font-medium text-foreground">
              {hoveredCell.count} task{hoveredCell.count !== 1 ? 's' : ''}
            </span>{' '}
            completed on {format(parseISO(hoveredCell.date), 'MMMM d, yyyy')}
          </div>
        )}

        {/* Stats summary */}
        <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-foreground">
              {heatmapData.totalCompleted}
            </div>
            <div className="text-xs text-muted-foreground">Tasks Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">
              {heatmapData.activeDays}
            </div>
            <div className="text-xs text-muted-foreground">Active Days</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">
              {heatmapData.activeDays > 0
                ? (heatmapData.totalCompleted / heatmapData.activeDays).toFixed(1)
                : '0'}
            </div>
            <div className="text-xs text-muted-foreground">Avg/Day</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
