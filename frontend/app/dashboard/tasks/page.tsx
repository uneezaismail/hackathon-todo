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
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TaskList } from '@/components/tasks/task-list'
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground">All Tasks</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Manage and organize all your tasks
          </p>
        </div>

        <TaskFormDialog
          trigger={
            <Button
              size="lg"
              className={cn(
                'bg-[#00d4b8] text-[#0f1729] hover:bg-[#00e5cc]',
                'hover:shadow-[0_0_20px_rgba(0,212,184,0.5)]',
                'transition-all duration-300',
                'dark:text-[#0f1729]'
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

      {/* Task List */}
      <Suspense
        fallback={
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-24 bg-card animate-pulse rounded-xl border-2 border-border"
              />
            ))}
          </div>
        }
      >
        <TaskList
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
