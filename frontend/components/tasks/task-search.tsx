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
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search tasks..."
          value={localValue}
          onChange={handleInputChange}
          disabled={disabled}
          className="pl-9 pr-9"
        />
        {localValue && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            disabled={disabled}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            title="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
