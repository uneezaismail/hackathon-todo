/**
 * Task Types Contract: Frontend Task Entity Definitions
 *
 * This file defines TypeScript types for task entities consumed from
 * the FastAPI backend. Tasks are NEVER stored in the frontend database.
 *
 * **IMPORTANT**: All task data is fetched from `/api/{user_id}/tasks`
 * endpoints on the FastAPI backend via Server Actions.
 */

// ============================================================================
// Core Task Entity
// ============================================================================

/**
 * Task entity - represents a todo item from backend
 *
 * This matches the FastAPI Pydantic model exactly.
 */
export interface Task {
  id: string // UUID from backend
  user_id: string // Owner's user ID (must match authenticated user)
  title: string // 1-200 characters
  description: string | null // 0-1000 characters, nullable
  completed: boolean // Completion status
  created_at: string // ISO 8601 timestamp (e.g., "2025-12-12T10:30:00Z")
  updated_at: string // ISO 8601 timestamp
}

// ============================================================================
// Task Input Types (for forms and Server Actions)
// ============================================================================

/**
 * Input for creating a new task
 * Used in task creation forms and Server Actions
 */
export interface CreateTaskInput {
  title: string // Required, 1-200 characters
  description?: string // Optional, 0-1000 characters
}

/**
 * Input for updating an existing task
 * All fields are optional for partial updates
 */
export interface UpdateTaskInput {
  title?: string // Optional, 1-200 characters
  description?: string // Optional, 0-1000 characters, nullable
  completed?: boolean // Optional, toggle completion status
}

/**
 * Input for toggling task completion (convenience type)
 */
export interface ToggleTaskInput {
  completed: boolean
}

// ============================================================================
// Task Filter and Query Types
// ============================================================================

/**
 * Task filter options
 */
export type TaskFilter = "all" | "pending" | "completed"

/**
 * Query parameters for task list endpoint
 */
export interface TaskQueryParams {
  status?: "pending" | "completed" // Omit for "all"
}

/**
 * Task list response from backend
 */
export interface TaskListResponse {
  tasks: Task[]
  total: number
}

// ============================================================================
// Task Display Types (for UI components)
// ============================================================================

/**
 * Task with computed display properties
 * Used in UI components for enhanced display
 */
export interface TaskDisplay extends Task {
  // Computed properties (frontend-only)
  createdAtFormatted: string // e.g., "Dec 12, 2025"
  updatedAtFormatted: string // e.g., "2 hours ago"
  isOverdue?: boolean // Future: if we add due dates
  priority?: "low" | "medium" | "high" // Future: if we add priorities
}

/**
 * Task group for filtering UI
 */
export interface TaskGroup {
  filter: TaskFilter
  label: string
  count: number
  tasks: Task[]
}

// ============================================================================
// Task Operation Types (for optimistic UI)
// ============================================================================

/**
 * Optimistic task state (before backend confirmation)
 */
export interface OptimisticTask extends Task {
  _optimistic: true // Flag to indicate optimistic state
  _operation: "create" | "update" | "delete" | "toggle"
}

/**
 * Task mutation status
 */
export type TaskMutationStatus =
  | { status: "idle" }
  | { status: "pending"; task: OptimisticTask }
  | { status: "success"; task: Task }
  | { status: "error"; error: string; rollback?: Task }

// ============================================================================
// Task Validation Rules (for reference)
// ============================================================================

/**
 * Task field constraints (must match backend validation)
 */
export const TASK_CONSTRAINTS = {
  TITLE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 200,
  },
  DESCRIPTION: {
    MIN_LENGTH: 0,
    MAX_LENGTH: 1000,
  },
} as const

/**
 * Validation helper functions
 */
export const TaskValidation = {
  isValidTitle: (title: string): boolean => {
    return (
      title.length >= TASK_CONSTRAINTS.TITLE.MIN_LENGTH &&
      title.length <= TASK_CONSTRAINTS.TITLE.MAX_LENGTH
    )
  },

  isValidDescription: (description: string | null | undefined): boolean => {
    if (description === null || description === undefined) return true
    return description.length <= TASK_CONSTRAINTS.DESCRIPTION.MAX_LENGTH
  },

  getTitleError: (title: string): string | null => {
    if (title.length < TASK_CONSTRAINTS.TITLE.MIN_LENGTH) {
      return "Title is required"
    }
    if (title.length > TASK_CONSTRAINTS.TITLE.MAX_LENGTH) {
      return `Title must be ${TASK_CONSTRAINTS.TITLE.MAX_LENGTH} characters or less`
    }
    return null
  },

  getDescriptionError: (description: string | null | undefined): string | null => {
    if (description && description.length > TASK_CONSTRAINTS.DESCRIPTION.MAX_LENGTH) {
      return `Description must be ${TASK_CONSTRAINTS.DESCRIPTION.MAX_LENGTH} characters or less`
    }
    return null
  },
} as const

