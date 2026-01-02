/**
 * Tasks Page
 *
 * Comprehensive task management page with:
 * - Search functionality
 * - Filters (status, priority, tags)
 * - Sort options
 * - Task list with CRUD operations
 */

import { Suspense } from 'react'
import { Plus, ListTodo } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TaskListModern } from '@/components/tasks/task-list-modern'
import { TaskSkeleton } from '@/components/tasks/task-skeleton'
import { TaskFormDialog } from '@/components/tasks/task-form-dialog'
import { DashboardClient } from '../dashboard-client'
import { fetchTasks } from '@/actions/tasks'
import { cn } from '@/lib/utils'
import type { TaskSortBy, TaskSortDirection } from '@/types/task'

// Valid sort values
const VALID_SORT_BY_VALUES: TaskSortBy[] = [
  'created',
  'due_date',
  'priority',
  'title',
  'due_date_soonest',
  'created_newest',
  'created_oldest',
  'priority_high_low',
  'alphabetical_az',
]

const VALID_SORT_DIRECTION_VALUES: TaskSortDirection[] = ['asc', 'desc']

interface TasksPageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    priority?: string
    tags?: string | string[]
    sort_by?: string
    sort_direction?: string
  }>
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const params = await searchParams

  // Extract filter parameters
  const search = params.search || ''
  const status = params.status || 'all'
  const priority = params.priority || 'all'

  // Handle tags
  let tags: string[] = []
  if (params.tags) {
    tags = Array.isArray(params.tags) ? params.tags : [params.tags]
  }

  // Handle sorting with validation
  const sortByParam = params.sort_by as TaskSortBy | undefined
  const sortBy: TaskSortBy = sortByParam && VALID_SORT_BY_VALUES.includes(sortByParam)
    ? sortByParam
    : 'created'

  const sortDirectionParam = params.sort_direction as TaskSortDirection | undefined
  const sortDirection: TaskSortDirection = sortDirectionParam && VALID_SORT_DIRECTION_VALUES.includes(sortDirectionParam)
    ? sortDirectionParam
    : 'desc'

  // Fetch all tasks for tag extraction
  const allTasksResult = await fetchTasks({
    sort_by: sortBy,
    sort_direction: sortDirection,
    limit: 100,
  })

  // Extract unique tags
  const availableTags: string[] = []
  if (allTasksResult.tasks) {
    const tagSet = new Set<string>()
    allTasksResult.tasks.forEach(task => {
      if (task.tags) {
        task.tags.forEach(tag => tagSet.add(tag))
      }
    })
    availableTags.push(...Array.from(tagSet).sort())
  }

  return (
    <div className="space-y-6">
      {/* Header with modern styling */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className={cn(
              "p-2 rounded-xl",
              "dark:bg-purple-500/10 light:bg-purple-100"
            )}>
              <ListTodo className={cn(
                "h-6 w-6",
                "dark:text-purple-400 light:text-purple-600"
              )} />
            </div>
            <h1 className={cn(
              "text-3xl sm:text-4xl font-bold",
              "dark:text-white light:text-gray-900"
            )}>
              All Tasks
            </h1>
          </div>
          <p className={cn(
            "text-sm sm:text-base",
            "dark:text-gray-400 light:text-gray-600"
          )}>
            Manage and organize all your tasks
          </p>
        </div>

        <TaskFormDialog
          trigger={
            <Button
              size="lg"
              className={cn(
                "font-semibold shadow-lg transition-all duration-300",
                // Dark mode
                "dark:bg-purple-500 dark:text-white dark:hover:bg-purple-600",
                "dark:hover:shadow-[0_0_20px_rgba(168,85,247,0.5)]",
                // Light mode
                "light:bg-purple-600 light:text-white light:hover:bg-purple-700",
                "light:hover:shadow-xl"
              )}
            >
              <Plus className="mr-2 h-5 w-5" />
              New Task
            </Button>
          }
        />
      </div>

      {/* Search, Filters, and Sort */}
      <DashboardClient
        initialSearch={search}
        initialStatus={status}
        initialPriority={priority}
        initialTags={tags}
        availableTags={availableTags}
        initialSortBy={sortBy}
        initialSortDirection={sortDirection}
      />

      {/* Modern Task List with Cards */}
      <Suspense fallback={<TaskSkeleton count={5} />}>
        <TaskListModern
          search={search}
          status={status}
          priority={priority}
          tags={tags}
          sortBy={sortBy}
          sortDirection={sortDirection}
        />
      </Suspense>
    </div>
  )
}
