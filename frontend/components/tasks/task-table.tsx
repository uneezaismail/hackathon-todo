/**
 * Task Table Component
 *
 * Table-based display for tasks with columns:
 * - Checkbox (for marking complete/pending)
 * - Task (title)
 * - Status (pending/completed badge)
 * - Priority (High/Medium/Low badge)
 * - Due Date
 * - Actions (dropdown menu)
 */

'use client'

import { useState, useTransition, useOptimistic } from 'react'
import { toast } from 'sonner'
import { MoreVertical, Eye, Pencil, Trash2, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { TaskDetailsDialog } from './task-details-dialog'
import type { Task, Priority } from '@/types/task'
import {
  Dialog as EditDialog,
  DialogContent as EditDialogContent,
  DialogHeader as EditDialogHeader,
  DialogTitle as EditDialogTitle,
} from '@/components/ui/dialog'

interface TaskTableProps {
  tasks: Task[]
  onTaskUpdated?: () => void
}

export function TaskTable({ tasks, onTaskUpdated }: TaskTableProps) {
  return (
    <div className="rounded-md border border-border/50 bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border/50">
            <TableHead className="w-[50px]"></TableHead>
            <TableHead className="text-muted-foreground font-medium">Task</TableHead>
            <TableHead className="text-muted-foreground font-medium">Status</TableHead>
            <TableHead className="text-muted-foreground font-medium">Priority</TableHead>
            <TableHead className="text-muted-foreground font-medium text-right">Due Date</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TaskTableRow key={task.id} task={task} onTaskUpdated={onTaskUpdated} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

interface TaskTableRowProps {
  task: Task
  onTaskUpdated?: () => void
}

function TaskTableRow({ task, onTaskUpdated }: TaskTableRowProps) {
  const [isPending, startTransition] = useTransition()
  const [isEditing, setIsEditing] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Optimistic UI state for task completion
  const [optimisticTask, setOptimisticTask] = useOptimistic(
    task,
    (currentTask, newCompleted: boolean) => ({
      ...currentTask,
      completed: newCompleted,
    })
  )

  const handleToggleComplete = () => {
    startTransition(async () => {
      const previousCompleted = optimisticTask.completed
      setOptimisticTask(!previousCompleted)

      const result = await toggleTaskComplete(task.id, previousCompleted)

      if (result.error) {
        setOptimisticTask(previousCompleted)
        toast.error(result.error, {
          duration: Infinity,
          action: {
            label: 'Dismiss',
            onClick: () => toast.dismiss(),
          },
        })
      } else {
        onTaskUpdated?.()
      }
    })
  }

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const result = await deleteTask(task.id)

      if (result.error) {
        toast.error(result.error, {
          duration: Infinity,
          action: {
            label: 'Dismiss',
            onClick: () => toast.dismiss(),
          },
        })
      } else {
        toast.success('Task deleted successfully')
        setShowDeleteDialog(false)
        onTaskUpdated?.()
      }
    } catch {
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

  const getStatusBadge = (completed: boolean) => {
    if (completed) {
      return (
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30">
          completed
        </Badge>
      )
    }
    return (
      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30">
        pending
      </Badge>
    )
  }

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'High':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30">
            high
          </Badge>
        )
      case 'Medium':
        return (
          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/30">
            medium
          </Badge>
        )
      case 'Low':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30">
            low
          </Badge>
        )
    }
  }

  return (
    <>
      <TableRow
        className="border-border/50 hover:bg-muted/50"
        data-testid="task-item"
        data-task-title={optimisticTask.title}
      >
        {/* Checkbox for completing task */}
        <TableCell className="w-[50px]">
          <Checkbox
            checked={optimisticTask.completed}
            onCheckedChange={handleToggleComplete}
            disabled={isPending}
            aria-label={`Mark "${task.title}" as ${optimisticTask.completed ? 'pending' : 'complete'}`}
            className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
          />
        </TableCell>
        <TableCell className="font-medium">
          <div className="flex flex-col">
            <span className={optimisticTask.completed ? 'line-through text-muted-foreground' : ''}>
              {optimisticTask.title}
            </span>
            {optimisticTask.tags && optimisticTask.tags.length > 0 && (
              <div className="flex gap-1 mt-1">
                {optimisticTask.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </TableCell>
        <TableCell>{getStatusBadge(optimisticTask.completed)}</TableCell>
        <TableCell>{getPriorityBadge(optimisticTask.priority)}</TableCell>
        <TableCell className="text-right text-muted-foreground">
          {optimisticTask.due_date
            ? format(new Date(optimisticTask.due_date), 'MMM d, yyyy')
            : '-'}
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isPending}>
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => setShowDetails(true)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-500 focus:text-red-500"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      {/* Task Details Dialog */}
      <TaskDetailsDialog
        task={optimisticTask}
        open={showDetails}
        onOpenChange={setShowDetails}
      />

      {/* Edit Task Dialog */}
      <EditDialog open={isEditing} onOpenChange={setIsEditing}>
        <EditDialogContent className="max-w-2xl">
          <EditDialogHeader>
            <EditDialogTitle>Edit Task</EditDialogTitle>
          </EditDialogHeader>
          <TaskForm
            task={task}
            onSuccess={() => {
              setIsEditing(false)
              onTaskUpdated?.()
            }}
            onCancel={() => setIsEditing(false)}
          />
        </EditDialogContent>
      </EditDialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{task.title}&quot;? This action cannot be undone.
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