// ============================================================================
// Task Sort and Order Types
// ============================================================================

/**
 * Task sort field options
 */
export type TaskSortField = "created_at" | "updated_at" | "title" | "completed"

/**
 * Sort direction
 */
export type SortDirection = "asc" | "desc"

/**
 * Task sort configuration
 */
export interface TaskSort {
  field: TaskSortField
  direction: SortDirection
}

/**
 * Default task sort (newest first)
 * Per spec FR-014: tasks ordered by created_at in reverse chronological order
 */
export const DEFAULT_TASK_SORT: TaskSort = {
  field: "created_at",
  direction: "desc", // Newest first
} as const

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if task is optimistic
 */
export function isOptimisticTask(task: Task | OptimisticTask): task is OptimisticTask {
  return "_optimistic" in task && task._optimistic === true
}

/**
 * Type guard to check if task is completed
 */
export function isCompletedTask(task: Task): boolean {
  return task.completed === true
}

/**
 * Type guard to check if task is pending
 */
export function isPendingTask(task: Task): boolean {
  return task.completed === false
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Filter tasks by status
 */
export function filterTasks(tasks: Task[], filter: TaskFilter): Task[] {
  switch (filter) {
    case "all":
      return tasks
    case "pending":
      return tasks.filter(isPendingTask)
    case "completed":
      return tasks.filter(isCompletedTask)
    default:
      return tasks
  }
}

/**
 * Sort tasks by field and direction
 */
export function sortTasks(tasks: Task[], sort: TaskSort): Task[] {
  const sorted = [...tasks]

  sorted.sort((a, b) => {
    let aValue: string | boolean = a[sort.field]
    let bValue: string | boolean = b[sort.field]

    // Handle null descriptions
    if (sort.field === "description") {
      aValue = a.description ?? ""
      bValue = b.description ?? ""
    }

    // Sort logic
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sort.direction === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }

    if (typeof aValue === "boolean" && typeof bValue === "boolean") {
      const aNum = aValue ? 1 : 0
      const bNum = bValue ? 1 : 0
      return sort.direction === "asc" ? aNum - bNum : bNum - aNum
    }

    return 0
  })

  return sorted
}

/**
 * Group tasks by completion status
 */
export function groupTasks(tasks: Task[]): TaskGroup[] {
  const pendingTasks = tasks.filter(isPendingTask)
  const completedTasks = tasks.filter(isCompletedTask)

  return [
    {
      filter: "all",
      label: "All Tasks",
      count: tasks.length,
      tasks,
    },
    {
      filter: "pending",
      label: "Pending",
      count: pendingTasks.length,
      tasks: pendingTasks,
    },
    {
      filter: "completed",
      label: "Completed",
      count: completedTasks.length,
      tasks: completedTasks,
    },
  ]
}

// ============================================================================
// Usage Examples (for documentation)
// ============================================================================

/**
 * Example: Creating a task with validation
 *
 * ```typescript
 * import { CreateTaskInput, TaskValidation } from "@/contracts/task-types"
 *
 * function validateAndCreateTask(input: CreateTaskInput): string | null {
 *   const titleError = TaskValidation.getTitleError(input.title)
 *   if (titleError) return titleError
 *
 *   const descriptionError = TaskValidation.getDescriptionError(input.description)
 *   if (descriptionError) return descriptionError
 *
 *   // Validation passed, create task via Server Action
 *   return null
 * }
 * ```
 */

/**
 * Example: Filtering and sorting tasks
 *
 * ```typescript
 * import { Task, filterTasks, sortTasks, DEFAULT_TASK_SORT } from "@/contracts/task-types"
 *
 * function getDisplayTasks(tasks: Task[], filter: TaskFilter): Task[] {
 *   const filtered = filterTasks(tasks, filter)
 *   return sortTasks(filtered, DEFAULT_TASK_SORT) // Newest first
 * }
 * ```
 */

/**
 * Example: Optimistic UI update
 *
 * ```typescript
 * import { Task, OptimisticTask } from "@/contracts/task-types"
 *
 * function createOptimisticTask(input: CreateTaskInput, userId: string): OptimisticTask {
 *   return {
 *     id: `temp-${Date.now()}`, // Temporary ID
 *     user_id: userId,
 *     title: input.title,
 *     description: input.description ?? null,
 *     completed: false,
 *     created_at: new Date().toISOString(),
 *     updated_at: new Date().toISOString(),
 *     _optimistic: true,
 *     _operation: "create",
 *   }
 * }
 * ```
 */

/**
 * Example: Type-safe task toggle
 *
 * ```typescript
 * import { Task, UpdateTaskInput } from "@/contracts/task-types"
 *
 * function toggleTask(task: Task): UpdateTaskInput {
 *   return {
 *     completed: !task.completed,
 *   }
 * }
 * ```
 */
