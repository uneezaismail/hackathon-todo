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
import { cn } from '@/lib/utils'
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
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* Status Filter Dropdown */}
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
            {currentStatusLabel}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className={cn(
          "w-40 rounded-xl border-2",
          "dark:bg-[#1a1a2e] dark:border-[#2a2a3e]",
          "light:bg-white light:border-gray-200"
        )}>
          <DropdownMenuRadioGroup value={status} onValueChange={onStatusChange}>
            {STATUS_OPTIONS.map((option) => (
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

      {/* Priority Filter Dropdown */}
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
            {currentPriorityLabel}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className={cn(
          "w-40 rounded-xl border-2",
          "dark:bg-[#1a1a2e] dark:border-[#2a2a3e]",
          "light:bg-white light:border-gray-200"
        )}>
          <DropdownMenuRadioGroup value={priority} onValueChange={onPriorityChange}>
            {PRIORITY_OPTIONS.map((option) => (
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

      {/* Tags Filter Dropdown */}
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
            {tags.length > 0 ? (
              <>
                Tags
                <Badge variant="secondary" className={cn(
                  "ml-1 rounded-full px-1.5 py-0 text-xs",
                  "dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30",
                  "light:bg-purple-100 light:text-purple-700 light:border-purple-200"
                )}>
                  {tags.length}
                </Badge>
              </>
            ) : (
              'All Tags'
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className={cn(
          "w-56 rounded-xl border-2",
          "dark:bg-[#1a1a2e] dark:border-[#2a2a3e]",
          "light:bg-white light:border-gray-200"
        )}>
          {availableTags.length === 0 ? (
            <div className={cn(
              "p-3 text-sm text-center",
              "dark:text-gray-400 light:text-gray-600"
            )}>
              No tags available
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-2 py-1.5">
                <DropdownMenuLabel className={cn(
                  "p-0 font-medium",
                  "dark:text-white light:text-gray-900"
                )}>
                  Filter by Tags
                </DropdownMenuLabel>
                {tags.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-auto px-2 py-1 text-xs transition-colors",
                      "dark:text-gray-400 dark:hover:text-purple-400 dark:hover:bg-purple-500/10",
                      "light:text-gray-600 light:hover:text-purple-700 light:hover:bg-purple-50"
                    )}
                    onClick={(e) => {
                      e.preventDefault()
                      handleClearTags()
                    }}
                  >
                    Reset
                  </Button>
                )}
              </div>
              <DropdownMenuSeparator className={cn(
                "dark:bg-[#2a2a3e] light:bg-gray-200"
              )} />
              <div className="max-h-[200px] overflow-y-auto">
                {availableTags.map((tag) => (
                  <div
                    key={tag}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer transition-colors",
                      "dark:hover:bg-purple-500/10 light:hover:bg-purple-50"
                    )}
                    onClick={() => handleTagToggle(tag, !tags.includes(tag))}
                  >
                    <Checkbox
                      checked={tags.includes(tag)}
                      onCheckedChange={(checked) => handleTagToggle(tag, checked === true)}
                    />
                    <span className={cn(
                      "text-sm flex-1",
                      "dark:text-white light:text-gray-900"
                    )}>
                      {tag}
                    </span>
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
