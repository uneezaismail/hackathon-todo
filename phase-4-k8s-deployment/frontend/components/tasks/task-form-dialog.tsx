/**
 * Task Form Dialog Component
 *
 * Wrapper around TaskForm to show it in a dialog
 */

'use client'

import { useState, ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { TaskForm } from './task-form'
import type { Task } from '@/types/task'

interface TaskFormDialogProps {
  trigger: ReactNode
  task?: Task | null
}

export function TaskFormDialog({ trigger, task }: TaskFormDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className={cn(
        "p-0 gap-0 border-0 bg-transparent shadow-none",
        "w-[95vw] sm:w-[90vw] md:w-[600px] lg:w-[700px]",
        "max-h-[90vh]",
        "overflow-hidden"
      )}>
        <DialogTitle className="sr-only">
          {task ? 'Edit Task' : 'Create New Task'}
        </DialogTitle>

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
            onSuccess={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
