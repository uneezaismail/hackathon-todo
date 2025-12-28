'use client'

import { useState, useCallback, useMemo } from 'react'
import { Calendar, dateFnsLocalizer, View, SlotInfo } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import type { Task } from '@/types/task'
import { CalendarEvent } from './calendar-event'
import { CalendarToolbar } from './calendar-toolbar'
import { cn } from '@/lib/utils'

// Setup date-fns localizer for react-big-calendar
const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

// Calendar event type
export interface CalendarEventData {
  id: string
  title: string
  start: Date
  end: Date
  allDay: boolean
  resource: Task
}

interface TaskCalendarProps {
  tasks: Task[]
  onTaskClick?: (task: Task) => void
  onTaskDrop?: (taskId: string, newDate: Date) => void
  onDateClick?: (date: Date) => void
  // Optional controlled props for parent sync
  currentDate?: Date
  currentView?: View
  onDateChange?: (date: Date) => void
  onViewChange?: (view: View) => void
  className?: string
}

// Priority colors
const priorityColors: Record<string, string> = {
  High: 'bg-red-500/20 border-red-500 text-red-400',
  Medium: 'bg-amber-500/20 border-amber-500 text-amber-400',
  Low: 'bg-blue-500/20 border-blue-500 text-blue-400',
}

export function TaskCalendar({
  tasks,
  onTaskClick,
  onTaskDrop,
  onDateClick,
  currentDate,
  currentView,
  onDateChange,
  onViewChange,
  className,
}: TaskCalendarProps) {
  // Get persisted view from localStorage or default to 'month'
  const [internalView, setInternalView] = useState<View>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('calendar-view')
      if (saved && ['month', 'week', 'day', 'agenda'].includes(saved)) {
        return saved as View
      }
    }
    return 'month'
  })

  const [internalDate, setInternalDate] = useState(new Date())

  // Use controlled or internal state
  const view = currentView ?? internalView
  const date = currentDate ?? internalDate

  // Transform tasks to calendar events
  const events: CalendarEventData[] = useMemo(() => {
    return tasks
      .filter((task) => task.due_date)
      .map((task) => {
        const dueDate = new Date(task.due_date!)
        return {
          id: task.id,
          title: task.title,
          start: dueDate,
          end: dueDate,
          allDay: true,
          resource: task,
        }
      })
  }, [tasks])

  // Handle view change with persistence
  const handleViewChange = useCallback((newView: View) => {
    setInternalView(newView)
    if (typeof window !== 'undefined') {
      localStorage.setItem('calendar-view', newView)
    }
    // Notify parent if callback provided
    onViewChange?.(newView)
  }, [onViewChange])

  // Handle navigation
  const handleNavigate = useCallback((newDate: Date) => {
    setInternalDate(newDate)
    // Notify parent if callback provided
    onDateChange?.(newDate)
  }, [onDateChange])

  // Handle event click
  const handleSelectEvent = useCallback(
    (event: CalendarEventData) => {
      if (onTaskClick) {
        onTaskClick(event.resource)
      }
    },
    [onTaskClick]
  )

  // Handle slot selection (clicking empty date)
  const handleSelectSlot = useCallback(
    (slotInfo: SlotInfo) => {
      if (onDateClick) {
        onDateClick(slotInfo.start)
      }
    },
    [onDateClick]
  )

  // Handle drag and drop
  const handleEventDrop = useCallback(
    ({ event, start }: { event: CalendarEventData; start: Date; end: Date }) => {
      if (onTaskDrop) {
        onTaskDrop(event.id, start)
      }
    },
    [onTaskDrop]
  )

  // Custom event styling based on priority and completion
  const eventStyleGetter = useCallback((event: CalendarEventData) => {
    const task = event.resource
    const isOverdue =
      !task.completed && task.due_date && new Date(task.due_date) < new Date()
    const priorityClass = priorityColors[task.priority] || priorityColors.Medium

    return {
      className: cn(
        'rounded-md border-l-2 px-1.5 py-0.5 text-xs font-medium transition-all',
        priorityClass,
        task.completed && 'opacity-50 line-through',
        isOverdue && !task.completed && 'ring-1 ring-red-500 animate-pulse'
      ),
    }
  }, [])

  // Custom components
  const components = useMemo(
    () => ({
      event: CalendarEvent,
      toolbar: CalendarToolbar,
    }),
    []
  )

  return (
    <div className={cn('h-full min-h-[700px]', className)}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        view={view}
        onView={handleViewChange}
        date={date}
        onNavigate={handleNavigate}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        selectable
        eventPropGetter={eventStyleGetter}
        components={components}
        popup
        popupOffset={{ x: 0, y: 0 }}
        views={['month', 'week', 'day', 'agenda']}
        step={60}
        showMultiDayTimes
        className="task-calendar"
      />
    </div>
  )
}
