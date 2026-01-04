/**
 * Dashboard Client Component
 *
 * Client component handling search, filter, and sort UI with URL search params state management
 * Integrates TaskSearch, TaskFilters, and TaskSort components
 */

'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'

import { TaskSearch } from '@/components/tasks/task-search'
import { TaskFilters } from '@/components/tasks/task-filters'
import { TaskSort } from '@/components/tasks/task-sort'
import type { TaskSortBy, TaskSortDirection } from '@/types/task'

interface DashboardClientProps {
  initialSearch: string
  initialStatus: string
  initialPriority: string
  initialTags: string[]
  availableTags: string[]
  initialSortBy: TaskSortBy
  initialSortDirection: TaskSortDirection
}

export function DashboardClient({
  initialSearch,
  initialStatus,
  initialPriority,
  initialTags,
  availableTags,
  initialSortBy,
  initialSortDirection,
}: DashboardClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  /**
   * Update URL search params when filters change
   */
  const updateSearchParams = useCallback(
    (updates: Record<string, string | string[] | null>) => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '' || value === 'all') {
          params.delete(key)
        } else if (Array.isArray(value)) {
          params.delete(key)
          value.forEach((v) => params.append(key, v))
        } else {
          params.set(key, value)
        }
      })

      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
      router.push(newUrl)
    },
    [pathname, router, searchParams]
  )

  const handleSearchChange = (search: string) => {
    updateSearchParams({ search })
  }

  const handleStatusChange = (status: string) => {
    updateSearchParams({ status })
  }

  const handlePriorityChange = (priority: string) => {
    updateSearchParams({ priority })
  }

  const handleTagsChange = (tags: string[]) => {
    updateSearchParams({ tags: tags.length > 0 ? tags : null })
  }

  const handleSortByChange = (sortBy: TaskSortBy) => {
    // Don't add sort_by if it's the default (created)
    updateSearchParams({ sort_by: sortBy === 'created' ? null : sortBy })
  }

  const handleSortDirectionChange = (sortDirection: TaskSortDirection) => {
    // Don't add sort_direction if it's the default (desc)
    updateSearchParams({ sort_direction: sortDirection === 'desc' ? null : sortDirection })
  }

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        {/* Task Search Component - Full width on mobile/tablet, fixed on desktop */}
        <TaskSearch 
          value={initialSearch} 
          onChange={handleSearchChange} 
          className="w-full lg:w-96"
        />

        {/* Filters & Sort - Wrap on small screens */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Task Filters (Status, Priority, Tags) */}
          <TaskFilters
            status={initialStatus}
            priority={initialPriority}
            tags={initialTags}
            availableTags={availableTags}
            onStatusChange={handleStatusChange}
            onPriorityChange={handlePriorityChange}
            onTagsChange={handleTagsChange}
          />

          {/* Separator for visual grouping on large screens if needed, 
              but flex-wrap handles it naturally */}
          
          {/* Task Sort (Field + Direction) */}
          <TaskSort
            sortBy={initialSortBy}
            sortDirection={initialSortDirection}
            onSortByChange={handleSortByChange}
            onSortDirectionChange={handleSortDirectionChange}
          />
        </div>
      </div>
    </div>
  )
}
