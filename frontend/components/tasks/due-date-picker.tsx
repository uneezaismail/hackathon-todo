/**
 * T041: Due Date Picker Component
 *
 * Date picker using Shadcn calendar component
 * Includes "Clear due date" functionality (T048)
 */

'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

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
      {!hideLabel && <Label htmlFor="due-date-picker">Due Date</Label>}
      <div className="flex gap-2">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              id="due-date-picker"
              type="button"
              variant="outline"
              disabled={disabled}
              className={`w-full justify-start text-left font-normal ${
                !value && 'text-muted-foreground'
              }`}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? format(value, 'PPP') : 'Pick a date'}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto">
            <SheetHeader>
              <SheetTitle>Select Due Date</SheetTitle>
            </SheetHeader>
            <div className="flex justify-center py-4">
              <Calendar
                mode="single"
                selected={value || undefined}
                onSelect={handleSelect}
                initialFocus
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </div>
          </SheetContent>
        </Sheet>

        {/* T048: Clear due date button */}
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            onClick={handleClear}
            className="shrink-0"
            title="Clear due date"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
