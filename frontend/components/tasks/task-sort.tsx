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
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Sort Field Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="default"
            disabled={disabled}
            className="gap-2 bg-muted/50 border-border/50 hover:bg-muted"
          >
            {currentFieldLabel}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          <DropdownMenuRadioGroup value={sortBy} onValueChange={(v) => onSortByChange(v as TaskSortBy)}>
            {SORT_FIELDS.map((option) => (
              <DropdownMenuRadioItem
                key={option.value}
                value={option.value}
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
            className="gap-2 bg-muted/50 border-border/50 hover:bg-muted"
          >
            {currentDirectionLabel}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          <DropdownMenuRadioGroup value={sortDirection} onValueChange={(v) => onSortDirectionChange(v as TaskSortDirection)}>
            {SORT_DIRECTIONS.map((option) => (
              <DropdownMenuRadioItem
                key={option.value}
                value={option.value}
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
