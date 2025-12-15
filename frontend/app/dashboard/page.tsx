/**
 * Dashboard Page
 *
 * Main dashboard page showing task list with:
 * - TaskSearch component integration
 * - TaskFilters component integration (inline dropdowns)
 * - TaskSort component integration (field + direction)
 * - Create/manage functionality
 * - Frontend-based tag filtering
 */

import { Suspense } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { TaskList } from '@/components/tasks/task-list'
import { TaskFormDialog } from '@/components/tasks/task-form-dialog'
import { DashboardClient } from './dashboard-client'
import { fetchTasks } from '@/actions/tasks'
import type { TaskSortBy, TaskSortDirection } from '@/types/task'

// Valid sort_by values
const VALID_SORT_BY_VALUES: TaskSortBy[] = [
  'created',
  'due_date',
  'priority',
  'title',
  // Legacy values for backward compatibility
  'due_date_soonest',
  'created_newest',
  'created_oldest',
  'priority_high_low',
  'alphabetical_az',
]

// Valid sort direction values
const VALID_SORT_DIRECTION_VALUES: TaskSortDirection[] = ['asc', 'desc']

interface DashboardPageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    priority?: string
    tags?: string | string[]
    sort_by?: string
    sort_direction?: string
  }>
}

/**
 * Dashboard Page with Search, Filters, Sort, and URL State Management
 */
export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  // Next.js 16: searchParams is a Promise that must be awaited
  const params = await searchParams

  // Extract all filter parameters from URL
  const search = params.search || ''
  const status = params.status || 'all'
  const priority = params.priority || 'all'

  // Handle tags - can be single string or array
  let tags: string[] = []
  if (params.tags) {
    tags = Array.isArray(params.tags) ? params.tags : [params.tags]
  }

  // Handle sort_by parameter with validation
  const sortByParam = params.sort_by as TaskSortBy | undefined
  const sortBy: TaskSortBy = sortByParam && VALID_SORT_BY_VALUES.includes(sortByParam)
    ? sortByParam
    : 'created' // Default to created

  // Handle sort_direction parameter with validation
  const sortDirectionParam = params.sort_direction as TaskSortDirection | undefined
  const sortDirection: TaskSortDirection = sortDirectionParam && VALID_SORT_DIRECTION_VALUES.includes(sortDirectionParam)
    ? sortDirectionParam
    : 'desc' // Default to descending

  // Fetch all tasks to extract available tags (without tag filter)
  const allTasksResult = await fetchTasks({
    sort_by: sortBy,
    sort_direction: sortDirection,
    limit: 100, // Get enough to extract tags
  })

  // Extract unique tags from all tasks
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
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground mt-2">
            View and manage tasks across all projects
          </p>
        </div>

        <TaskFormDialog
          trigger={
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          }
        />
      </div>

      {/* Search, Filters, Sort, and URL State Management */}
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
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-muted animate-pulse rounded-lg"
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
