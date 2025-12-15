/**
 * Task Details Dialog Component
 *
 * Displays full task details in a modal dialog
 */

'use client'

import { format } from 'date-fns'
import { Calendar, Clock, Tag as TagIcon, Flag } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Task, Priority } from '@/types/task'

interface TaskDetailsDialogProps {
  task: Task
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskDetailsDialog({ task, open, onOpenChange }: TaskDetailsDialogProps) {
  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'High':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'Medium':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
      case 'Low':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      default:
        return ''
    }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy')
  }

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">{task.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground w-20">Status:</span>
            {task.completed ? (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                Completed
              </Badge>
            ) : (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                Pending
              </Badge>
            )}
          </div>

          {/* Priority */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground w-20">Priority:</span>
            <Badge className={getPriorityColor(task.priority)}>
              <Flag className="mr-1 h-3 w-3" />
              {task.priority}
            </Badge>
          </div>

          {/* Description */}
          {task.description && (
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Description:</span>
              <p className="text-sm bg-muted/50 rounded-md p-3">{task.description}</p>
            </div>
          )}

          {/* Due Date */}
          {task.due_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Due:</span>
              <span className="text-sm">{formatDate(task.due_date)}</span>
            </div>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex items-start gap-2">
              <TagIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span className="text-sm text-muted-foreground">Tags:</span>
              <div className="flex flex-wrap gap-1">
                {task.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="border-t pt-4 mt-4 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Created: {formatDateTime(task.created_at)}</span>
            </div>
            {task.updated_at !== task.created_at && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Updated: {formatDateTime(task.updated_at)}</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
