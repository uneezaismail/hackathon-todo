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
          <Repeat className={cn(
            "h-4 w-4",
            "dark:text-gray-400 light:text-gray-600"
          )} />
          <Label
            htmlFor="recurring-toggle"
            className={cn(
              "cursor-pointer text-sm font-semibold",
              "dark:text-white light:text-gray-900"
            )}
          >
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
        <div className={cn(
          "space-y-4 rounded-xl border p-4 transition-colors",
          "dark:bg-[#1a1a2e]/50 dark:border-[#2a2a3e]",
          "light:bg-purple-50/50 light:border-purple-200"
        )}>
          {/* Recurrence pattern */}
          <div className="flex items-center gap-3">
            <Label className={cn(
              "min-w-[60px] text-sm font-medium",
              "dark:text-gray-300 light:text-gray-700"
            )}>
              Every
            </Label>
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
              className={cn(
                "w-20 h-10 rounded-lg font-medium transition-all duration-200",
                "dark:bg-[#1a1a2e] dark:border-[#2a2a3e] dark:text-white",
                "dark:hover:border-purple-500/40 dark:focus:border-purple-500/60",
                "light:bg-white light:border-gray-200 light:text-gray-900",
                "light:hover:border-purple-400 light:focus:border-purple-500"
              )}
            />
            <Select
              value={recurrenceType || 'weekly'}
              onValueChange={(value) =>
                onRecurrenceTypeChange(value as RecurrenceType)
              }
            >
              <SelectTrigger className={cn(
                "w-[130px] h-10 rounded-lg font-medium transition-all duration-200",
                "dark:bg-[#1a1a2e] dark:border-[#2a2a3e] dark:text-white",
                "dark:hover:border-purple-500/40 dark:focus:border-purple-500/60",
                "light:bg-white light:border-gray-200 light:text-gray-900",
                "light:hover:border-purple-400 light:focus:border-purple-500"
              )}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={cn(
                "rounded-xl border shadow-lg",
                "dark:bg-[#1a1a2e] dark:border-[#2a2a3e]",
                "light:bg-white light:border-gray-200"
              )}>
                <SelectItem value="daily" className={cn(
                  "dark:focus:bg-purple-500/20 dark:text-white",
                  "light:focus:bg-purple-50 light:text-gray-900"
                )}>
                  {recurrenceInterval === 1 ? 'day' : 'days'}
                </SelectItem>
                <SelectItem value="weekly" className={cn(
                  "dark:focus:bg-purple-500/20 dark:text-white",
                  "light:focus:bg-purple-50 light:text-gray-900"
                )}>
                  {recurrenceInterval === 1 ? 'week' : 'weeks'}
                </SelectItem>
                <SelectItem value="monthly" className={cn(
                  "dark:focus:bg-purple-500/20 dark:text-white",
                  "light:focus:bg-purple-50 light:text-gray-900"
                )}>
                  {recurrenceInterval === 1 ? 'month' : 'months'}
                </SelectItem>
                <SelectItem value="yearly" className={cn(
                  "dark:focus:bg-purple-500/20 dark:text-white",
                  "light:focus:bg-purple-50 light:text-gray-900"
                )}>
                  {recurrenceInterval === 1 ? 'year' : 'years'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Weekly day selection */}
          {recurrenceType === 'weekly' && (
            <div className="space-y-2">
              <Label className={cn(
                "text-sm font-medium",
                "dark:text-gray-300 light:text-gray-700"
              )}>
                On these days
              </Label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((day) => (
                  <Button
                    key={day.value}
                    type="button"
                    variant={selectedDays.includes(day.value) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleDay(day.value)}
                    className={cn(
                      "w-12 h-9 font-medium rounded-lg transition-all duration-200",
                      selectedDays.includes(day.value)
                        ? cn(
                            "dark:bg-purple-500 dark:text-white dark:hover:bg-purple-600",
                            "light:bg-purple-600 light:text-white light:hover:bg-purple-700",
                            "border-transparent shadow-sm"
                          )
                        : cn(
                            "dark:bg-[#1a1a2e] dark:border-[#2a2a3e] dark:text-gray-300",
                            "dark:hover:bg-[#2a2a3e] dark:hover:border-purple-500/40",
                            "light:bg-white light:border-gray-200 light:text-gray-700",
                            "light:hover:bg-gray-50 light:hover:border-purple-400"
                          )
                    )}
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* End options */}
          <div className="space-y-3">
            <Label className={cn(
              "text-sm font-medium",
              "dark:text-gray-300 light:text-gray-700"
            )}>
              End recurrence
            </Label>

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
              <Label
                htmlFor="end-date-toggle"
                className={cn(
                  "cursor-pointer text-sm",
                  "dark:text-gray-300 light:text-gray-700"
                )}
              >
                On date
              </Label>
              {recurrenceEndDate !== null && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-[200px] h-10 justify-start text-left font-medium rounded-lg transition-all duration-200',
                        // Dark mode
                        "dark:bg-[#1a1a2e] dark:border-[#2a2a3e]",
                        "dark:hover:bg-[#2a2a3e] dark:hover:border-purple-500/40",
                        // Light mode
                        "light:bg-white light:border-gray-200",
                        "light:hover:bg-gray-50 light:hover:border-purple-400",
                        // Text color
                        !recurrenceEndDate
                          ? "dark:text-gray-400 light:text-gray-500"
                          : "dark:text-white light:text-gray-900"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-purple-500 dark:text-purple-400 light:text-purple-600" />
                      {recurrenceEndDate
                        ? format(new Date(recurrenceEndDate), 'PPP')
                        : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className={cn(
                      "w-auto p-0",
                      "max-w-[calc(100vw-2rem)] sm:max-w-sm",
                      "dark:bg-[#1a1a2e] light:bg-white",
                      "dark:border-[#2a2a3e] light:border-gray-200",
                      "shadow-xl rounded-xl"
                    )}
                    align="start"
                    sideOffset={8}
                  >
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
              <Label
                htmlFor="max-occurrences-toggle"
                className={cn(
                  "cursor-pointer text-sm",
                  "dark:text-gray-300 light:text-gray-700"
                )}
              >
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
                    className={cn(
                      "w-20 h-10 rounded-lg font-medium transition-all duration-200",
                      "dark:bg-[#1a1a2e] dark:border-[#2a2a3e] dark:text-white",
                      "dark:hover:border-purple-500/40 dark:focus:border-purple-500/60",
                      "light:bg-white light:border-gray-200 light:text-gray-900",
                      "light:hover:border-purple-400 light:focus:border-purple-500"
                    )}
                  />
                  <span className={cn(
                    "text-sm",
                    "dark:text-gray-400 light:text-gray-600"
                  )}>
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
              <Label
                htmlFor="never-end-toggle"
                className={cn(
                  "cursor-pointer text-sm",
                  "dark:text-gray-300 light:text-gray-700"
                )}
              >
                Never
              </Label>
            </div>
          </div>

          {/* Summary */}
          {getRecurrenceSummary() && (
            <div className={cn(
              "pt-3 mt-1 border-t",
              "dark:border-[#2a2a3e] light:border-purple-200"
            )}>
              <p className={cn(
                "text-sm font-medium",
                "dark:text-purple-400 light:text-purple-700"
              )}>
                {getRecurrenceSummary()}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
