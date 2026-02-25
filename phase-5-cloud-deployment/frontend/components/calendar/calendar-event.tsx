'use client'

import { EventProps } from 'react-big-calendar'
import { Check, Repeat } from 'lucide-react'
import type { CalendarEventData } from './task-calendar'
import { cn } from '@/lib/utils'
import { getRecurrencePatternText } from '@/lib/analytics'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// Priority colors - more vibrant for dark theme
const priorityColors: Record<string, { bg: string; border: string; text: string }> = {
  High: { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-300' },
  Medium: { bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-300' },
  Low: { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-300' },
}

export function CalendarEvent({ event }: EventProps<CalendarEventData>) {
  const task = event.resource
  const isCompleted = task.completed
  const isOverdue =
    !isCompleted && task.due_date && new Date(task.due_date) < new Date()
  const isRecurring = (task as { is_recurring?: boolean }).is_recurring

  const priority = task.priority || 'Medium'
  const colors = priorityColors[priority] || priorityColors.Medium

  return (
    <div
      className={cn(
        'flex items-center gap-1 px-1.5 py-0.5 w-full overflow-hidden rounded',
        'border-l-2',
        colors.bg,
        colors.border,
        isCompleted && 'opacity-50 line-through',
        isOverdue && 'ring-1 ring-red-500/50'
      )}
    >
      {/* Task title */}
      <span
        className={cn(
          'truncate text-xs font-medium flex-1 min-w-0',
          colors.text,
          isCompleted && 'line-through opacity-70'
        )}
        title={task.title}
      >
        {task.title}
      </span>

      {/* Status indicators */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {/* Recurring indicator with tooltip */}
        {isRecurring && getRecurrencePatternText(task) && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Repeat
                  className={cn(
                    'w-2.5 h-2.5 cursor-help',
                    isCompleted ? 'text-white/40' : 'text-purple-400'
                  )}
                  aria-label="Recurring task"
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Recurring: {getRecurrencePatternText(task)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Completed indicator */}
        {isCompleted && (
          <Check
            className="w-2.5 h-2.5 text-green-400"
            aria-label="Completed"
          />
        )}
      </div>
    </div>
  )
}
