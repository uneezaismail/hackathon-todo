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

import { deleteTask, toggleTaskComplete, completeTask } from '@/actions/tasks'
import { TaskForm } from './task-form'
import { TaskDetailsDialog } from './task-details-dialog'
import { Repeat } from 'lucide-react'
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
    <div className="rounded-2xl border-2 border-[#00d4b8]/20 bg-[#131929]/40 backdrop-blur-md overflow-hidden hover:border-[#00d4b8]/40 hover:shadow-[0_0_30px_rgba(0,212,184,0.15)] transition-all duration-300">
      <Table>
        <TableHeader className="bg-[#1a2332]/60">
          <TableRow className="hover:bg-transparent border-white/10">
            <TableHead className="w-[50px]"></TableHead>
            <TableHead className="h-12 text-white/60 font-semibold uppercase tracking-wider text-xs">Task</TableHead>
            <TableHead className="h-12 text-white/60 font-semibold uppercase tracking-wider text-xs">Status</TableHead>
            <TableHead className="h-12 text-white/60 font-semibold uppercase tracking-wider text-xs">Priority</TableHead>
            <TableHead className="h-12 text-white/60 font-semibold uppercase tracking-wider text-xs text-right">Due Date</TableHead>
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

      // For recurring tasks completing (not uncompleting), use the /complete endpoint
      if (task.is_recurring && !previousCompleted) {
        const result = await completeTask(task.id)

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
          if (result.nextOccurrence) {
            toast.success('Task completed! Next occurrence created.')
          } else {
            toast.success('Task completed!')
          }
          onTaskUpdated?.()
        }
      } else {
        // Regular toggle for non-recurring or uncompleting
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
          toast.success(result.task?.completed ? 'Task completed!' : 'Task marked as pending')
          onTaskUpdated?.()
        }
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
        className="border-white/5 hover:bg-[#00d4b8]/5 transition-colors duration-200 group"
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
            className="data-[state=checked]:bg-[#00d4b8] data-[state=checked]:border-[#00d4b8] border-white/20 transition-all"
          />
        </TableCell>
        <TableCell className="font-medium">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className={optimisticTask.completed ? 'line-through text-white/40' : 'text-white group-hover:text-[#00d4b8] transition-colors'}>
                {optimisticTask.title}
              </span>
              {/* Recurring task indicator */}
              {task.is_recurring && (
                <Repeat className="h-3.5 w-3.5 text-purple-400 flex-shrink-0" aria-label="Recurring task" />
              )}
            </div>
            {optimisticTask.tags && optimisticTask.tags.length > 0 && (
              <div className="flex gap-1 mt-1 flex-wrap">
                {optimisticTask.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs bg-[#00d4b8]/10 text-[#00d4b8] border border-[#00d4b8]/20 hover:bg-[#00d4b8]/20 transition-colors"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </TableCell>
        <TableCell>{getStatusBadge(optimisticTask.completed)}</TableCell>
        <TableCell>{getPriorityBadge(optimisticTask.priority)}</TableCell>
        <TableCell className="text-right text-white/60">
          {optimisticTask.due_date
            ? format(new Date(optimisticTask.due_date), 'MMM d, yyyy')
            : '-'}
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-white/5 hover:text-[#00d4b8] transition-all duration-200 opacity-60 group-hover:opacity-100"
                disabled={isPending}
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-card border-[#00d4b8]/20 backdrop-blur-md">
              <DropdownMenuItem
                onClick={() => setShowDetails(true)}
                className="hover:bg-secondary transition-colors cursor-pointer"
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsEditing(true)}
                className="hover:bg-secondary transition-colors cursor-pointer"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-400 hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer"
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
        <EditDialogContent className="w-[92vw] sm:max-w-lg md:max-w-2xl max-h-[85vh] overflow-y-auto bg-transparent border-0 shadow-none p-0 sm:rounded-3xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          <EditDialogTitle className="sr-only">Edit Task</EditDialogTitle>
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
    </>
  )
}
