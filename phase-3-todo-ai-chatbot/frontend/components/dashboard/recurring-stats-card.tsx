/**
 * Recurring Stats Card Component - Phase 7
 *
 * Displays statistics about recurring tasks including:
 * - Active recurring patterns
 * - Completed occurrences
 * - Breakdown by recurrence type
 * - Completion rates by type
 */

'use client'

import * as React from 'react'
import { Task } from '@/types/task'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { getRecurringTaskStats, RecurringTaskStats } from '@/lib/analytics'
import {
  Repeat,
  Calendar,
  CalendarDays,
  CalendarRange,
  CalendarCheck,
  Flame,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RecurringStatsCardProps {
  tasks: Task[]
  className?: string
}

const RECURRENCE_TYPE_CONFIG = {
  daily: {
    label: 'Daily',
    icon: Calendar,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  weekly: {
    label: 'Weekly',
    icon: CalendarDays,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  monthly: {
    label: 'Monthly',
    icon: CalendarRange,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  yearly: {
    label: 'Yearly',
    icon: CalendarCheck,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
}

export function RecurringStatsCard({ tasks, className }: RecurringStatsCardProps) {
  const stats = React.useMemo(() => getRecurringTaskStats(tasks), [tasks])

  const hasRecurringTasks = stats.totalRecurringTasks > 0

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Repeat className="h-5 w-5 text-purple-500" />
              Recurring Tasks
            </CardTitle>
            <CardDescription>
              {hasRecurringTasks
                ? `${stats.activeRecurringTasks} active patterns`
                : 'No recurring tasks yet'}
            </CardDescription>
          </div>
          {stats.streakByRecurring > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Flame className="h-3 w-3 text-orange-500" />
              {stats.streakByRecurring} day streak
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasRecurringTasks ? (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">{stats.totalRecurringTasks}</div>
                <div className="text-xs text-muted-foreground">Total Patterns</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">{stats.completedOccurrences}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
            </div>

            {/* Breakdown by type */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">By Recurrence Type</h4>
              {(Object.entries(stats.recurringByType) as [keyof typeof RECURRENCE_TYPE_CONFIG, number][])
                .filter(([_, count]) => count > 0)
                .map(([type, count]) => {
                  const config = RECURRENCE_TYPE_CONFIG[type]
                  const Icon = config.icon
                  const completionRate = stats.completionRateByType[type]

                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn("p-1.5 rounded", config.bgColor)}>
                            <Icon className={cn("h-3.5 w-3.5", config.color)} />
                          </div>
                          <span className="text-sm font-medium">{config.label}</span>
                          <Badge variant="outline" className="text-xs">
                            {count}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {completionRate}%
                        </span>
                      </div>
                      <Progress value={completionRate} className="h-1.5" />
                    </div>
                  )
                })}

              {/* Show message if no types have tasks */}
              {Object.values(stats.recurringByType).every(count => count === 0) && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Create recurring tasks to see breakdown
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <Repeat className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-2">
              No recurring tasks created yet
            </p>
            <p className="text-xs text-muted-foreground">
              Create a task with a recurrence pattern to track your habits
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
