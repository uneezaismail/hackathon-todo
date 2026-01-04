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
            <CardTitle className="text-lg font-semibold flex items-center gap-2 dark:text-white light:text-gray-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/10 dark:bg-purple-600/10 light:bg-purple-50">
                <Repeat className="h-5 w-5 text-purple-500 dark:text-purple-400 light:text-purple-600" />
              </div>
              Recurring Tasks
            </CardTitle>
            <CardDescription className="dark:text-gray-400 light:text-gray-600">
              {hasRecurringTasks
                ? `${stats.activeRecurringTasks} active patterns`
                : 'No recurring tasks yet'}
            </CardDescription>
          </div>
          {stats.streakByRecurring > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1 bg-orange-500/10 dark:bg-orange-500/10 light:bg-orange-50 text-orange-600 dark:text-orange-400 light:text-orange-700 border border-orange-500/20">
              <Flame className="h-3 w-3" />
              <span className="font-semibold">{stats.streakByRecurring} day streak</span>
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasRecurringTasks ? (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className={cn(
                "p-4 rounded-xl border transition-colors",
                "dark:border-[#2a2a3e] light:border-[#e5e5ea]",
                "hover:bg-purple-500/5"
              )}>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 light:text-purple-700">{stats.totalRecurringTasks}</div>
                <div className="text-xs dark:text-gray-400 light:text-gray-600 uppercase tracking-wide font-medium mt-1">Total Patterns</div>
              </div>
              <div className={cn(
                "p-4 rounded-xl border transition-colors",
                "dark:border-[#2a2a3e] light:border-[#e5e5ea]",
                "hover:bg-purple-500/5"
              )}>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 light:text-purple-700">{stats.completedOccurrences}</div>
                <div className="text-xs dark:text-gray-400 light:text-gray-600 uppercase tracking-wide font-medium mt-1">Completed</div>
              </div>
            </div>

            {/* Breakdown by type */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold dark:text-gray-300 light:text-gray-700 uppercase tracking-wide">By Recurrence Type</h4>
              {(Object.entries(stats.recurringByType) as [keyof typeof RECURRENCE_TYPE_CONFIG, number][])
                .filter(([_, count]) => count > 0)
                .map(([type, count]) => {
                  const config = RECURRENCE_TYPE_CONFIG[type]
                  const Icon = config.icon
                  const completionRate = stats.completionRateByType[type]

                  return (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn("p-2 rounded-xl", config.bgColor)}>
                            <Icon className={cn("h-4 w-4", config.color)} />
                          </div>
                          <span className="text-sm font-semibold dark:text-white light:text-gray-900">{config.label}</span>
                          <Badge variant="outline" className="text-xs font-semibold dark:bg-purple-500/10 dark:border-purple-500/20 dark:text-purple-400 light:bg-purple-50 light:border-purple-300 light:text-purple-700">
                            {count}
                          </Badge>
                        </div>
                        <span className="text-sm font-bold text-purple-600 dark:text-purple-400 light:text-purple-700">
                          {completionRate}%
                        </span>
                      </div>
                      <Progress value={completionRate} className="h-2" />
                    </div>
                  )
                })}

              {/* Show message if no types have tasks */}
              {Object.values(stats.recurringByType).every(count => count === 0) && (
                <p className="text-sm dark:text-gray-400 light:text-gray-600 text-center py-3">
                  Create recurring tasks to see breakdown
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-600/10 dark:bg-purple-600/10 light:bg-purple-50 mx-auto mb-4">
              <Repeat className="h-8 w-8 text-purple-500 dark:text-purple-400 light:text-purple-600 opacity-50" />
            </div>
            <p className="text-sm dark:text-gray-300 light:text-gray-700 font-medium mb-2">
              No recurring tasks created yet
            </p>
            <p className="text-xs dark:text-gray-500 light:text-gray-500">
              Create a task with a recurrence pattern to track your habits
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
