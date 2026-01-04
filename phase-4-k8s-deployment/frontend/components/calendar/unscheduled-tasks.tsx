'use client'

import { CalendarX2, GripVertical } from 'lucide-react'
import type { Task } from '@/types/task'
import { cn } from '@/lib/utils'

interface UnscheduledTasksProps {
  tasks: Task[]
  onTaskClick?: (task: Task) => void
  className?: string
}

// Priority colors with dark/light mode support
const priorityColors: Record<string, string> = {
  High: 'dark:border-l-red-500 light:border-l-red-600',
  Medium: 'dark:border-l-amber-500 light:border-l-amber-600',
  Low: 'dark:border-l-blue-500 light:border-l-blue-600',
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
        <div className={cn(
          'flex items-center gap-2 mb-3',
          'dark:text-gray-400 light:text-gray-600'
        )}>
          <CalendarX2 className="w-4 h-4" />
          <span className="text-sm font-medium">Unscheduled Tasks</span>
        </div>
        <p className={cn(
          'text-xs text-center py-4',
          'dark:text-gray-500 light:text-gray-400'
        )}>
          No unscheduled tasks
        </p>
      </div>
    )
  }

  return (
    <div className={cn('p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <div className={cn(
          'flex items-center gap-2',
          'dark:text-gray-400 light:text-gray-700'
        )}>
          <CalendarX2 className="w-4 h-4" />
          <span className="text-sm font-medium">Unscheduled</span>
        </div>
        <span className={cn(
          'text-xs px-2 py-0.5 rounded-full',
          'dark:text-purple-400 dark:bg-purple-500/10',
          'light:text-purple-700 light:bg-purple-100'
        )}>
          {unscheduledTasks.length}
        </span>
      </div>

      <div className={cn(
        'space-y-2 max-h-[400px] overflow-y-auto',
        // Custom scrollbar
        '[&::-webkit-scrollbar]:w-2',
        '[&::-webkit-scrollbar-track]:dark:bg-transparent [&::-webkit-scrollbar-track]:light:bg-gray-100',
        '[&::-webkit-scrollbar-track]:rounded-full',
        '[&::-webkit-scrollbar-thumb]:dark:bg-purple-500/30 [&::-webkit-scrollbar-thumb]:light:bg-purple-300',
        '[&::-webkit-scrollbar-thumb]:rounded-full',
        '[&::-webkit-scrollbar-thumb]:hover:dark:bg-purple-500/50 [&::-webkit-scrollbar-thumb]:hover:light:bg-purple-400'
      )}>
        {unscheduledTasks.map((task) => (
          <div
            key={task.id}
            onClick={() => onTaskClick?.(task)}
            className={cn(
              'group flex items-center gap-2 p-2.5 rounded-lg border-l-2 cursor-pointer transition-all duration-200',
              'dark:bg-[#2a2a3e]/50 light:bg-gray-50',
              'dark:hover:bg-[#2a2a3e] dark:hover:border-l-purple-500/50',
              'light:hover:bg-gray-100 light:hover:border-l-purple-500',
              priorityColors[task.priority] || priorityColors.Medium
            )}
          >
            <GripVertical className={cn(
              'w-3 h-3 flex-shrink-0 transition-colors',
              'dark:text-gray-600 dark:group-hover:text-gray-400',
              'light:text-gray-400 light:group-hover:text-gray-600'
            )} />
            <span className={cn(
              'text-sm truncate flex-1',
              'dark:text-gray-300 light:text-gray-700'
            )}>
              {task.title}
            </span>
          </div>
        ))}
      </div>

      <p className={cn(
        'text-xs mt-3 text-center',
        'dark:text-gray-500 light:text-gray-400'
      )}>
        Drag tasks to calendar to schedule
      </p>
    </div>
  )
}
