/**
 * Task Filters Component (T100-T102)
 *
 * Client Component that displays filter buttons for task status:
 * - All tasks
 * - Pending tasks
 * - Completed tasks
 *
 * Uses URL search params for state persistence
 * Highlights active filter visually
 *
 * @component TaskFilters
 */

'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { TaskFilter } from '@/types/task'

interface TaskFiltersProps {
  counts?: {
    all?: number
    pending?: number
    completed?: number
  }
}

/**
 * T100: Task Filters Component
 * T101: Filter state management with URL search params
 * T102: Filter buttons for "All", "Pending", "Completed"
 */
export default function TaskFilters({ counts }: TaskFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // Get current filter from URL (default to 'all')
  const currentFilter = (searchParams.get('status') as TaskFilter) || 'all'

  /**
   * Handle filter change
   * Updates URL search params with new filter
   * Preserves other query parameters
   */
  const handleFilterChange = (filter: TaskFilter) => {
    const params = new URLSearchParams(searchParams.toString())

    if (filter === 'all') {
      // Remove status param for "All" filter
      params.delete('status')
    } else {
      // Set status param for specific filters
      params.set('status', filter)
    }

    // Build new URL with updated params
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname

    // Navigate to new URL
    router.push(newUrl)
  }

  /**
   * Get button variant based on active state
   */
  const getButtonVariant = (filter: TaskFilter): 'default' | 'outline' => {
    return currentFilter === filter ? 'default' : 'outline'
  }

  return (
    <div
      role="group"
      aria-label="Task filters"
      className="flex flex-wrap items-center gap-2 mb-6"
    >
      {/* All Tasks Filter */}
      <Button
        variant={getButtonVariant('all')}
        size="sm"
        onClick={() => handleFilterChange('all')}
        className={currentFilter === 'all' ? 'bg-primary' : ''}
        aria-current={currentFilter === 'all' ? 'true' : 'false'}
      >
        All
        {counts?.all !== undefined && (
          <Badge variant="secondary" className="ml-2">
            {counts.all}
          </Badge>
        )}
      </Button>

      {/* Pending Tasks Filter */}
      <Button
        variant={getButtonVariant('pending')}
        size="sm"
        onClick={() => handleFilterChange('pending')}
        className={currentFilter === 'pending' ? 'bg-primary' : ''}
        aria-current={currentFilter === 'pending' ? 'true' : 'false'}
      >
        Pending
        {counts?.pending !== undefined && (
          <Badge variant="secondary" className="ml-2">
            {counts.pending}
          </Badge>
        )}
      </Button>

      {/* Completed Tasks Filter */}
      <Button
        variant={getButtonVariant('completed')}
        size="sm"
        onClick={() => handleFilterChange('completed')}
        className={currentFilter === 'completed' ? 'bg-primary' : ''}
        aria-current={currentFilter === 'completed' ? 'true' : 'false'}
      >
        Completed
        {counts?.completed !== undefined && (
          <Badge variant="secondary" className="ml-2">
            {counts.completed}
          </Badge>
        )}
      </Button>
    </div>
  )
}
