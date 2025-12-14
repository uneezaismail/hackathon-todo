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
import type { Task } from '@/types/task'

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

        // Convert empty description to null for API
        const taskData = {
          title: data.title,
          description: data.description || null,
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
