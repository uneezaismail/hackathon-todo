/**
 * T040: Priority Selector Component
 *
 * Allows users to select task priority level (High, Medium, Low)
 * using a dropdown select with color-coded options.
 * Fully responsive with beautiful styling for light and dark modes
 */

'use client'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { Priority } from '@/types/task'

interface PrioritySelectorProps {
  value: Priority
  onChange: (priority: Priority) => void
  disabled?: boolean
  className?: string
  /** If true, hides the label (for inline usage) */
  hideLabel?: boolean
}

const PRIORITY_OPTIONS: { value: Priority; label: string; dotColor: string; textColor: string }[] = [
  { value: 'High', label: 'High', dotColor: 'bg-red-500', textColor: 'text-red-600 dark:text-red-400' },
  { value: 'Medium', label: 'Medium', dotColor: 'bg-yellow-500', textColor: 'text-yellow-600 dark:text-yellow-400' },
  { value: 'Low', label: 'Low', dotColor: 'bg-green-500', textColor: 'text-green-600 dark:text-green-400' },
]

export function PrioritySelector({
  value,
  onChange,
  disabled = false,
  className = '',
  hideLabel = false,
}: PrioritySelectorProps) {
  const selectedOption = PRIORITY_OPTIONS.find((opt) => opt.value === value)

  return (
    <div className={cn("space-y-2", className)}>
      {!hideLabel && (
        <Label
          htmlFor="priority-selector"
          className="text-sm font-semibold dark:text-white light:text-gray-900"
        >
          Priority
        </Label>
      )}
      <Select
        value={value}
        onValueChange={(val) => onChange(val as Priority)}
        disabled={disabled}
      >
        <SelectTrigger
          id="priority-selector"
          className={cn(
            "h-12 w-full text-base font-medium transition-all duration-200 rounded-xl",
            // Dark mode
            "dark:bg-[#1a1a2e] dark:border-[#2a2a3e]",
            "dark:text-white dark:placeholder:text-gray-400",
            "dark:hover:bg-[#2a2a3e] dark:hover:border-purple-500/40",
            "focus:dark:border-purple-500/60 focus:dark:ring-2 focus:dark:ring-purple-500/20",
            // Light mode
            "light:bg-white light:border-gray-200",
            "light:text-gray-900 light:placeholder:text-gray-500",
            "light:hover:bg-gray-50 light:hover:border-purple-400",
            "focus:light:border-purple-500 focus:light:ring-2 focus:light:ring-purple-500/20"
          )}
        >
          <SelectValue placeholder="Select priority">
            {selectedOption && (
              <span className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${selectedOption.dotColor} shadow-sm`} />
                <span className="font-medium dark:text-white light:text-gray-900">
                  {selectedOption.label}
                </span>
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent
          className={cn(
            "rounded-xl border shadow-lg",
            "dark:bg-[#1a1a2e] dark:border-[#2a2a3e]",
            "light:bg-white light:border-gray-200"
          )}
        >
          {PRIORITY_OPTIONS.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className={cn(
                "cursor-pointer rounded-lg transition-colors",
                "dark:focus:bg-purple-500/20 dark:text-white dark:focus:text-white",
                "light:focus:bg-purple-50 light:text-gray-900 light:focus:text-gray-900"
              )}
            >
              <span className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${option.dotColor} shadow-sm`} />
                <span className="font-medium">{option.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
