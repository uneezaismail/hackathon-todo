/**
 * Task utility functions
 *
 * Todoist-style: Single task model with shifting due_date
 * - No more pattern/instance separation
 * - All tasks are real tasks (is_pattern always false)
 * - Recurring tasks shift their due_date when completed
 */

import type { Task } from '@/types/task'

/**
 * Check if a task is a recurring pattern (LEGACY - for backward compatibility)
 *
 * In Todoist-style, this should always return false for new tasks.
 * Kept for backward compatibility with old data that may have is_pattern=true.
 *
 * @param task - Task to check
 * @returns true if the task is a legacy pattern (should be hidden)
 */
function isLegacyPattern(task: Task): boolean {
  // Only check explicit is_pattern flag
  // New tasks will always have is_pattern=false
  return task.is_pattern === true
}

/**
 * Filter out legacy recurring task patterns from task list
 *
 * In Todoist-style model, new recurring tasks are NOT patterns.
 * This filter only removes old legacy pattern data (if any exists).
 *
 * @param tasks - Array of tasks to filter
 * @returns Tasks without legacy patterns
 */
export function filterOutPatterns(tasks: Task[]): Task[] {
  return tasks.filter(task => !isLegacyPattern(task))
}

/**
 * Filter to show only recurring task patterns (LEGACY)
 *
 * Used for "Manage Recurring Tasks" views.
 * In Todoist-style, this returns tasks that are recurring (not patterns).
 *
 * @param tasks - Array of tasks to filter
 * @returns Only recurring tasks
 */
export function filterOnlyPatterns(tasks: Task[]): Task[] {
  // Return recurring tasks (for managing recurrence settings)
  return tasks.filter(task => task.is_recurring && !task.completed)
}

/**
 * Filter tasks for display (Todoist-style)
 *
 * In Todoist-style model:
 * - All tasks are real tasks (no patterns)
 * - Each recurring task is a single task with shifting due_date
 * - No need to filter "nearest instance" because there's only ONE task
 *
 * This function now just removes legacy patterns (if any).
 *
 * @param tasks - Array of tasks to filter
 * @returns Tasks ready for display
 */
export function filterNearestRecurringInstance(tasks: Task[]): Task[] {
  // Todoist-style: Just filter out legacy patterns, show all real tasks
  return filterOutPatterns(tasks)
}

/**
 * Filter to show all instances of recurring tasks (LEGACY)
 *
 * In Todoist-style, this is the same as filterOutPatterns because
 * there are no multiple instances - just one task per recurring item.
 *
 * @param tasks - Array of tasks to filter
 * @returns All tasks (excluding legacy patterns)
 */
export function filterAllRecurringInstances(tasks: Task[]): Task[] {
  return filterOutPatterns(tasks)
}

/**
 * Get display-ready tasks for the task list
 *
 * Convenience function that applies all necessary filters.
 *
 * @param tasks - Array of tasks from API
 * @returns Tasks ready for display
 */
export function getDisplayTasks(tasks: Task[]): Task[] {
  return filterOutPatterns(tasks)
}
