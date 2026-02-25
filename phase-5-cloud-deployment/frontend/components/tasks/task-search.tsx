/**
 * T066: Task Search Component
 *
 * Real-time search input with debouncing (T073: 300ms delay)
 * Allows users to search tasks by keyword (title/description)
 */

'use client'

import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { useDebouncedCallback } from 'use-debounce'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface TaskSearchProps {
  value: string
  onChange: (search: string) => void
  disabled?: boolean
  className?: string
}

export function TaskSearch({
  value,
  onChange,
  disabled = false,
  className = '',
}: TaskSearchProps) {
  const [localValue, setLocalValue] = useState(value)

  // T073: Debounced search with 300ms delay to reduce API calls
  const debouncedOnChange = useDebouncedCallback(
    (searchValue: string) => {
      onChange(searchValue)
    },
    300 // 300ms debounce
  )

  // Update local value when prop changes (e.g., from URL params or clear filters)
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    debouncedOnChange(newValue)
  }

  const handleClear = () => {
    setLocalValue('')
    onChange('')
  }

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className={cn(
          "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4",
          "dark:text-gray-400 light:text-gray-500"
        )} />
        <Input
          type="text"
          placeholder="Search tasks..."
          value={localValue}
          onChange={handleInputChange}
          disabled={disabled}
          className={cn(
            "h-11 pl-9 pr-9 rounded-xl border-2 font-medium transition-all duration-200",
            // Dark mode
            "dark:bg-[#1a1a2e] dark:border-[#2a2a3e]",
            "dark:text-white dark:placeholder:text-gray-400",
            "dark:hover:border-purple-500/40",
            "dark:focus:border-purple-500/60 dark:focus:ring-2 dark:focus:ring-purple-500/20",
            // Light mode
            "light:bg-white light:border-gray-200",
            "light:text-gray-900 light:placeholder:text-gray-500",
            "light:hover:border-purple-400",
            "light:focus:border-purple-500 light:focus:ring-2 light:focus:ring-purple-500/20"
          )}
        />
        {localValue && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            disabled={disabled}
            className={cn(
              "absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg transition-colors",
              "dark:text-gray-400 dark:hover:text-white dark:hover:bg-[#2a2a3e]",
              "light:text-gray-600 light:hover:text-gray-900 light:hover:bg-gray-100"
            )}
            title="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
