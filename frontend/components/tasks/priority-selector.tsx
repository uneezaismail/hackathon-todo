/**
 * T040: Priority Selector Component
 *
 * Allows users to select task priority level (High, Medium, Low)
 * using a dropdown select with color-coded options.
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

const PRIORITY_OPTIONS: { value: Priority; label: string; dotColor: string }[] = [
  { value: 'High', label: 'High', dotColor: 'bg-red-500' },
  { value: 'Medium', label: 'Medium', dotColor: 'bg-yellow-500' },
  { value: 'Low', label: 'Low', dotColor: 'bg-green-500' },
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
      {!hideLabel && <Label htmlFor="priority-selector">Priority</Label>}
      <Select
        value={value}
        onValueChange={(val) => onChange(val as Priority)}
        disabled={disabled}
      >
        <SelectTrigger id="priority-selector" className="w-full">
          <SelectValue placeholder="Select priority">
            {selectedOption && (
              <span className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${selectedOption.dotColor}`} />
                {selectedOption.label}
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {PRIORITY_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <span className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${option.dotColor}`} />
                {option.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
