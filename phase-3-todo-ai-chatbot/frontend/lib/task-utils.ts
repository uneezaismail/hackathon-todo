/**
 * Task utility functions
 */

import type { Task } from '@/types/task'

/**
 * Filter out recurring task patterns from task list
 *
 * Patterns (is_pattern=true) are templates used to generate instances.
 * They should NOT be shown in regular task lists, calendars, or analytics.
 * Users should only see instances (is_pattern=false).
 *
 * @param tasks - Array of tasks to filter
 * @returns Tasks without patterns (only instances and non-recurring tasks)
 */
export function filterOutPatterns(tasks: Task[]): Task[] {
  return tasks.filter(task => {
    // Keep all non-recurring tasks
    if (!task.is_recurring) {
      return true
    }

    // For recurring tasks, only keep instances (not patterns)
    // is_pattern might be undefined in older data, treat undefined as false
    const isPattern = task.is_pattern ?? false
    return !isPattern
  })
}

/**
 * Filter to show only recurring task patterns
 *
 * Used for "Manage Recurring Tasks" views where users want to see
 * the templates/patterns, not the individual instances.
 *
 * @param tasks - Array of tasks to filter
 * @returns Only recurring task patterns
 */
export function filterOnlyPatterns(tasks: Task[]): Task[] {
  return tasks.filter(task => {
    return task.is_recurring && (task.is_pattern ?? false)
  })
}
