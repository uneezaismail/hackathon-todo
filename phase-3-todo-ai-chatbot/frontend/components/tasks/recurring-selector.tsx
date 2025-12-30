'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { CalendarIcon, Repeat } from 'lucide-react'
import type { RecurrenceType } from '@/types/task'

interface RecurrenceSelectorProps {
  isRecurring: boolean
  onIsRecurringChange: (value: boolean) => void
  recurrenceType: RecurrenceType | null
  onRecurrenceTypeChange: (value: RecurrenceType | null) => void
  recurrenceInterval: number
  onRecurrenceIntervalChange: (value: number) => void
  recurrenceDays: string | null
  onRecurrenceDaysChange: (value: string | null) => void
  recurrenceEndDate: string | null
  onRecurrenceEndDateChange: (value: string | null) => void
  maxOccurrences: number | null
  onMaxOccurrencesChange: (value: number | null) => void
  className?: string
}

const WEEKDAYS = [
  { value: 'mon', label: 'Mon' },
  { value: 'tue', label: 'Tue' },
  { value: 'wed', label: 'Wed' },
  { value: 'thu', label: 'Thu' },
  { value: 'fri', label: 'Fri' },
  { value: 'sat', label: 'Sat' },
  { value: 'sun', label: 'Sun' },
]

