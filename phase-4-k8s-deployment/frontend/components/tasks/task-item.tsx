/**
 * Task Item Component (T078, T083-T085)
 *
 * Client Component displaying a single task with:
 * - Optimistic UI updates using useOptimistic hook
 * - Error rollback logic for failed operations
 * - Delete confirmation dialog
 * - Loading states
 */

'use client'

import { useState, useTransition, useOptimistic } from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2, Loader2, Repeat, SkipForward, StopCircle, MoreHorizontal } from 'lucide-react'

import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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

import { deleteTask, toggleTaskComplete, skipTask, stopRecurrence, completeTask } from '@/actions/tasks'
import { TaskForm } from './task-form'
import { EditRecurringDialog } from './edit-recurring-dialog'
import { getRecurrencePatternText } from '@/lib/analytics'
import type { Task, Priority } from '@/types/task'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface TaskItemProps {
  task: Task
  onTaskUpdated?: () => void
}

/**
 * T078: Task Item Component with T083 Optimistic UI
 */
export function TaskItem({ task, onTaskUpdated }: TaskItemProps) {
  const [isPending, startTransition] = useTransition()
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showEditRecurringDialog, setShowEditRecurringDialog] = useState(false)
  const [isSkipping, setIsSkipping] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [showStopConfirmDialog, setShowStopConfirmDialog] = useState(false)
  const [editSeries, setEditSeries] = useState(false)

  // T083: Optimistic UI state for task completion
  const [optimisticTask, setOptimisticTask] = useOptimistic(
    task,
    (currentTask, newCompleted: boolean) => ({
      ...currentTask,
      completed: newCompleted,
    })
  )

  /**
   * T074, T083, T084: Toggle task completion with optimistic UI and rollback
   * For recurring tasks, uses the /complete endpoint
   */
  const handleToggleComplete = () => {
    startTransition(async () => {
      const previousCompleted = optimisticTask.completed

      // T083: Optimistically update UI
      setOptimisticTask(!previousCompleted)

      // For recurring tasks completing (not uncompleting), use the /complete endpoint
      if (task.is_recurring && !previousCompleted) {
        const result = await completeTask(task.id)
        if (result.error) {
          setOptimisticTask(previousCompleted)
          toast.error(result.error, {
            duration: Infinity,
            action: { label: 'Dismiss', onClick: () => toast.dismiss() },
          })
        } else {
          if (result.nextOccurrence) {
            // Todoist-style: Task's due_date shifted to next occurrence
            toast.success('Task completed! Moved to next occurrence.')
          } else {
            // Recurrence ended or non-recurring task
            toast.success('Task completed!')
          }
          onTaskUpdated?.()
        }
      } else {
        // Regular toggle for non-recurring or uncompleting
        const result = await toggleTaskComplete(task.id, previousCompleted)

        if (result.error) {
          // T084: Rollback on error
          setOptimisticTask(previousCompleted)

          // T088: Show error banner
          toast.error(result.error, {
            duration: Infinity,
            action: {
              label: 'Dismiss',
              onClick: () => toast.dismiss(),
            },
          })
        } else {
          // Success
          onTaskUpdated?.()
        }
      }
    })
  }

  /**
   * T042: Skip a recurring task occurrence
   */
  const handleSkip = async () => {
    setIsSkipping(true)
    try {
      const result = await skipTask(task.id)
      if (result.error) {
        toast.error(result.error, {
          duration: Infinity,
          action: { label: 'Dismiss', onClick: () => toast.dismiss() },
        })
      } else {
        if (result.nextOccurrence) {
          toast.success('Occurrence skipped! Next occurrence created.')
        } else {
          toast.success('Occurrence skipped!')
        }
        onTaskUpdated?.()
      }
    } catch (error) {
      toast.error('Failed to skip occurrence')
    } finally {
      setIsSkipping(false)
    }
  }

  /**
   * T043: Stop recurrence for a recurring task
   */
  const handleStopRecurrence = async () => {
    setIsStopping(true)
    try {
      const result = await stopRecurrence(task.id)
      if (result.error) {
        toast.error(result.error, {
          duration: Infinity,
          action: { label: 'Dismiss', onClick: () => toast.dismiss() },
        })
      } else {
        toast.success('Recurrence stopped. No future instances will be created.')
        setShowStopConfirmDialog(false)
        onTaskUpdated?.()
      }
    } catch (error) {
      toast.error('Failed to stop recurrence')
    } finally {
      setIsStopping(false)
    }
  }

  /**
   * Handle edit button click for recurring tasks
   */
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

  /**
   * T085: Delete task with confirmation
   */
  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const result = await deleteTask(task.id)

      if (result.error) {
        // T084, T088: Show error and don't remove from UI
        toast.error(result.error, {
          duration: Infinity,
          action: {
            label: 'Dismiss',
            onClick: () => toast.dismiss(),
          },
        })
      } else {
        // Success
        toast.success('Task deleted successfully')
        setShowDeleteDialog(false)
        onTaskUpdated?.()
      }
    } catch (error) {
      toast.error('An unexpected error occurred', {
        duration: Infinity,
        action: {
          label: 'Dismiss',
          onClick: () => toast.dismiss(),
        },
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Format timestamp
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  }

  // T044, T047: Get priority color classes
  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-700 border-red-300'
      case 'Medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'Low':
        return 'bg-green-100 text-green-700 border-green-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  // If editing, show the form
  if (isEditing) {
    return (
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
    )
  }

  return (
    <>
      <Card
        className="transition-opacity"
        data-testid="task-item"
        data-task-title={optimisticTask.title}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* T087: Checkbox with loading state */}
            <div className="pt-0.5">
              <Checkbox
                id={`task-${task.id}`}
                checked={optimisticTask.completed}
                onCheckedChange={handleToggleComplete}
                disabled={isPending}
                aria-label={`Mark "${task.title}" as ${optimisticTask.completed ? 'pending' : 'complete'}`}
              />
            </div>

            {/* Task content */}
            <div className="flex-1 min-w-0">
              <label
                htmlFor={`task-${task.id}`}
                className={`block text-sm font-medium cursor-pointer transition-all ${
                  optimisticTask.completed
                    ? 'line-through text-muted-foreground'
                    : 'text-foreground'
                }`}
              >
                {optimisticTask.title}
              </label>

              {optimisticTask.description && (
                <p
                  className={`mt-1 text-sm transition-all ${
                    optimisticTask.completed
                      ? 'line-through text-muted-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {optimisticTask.description}
                </p>
              )}

              {/* T044-T047: Display priority, due_date, and tags */}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {/* T044, T047: Priority badge with color coding */}
                <Badge
                  variant="outline"
                  className={`text-xs ${getPriorityColor(optimisticTask.priority)}`}
                >
                  {optimisticTask.priority}
                </Badge>

                {/* Phase 4: Recurring task indicator with tooltip */}
                {optimisticTask.is_recurring && getRecurrencePatternText(task) && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-300 cursor-help">
                          <Repeat className="w-3 h-3 mr-1" />
                          {getRecurrencePatternText(task)}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Recurring: {getRecurrencePatternText(task)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                {/* T045: Due date display */}
                {optimisticTask.due_date && (
                  <Badge variant="outline" className="text-xs">
                    Due: {format(new Date(optimisticTask.due_date), 'MMM d, yyyy')}
                  </Badge>
                )}

                {/* T046: Tags display as colored badges */}
                {optimisticTask.tags && optimisticTask.tags.length > 0 && (
                  <>
                    {optimisticTask.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </>
                )}
              </div>

              <div className="mt-2 text-xs text-muted-foreground">
                Created {formatDate(task.created_at)}
                {task.updated_at !== task.created_at && ` • Updated ${formatDate(task.updated_at)}`}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEditClick}
                disabled={isPending || isSkipping || isStopping}
                aria-label="Edit task"
              >
                <Pencil className="h-4 w-4" />
              </Button>

              {/* T042, T043: Dropdown menu with recurring task actions */}
              {optimisticTask.is_recurring && !optimisticTask.completed ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isPending || isSkipping || isStopping}
                      aria-label="More actions"
                    >
                      {isSkipping || isStopping ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreHorizontal className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={handleSkip}
                      disabled={isSkipping}
                    >
                      <SkipForward className="mr-2 h-4 w-4" />
                      Skip this occurrence
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setShowStopConfirmDialog(true)}
                      disabled={isStopping}
                      className="text-orange-600"
                    >
                      <StopCircle className="mr-2 h-4 w-4" />
                      Stop recurrence
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-destructive"
                    >
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
                  aria-label="Delete task"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* T085: Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md bg-[#131929]/95 backdrop-blur-xl border-2 border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-white/70 text-base pt-2">
              Are you sure you want to delete <span className="text-[#00d4b8] font-semibold">&quot;{task.title}&quot;</span>?
              <br />
              <span className="text-red-400 font-medium">This action cannot be undone.</span>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
              className="border-white/20 text-white hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>

            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 border-0"
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

      {/* T041: Edit Recurring Dialog */}
      <EditRecurringDialog
        open={showEditRecurringDialog}
        onOpenChange={setShowEditRecurringDialog}
        onEditThisInstance={handleEditThisInstance}
        onEditAllInstances={handleEditAllInstances}
        taskTitle={task.title}
      />

      {/* T043: Stop Recurrence Confirmation Dialog */}
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
    </>
  )
}
