/**
 * Task Details Dialog Component
 *
 * Displays full task details in a modal dialog
 */

'use client'

import { format } from 'date-fns'
import { Calendar, Clock, Tag as TagIcon, Flag, Repeat } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
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
      <DialogContent className="w-[92vw] sm:max-w-lg bg-[#131929]/95 backdrop-blur-xl border-2 border-[#00d4b8]/30 shadow-[0_0_50px_rgba(0,212,184,0.1)] p-0 gap-0 overflow-hidden rounded-2xl sm:rounded-3xl">
        <DialogHeader className="p-6 pb-2 text-left">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-white mb-1" style={{ textShadow: '0 0 20px rgba(0, 229, 204, 0.3)' }}>
            {task.title}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 pt-2 space-y-6">
          {/* Status & Priority Row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-[#1a2332]/50 p-2 rounded-lg border border-white/5">
              <span className="text-xs font-medium text-white/60 uppercase tracking-wider">Status</span>
              {task.completed ? (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20">
                  Completed
                </Badge>
              ) : (
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20">
                  Pending
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 bg-[#1a2332]/50 p-2 rounded-lg border border-white/5">
              <span className="text-xs font-medium text-white/60 uppercase tracking-wider">Priority</span>
              <Badge className={`${getPriorityColor(task.priority)} hover:bg-opacity-20`}>
                <Flag className="mr-1 h-3 w-3" />
                {task.priority}
              </Badge>
            </div>

            {/* Recurring task indicator */}
            {task.is_recurring && getRecurrencePatternText(task) && (
              <div className="flex items-center gap-2 bg-[#1a2332]/50 p-2 rounded-lg border border-white/5">
                <span className="text-xs font-medium text-white/60 uppercase tracking-wider">Recurrence</span>
                <Badge className="bg-purple-400/10 text-purple-400 border-purple-400/30 hover:bg-purple-400/20">
                  <Repeat className="mr-1 h-3 w-3" />
                  {getRecurrencePatternText(task)}
                </Badge>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-white/90">Description</span>
            <div className="bg-[#1a2332]/80 rounded-xl p-4 border border-white/10 text-white/80 text-sm leading-relaxed min-h-20">
              {task.description || <span className="text-white/30 italic">No description provided</span>}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Due Date */}
            <div className="bg-[#1a2332]/50 p-3 rounded-xl border border-white/5 space-y-1">
              <span className="text-xs font-medium text-white/50 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Due Date
              </span>
              <p className="text-sm font-medium text-white">
                {task.due_date ? formatDate(task.due_date) : 'No due date'}
              </p>
            </div>

            {/* Created At */}
            <div className="bg-[#1a2332]/50 p-3 rounded-xl border border-white/5 space-y-1">
              <span className="text-xs font-medium text-white/50 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Created
              </span>
              <p className="text-sm font-medium text-white">
                {formatDate(task.created_at)}
              </p>
            </div>
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium text-white/90 flex items-center gap-2">
                <TagIcon className="h-4 w-4 text-[#00d4b8]" /> Tags
              </span>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag) => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="bg-[#00d4b8]/10 text-[#00d4b8] border border-[#00d4b8]/20 px-3 py-1 text-xs"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Footer Timestamp */}
          {task.updated_at !== task.created_at && (
            <div className="pt-4 border-t border-white/10 text-center">
              <p className="text-xs text-white/30">
                Last updated: {formatDateTime(task.updated_at)}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
