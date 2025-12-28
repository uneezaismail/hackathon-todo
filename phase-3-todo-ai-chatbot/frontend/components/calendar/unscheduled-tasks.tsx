'use client'

import { CalendarX2, GripVertical } from 'lucide-react'
import type { Task } from '@/types/task'
import { cn } from '@/lib/utils'

interface UnscheduledTasksProps {
  tasks: Task[]
  onTaskClick?: (task: Task) => void
  className?: string
}

// Priority colors
const priorityColors: Record<string, string> = {
  High: 'border-l-red-500',
  Medium: 'border-l-amber-500',
  Low: 'border-l-blue-500',
}

export function UnscheduledTasks({
  tasks,
  onTaskClick,
  className,
}: UnscheduledTasksProps) {
  // Filter tasks without due dates
  const unscheduledTasks = tasks.filter((task) => !task.due_date && !task.completed)

  if (unscheduledTasks.length === 0) {
    return (
      <div className={cn('p-4', className)}>
        <div className="flex items-center gap-2 text-white/40 mb-3">
          <CalendarX2 className="w-4 h-4" />
          <span className="text-sm font-medium">Unscheduled Tasks</span>
        </div>
        <p className="text-xs text-white/30 text-center py-4">
          No unscheduled tasks
        </p>
      </div>
    )
  }

  return (
    <div className={cn('p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-white/60">
          <CalendarX2 className="w-4 h-4" />
          <span className="text-sm font-medium">Unscheduled</span>
        </div>
        <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
          {unscheduledTasks.length}
        </span>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {unscheduledTasks.map((task) => (
          <div
            key={task.id}
            onClick={() => onTaskClick?.(task)}
            className={cn(
              'group flex items-center gap-2 p-2 rounded-lg bg-white/5 border-l-2 cursor-pointer',
              'hover:bg-white/10 transition-colors',
              priorityColors[task.priority] || priorityColors.Medium
            )}
          >
            <GripVertical className="w-3 h-3 text-white/20 group-hover:text-white/40 flex-shrink-0" />
            <span className="text-sm text-white/80 truncate flex-1">{task.title}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-white/30 mt-3 text-center">
        Drag tasks to calendar to schedule
      </p>
    </div>
  )
}
