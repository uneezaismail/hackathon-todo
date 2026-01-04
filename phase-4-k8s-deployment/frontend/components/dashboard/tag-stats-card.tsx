/**
 * Tag Stats Card Component - Phase 7
 *
 * Displays statistics for tags including:
 * - Task count per tag
 * - Completion rate by tag
 * - Average completion time
 */

'use client'

import * as React from 'react'
import { Task } from '@/types/task'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { getTagStats, TagStats } from '@/lib/analytics'
import { Tag, Clock, CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TagStatsCardProps {
  tasks: Task[]
  limit?: number
  className?: string
}

// Predefined colors for tags (cycles through these)
const TAG_COLORS = [
  { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
  { text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10' },
  { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
  { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
  { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10' },
  { text: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-500/10' },
  { text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10' },
  { text: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-500/10' },
]

function getTagColor(index: number) {
  return TAG_COLORS[index % TAG_COLORS.length]
}

export function TagStatsCard({ tasks, limit = 5, className }: TagStatsCardProps) {
  const tagStats = React.useMemo(() => getTagStats(tasks).slice(0, limit), [tasks, limit])

  const hasTags = tagStats.length > 0

  return (
    <Card className={cn(
      "border-2 transition-all duration-300",
      "dark:bg-[#1a1a2e] dark:border-[#A855F7]/20",
      "light:bg-white light:border-[#A855F7]/20",
      "hover:shadow-lg hover:border-[#A855F7]/40 dark:hover:shadow-purple-500/20 light:hover:shadow-purple-500/10",
      className
    )}>
      <CardHeader className={cn(
        "pb-4 border-b",
        "dark:border-[#A855F7]/20",
        "light:border-[#A855F7]/10"
      )}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2 dark:text-white light:text-gray-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/10 dark:bg-purple-600/10 light:bg-purple-50">
                <Tag className="h-5 w-5 text-purple-500 dark:text-purple-400 light:text-purple-600" />
              </div>
              Tag Analytics
            </CardTitle>
            <CardDescription className="dark:text-gray-400 light:text-gray-600">
              {hasTags
                ? `${tagStats.length} tag${tagStats.length !== 1 ? 's' : ''} in use`
                : 'No tags used yet'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-5">
        {hasTags ? (
          <div className="space-y-4">
            {tagStats.map((tag, index) => {
              const color = getTagColor(index)

              return (
                <div key={tag.name} className="p-3 rounded-lg border border-[#A855F7]/10 dark:border-[#A855F7]/10 light:border-[#A855F7]/5 bg-[#A855F7]/5 dark:bg-[#A855F7]/5 light:bg-[#A855F7]/2 space-y-3">
                  {/* Tag header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={cn("font-semibold border-2", color.text, color.bg)}
                      >
                        {tag.name}
                      </Badge>
                      <span className="text-xs dark:text-gray-300 light:text-gray-700 font-medium">
                        {tag.totalTasks} task{tag.totalTasks !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-purple-500 dark:text-purple-300 light:text-purple-600">
                      {tag.completionRate}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <Progress value={tag.completionRate} className="h-2" />

                  {/* Stats row */}
                  <div className="flex items-center gap-4 text-xs dark:text-gray-400 light:text-gray-600 font-medium">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400 light:text-emerald-600" />
                      <span className="font-medium">{tag.completedTasks} done</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Circle className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400 light:text-amber-600" />
                      <span className="font-medium">{tag.pendingTasks} pending</span>
                    </div>
                    {tag.avgCompletionTime > 0 && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-purple-500 dark:text-purple-400 light:text-purple-600" />
                        <span className="font-medium">{tag.avgCompletionTime}d avg</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#A855F7]/20 to-[#A855F7]/5 dark:bg-gradient-to-br dark:from-[#A855F7]/20 dark:to-[#A855F7]/5 light:bg-gradient-to-br light:from-[#A855F7]/10 light:to-[#A855F7]/5 mx-auto mb-4 border border-[#A855F7]/20">
              <Tag className="h-8 w-8 text-purple-500 dark:text-purple-400 light:text-purple-600" />
            </div>
            <p className="text-sm dark:text-gray-200 light:text-gray-800 font-semibold mb-2">
              No tags used yet
            </p>
            <p className="text-xs dark:text-gray-400 light:text-gray-600">
              Add tags to your tasks to see analytics here
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
