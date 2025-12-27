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
    <div className={`space-y-2 ${className}`}>
      {!hideLabel && (
        <Label htmlFor="priority-selector" className="text-sm font-semibold text-white/90">
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
          className="h-12 w-full text-base bg-[#1a2332]/80 border-2 border-white/10 text-white placeholder:text-white/40 focus:ring-0 focus:border-[#00d4b8]/60 transition-all duration-300 rounded-xl"
        >
          <SelectValue placeholder="Select priority">
            {selectedOption && (
              <span className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${selectedOption.dotColor} shadow-[0_0_8px_currentColor]`} />
                <span className={`font-medium text-white`}>{selectedOption.label}</span>
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-[#131929] border-[#00d4b8]/30 text-white">
          {PRIORITY_OPTIONS.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="cursor-pointer focus:bg-[#00d4b8]/20 focus:text-white"
            >
              <span className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${option.dotColor} shadow-[0_0_8px_currentColor]`} />
                <span className={`font-medium text-white`}>{option.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
