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
import { cn } from '@/lib/utils'

import { createTask, updateTask, updateTaskWithSeries } from '@/actions/tasks'
import type { Task, Priority, RecurrenceType } from '@/types/task'
import { PrioritySelector } from '@/components/tasks/priority-selector'
import { DueDatePicker } from '@/components/tasks/due-date-picker'
import { TagInput } from '@/components/tasks/tag-input'
import { RecurringSelector } from '@/components/tasks/recurring-selector'

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
  defaultDueDate?: string // ISO format YYYY-MM-DD for calendar integration
  updateSeries?: boolean // T044: If true, update all future instances (for recurring tasks)
  onSuccess?: () => void
  onCancel?: () => void
}

/**
 * T079: Task Form Component
 * Can be used for both creating new tasks and editing existing ones
 */
export function TaskForm({ task, defaultDueDate, updateSeries = false, onSuccess, onCancel }: TaskFormProps) {
  const [isPending, startTransition] = useTransition()
  const isEditing = !!task

  // T043: State for priority, due_date, and tags
  // Support defaultDueDate for calendar integration (clicking on a date)
  const [priority, setPriority] = useState<Priority>(task?.priority || 'Medium')
  const [dueDate, setDueDate] = useState<Date | null>(() => {
    if (task?.due_date) return new Date(task.due_date)
    if (defaultDueDate) return new Date(defaultDueDate)
    return null
  })
  const [tags, setTags] = useState<string[]>(task?.tags || [])

  // Phase 4: Recurrence state
  const [isRecurring, setIsRecurring] = useState<boolean>(task?.is_recurring || false)
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType | null>(
    task?.recurrence_type || null
  )
  const [recurrenceInterval, setRecurrenceInterval] = useState<number>(
    task?.recurrence_interval || 1
  )
  const [recurrenceDays, setRecurrenceDays] = useState<string | null>(
    task?.recurrence_days || null
  )
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<string | null>(
    task?.recurrence_end_date || null
  )
  const [maxOccurrences, setMaxOccurrences] = useState<number | null>(
    task?.max_occurrences || null
  )

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
        // Phase 4: Include recurrence fields
        const taskData = {
          title: data.title,
          description: data.description || null,
          priority,
          due_date: dueDate ? dueDate.toISOString().split('T')[0] : null, // Format as YYYY-MM-DD
          tags,
          // Phase 4: Recurrence fields
          is_recurring: isRecurring,
          recurrence_type: isRecurring ? recurrenceType : null,
          recurrence_interval: isRecurring ? recurrenceInterval : 1,
          recurrence_days: isRecurring && recurrenceType === 'weekly' ? recurrenceDays : null,
          recurrence_end_date: isRecurring ? recurrenceEndDate : null,
          max_occurrences: isRecurring ? maxOccurrences : null,
        }

        if (isEditing && task) {
          // T044: Update existing task - use updateSeries if editing recurring task series
          if (updateSeries && task.is_recurring) {
            result = await updateTaskWithSeries(task.id, taskData, true)
          } else {
            result = await updateTask(task.id, taskData)
          }
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
          // Phase 4: Reset recurrence fields
          setIsRecurring(false)
          setRecurrenceType(null)
          setRecurrenceInterval(1)
          setRecurrenceDays(null)
          setRecurrenceEndDate(null)
          setMaxOccurrences(null)
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
    // Phase 4: Reset recurrence fields on cancel
    setIsRecurring(task?.is_recurring || false)
    setRecurrenceType(task?.recurrence_type || null)
    setRecurrenceInterval(task?.recurrence_interval || 1)
    setRecurrenceDays(task?.recurrence_days || null)
    setRecurrenceEndDate(task?.recurrence_end_date || null)
    setMaxOccurrences(task?.max_occurrences || null)
    onCancel?.()
  }

  const titleLength = titleValue?.length || 0
  const descriptionLength = descriptionValue?.length || 0

  return (
    <div className="w-full mx-auto">
      <div className={cn(
        "relative rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 backdrop-blur-xl transition-all duration-300",
        // Dark mode
        "dark:bg-[#1a1a2e]/95 dark:border-[#2a2a3e]",
        "dark:shadow-[0_0_60px_rgba(168,85,247,0.15)]",
        // Light mode
        "light:bg-white/95 light:border-purple-200",
        "light:shadow-xl"
      )}>

        {/* Header */}
        <div className="mb-4 sm:mb-6 text-center sm:text-left">
          <h2 className={cn(
            "text-xl sm:text-2xl font-bold mb-1",
            "dark:text-white light:text-gray-900"
          )}>
            {isEditing ? 'Edit Task' : 'Create New Task'}
          </h2>
          <p className={cn(
            "text-xs sm:text-sm",
            "dark:text-gray-400 light:text-gray-600"
          )}>
            {isEditing ? 'Update your task details below' : 'Add a new task to your list'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
          {/* Title Field */}
          <div className="space-y-1.5">
            <Label
              htmlFor="title"
              className={cn(
                "font-semibold text-sm",
                "dark:text-white light:text-gray-900"
              )}
            >
              Title <span className="text-purple-500 dark:text-purple-400 light:text-purple-600">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Enter task title..."
              {...register('title')}
              disabled={isPending}
              className={cn(
                "h-12 rounded-xl border-2 font-medium transition-all duration-200",
                errors.title
                  ? cn(
                      "border-red-500/60 focus:border-red-500",
                      "dark:shadow-[0_0_15px_rgba(239,68,68,0.2)]",
                      "light:shadow-sm"
                    )
                  : cn(
                      // Dark mode
                      "dark:bg-[#1a1a2e] dark:border-[#2a2a3e]",
                      "dark:text-white dark:placeholder:text-gray-400",
                      "dark:hover:bg-[#2a2a3e] dark:hover:border-purple-500/40",
                      "dark:focus:border-purple-500/60 dark:focus:ring-2 dark:focus:ring-purple-500/20",
                      // Light mode
                      "light:bg-white light:border-gray-200",
                      "light:text-gray-900 light:placeholder:text-gray-500",
                      "light:hover:bg-gray-50 light:hover:border-purple-400",
                      "light:focus:border-purple-500 light:focus:ring-2 light:focus:ring-purple-500/20"
                    )
              )}
            />
            <div className="flex justify-between items-center text-xs">
              <span className="text-red-400 font-medium min-h-[16px]">{errors.title?.message}</span>
              <span className={cn(
                titleLength > 200 ? 'text-red-400 font-medium' : 'dark:text-gray-500 light:text-gray-500'
              )}>
                {titleLength}/200
              </span>
            </div>
          </div>

          {/* Description Field */}
          <div className="space-y-1.5">
            <Label
              htmlFor="description"
              className={cn(
                "font-semibold text-sm",
                "dark:text-white light:text-gray-900"
              )}
            >
              Description <span className="dark:text-gray-500 light:text-gray-500 font-normal text-xs ml-1">(optional)</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Enter task description..."
              rows={3}
              {...register('description')}
              disabled={isPending}
              className={cn(
                "resize-none rounded-xl border-2 font-medium transition-all duration-200",
                errors.description
                  ? cn(
                      "border-red-500/60 focus:border-red-500",
                      "dark:shadow-[0_0_15px_rgba(239,68,68,0.2)]",
                      "light:shadow-sm"
                    )
                  : cn(
                      // Dark mode
                      "dark:bg-[#1a1a2e] dark:border-[#2a2a3e]",
                      "dark:text-white dark:placeholder:text-gray-400",
                      "dark:hover:bg-[#2a2a3e] dark:hover:border-purple-500/40",
                      "dark:focus:border-purple-500/60 dark:focus:ring-2 dark:focus:ring-purple-500/20",
                      // Light mode
                      "light:bg-white light:border-gray-200",
                      "light:text-gray-900 light:placeholder:text-gray-500",
                      "light:hover:bg-gray-50 light:hover:border-purple-400",
                      "light:focus:border-purple-500 light:focus:ring-2 light:focus:ring-purple-500/20"
                    )
              )}
            />
            <div className="flex justify-between items-center text-xs">
              <span className="text-red-400 font-medium min-h-[16px]">{errors.description?.message}</span>
              <span className={cn(
                descriptionLength > 1000 ? 'text-red-400 font-medium' : 'dark:text-gray-500 light:text-gray-500'
              )}>
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

          {/* Phase 4: Recurring Task Selector */}
          <RecurringSelector
            isRecurring={isRecurring}
            onIsRecurringChange={setIsRecurring}
            recurrenceType={recurrenceType}
            onRecurrenceTypeChange={setRecurrenceType}
            recurrenceInterval={recurrenceInterval}
            onRecurrenceIntervalChange={setRecurrenceInterval}
            recurrenceDays={recurrenceDays}
            onRecurrenceDaysChange={setRecurrenceDays}
            recurrenceEndDate={recurrenceEndDate}
            onRecurrenceEndDateChange={setRecurrenceEndDate}
            maxOccurrences={maxOccurrences}
            onMaxOccurrencesChange={setMaxOccurrences}
          />

          {/* Actions */}
          <div className={cn(
            "flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t",
            "dark:border-[#2a2a3e] light:border-gray-200"
          )}>
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
                disabled={isPending}
                className={cn(
                  "w-full sm:w-auto min-w-[100px] h-11 font-medium rounded-xl transition-all duration-200",
                  "dark:text-gray-400 dark:hover:text-white dark:hover:bg-[#2a2a3e]",
                  "light:text-gray-600 light:hover:text-gray-900 light:hover:bg-gray-100"
                )}
              >
                Cancel
              </Button>
            )}

            <Button
              type="submit"
              disabled={isPending}
              className={cn(
                "w-full sm:w-auto min-w-[140px] h-11 font-semibold rounded-xl transition-all duration-300",
                "dark:bg-purple-500 dark:text-white dark:hover:bg-purple-600",
                "dark:shadow-lg dark:hover:shadow-[0_0_20px_rgba(168,85,247,0.5)]",
                "light:bg-purple-600 light:text-white light:hover:bg-purple-700",
                "light:shadow-lg light:hover:shadow-xl"
              )}
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
