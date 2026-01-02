/**
 * Analytics Date Filter Component - Phase 7
 *
 * Provides date range selection for filtering analytics data.
 * Supports preset ranges and custom date selection.
 */

'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CalendarIcon, X } from 'lucide-react'
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns'
import { cn } from '@/lib/utils'
import { DateRange } from 'react-day-picker'

export type DateRangePreset =
  | 'all'
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last30days'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'custom'

interface AnalyticsDateFilterProps {
  startDate: Date | null
  endDate: Date | null
  onDateChange: (start: Date | null, end: Date | null) => void
  className?: string
}

const PRESET_OPTIONS: { value: DateRangePreset; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'thisWeek', label: 'This Week' },
  { value: 'lastWeek', label: 'Last Week' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'custom', label: 'Custom Range' },
]

function getPresetDateRange(preset: DateRangePreset): { start: Date | null; end: Date | null } {
  const today = new Date()

  switch (preset) {
    case 'all':
      return { start: null, end: null }
    case 'today':
      return { start: today, end: today }
    case 'yesterday':
      const yesterday = subDays(today, 1)
      return { start: yesterday, end: yesterday }
    case 'last7days':
      return { start: subDays(today, 6), end: today }
    case 'last30days':
      return { start: subDays(today, 29), end: today }
    case 'thisWeek':
      return { start: startOfWeek(today), end: endOfWeek(today) }
    case 'lastWeek':
      const lastWeekStart = startOfWeek(subDays(today, 7))
      return { start: lastWeekStart, end: endOfWeek(lastWeekStart) }
    case 'thisMonth':
      return { start: startOfMonth(today), end: endOfMonth(today) }
    case 'lastMonth':
      const lastMonth = subMonths(today, 1)
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) }
    case 'custom':
    default:
      return { start: null, end: null }
  }
}

export function AnalyticsDateFilter({
  startDate,
  endDate,
  onDateChange,
  className,
}: AnalyticsDateFilterProps) {
  const [selectedPreset, setSelectedPreset] = React.useState<DateRangePreset>('all')
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false)
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
    startDate && endDate ? { from: startDate, to: endDate } : undefined
  )

  const handlePresetChange = (preset: DateRangePreset) => {
    setSelectedPreset(preset)

    if (preset === 'custom') {
      setIsCalendarOpen(true)
      return
    }

    const { start, end } = getPresetDateRange(preset)
    onDateChange(start, end)
    setDateRange(start && end ? { from: start, to: end } : undefined)
  }

  const handleCalendarSelect = (range: DateRange | undefined) => {
    setDateRange(range)
    if (range?.from && range?.to) {
      setSelectedPreset('custom')
      onDateChange(range.from, range.to)
    } else if (range?.from) {
      // Single date selected
      setSelectedPreset('custom')
      onDateChange(range.from, range.from)
    }
  }

  const handleClearDates = () => {
    setSelectedPreset('all')
    setDateRange(undefined)
    onDateChange(null, null)
  }

  const formatDateRange = () => {
    if (!startDate && !endDate) return 'All Time'
    if (startDate && endDate) {
      if (startDate.getTime() === endDate.getTime()) {
        return format(startDate, 'MMM d, yyyy')
      }
      return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`
    }
    return 'Select dates'
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* Preset selector */}
      <Select value={selectedPreset} onValueChange={handlePresetChange}>
        <SelectTrigger className={cn(
          "w-[160px] transition-all",
          "dark:bg-[#1a1a2e] dark:border-[#2a2a3e] dark:text-white",
          "light:bg-white light:border-[#e5e5ea] light:text-gray-900",
          "hover:border-purple-500/40 dark:hover:border-purple-500/40 light:hover:border-purple-300",
          "focus:ring-2 focus:ring-purple-500/20"
        )}>
          <SelectValue placeholder="Select range" />
        </SelectTrigger>
        <SelectContent className={cn(
          "dark:bg-[#1a1a2e] dark:border-[#2a2a3e]",
          "light:bg-white light:border-[#e5e5ea]"
        )}>
          {PRESET_OPTIONS.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className={cn(
                "dark:text-white light:text-gray-900",
                "dark:focus:bg-purple-500/10 light:focus:bg-purple-50",
                "dark:hover:bg-purple-500/10 light:hover:bg-purple-50"
              )}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Custom date picker */}
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal min-w-[200px] transition-all",
              "dark:bg-[#1a1a2e] dark:border-[#2a2a3e] dark:text-white",
              "light:bg-white light:border-[#e5e5ea] light:text-gray-900",
              "hover:border-purple-500/40 dark:hover:border-purple-500/40 light:hover:border-purple-300",
              "dark:hover:bg-purple-500/10 light:hover:bg-purple-50",
              !startDate && !endDate && "dark:text-gray-400 light:text-gray-600"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-purple-500 dark:text-purple-400 light:text-purple-600" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className={cn(
          "w-auto p-0",
          "dark:bg-[#1a1a2e] dark:border-[#2a2a3e]",
          "light:bg-white light:border-[#e5e5ea]"
        )} align="start">
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={handleCalendarSelect}
            numberOfMonths={2}
            defaultMonth={startDate || undefined}
            disabled={(date) => date > new Date()}
            className={cn(
              "dark:text-white light:text-gray-900"
            )}
          />
          <div className={cn(
            "flex items-center justify-between p-3 border-t",
            "dark:border-[#2a2a3e] light:border-[#e5e5ea]"
          )}>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearDates}
              className={cn(
                "dark:text-gray-400 light:text-gray-600",
                "dark:hover:text-purple-400 dark:hover:bg-purple-500/10",
                "light:hover:text-purple-700 light:hover:bg-purple-50"
              )}
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={() => setIsCalendarOpen(false)}
              className={cn(
                "bg-purple-600 hover:bg-purple-700 text-white",
                "dark:bg-purple-600 dark:hover:bg-purple-700",
                "light:bg-purple-600 light:hover:bg-purple-700"
              )}
            >
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear button when dates are selected */}
      {(startDate || endDate) && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClearDates}
          className={cn(
            "h-9 w-9 transition-all",
            "dark:text-gray-400 dark:hover:text-purple-400 dark:hover:bg-purple-500/10",
            "light:text-gray-600 light:hover:text-purple-700 light:hover:bg-purple-50"
          )}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Clear dates</span>
        </Button>
      )}
    </div>
  )
}
