/**
 * T041: Due Date Picker Component
 *
 * Date picker using Shadcn calendar component
 * Includes "Clear due date" functionality (T048)
 * Fully responsive with beautiful styling for light and dark modes
 */

'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface DueDatePickerProps {
  value: Date | null
  onChange: (date: Date | null) => void
  disabled?: boolean
  className?: string
  /** If true, hides the label (for inline usage) */
  hideLabel?: boolean
}

export function DueDatePicker({
  value,
  onChange,
  disabled = false,
  className = '',
  hideLabel = false,
}: DueDatePickerProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (date: Date | undefined) => {
    onChange(date || null)
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {!hideLabel && (
        <Label htmlFor="due-date-picker" className="text-sm font-semibold text-white/90">
          Due Date
        </Label>
      )}
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id="due-date-picker"
              type="button"
              variant="outline"
              disabled={disabled}
              className={`h-12 w-full justify-start text-left font-medium text-base transition-all duration-300 rounded-xl bg-[#1a2332]/80 border-2 ${
                open ? 'border-[#00d4b8]/60 shadow-[0_0_20px_rgba(0,212,184,0.2)]' : 'border-white/10'
              } text-white hover:bg-[#1a2332] hover:text-white hover:border-[#00d4b8]/40 ${
                !value && 'text-white/40'
              }`}
            >
              <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-[#00d4b8]" />
              <span className="truncate">{value ? format(value, 'PPP') : 'Pick a date'}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-[#131929] border border-[#00d4b8]/30 shadow-xl" align="start">
            <Calendar
              mode="single"
              selected={value || undefined}
              onSelect={handleSelect}
              initialFocus
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              className="rounded-lg bg-[#131929] text-white p-3"
            />
          </PopoverContent>
        </Popover>

        {/* T048: Clear due date button */}
        {value && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={disabled}
            onClick={handleClear}
            className="h-12 w-12 shrink-0 rounded-xl border-2 border-white/10 bg-[#1a2332]/80 text-white hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50 transition-all duration-200"
            title="Clear due date"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
