/**
 * Task List Component (Enhanced for Table View)
 *
 * Server Component that fetches and displays tasks in a table layout
 * - Table-based display with columns: Task, Status, Priority, Due Date
 * - Empty state message when search/filter returns zero results
 * - Sort integration for task list
 */

import { fetchTasks } from '@/actions/tasks'
import { TaskTable } from './task-table'
import { EmptyState } from './empty-state'
import type { TaskSortBy, TaskSortDirection } from '@/types/task'
import { filterOutPatterns } from '@/lib/task-utils'

interface TaskListProps {
  search?: string
  status?: string
  priority?: string
  tags?: string[]
  sortBy?: TaskSortBy
  sortDirection?: TaskSortDirection
  limit?: number
  offset?: number
}

/**
 * Task List Server Component with Search, Filter, and Sort Support
 */
export async function TaskList({
  search,
  status,
  priority,
  tags,
  sortBy,
  sortDirection,
  limit,
  offset,
}: TaskListProps) {
  // Fetch tasks using server action with search, filters, and sort
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

  // Handle error state
  if (result.error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{result.error}</p>
        <p className="text-sm text-muted-foreground">
          Please try refreshing the page or contact support if the problem persists.
        </p>
      </div>
    )
  }

  // Todoist-style: Filter out only legacy patterns (if any)
  // New recurring tasks are single tasks with shifting due_date, not patterns
  const tasks = filterOutPatterns(result.tasks || [])
  const total = tasks.length  // Use filtered length for display

  // Determine if filters are active
  const hasActiveFilters =
    (search && search.trim().length > 0) ||
    (status && status !== 'all') ||
    (priority && priority !== 'all') ||
    (tags && tags.length > 0)

  // Handle empty state
  if (tasks.length === 0) {
    // Different message when filters are active
    if (hasActiveFilters) {
      return (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-8 h-8 text-muted-foreground"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">No tasks match your filters</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search or filters to find what you&apos;re looking for.
          </p>
          <p className="text-sm text-muted-foreground">
            Active filters:{' '}
            {[
              search && `"${search}"`,
              status !== 'all' && status,
              priority !== 'all' && priority,
              tags && tags.length > 0 && `${tags.length} tag(s)`,
            ]
              .filter(Boolean)
              .join(', ')}
          </p>
        </div>
      )
    }

    // No filters active - show default empty state
    return <EmptyState />
  }

  return (
    <div className="space-y-4" role="list">
      {/* Show result count when filters are active */}
      {hasActiveFilters && (
        <div className="text-sm text-muted-foreground mb-4">
          Found {total} task{total !== 1 ? 's' : ''}
        </div>
      )}

      <TaskTable tasks={tasks} />
    </div>
  )
}
