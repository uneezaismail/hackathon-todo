/**
 * Dashboard Page (T081, T104)
 *
 * Main dashboard page showing task list with create/manage functionality
 * Server Component that handles authentication and fetches data
 * Now includes task filtering (T104)
 */

import { Suspense } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { TaskList } from '@/components/tasks/task-list'
import { TaskFormDialog } from '@/components/tasks/task-form-dialog'
import TaskFilters from '@/components/tasks/task-filters'

interface DashboardPageProps {
  searchParams: Promise<{ status?: string }>
}

/**
 * T081: Dashboard Page with Task List
 * T104: Integrate task filters in dashboard page
 */
export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  // Next.js 16: searchParams is a Promise that must be awaited
  const params = await searchParams
  const status = params.status

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
          <p className="text-muted-foreground mt-2">
            Manage your todo list and stay productive
          </p>
        </div>

        <TaskFormDialog
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          }
        />
      </div>

      {/* Task Filters (T104) */}
      <TaskFilters />

      {/* Task List */}
      <Suspense
        fallback={
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-muted animate-pulse rounded-lg"
              />
            ))}
          </div>
        }
      >
        <TaskList status={status} />
      </Suspense>
    </div>
  )
}
