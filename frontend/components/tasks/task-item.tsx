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
import { Pencil, Trash2, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { deleteTask, toggleTaskComplete } from '@/actions/tasks'
import { TaskForm } from './task-form'
import type { Task } from '@/types/task'

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
   */
  const handleToggleComplete = () => {
    startTransition(async () => {
      const previousCompleted = optimisticTask.completed

      // T083: Optimistically update UI
      setOptimisticTask(!previousCompleted)

      // Call server action with current completion state
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
    })
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

  // If editing, show the form
  if (isEditing) {
    return (
      <TaskForm
        task={task}
        onSuccess={() => {
          setIsEditing(false)
          onTaskUpdated?.()
        }}
        onCancel={() => setIsEditing(false)}
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
                onClick={() => setIsEditing(true)}
                disabled={isPending}
                aria-label="Edit task"
              >
                <Pencil className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isPending}
                aria-label="Delete task"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* T085: Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{task.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
