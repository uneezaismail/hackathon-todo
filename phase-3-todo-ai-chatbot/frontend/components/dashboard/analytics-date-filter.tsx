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
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Select range" />
        </SelectTrigger>
        <SelectContent>
          {PRESET_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
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
              "justify-start text-left font-normal min-w-[200px]",
              !startDate && !endDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={handleCalendarSelect}
            numberOfMonths={2}
            defaultMonth={startDate || undefined}
            disabled={(date) => date > new Date()}
          />
          <div className="flex items-center justify-between p-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearDates}
              className="text-muted-foreground"
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={() => setIsCalendarOpen(false)}
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
          className="h-9 w-9"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Clear dates</span>
        </Button>
      )}
    </div>
  )
}
