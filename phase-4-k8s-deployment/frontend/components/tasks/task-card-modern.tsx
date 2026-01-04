/**
 * Modern Task Card Component (2025 Design)
 *
 * Based on 2025 UX best practices:
 * - Minimalist design reducing cognitive load
 * - Clear visual hierarchy
 * - 8-12px spacing
 * - Quick scannability
 * - Hover interactions
 * - Dark/light mode support
 */

'use client'

import { useState, useTransition, useOptimistic } from 'react'
import { toast } from 'sonner'
import {
  Pencil,
  Trash2,
  Loader2,
  Repeat,
  SkipForward,
  StopCircle,
  MoreHorizontal,
  Calendar,
  Clock,
} from 'lucide-react'
import { format, isPast, isToday, isTomorrow } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import { deleteTask, toggleTaskComplete, skipTask, stopRecurrence, completeTask } from '@/actions/tasks'
import { TaskForm } from './task-form'
import { EditRecurringDialog } from './edit-recurring-dialog'
import { getRecurrencePatternText } from '@/lib/analytics'
import type { Task, Priority } from '@/types/task'

interface TaskCardModernProps {
  task: Task
  onTaskUpdated?: () => void
}

export function TaskCardModern({ task, onTaskUpdated }: TaskCardModernProps) {
  const [isPending, startTransition] = useTransition()
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showEditRecurringDialog, setShowEditRecurringDialog] = useState(false)
  const [isSkipping, setIsSkipping] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [showStopConfirmDialog, setShowStopConfirmDialog] = useState(false)
  const [editSeries, setEditSeries] = useState(false)

  // Optimistic UI state
  const [optimisticTask, setOptimisticTask] = useOptimistic(
    task,
    (currentTask, newCompleted: boolean) => ({
      ...currentTask,
      completed: newCompleted,
    })
  )

  // Toggle completion
  const handleToggleComplete = () => {
    startTransition(async () => {
      const previousCompleted = optimisticTask.completed
      setOptimisticTask(!previousCompleted)

      if (task.is_recurring && !previousCompleted) {
        const result = await completeTask(task.id)
        if (result.error) {
          setOptimisticTask(previousCompleted)
          toast.error(result.error)
        } else {
          toast.success(result.nextOccurrence ? 'Task completed! Moved to next occurrence.' : 'Task completed!')
          onTaskUpdated?.()
        }
      } else {
        const result = await toggleTaskComplete(task.id, previousCompleted)
        if (result.error) {
          setOptimisticTask(previousCompleted)
          toast.error(result.error)
        } else {
          onTaskUpdated?.()
        }
      }
    })
  }

  // Skip occurrence
  const handleSkip = async () => {
    setIsSkipping(true)
    try {
      const result = await skipTask(task.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(result.nextOccurrence ? 'Occurrence skipped! Next occurrence created.' : 'Occurrence skipped!')
        onTaskUpdated?.()
      }
    } finally {
      setIsSkipping(false)
    }
  }

  // Stop recurrence
  const handleStopRecurrence = async () => {
    setIsStopping(true)
    try {
      const result = await stopRecurrence(task.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Recurrence stopped. No future instances will be created.')
        setShowStopConfirmDialog(false)
        onTaskUpdated?.()
      }
    } finally {
      setIsStopping(false)
    }
  }

  // Handle edit
  const handleEditClick = () => {
    if (task.is_recurring) {
      setShowEditRecurringDialog(true)
    } else {
      setIsEditing(true)
    }
  }

  const handleEditThisInstance = () => {
    setEditSeries(false)
    setIsEditing(true)
  }

  const handleEditAllInstances = () => {
    setEditSeries(true)
    setIsEditing(true)
  }

  // Delete task
  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteTask(task.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Task deleted successfully')
        setShowDeleteDialog(false)
        onTaskUpdated?.()
      }
    } finally {
      setIsDeleting(false)
    }
  }

  // Get priority styling
  const getPriorityStyles = (priority: Priority) => {
    switch (priority) {
      case 'High':
        return {
          dot: 'bg-red-500',
          text: 'dark:text-red-400 light:text-red-600',
          bg: 'dark:bg-red-500/10 light:bg-red-50',
          border: 'dark:border-red-500/30 light:border-red-200',
        }
      case 'Medium':
        return {
          dot: 'bg-amber-500',
          text: 'dark:text-amber-400 light:text-amber-600',
          bg: 'dark:bg-amber-500/10 light:bg-amber-50',
          border: 'dark:border-amber-500/30 light:border-amber-200',
        }
      case 'Low':
        return {
          dot: 'bg-emerald-500',
          text: 'dark:text-emerald-400 light:text-emerald-600',
          bg: 'dark:bg-emerald-500/10 light:bg-emerald-50',
          border: 'dark:border-emerald-500/30 light:border-emerald-200',
        }
    }
  }

  // Get due date styling
  const getDueDateStyles = () => {
    if (!optimisticTask.due_date) return null

    const dueDate = new Date(optimisticTask.due_date)
    const overdue = isPast(dueDate) && !isToday(dueDate)

    if (overdue) {
      return {
        text: 'dark:text-red-400 light:text-red-600',
        bg: 'dark:bg-red-500/10 light:bg-red-50',
        border: 'dark:border-red-500/30 light:border-red-200',
        label: 'Overdue',
      }
    }

    if (isToday(dueDate)) {
      return {
        text: 'dark:text-purple-400 light:text-purple-600',
        bg: 'dark:bg-purple-500/10 light:bg-purple-50',
        border: 'dark:border-purple-500/30 light:border-purple-200',
        label: 'Today',
      }
    }

    if (isTomorrow(dueDate)) {
      return {
        text: 'dark:text-blue-400 light:text-blue-600',
        bg: 'dark:bg-blue-500/10 light:bg-blue-50',
        border: 'dark:border-blue-500/30 light:border-blue-200',
        label: 'Tomorrow',
      }
    }

    return {
      text: 'dark:text-gray-400 light:text-gray-600',
      bg: 'dark:bg-gray-500/10 light:bg-gray-50',
      border: 'dark:border-gray-500/20 light:border-gray-200',
      label: format(dueDate, 'MMM d'),
    }
  }

  const priorityStyles = getPriorityStyles(optimisticTask.priority)
  const dueDateStyles = getDueDateStyles()

  return (
    <>
      {/* Modern Task Card */}
      <div
        className={cn(
          "group relative rounded-xl border-2 p-4 transition-all duration-200",
          // Dark mode
          "dark:bg-[#1a1a2e] dark:border-[#2a2a3e]",
          "dark:hover:border-purple-500/40 dark:hover:shadow-lg dark:hover:shadow-purple-500/10",
          // Light mode
          "light:bg-white light:border-gray-200",
          "light:hover:border-purple-300 light:hover:shadow-lg",
          // Completed state
          optimisticTask.completed && "opacity-60"
        )}
        data-testid="task-card"
        data-task-title={optimisticTask.title}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <div className="pt-1">
            <Checkbox
              id={`task-${task.id}`}
              checked={optimisticTask.completed}
              onCheckedChange={handleToggleComplete}
              disabled={isPending}
              className={cn(
                "h-5 w-5 rounded-md transition-all",
                "dark:border-gray-600 dark:data-[state=checked]:bg-purple-500 dark:data-[state=checked]:border-purple-500",
                "light:border-gray-300 light:data-[state=checked]:bg-purple-600 light:data-[state=checked]:border-purple-600"
              )}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <label
              htmlFor={`task-${task.id}`}
              className={cn(
                "block font-semibold cursor-pointer transition-all mb-2",
                optimisticTask.completed
                  ? "line-through dark:text-gray-500 light:text-gray-400"
                  : "dark:text-white light:text-gray-900"
              )}
            >
              {optimisticTask.title}
            </label>

            {/* Description */}
            {optimisticTask.description && (
              <p
                className={cn(
                  "text-sm mb-3 line-clamp-2",
                  optimisticTask.completed
                    ? "line-through dark:text-gray-600 light:text-gray-400"
                    : "dark:text-gray-400 light:text-gray-600"
                )}
              >
                {optimisticTask.description}
              </p>
            )}

            {/* Metadata Row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Priority Badge */}
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-medium border",
                  priorityStyles.bg,
                  priorityStyles.border,
                  priorityStyles.text
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full mr-1.5", priorityStyles.dot)} />
                {optimisticTask.priority}
              </Badge>

              {/* Due Date Badge */}
              {dueDateStyles && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-medium border",
                    dueDateStyles.bg,
                    dueDateStyles.border,
                    dueDateStyles.text
                  )}
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  {dueDateStyles.label}
                </Badge>
              )}

              {/* Recurring Badge */}
              {optimisticTask.is_recurring && getRecurrencePatternText(task) && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="outline"
                        className="text-xs font-medium cursor-help dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/30 light:bg-purple-50 light:text-purple-700 light:border-purple-200"
                      >
                        <Repeat className="h-3 w-3 mr-1" />
                        {getRecurrencePatternText(task)}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Recurring: {getRecurrencePatternText(task)}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Tags */}
              {optimisticTask.tags && optimisticTask.tags.length > 0 && (
                <>
                  {optimisticTask.tags.slice(0, 3).map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs font-medium dark:bg-gray-700 dark:text-gray-300 light:bg-gray-100 light:text-gray-700"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {optimisticTask.tags.length > 3 && (
                    <Badge
                      variant="secondary"
                      className="text-xs font-medium dark:bg-gray-700 dark:text-gray-400 light:bg-gray-100 light:text-gray-600"
                    >
                      +{optimisticTask.tags.length - 3}
                    </Badge>
                  )}
                </>
              )}
            </div>

            {/* Timestamp */}
            <div className="mt-2 text-xs dark:text-gray-500 light:text-gray-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Created {format(new Date(task.created_at), 'MMM d, yyyy')}</span>
            </div>
          </div>

          {/* Action Buttons - Always visible on mobile, hover on desktop */}
          <div className={cn(
            "flex items-center gap-1 transition-opacity",
            // Mobile: always show (below md breakpoint)
            "opacity-100 md:opacity-0 md:group-hover:opacity-100",
            (isPending || isSkipping || isStopping) && "opacity-100"
          )}>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEditClick}
              disabled={isPending || isSkipping || isStopping}
              className={cn(
                "h-8 w-8 p-0",
                "dark:text-gray-400 dark:hover:text-white dark:hover:bg-[#2a2a3e]",
                "light:text-gray-600 light:hover:text-gray-900 light:hover:bg-gray-100"
              )}
            >
              <Pencil className="h-4 w-4" />
            </Button>

            {optimisticTask.is_recurring && !optimisticTask.completed ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isPending || isSkipping || isStopping}
                    className={cn(
                      "h-8 w-8 p-0",
                      "dark:text-gray-400 dark:hover:text-white dark:hover:bg-[#2a2a3e]",
                      "light:text-gray-600 light:hover:text-gray-900 light:hover:bg-gray-100"
                    )}
                  >
                    {isSkipping || isStopping ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MoreHorizontal className="h-4 w-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleSkip} disabled={isSkipping}>
                    <SkipForward className="mr-2 h-4 w-4" />
                    Skip this occurrence
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowStopConfirmDialog(true)} disabled={isStopping} className="text-orange-600">
                    <StopCircle className="mr-2 h-4 w-4" />
                    Stop recurrence
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete task
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isPending}
                className={cn(
                  "h-8 w-8 p-0",
                  "dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-500/10",
                  "light:text-gray-600 light:hover:text-red-600 light:hover:bg-red-50"
                )}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className={cn(
          "sm:max-w-md backdrop-blur-xl border-2 shadow-xl",
          "dark:bg-[#1a1a2e]/95 dark:border-red-500/30",
          "light:bg-white/95 light:border-red-300"
        )}>
          <DialogHeader>
            <DialogTitle className={cn(
              "text-xl font-bold flex items-center gap-2",
              "dark:text-white light:text-gray-900"
            )}>
              <Trash2 className="h-5 w-5 text-red-500" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className={cn(
              "text-base pt-2",
              "dark:text-gray-400 light:text-gray-600"
            )}>
              Are you sure you want to delete <span className="font-semibold dark:text-purple-400 light:text-purple-700">&quot;{task.title}&quot;</span>?
              <br />
              <span className="text-red-500 font-medium">This action cannot be undone.</span>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
              className={cn(
                "dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700",
                "light:border-gray-300 light:text-gray-700 light:hover:bg-gray-100"
              )}
            >
              Cancel
            </Button>

            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Recurring Dialog */}
      <EditRecurringDialog
        open={showEditRecurringDialog}
        onOpenChange={setShowEditRecurringDialog}
        onEditThisInstance={handleEditThisInstance}
        onEditAllInstances={handleEditAllInstances}
        taskTitle={task.title}
      />

      {/* Stop Recurrence Dialog */}
      <Dialog open={showStopConfirmDialog} onOpenChange={setShowStopConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stop Recurrence</DialogTitle>
            <DialogDescription>
              Are you sure you want to stop the recurrence for &quot;{task.title}&quot;?
              <br /><br />
              This task will no longer repeat automatically. You can still complete or delete this instance.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowStopConfirmDialog(false)}
              disabled={isStopping}
            >
              Cancel
            </Button>

            <Button
              variant="default"
              onClick={handleStopRecurrence}
              disabled={isStopping}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isStopping ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Stopping...
                </>
              ) : (
                'Stop Recurrence'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog - Full Screen Popup like Create Form */}
      <Dialog open={isEditing} onOpenChange={(open) => {
        if (!open) {
          setIsEditing(false)
          setEditSeries(false)
        }
      }}>
        <DialogContent className={cn(
          "p-0 gap-0 border-0 bg-transparent shadow-none",
          "w-[95vw] sm:w-[90vw] md:w-[600px] lg:w-[700px]",
          "max-h-[90vh]",
          "overflow-hidden"
        )}>
          <DialogTitle className="sr-only">Edit Task</DialogTitle>

          {/* Scrollable container with custom scrollbar */}
          <div className={cn(
            "max-h-[90vh] overflow-y-auto",
            // Custom scrollbar styling
            "[&::-webkit-scrollbar]:w-2",
            "[&::-webkit-scrollbar-track]:dark:bg-[#1a1a2e] [&::-webkit-scrollbar-track]:light:bg-gray-100",
            "[&::-webkit-scrollbar-track]:rounded-full",
            "[&::-webkit-scrollbar-thumb]:dark:bg-purple-500/30 [&::-webkit-scrollbar-thumb]:light:bg-purple-300",
            "[&::-webkit-scrollbar-thumb]:rounded-full",
            "[&::-webkit-scrollbar-thumb]:hover:dark:bg-purple-500/50 [&::-webkit-scrollbar-thumb]:hover:light:bg-purple-400"
          )}>
            <TaskForm
              task={task}
              updateSeries={editSeries}
              onSuccess={() => {
                setIsEditing(false)
                setEditSeries(false)
                onTaskUpdated?.()
              }}
              onCancel={() => {
                setIsEditing(false)
                setEditSeries(false)
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
