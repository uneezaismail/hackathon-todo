'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Calendar as CalendarIcon } from 'lucide-react'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './calendar.css'

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
        // Filter out recurring task patterns - users should only see instances
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
          <CalendarIcon className="h-12 w-12 text-red-600 dark:text-red-400" />
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <Button
            onClick={loadTasks}
            className="bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-500/10">
            <CalendarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">Calendar</h1>
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mt-1">
              View and manage your tasks by date
            </p>
          </div>
        </div>
        <Button
          onClick={handleCreateClick}
          className="h-11 gap-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 shadow-lg shadow-purple-500/20 transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden xs:inline">New Task</span>
          <span className="xs:hidden">New</span>
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
        {/* Calendar - Fully responsive with proper sizing */}
        <div className="flex-1 min-w-0 bg-white dark:bg-[#1a1a2e]/95 rounded-2xl p-3 sm:p-4 lg:p-6 border-2 border-gray-200 dark:border-[#2a2a3e] shadow-xl dark:shadow-[0_0_40px_rgba(168,85,247,0.1)] transition-all duration-200">
          <div className="h-[600px] sm:h-[650px] lg:h-[750px]">
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
        </div>

        {/* Sidebar with workload components - Desktop only */}
        <div className="hidden xl:flex flex-col gap-4 w-80 flex-shrink-0">
          {/* Mini Heatmap - Phase 8 */}
          <CalendarMiniHeatmap
            tasks={tasks}
            currentDate={currentDate}
            onDayClick={handleHeatmapDayClick}
          />

          {/* Unscheduled tasks */}
          <div className="flex-1 bg-white dark:bg-[#1a1a2e]/95 rounded-2xl border-2 border-gray-200 dark:border-[#2a2a3e] overflow-hidden shadow-xl dark:shadow-[0_0_40px_rgba(168,85,247,0.1)] transition-all duration-200">
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
        <DialogContent className="p-0 gap-0 border-0 bg-transparent shadow-none w-[95vw] sm:w-[90vw] md:w-[600px] lg:w-[700px] max-h-[90vh] overflow-hidden">
          <DialogTitle className="sr-only">
            {editTask ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
          {/* Scrollable container with custom scrollbar */}
          <div className="max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:dark:bg-[#1a1a2e] [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-purple-300 [&::-webkit-scrollbar-thumb]:dark:bg-purple-500/30 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-purple-400 [&::-webkit-scrollbar-thumb]:hover:dark:bg-purple-500/50">
            <TaskForm
              task={editTask}
              defaultDueDate={prefillDate || undefined}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
