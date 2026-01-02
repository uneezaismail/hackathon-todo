/**
 * Task Details Dialog Component
 *
 * Displays full task details in a modal dialog
 */

'use client'

import { format } from 'date-fns'
import { Calendar, Clock, Tag as TagIcon, Flag, Repeat } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getRecurrencePatternText } from '@/lib/analytics'
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
        return 'dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30 light:bg-red-100 light:text-red-700 light:border-red-300'
      case 'Medium':
        return 'dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30 light:bg-amber-100 light:text-amber-700 light:border-amber-300'
      case 'Low':
        return 'dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30 light:bg-emerald-100 light:text-emerald-700 light:border-emerald-300'
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
      <DialogContent className={cn(
        "w-[92vw] sm:max-w-lg p-0 gap-0 overflow-hidden rounded-2xl sm:rounded-3xl border-2 backdrop-blur-xl transition-all duration-200",
        "dark:bg-[#1a1a2e]/95 dark:border-[#2a2a3e]",
        "dark:shadow-[0_0_60px_rgba(168,85,247,0.15)]",
        "light:bg-white light:border-purple-200",
        "light:shadow-xl"
      )}>
        <DialogHeader className="p-6 pb-2 text-left">
          <DialogTitle className={cn(
            "text-xl sm:text-2xl font-bold mb-1",
            "dark:text-white light:text-gray-900"
          )}>
            {task.title}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 pt-2 space-y-6">
          {/* Status & Priority Row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className={cn(
              "flex items-center gap-2 p-2 rounded-lg border",
              "dark:bg-[#2a2a3e]/50 dark:border-[#2a2a3e]",
              "light:bg-gray-50 light:border-gray-200"
            )}>
              <span className={cn(
                "text-xs font-medium uppercase tracking-wider",
                "dark:text-gray-400 light:text-gray-600"
              )}>
                Status
              </span>
              {task.completed ? (
                <Badge className={cn(
                  "dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30",
                  "light:bg-emerald-100 light:text-emerald-700 light:border-emerald-300",
                  "hover:bg-opacity-20"
                )}>
                  Completed
                </Badge>
              ) : (
                <Badge className={cn(
                  "dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
                  "light:bg-amber-100 light:text-amber-700 light:border-amber-300",
                  "hover:bg-opacity-20"
                )}>
                  Pending
                </Badge>
              )}
            </div>

            <div className={cn(
              "flex items-center gap-2 p-2 rounded-lg border",
              "dark:bg-[#2a2a3e]/50 dark:border-[#2a2a3e]",
              "light:bg-gray-50 light:border-gray-200"
            )}>
              <span className={cn(
                "text-xs font-medium uppercase tracking-wider",
                "dark:text-gray-400 light:text-gray-600"
              )}>
                Priority
              </span>
              <Badge className={cn(getPriorityColor(task.priority), "hover:bg-opacity-20")}>
                <Flag className="mr-1 h-3 w-3" />
                {task.priority}
              </Badge>
            </div>

            {/* Recurring task indicator */}
            {task.is_recurring && getRecurrencePatternText(task) && (
              <div className={cn(
                "flex items-center gap-2 p-2 rounded-lg border",
                "dark:bg-[#2a2a3e]/50 dark:border-[#2a2a3e]",
                "light:bg-gray-50 light:border-gray-200"
              )}>
                <span className={cn(
                  "text-xs font-medium uppercase tracking-wider",
                  "dark:text-gray-400 light:text-gray-600"
                )}>
                  Recurrence
                </span>
                <Badge className={cn(
                  "dark:bg-purple-400/10 dark:text-purple-400 dark:border-purple-400/30",
                  "light:bg-purple-100 light:text-purple-700 light:border-purple-300",
                  "hover:bg-opacity-20"
                )}>
                  <Repeat className="mr-1 h-3 w-3" />
                  {getRecurrencePatternText(task)}
                </Badge>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <span className={cn(
              "text-sm font-medium",
              "dark:text-white light:text-gray-900"
            )}>
              Description
            </span>
            <div className={cn(
              "rounded-xl p-4 border text-sm leading-relaxed min-h-20",
              "dark:bg-[#2a2a3e]/80 dark:border-[#2a2a3e] dark:text-gray-300",
              "light:bg-gray-50 light:border-gray-200 light:text-gray-700"
            )}>
              {task.description || (
                <span className={cn(
                  "italic",
                  "dark:text-gray-500 light:text-gray-400"
                )}>
                  No description provided
                </span>
              )}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Due Date */}
            <div className={cn(
              "p-3 rounded-xl border space-y-1",
              "dark:bg-[#2a2a3e]/50 dark:border-[#2a2a3e]",
              "light:bg-gray-50 light:border-gray-200"
            )}>
              <span className={cn(
                "text-xs font-medium flex items-center gap-1.5",
                "dark:text-gray-400 light:text-gray-600"
              )}>
                <Calendar className="h-3.5 w-3.5" /> Due Date
              </span>
              <p className={cn(
                "text-sm font-medium",
                "dark:text-white light:text-gray-900"
              )}>
                {task.due_date ? formatDate(task.due_date) : 'No due date'}
              </p>
            </div>

            {/* Created At */}
            <div className={cn(
              "p-3 rounded-xl border space-y-1",
              "dark:bg-[#2a2a3e]/50 dark:border-[#2a2a3e]",
              "light:bg-gray-50 light:border-gray-200"
            )}>
              <span className={cn(
                "text-xs font-medium flex items-center gap-1.5",
                "dark:text-gray-400 light:text-gray-600"
              )}>
                <Clock className="h-3.5 w-3.5" /> Created
              </span>
              <p className={cn(
                "text-sm font-medium",
                "dark:text-white light:text-gray-900"
              )}>
                {formatDate(task.created_at)}
              </p>
            </div>
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="space-y-2">
              <span className={cn(
                "text-sm font-medium flex items-center gap-2",
                "dark:text-white light:text-gray-900"
              )}>
                <TagIcon className={cn(
                  "h-4 w-4",
                  "dark:text-purple-400 light:text-purple-600"
                )} />
                Tags
              </span>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className={cn(
                      "px-3 py-1 text-xs border",
                      "dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/30",
                      "light:bg-purple-100 light:text-purple-700 light:border-purple-300"
                    )}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Footer Timestamp */}
          {task.updated_at !== task.created_at && (
            <div className={cn(
              "pt-4 border-t text-center",
              "dark:border-[#2a2a3e] light:border-gray-200"
            )}>
              <p className={cn(
                "text-xs",
                "dark:text-gray-500 light:text-gray-400"
              )}>
                Last updated: {formatDateTime(task.updated_at)}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
