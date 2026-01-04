/**
 * Modern Task List Component (2025 Design)
 *
 * Card-based layout with:
 * - 12px spacing between cards
 * - Load more pagination
 * - Skeleton loaders
 * - Empty states
 */

import { fetchTasks } from '@/actions/tasks'
import { TaskCardModern } from './task-card-modern'
import { TaskSkeleton } from './task-skeleton'
import { filterOutPatterns } from '@/lib/task-utils'
import { SearchX } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TaskSortBy, TaskSortDirection } from '@/types/task'

interface TaskListModernProps {
  search?: string
  status?: string
  priority?: string
  tags?: string[]
  sortBy?: TaskSortBy
  sortDirection?: TaskSortDirection
  limit?: number
  offset?: number
}

export async function TaskListModern({
  search,
  status,
  priority,
  tags,
  sortBy,
  sortDirection,
  limit = 15,
  offset = 0,
}: TaskListModernProps) {
  // Fetch tasks
  const result = await fetchTasks({
    search,
    status,
    priority,
    tags,
    sort_by: sortBy,
    sort_direction: sortDirection,
    limit,
    offset,
  })

  // Handle error
  if (result.error) {
    return (
      <div className={cn(
        "text-center py-12 rounded-xl border-2",
        "dark:bg-red-500/5 dark:border-red-500/20",
        "light:bg-red-50 light:border-red-200"
      )}>
        <p className={cn(
          "text-sm font-medium mb-2",
          "dark:text-red-400 light:text-red-600"
        )}>
          {result.error}
        </p>
        <p className={cn(
          "text-xs",
          "dark:text-gray-400 light:text-gray-600"
        )}>
          Please try refreshing the page or contact support if the problem persists.
        </p>
      </div>
    )
  }

  // Filter out patterns
  const tasks = filterOutPatterns(result.tasks || [])

  // Check for active filters
  const hasActiveFilters =
    (search && search.trim().length > 0) ||
    (status && status !== 'all') ||
    (priority && priority !== 'all') ||
    (tags && tags.length > 0)

  // Empty state
  if (tasks.length === 0) {
    if (hasActiveFilters) {
      return (
        <div className="text-center py-16">
          <div className={cn(
            "mx-auto w-16 h-16 mb-4 rounded-full flex items-center justify-center",
            "dark:bg-[#2a2a3e] light:bg-gray-100"
          )}>
            <SearchX className={cn(
              "w-8 h-8",
              "dark:text-gray-500 light:text-gray-400"
            )} />
          </div>
          <h3 className={cn(
            "text-lg font-semibold mb-2",
            "dark:text-white light:text-gray-900"
          )}>
            No tasks match your filters
          </h3>
          <p className={cn(
            "text-sm",
            "dark:text-gray-400 light:text-gray-600"
          )}>
            Try adjusting your search or filters to find what you&apos;re looking for.
          </p>
        </div>
      )
    }

    return (
      <div className="text-center py-16">
        <div className={cn(
          "mx-auto w-16 h-16 mb-4 rounded-full flex items-center justify-center",
          "dark:bg-[#2a2a3e] light:bg-gray-100"
        )}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={cn(
              "w-8 h-8",
              "dark:text-gray-500 light:text-gray-400"
            )}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
            />
          </svg>
        </div>
        <h3 className={cn(
          "text-lg font-semibold mb-2",
          "dark:text-white light:text-gray-900"
        )}>
          No tasks yet
        </h3>
        <p className={cn(
          "text-sm",
          "dark:text-gray-400 light:text-gray-600"
        )}>
          Click &quot;New Task&quot; to create your first task.
        </p>
      </div>
    )
  }

  // Task grid with 12px spacing
  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskCardModern key={task.id} task={task} />
      ))}

      {/* Results count */}
      <div className={cn(
        "text-sm text-center py-4",
        "dark:text-gray-500 light:text-gray-600"
      )}>
        Showing {tasks.length} task{tasks.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}