export function RecurringSelector({
  isRecurring,
  onIsRecurringChange,
  recurrenceType,
  onRecurrenceTypeChange,
  recurrenceInterval,
  onRecurrenceIntervalChange,
  recurrenceDays,
  onRecurrenceDaysChange,
  recurrenceEndDate,
  onRecurrenceEndDateChange,
  maxOccurrences,
  onMaxOccurrencesChange,
  className,
}: RecurrenceSelectorProps) {
  // Parse selected days from comma-separated string
  const selectedDays = recurrenceDays
    ? recurrenceDays.split(',').map((d) => d.trim().toLowerCase())
    : []

  // Toggle a day selection
  const toggleDay = (day: string) => {
    const newDays = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day]

    onRecurrenceDaysChange(newDays.length > 0 ? newDays.join(',') : null)
  }

  // Get interval label based on recurrence type
  const getIntervalLabel = () => {
    switch (recurrenceType) {
      case 'daily':
        return recurrenceInterval === 1 ? 'day' : 'days'
      case 'weekly':
        return recurrenceInterval === 1 ? 'week' : 'weeks'
      case 'monthly':
        return recurrenceInterval === 1 ? 'month' : 'months'
      case 'yearly':
        return recurrenceInterval === 1 ? 'year' : 'years'
      default:
        return 'interval'
    }
  }

  // Get recurrence summary text
  const getRecurrenceSummary = () => {
    if (!isRecurring || !recurrenceType) return null

    let summary = `Every ${recurrenceInterval > 1 ? recurrenceInterval + ' ' : ''}${getIntervalLabel()}`

    if (recurrenceType === 'weekly' && selectedDays.length > 0) {
      const dayLabels = selectedDays
        .map((d) => WEEKDAYS.find((wd) => wd.value === d)?.label || d)
        .join(', ')
      summary += ` on ${dayLabels}`
    }

    if (recurrenceEndDate) {
      summary += ` until ${format(new Date(recurrenceEndDate), 'MMM d, yyyy')}`
    } else if (maxOccurrences) {
      summary += `, ${maxOccurrences} times`
    }

    return summary
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toggle recurring */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Repeat className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="recurring-toggle" className="cursor-pointer">
            Repeat task
          </Label>
        </div>
        <Switch
          id="recurring-toggle"
          checked={isRecurring}
          onCheckedChange={(checked) => {
            onIsRecurringChange(checked)
            if (checked && !recurrenceType) {
              onRecurrenceTypeChange('weekly')
            }
          }}
        />
      </div>

      {isRecurring && (
        <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
          {/* Recurrence pattern */}
          <div className="flex items-center gap-3">
            <Label className="min-w-[60px]">Every</Label>
            <Input
              type="number"
              min={1}
              max={365}
              value={recurrenceInterval}
              onChange={(e) =>
                onRecurrenceIntervalChange(
                  Math.max(1, Math.min(365, parseInt(e.target.value) || 1))
                )
              }
              className="w-20"
            />
            <Select
              value={recurrenceType || 'weekly'}
              onValueChange={(value) =>
                onRecurrenceTypeChange(value as RecurrenceType)
              }
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">
                  {recurrenceInterval === 1 ? 'day' : 'days'}
                </SelectItem>
                <SelectItem value="weekly">
                  {recurrenceInterval === 1 ? 'week' : 'weeks'}
                </SelectItem>
                <SelectItem value="monthly">
                  {recurrenceInterval === 1 ? 'month' : 'months'}
                </SelectItem>
                <SelectItem value="yearly">
                  {recurrenceInterval === 1 ? 'year' : 'years'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Weekly day selection */}
          {recurrenceType === 'weekly' && (
            <div className="space-y-2">
              <Label>On these days</Label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((day) => (
                  <Button
                    key={day.value}
                    type="button"
                    variant={selectedDays.includes(day.value) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleDay(day.value)}
                    className="w-12"
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* End options */}
          <div className="space-y-3">
            <Label>End recurrence</Label>

            {/* End date */}
            <div className="flex items-center gap-3">
              <Checkbox
                id="end-date-toggle"
                checked={recurrenceEndDate !== null}
                onCheckedChange={(checked) => {
                  if (checked) {
                    // Set default to 3 months from now
                    const defaultEnd = new Date()
                    defaultEnd.setMonth(defaultEnd.getMonth() + 3)
                    onRecurrenceEndDateChange(
                      format(defaultEnd, 'yyyy-MM-dd')
                    )
                    onMaxOccurrencesChange(null)
                  } else {
                    onRecurrenceEndDateChange(null)
                  }
                }}
              />
              <Label htmlFor="end-date-toggle" className="cursor-pointer">
                On date
              </Label>
              {recurrenceEndDate !== null && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-[200px] justify-start text-left font-normal',
                        !recurrenceEndDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {recurrenceEndDate
                        ? format(new Date(recurrenceEndDate), 'PPP')
                        : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={
                        recurrenceEndDate
                          ? new Date(recurrenceEndDate)
                          : undefined
                      }
                      onSelect={(date) =>
                        onRecurrenceEndDateChange(
                          date ? format(date, 'yyyy-MM-dd') : null
                        )
                      }
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>

            {/* Max occurrences */}
            <div className="flex items-center gap-3">
              <Checkbox
                id="max-occurrences-toggle"
                checked={maxOccurrences !== null}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onMaxOccurrencesChange(10)
                    onRecurrenceEndDateChange(null)
                  } else {
                    onMaxOccurrencesChange(null)
                  }
                }}
              />
              <Label htmlFor="max-occurrences-toggle" className="cursor-pointer">
                After
              </Label>
              {maxOccurrences !== null && (
                <>
                  <Input
                    type="number"
                    min={1}
                    max={999}
                    value={maxOccurrences}
                    onChange={(e) =>
                      onMaxOccurrencesChange(
                        Math.max(1, parseInt(e.target.value) || 1)
                      )
                    }
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">
                    occurrences
                  </span>
                </>
              )}
            </div>

            {/* Never option */}
            <div className="flex items-center gap-3">
              <Checkbox
                id="never-end-toggle"
                checked={recurrenceEndDate === null && maxOccurrences === null}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onRecurrenceEndDateChange(null)
                    onMaxOccurrencesChange(null)
                  }
                }}
              />
              <Label htmlFor="never-end-toggle" className="cursor-pointer">
                Never
              </Label>
            </div>
          </div>

          {/* Summary */}
          {getRecurrenceSummary() && (
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                {getRecurrenceSummary()}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
