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

      <DialogContent className="w-[92vw] sm:max-w-lg md:max-w-2xl max-h-[85vh] overflow-y-auto bg-transparent border-0 shadow-none p-0 sm:rounded-3xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        <DialogTitle className="sr-only">
          {task ? 'Edit Task' : 'Create New Task'}
        </DialogTitle>
        <TaskForm
          task={task}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
