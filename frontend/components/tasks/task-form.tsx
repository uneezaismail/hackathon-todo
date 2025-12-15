/**
 * Task Form Component (T079)
 *
 * Client Component for creating and editing tasks
 * Includes form validation and loading states
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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

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
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Task' : 'Create New Task'}</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {/* Title Field */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Enter task title"
              {...register('title')}
              disabled={isPending}
              className={errors.title ? 'border-destructive' : ''}
            />
            <div className="flex justify-between items-center">
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
              <span
                className={`text-xs ml-auto ${
                  titleLength > 200 ? 'text-destructive' : 'text-muted-foreground'
                }`}
              >
                {titleLength}/200
              </span>
            </div>
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Enter task description"
              rows={4}
              {...register('description')}
              disabled={isPending}
              className={errors.description ? 'border-destructive' : ''}
            />
            <div className="flex justify-between items-center">
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
              <span
                className={`text-xs ml-auto ${
                  descriptionLength > 1000 ? 'text-destructive' : 'text-muted-foreground'
                }`}
              >
                {descriptionLength}/1000
              </span>
            </div>
          </div>

          {/* T043: Priority and Due Date on the same line */}
          <div className="grid grid-cols-2 gap-4">
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

          {/* T043: Tag Input */}
          <TagInput
            value={tags}
            onChange={setTags}
            disabled={isPending}
          />
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isPending}>
              Cancel
            </Button>
          )}

          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>{isEditing ? 'Update Task' : 'Create Task'}</>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
