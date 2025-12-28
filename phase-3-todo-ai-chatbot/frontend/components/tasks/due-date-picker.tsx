/**
 * T041: Due Date Picker Component
 *
 * Date picker using Shadcn calendar component
 * Includes "Clear due date" functionality (T048)
 * T062: Shows busy day hints when busyDays prop is provided
 * Fully responsive with beautiful styling for light and dark modes
 */

'use client'

import { useState, useMemo } from 'react'
import { format, isSameDay, parseISO } from 'date-fns'
import { Calendar as CalendarIcon, X, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface BusyDayInfo {
  date: string // YYYY-MM-DD
  taskCount: number
}

interface DueDatePickerProps {
  value: Date | null
  onChange: (date: Date | null) => void
  disabled?: boolean
  className?: string
  /** If true, hides the label (for inline usage) */
  hideLabel?: boolean
  /** T062: Array of busy days to highlight in calendar */
  busyDays?: BusyDayInfo[]
}

export function DueDatePicker({
  value,
  onChange,
  disabled = false,
  className = '',
  hideLabel = false,
  busyDays = [],
}: DueDatePickerProps) {
  const [open, setOpen] = useState(false)

  // T062: Check if selected date is busy
  const selectedBusyInfo = useMemo(() => {
    if (!value || busyDays.length === 0) return null
    return busyDays.find(bd => isSameDay(parseISO(bd.date), value))
  }, [value, busyDays])

  // T062: Create modifiers for busy days styling
  const busyDayModifiers = useMemo(() => {
    if (busyDays.length === 0) return {}

    const lightDays: Date[] = []
    const mediumDays: Date[] = []
    const heavyDays: Date[] = []

    busyDays.forEach(bd => {
      const date = parseISO(bd.date)
      if (bd.taskCount <= 2) {
        lightDays.push(date)
      } else if (bd.taskCount <= 4) {
        mediumDays.push(date)
      } else {
        heavyDays.push(date)
      }
    })

    return {
      busyLight: lightDays,
      busyMedium: mediumDays,
      busyHeavy: heavyDays,
    }
  }, [busyDays])

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
              modifiers={busyDayModifiers}
              modifiersClassNames={{
                busyLight: 'bg-emerald-500/20 hover:bg-emerald-500/30',
                busyMedium: 'bg-amber-500/30 hover:bg-amber-500/40',
                busyHeavy: 'bg-red-500/30 hover:bg-red-500/40',
              }}
            />
            {/* T062: Busy days legend */}
            {busyDays.length > 0 && (
              <div className="p-3 pt-0 border-t border-white/10">
                <div className="flex items-center justify-center gap-3 text-xs text-white/60">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm bg-emerald-500/40" />
                    Light
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm bg-amber-500/40" />
                    Moderate
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm bg-red-500/40" />
                    Busy
                  </span>
                </div>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* T048: Clear due date button */}
        {value && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
              <TooltipContent>Clear due date</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* T062: Busy day warning for selected date */}
      {selectedBusyInfo && selectedBusyInfo.taskCount >= 3 && (
        <div className="flex items-center gap-2 text-xs text-amber-400">
          <AlertCircle className="h-3 w-3" />
          <span>
            {selectedBusyInfo.taskCount >= 5
              ? `Busy day! ${selectedBusyInfo.taskCount} tasks scheduled`
              : `${selectedBusyInfo.taskCount} tasks on this day`}
          </span>
        </div>
      )}
    </div>
  )
}
