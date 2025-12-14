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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Create New Task'}</DialogTitle>
        </DialogHeader>

        <TaskForm
          task={task}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
