/**
 * Task Sort Component
 *
 * Provides sorting controls with:
 * - Sort field dropdown (Created, Due Date, Priority, Title)
 * - Sort direction dropdown (Ascending/Descending)
 */

'use client'

import { ChevronDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { TaskSortBy, TaskSortDirection } from '@/types/task'

interface TaskSortProps {
  sortBy: TaskSortBy
  sortDirection: TaskSortDirection
  onSortByChange: (value: TaskSortBy) => void
  onSortDirectionChange: (value: TaskSortDirection) => void
  disabled?: boolean
  className?: string
}

// Sort field options
const SORT_FIELDS: { value: TaskSortBy; label: string }[] = [
  { value: 'created', label: 'Created' },
  { value: 'due_date', label: 'Due Date' },
  { value: 'priority', label: 'Priority' },
  { value: 'title', label: 'Title' },
]

// Sort direction options
const SORT_DIRECTIONS: { value: TaskSortDirection; label: string }[] = [
  { value: 'desc', label: 'Descending' },
  { value: 'asc', label: 'Ascending' },
]

export function TaskSort({
  sortBy,
  sortDirection,
  onSortByChange,
  onSortDirectionChange,
  disabled = false,
  className = '',
}: TaskSortProps) {
  // Get current labels
  const currentFieldLabel = SORT_FIELDS.find(opt => opt.value === sortBy)?.label || 'Created'
  const currentDirectionLabel = SORT_DIRECTIONS.find(opt => opt.value === sortDirection)?.label || 'Descending'

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* Sort Field Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="default"
            disabled={disabled}
            className={cn(
              "h-11 gap-2 rounded-xl border-2 font-medium transition-all duration-200",
              // Dark mode
              "dark:bg-[#1a1a2e] dark:border-[#2a2a3e]",
              "dark:text-white dark:hover:bg-[#2a2a3e] dark:hover:border-purple-500/40",
              // Light mode
              "light:bg-white light:border-gray-200",
              "light:text-gray-900 light:hover:bg-gray-50 light:hover:border-purple-400"
            )}
          >
            {currentFieldLabel}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className={cn(
          "w-40 rounded-xl border-2",
          "dark:bg-[#1a1a2e] dark:border-[#2a2a3e]",
          "light:bg-white light:border-gray-200"
        )}>
          <DropdownMenuRadioGroup value={sortBy} onValueChange={(v) => onSortByChange(v as TaskSortBy)}>
            {SORT_FIELDS.map((option) => (
              <DropdownMenuRadioItem
                key={option.value}
                value={option.value}
                className={cn(
                  "transition-colors",
                  "dark:hover:bg-purple-500/10 dark:text-white",
                  "light:hover:bg-purple-50 light:text-gray-900"
                )}
              >
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sort Direction Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="default"
            disabled={disabled}
            className={cn(
              "h-11 gap-2 rounded-xl border-2 font-medium transition-all duration-200",
              // Dark mode
              "dark:bg-[#1a1a2e] dark:border-[#2a2a3e]",
              "dark:text-white dark:hover:bg-[#2a2a3e] dark:hover:border-purple-500/40",
              // Light mode
              "light:bg-white light:border-gray-200",
              "light:text-gray-900 light:hover:bg-gray-50 light:hover:border-purple-400"
            )}
          >
            {currentDirectionLabel}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className={cn(
          "w-40 rounded-xl border-2",
          "dark:bg-[#1a1a2e] dark:border-[#2a2a3e]",
          "light:bg-white light:border-gray-200"
        )}>
          <DropdownMenuRadioGroup value={sortDirection} onValueChange={(v) => onSortDirectionChange(v as TaskSortDirection)}>
            {SORT_DIRECTIONS.map((option) => (
              <DropdownMenuRadioItem
                key={option.value}
                value={option.value}
                className={cn(
                  "transition-colors",
                  "dark:hover:bg-purple-500/10 dark:text-white",
                  "light:hover:bg-purple-50 light:text-gray-900"
                )}
              >
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
