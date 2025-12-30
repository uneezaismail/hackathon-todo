'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Calendar as CalendarIcon } from 'lucide-react'
import 'react-big-calendar/lib/css/react-big-calendar.css'

import { TaskCalendar, UnscheduledTasks, CalendarWorkloadHeader, CalendarMiniHeatmap } from '@/components/calendar'
import { TaskDetailsDialog } from '@/components/tasks/task-details-dialog'
import { TaskForm } from '@/components/tasks/task-form'
import { Button } from '@/components/ui/button'
import { CalendarPageSkeleton } from '@/components/dashboard/dashboard-skeleton'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { fetchTasks, updateTask } from '@/actions/tasks'
import type { Task } from '@/types/task'
import { format } from 'date-fns'
import { filterOutPatterns } from '@/lib/task-utils'

export default function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Calendar state for workload components
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day' | 'agenda'>('month')

  // Task details dialog state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  // Task form dialog state (for creating/editing)
  const [formOpen, setFormOpen] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [prefillDate, setPrefillDate] = useState<string | null>(null)

  // Fetch tasks
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true)
      const result = await fetchTasks({ limit: 100 }) // Max allowed by backend
      if (result.error) {
        setError(result.error)
        toast.error(result.error)
      } else {
        // Todoist-style: Filter out only legacy patterns (if any)
        // New recurring tasks are single tasks with shifting due_date
        const tasks = filterOutPatterns(result.tasks || [])
        setTasks(tasks)
        setError(null)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load tasks'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  // Handle task click - show details
  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task)
    setDetailsOpen(true)
  }, [])

  // Handle task drag-and-drop - update due date
  const handleTaskDrop = useCallback(async (taskId: string, newDate: Date) => {
    const formattedDate = format(newDate, 'yyyy-MM-dd')

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, due_date: formattedDate } : t))
    )

    try {
      const result = await updateTask(taskId, { due_date: formattedDate })
      if (result.error) {
        toast.error(result.error)
        // Revert on error
        loadTasks()
      } else {
        toast.success('Task rescheduled')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update task'
      toast.error(message)
      loadTasks()
    }
  }, [loadTasks])

  // Handle clicking empty date - open form with prefilled date
  const handleDateClick = useCallback((date: Date) => {
    const formattedDate = format(date, 'yyyy-MM-dd')
    setPrefillDate(formattedDate)
    setEditTask(null)
    setFormOpen(true)
  }, [])

  // Handle form success - refresh and close
  const handleFormSuccess = useCallback(() => {
    setFormOpen(false)
    setEditTask(null)
    setPrefillDate(null)
    loadTasks()
  }, [loadTasks])

  // Handle form cancel
  const handleFormCancel = useCallback(() => {
    setFormOpen(false)
    setEditTask(null)
    setPrefillDate(null)
  }, [])

  // Handle create new task button
  const handleCreateClick = useCallback(() => {
    setEditTask(null)
    setPrefillDate(null)
    setFormOpen(true)
  }, [])

  // Handle mini heatmap day click - navigate calendar to that day
  const handleHeatmapDayClick = useCallback((date: Date) => {
    setCurrentDate(date)
    setCalendarView('day')
  }, [])

  // Handle calendar date change - sync with workload components
  const handleCalendarDateChange = useCallback((date: Date) => {
    setCurrentDate(date)
  }, [])

  // Handle calendar view change - sync with workload header
  // react-big-calendar View type includes 'work_week' but we only use standard views
  const handleCalendarViewChange = useCallback((view: string) => {
    if (['month', 'week', 'day', 'agenda'].includes(view)) {
      setCalendarView(view as 'month' | 'week' | 'day' | 'agenda')
    }
  }, [])

  if (loading) {
    return <CalendarPageSkeleton />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <CalendarIcon className="h-12 w-12 text-red-400" />
          <p className="text-red-400">{error}</p>
          <Button
            onClick={loadTasks}
            className="bg-[#00d4b8] text-[#0b1121] hover:bg-[#00d4b8]/90"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground text-sm mt-1">
            View and manage your tasks by date
          </p>
        </div>
        <Button
          onClick={handleCreateClick}
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
        >
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Workload Header - Phase 8 */}
      <CalendarWorkloadHeader
        tasks={tasks}
        currentDate={currentDate}
        view={calendarView}
      />

      {/* Main content - responsive layout */}
      <div className="flex flex-col xl:flex-row gap-4 xl:gap-6">
        {/* Calendar */}
        <div className="flex-1 bg-card rounded-xl p-2 sm:p-4 border border-border overflow-x-auto shadow-sm">
          <TaskCalendar
            tasks={tasks}
            onTaskClick={handleTaskClick}
            onTaskDrop={handleTaskDrop}
            onDateClick={handleDateClick}
            currentDate={currentDate}
            currentView={calendarView}
            onDateChange={handleCalendarDateChange}
            onViewChange={handleCalendarViewChange}
          />
        </div>

        {/* Sidebar with workload components */}
        <div className="hidden xl:flex flex-col gap-4 w-72">
          {/* Mini Heatmap - Phase 8 */}
          <CalendarMiniHeatmap
            tasks={tasks}
            currentDate={currentDate}
            onDayClick={handleHeatmapDayClick}
          />

          {/* Unscheduled tasks */}
          <div className="flex-1 bg-card rounded-xl border border-border overflow-hidden shadow-sm">
            <UnscheduledTasks tasks={tasks} onTaskClick={handleTaskClick} />
          </div>
        </div>
      </div>

      {/* Task Details Dialog */}
      {selectedTask && (
        <TaskDetailsDialog
          task={selectedTask}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      )}

      {/* Task Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="w-[92vw] sm:max-w-lg md:max-w-2xl max-h-[85vh] overflow-y-auto bg-transparent border-0 shadow-none p-0 sm:rounded-3xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          <DialogTitle className="sr-only">
            {editTask ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
          <TaskForm
            task={editTask}
            defaultDueDate={prefillDate || undefined}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
