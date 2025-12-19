/**
 * Task Form Component (T079)
 *
 * Client Component for creating and editing tasks
 * Includes form validation and loading states
 * Fully responsive with beautiful styling for light and dark modes
 */

'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

import { createTask, updateTask } from '@/actions/tasks'
import type { Task, Priority } from '@/types/task'
import { PrioritySelector } from '@/components/tasks/priority-selector'
import { DueDatePicker } from '@/components/tasks/due-date-picker'
import { TagInput } from '@/components/tasks/tag-input'

/**
 * T086: Form validation schema
 * - Title: required, 1-200 characters
 * - Description: optional, max 1000 characters
 */
const taskFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
})

type TaskFormData = z.infer<typeof taskFormSchema>

interface TaskFormProps {
  task?: Task | null
  onSuccess?: () => void
  onCancel?: () => void
}

/**
 * T079: Task Form Component
 * Can be used for both creating new tasks and editing existing ones
 */
export function TaskForm({ task, onSuccess, onCancel }: TaskFormProps) {
  const [isPending, startTransition] = useTransition()
  const isEditing = !!task

  // T043: State for priority, due_date, and tags
  const [priority, setPriority] = useState<Priority>(task?.priority || 'Medium')
  const [dueDate, setDueDate] = useState<Date | null>(
    task?.due_date ? new Date(task.due_date) : null
  )
  const [tags, setTags] = useState<string[]>(task?.tags || [])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
    },
  })

  // Watch field values for character count
  const titleValue = watch('title')
  const descriptionValue = watch('description')

  const onSubmit = (data: TaskFormData) => {
    startTransition(async () => {
      try {
        let result

        // T043: Convert empty description to null and format due_date as ISO 8601
        const taskData = {
          title: data.title,
          description: data.description || null,
          priority,
          due_date: dueDate ? dueDate.toISOString().split('T')[0] : null, // Format as YYYY-MM-DD
          tags,
        }

        if (isEditing && task) {
          // Update existing task
          result = await updateTask(task.id, taskData)
        } else {
          // Create new task
          result = await createTask(taskData)
        }

        if (result.error) {
          // T088: Show error using toast
          toast.error(result.error, {
            duration: Infinity, // User must dismiss manually
            action: {
              label: 'Dismiss',
              onClick: () => toast.dismiss(),
            },
          })
        } else {
          // Success
          toast.success(isEditing ? 'Task updated successfully' : 'Task created successfully')
          reset()
          // T043: Reset priority, due_date, and tags on success
          setPriority('Medium')
          setDueDate(null)
          setTags([])
          onSuccess?.()
        }
      } catch (error) {
        // T088: Show error banner
        toast.error('An unexpected error occurred', {
          duration: Infinity,
          action: {
            label: 'Dismiss',
            onClick: () => toast.dismiss(),
          },
        })
      }
    })
  }

  const handleCancel = () => {
    reset()
    // T043: Reset priority, due_date, and tags on cancel
    setPriority(task?.priority || 'Medium')
    setDueDate(task?.due_date ? new Date(task.due_date) : null)
    setTags(task?.tags || [])
    onCancel?.()
  }

  const titleLength = titleValue?.length || 0
  const descriptionLength = descriptionValue?.length || 0

  return (
    <div className="w-full mx-auto">
      <div className="relative rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-[#00d4b8]/30 bg-[#131929]/95 backdrop-blur-xl shadow-[0_0_80px_rgba(0,212,184,0.15)]">
        
        {/* Header */}
        <div className="mb-4 sm:mb-6 text-center sm:text-left">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-1" style={{ textShadow: '0 0 20px rgba(0, 229, 204, 0.3)' }}>
            {isEditing ? 'Edit Task' : 'Create New Task'}
          </h2>
          <p className="text-white/60 text-xs sm:text-sm">
            {isEditing ? 'Update your task details below' : 'Add a new task to your list'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
          {/* Title Field */}
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-white/90 font-medium text-sm">
              Title <span className="text-[#00d4b8]">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Enter task title..."
              {...register('title')}
              disabled={isPending}
              className={`h-11 rounded-xl bg-[#1a2332]/80 border-2 text-white placeholder:text-white/40 transition-all duration-300 ${
                errors.title
                  ? 'border-red-500/60 focus:border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                  : 'border-white/10 focus:bg-[#1a2332] focus:border-[#00d4b8]/60 focus:shadow-[0_0_20px_rgba(0,212,184,0.2)]'
              }`}
            />
            <div className="flex justify-between items-center text-xs">
              <span className="text-red-400 font-medium min-h-[16px]">{errors.title?.message}</span>
              <span className={titleLength > 200 ? 'text-red-400 font-medium' : 'text-white/40'}>
                {titleLength}/200
              </span>
            </div>
          </div>

          {/* Description Field */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-white/90 font-medium text-sm">
              Description <span className="text-white/40 font-normal text-xs ml-1">(optional)</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Enter task description..."
              rows={3}
              {...register('description')}
              disabled={isPending}
              className={`resize-none rounded-xl bg-[#1a2332]/80 border-2 text-white placeholder:text-white/40 transition-all duration-300 ${
                errors.description
                  ? 'border-red-500/60 focus:border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                  : 'border-white/10 focus:bg-[#1a2332] focus:border-[#00d4b8]/60 focus:shadow-[0_0_20px_rgba(0,212,184,0.2)]'
              }`}
            />
            <div className="flex justify-between items-center text-xs">
              <span className="text-red-400 font-medium min-h-[16px]">{errors.description?.message}</span>
              <span className={descriptionLength > 1000 ? 'text-red-400 font-medium' : 'text-white/40'}>
                {descriptionLength}/1000
              </span>
            </div>
          </div>

          {/* Priority and Due Date - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <PrioritySelector
              value={priority}
              onChange={setPriority}
              disabled={isPending}
            />
            <DueDatePicker
              value={dueDate}
              onChange={setDueDate}
              disabled={isPending}
            />
          </div>

          {/* Tag Input */}
          <TagInput
            value={tags}
            onChange={setTags}
            disabled={isPending}
          />

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-3 border-t border-white/10">
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
                disabled={isPending}
                className="w-full sm:w-auto min-w-[100px] h-11 text-white/70 hover:text-white hover:bg-white/10"
              >
                Cancel
              </Button>
            )}

            <Button
              type="submit"
              disabled={isPending}
              className="w-full sm:w-auto min-w-[140px] h-11 font-semibold rounded-xl bg-[#00d4b8] text-[#0f1729] hover:bg-[#00e5cc] hover:shadow-[0_0_20px_rgba(0,212,184,0.5)] transition-all duration-300"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>{isEditing ? 'Update Task' : 'Create Task'}</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
