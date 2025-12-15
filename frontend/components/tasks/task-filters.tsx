/**
 * Task Filters Component (Inline Dropdowns)
 *
 * Provides inline filtering controls:
 * - Status (All Status/Pending/Completed)
 * - Priority (All Priority/High/Medium/Low)
 * - Tags (multi-select with checkboxes)
 */

'use client'

import { ChevronDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'

interface TaskFiltersProps {
  status: string
  priority: string
  tags: string[]
  availableTags: string[] // Tags extracted from tasks
  onStatusChange: (status: string) => void
  onPriorityChange: (priority: string) => void
  onTagsChange: (tags: string[]) => void
  disabled?: boolean
  className?: string
}

// Status options
const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
]

// Priority options
const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priority' },
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' },
]

export function TaskFilters({
  status,
  priority,
  tags,
  availableTags,
  onStatusChange,
  onPriorityChange,
  onTagsChange,
  disabled = false,
  className = '',
}: TaskFiltersProps) {
  // Get current labels
  const currentStatusLabel = STATUS_OPTIONS.find(opt => opt.value === status)?.label || 'All Status'
  const currentPriorityLabel = PRIORITY_OPTIONS.find(opt => opt.value === priority)?.label || 'All Priority'

  // Handle tag toggle
  const handleTagToggle = (tagName: string, checked: boolean) => {
    if (checked) {
      onTagsChange([...tags, tagName])
    } else {
      onTagsChange(tags.filter(t => t !== tagName))
    }
  }

  // Clear all tags
  const handleClearTags = () => {
    onTagsChange([])
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Status Filter Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="default"
            disabled={disabled}
            className="gap-2 bg-muted/50 border-border/50 hover:bg-muted"
          >
            {currentStatusLabel}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          <DropdownMenuRadioGroup value={status} onValueChange={onStatusChange}>
            {STATUS_OPTIONS.map((option) => (
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

      {/* Priority Filter Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="default"
            disabled={disabled}
            className="gap-2 bg-muted/50 border-border/50 hover:bg-muted"
          >
            {currentPriorityLabel}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          <DropdownMenuRadioGroup value={priority} onValueChange={onPriorityChange}>
            {PRIORITY_OPTIONS.map((option) => (
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

      {/* Tags Filter Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="default"
            disabled={disabled}
            className="gap-2 bg-muted/50 border-border/50 hover:bg-muted"
          >
            {tags.length > 0 ? (
              <>
                Tags
                <Badge variant="secondary" className="ml-1 rounded-full px-1.5 py-0 text-xs">
                  {tags.length}
                </Badge>
              </>
            ) : (
              'All Tags'
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {availableTags.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground text-center">
              No tags available
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-2 py-1.5">
                <DropdownMenuLabel className="p-0 font-medium">Filter by Tags</DropdownMenuLabel>
                {tags.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.preventDefault()
                      handleClearTags()
                    }}
                  >
                    Reset
                  </Button>
                )}
              </div>
              <DropdownMenuSeparator />
              <div className="max-h-[200px] overflow-y-auto">
                {availableTags.map((tag) => (
                  <div
                    key={tag}
                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded-sm cursor-pointer"
                    onClick={() => handleTagToggle(tag, !tags.includes(tag))}
                  >
                    <Checkbox
                      checked={tags.includes(tag)}
                      onCheckedChange={(checked) => handleTagToggle(tag, checked === true)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <span className="text-sm flex-1">{tag}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
