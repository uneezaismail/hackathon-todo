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
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Tag className="h-5 w-5 text-blue-500" />
              Tag Analytics
            </CardTitle>
            <CardDescription>
              {hasTags
                ? `${tagStats.length} tag${tagStats.length !== 1 ? 's' : ''} in use`
                : 'No tags used yet'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasTags ? (
          <div className="space-y-3">
            {tagStats.map((tag, index) => {
              const color = getTagColor(index)

              return (
                <div key={tag.name} className="space-y-2">
                  {/* Tag header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={cn("font-medium", color.text, color.bg)}
                      >
                        {tag.name}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {tag.totalTasks} task{tag.totalTasks !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <span className="text-sm font-medium">
                      {tag.completionRate}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <Progress value={tag.completionRate} className="h-1.5" />

                  {/* Stats row */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      {tag.completedTasks} done
                    </div>
                    <div className="flex items-center gap-1">
                      <Circle className="h-3 w-3 text-amber-500" />
                      {tag.pendingTasks} pending
                    </div>
                    {tag.avgCompletionTime > 0 && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {tag.avgCompletionTime}d avg
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <Tag className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-2">
              No tags used yet
            </p>
            <p className="text-xs text-muted-foreground">
              Add tags to your tasks to see analytics here
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
