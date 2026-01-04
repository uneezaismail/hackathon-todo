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
import { cn } from '@/lib/utils'
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
    <div className={cn("space-y-2", className)}>
      {!hideLabel && (
        <Label
          htmlFor="due-date-picker"
          className="text-sm font-semibold text-gray-900 dark:text-white"
        >
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
              className={cn(
                "h-12 w-full justify-start text-left font-medium transition-all duration-200 rounded-xl",
                // Dark mode
                "dark:bg-[#1a1a2e] dark:border-[#2a2a3e]",
                "dark:hover:bg-[#2a2a3e] dark:hover:border-purple-500/40",
                open && "dark:border-purple-500/60 dark:ring-2 dark:ring-purple-500/20",
                // Light mode
                "bg-white border-gray-200",
                "hover:bg-gray-50 hover:border-purple-400",
                open && "border-purple-500 ring-2 ring-purple-500/20",
                // Text color
                value
                  ? "text-gray-900 dark:text-white"
                  : "text-gray-500 dark:text-gray-400"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-purple-600 dark:text-purple-400" />
              <span className="truncate">{value ? format(value, 'PPP') : 'Pick a date'}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className={cn(
              "w-auto p-0 overflow-hidden",
              // Responsive width - smaller on mobile
              "min-w-[280px] max-w-[calc(100vw-2rem)]",
              "sm:min-w-[320px] sm:max-w-md",
              "bg-white dark:bg-[#1a1a2e]",
              "border-gray-200 dark:border-[#2a2a3e]",
              "shadow-xl rounded-xl border-2"
            )}
            align="start"
            sideOffset={8}
          >
            <Calendar
              mode="single"
              selected={value || undefined}
              onSelect={handleSelect}
              initialFocus
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              className={cn(
                "!border-0 !shadow-none !bg-transparent",
                // Smaller padding on mobile
                "p-2 sm:p-3"
              )}
              modifiers={busyDayModifiers}
              modifiersClassNames={{
                busyLight: cn(
                  "bg-emerald-100 dark:bg-emerald-500/20",
                  "hover:bg-emerald-200 dark:hover:bg-emerald-500/30"
                ),
                busyMedium: cn(
                  "bg-amber-100 dark:bg-amber-500/30",
                  "hover:bg-amber-200 dark:hover:bg-amber-500/40"
                ),
                busyHeavy: cn(
                  "bg-red-100 dark:bg-red-500/30",
                  "hover:bg-red-200 dark:hover:bg-red-500/40"
                ),
              }}
            />
            {/* T062: Busy days legend */}
            {busyDays.length > 0 && (
              <div className={cn(
                "p-3 pt-0 border-t",
                "border-gray-200 dark:border-[#2a2a3e]"
              )}>
                <div className={cn(
                  "flex items-center justify-center gap-3 text-xs",
                  "text-gray-600 dark:text-gray-400"
                )}>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm bg-emerald-400 dark:bg-emerald-500/40" />
                    Light
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm bg-amber-400 dark:bg-amber-500/40" />
                    Moderate
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm bg-red-400 dark:bg-red-500/40" />
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
                  className={cn(
                    "h-12 w-12 shrink-0 rounded-xl transition-all duration-200",
                    "bg-white border-gray-200 text-gray-600",
                    "hover:bg-red-50 hover:text-red-600 hover:border-red-300",
                    "dark:bg-[#1a1a2e] dark:border-[#2a2a3e] dark:text-gray-400",
                    "dark:hover:bg-red-500/10 dark:hover:text-red-400 dark:hover:border-red-500/50"
                  )}
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
        <div className={cn(
          "flex items-center gap-2 text-xs",
          "text-amber-600 dark:text-amber-400"
        )}>
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
