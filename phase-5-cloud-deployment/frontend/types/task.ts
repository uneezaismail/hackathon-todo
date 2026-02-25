/**
 * Task Type Definitions
 *
 * These types MUST match the FastAPI backend Pydantic models.
 * Tasks are never stored in the frontend database - only fetched from the backend API.
 */

/**
 * Priority type - matches backend PriorityType (T035)
 */
export type Priority = 'High' | 'Medium' | 'Low'

/**
 * Tag interface for autocomplete - matches backend TagWithUsage (T036)
 */
export interface Tag {
  name: string
  usage_count: number
}

/**
 * Recurrence type for recurring tasks - matches backend RecurrenceType enum
 */
export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly'

/**
 * Task entity - matches FastAPI TaskResponse model (T034)
 * Phase 4: Extended with recurrence fields
 */
export interface Task {
  id: string // UUID v4 from backend
  title: string
  description: string | null
  completed: boolean
  priority: Priority // Priority level (default: Medium)
  due_date: string | null // ISO 8601 date format (YYYY-MM-DD)
  tags: string[] // Array of tag names
  user_id: string
  created_at: string // ISO 8601 timestamp
  updated_at: string // ISO 8601 timestamp
  // Phase 4: Recurrence fields
  is_recurring: boolean // Whether this task repeats
  is_pattern: boolean // Whether this is a recurring pattern (template) or instance
  recurrence_type: RecurrenceType | null // Pattern type
  recurrence_interval: number // Interval between occurrences (default: 1)
  recurrence_days: string | null // Days for weekly recurrence (e.g., "mon,wed,fri")
  recurrence_end_date: string | null // End date for recurrence (YYYY-MM-DD)
  max_occurrences: number | null // Max number of occurrences
  parent_task_id: string | null // Links instances to original recurring task
  occurrence_count: number // Number of occurrences generated
}

/**
 * Task creation payload - matches FastAPI TaskCreate model
 * Phase 4: Extended with recurrence fields
 */
export interface TaskCreate {
  title: string
  description?: string | null
  priority?: Priority
  due_date?: string | null // ISO 8601 date format (YYYY-MM-DD)
  tags?: string[]
  // Phase 4: Recurrence fields
  is_recurring?: boolean
  recurrence_type?: RecurrenceType | null
  recurrence_interval?: number
  recurrence_days?: string | null
  recurrence_end_date?: string | null
  max_occurrences?: number | null
}

/**
 * Task update payload - matches FastAPI TaskUpdate model
 * Phase 4: Extended with recurrence fields
 */
export interface TaskUpdate {
  title?: string
  description?: string | null
  completed?: boolean
  priority?: Priority
  due_date?: string | null // ISO 8601 date format (YYYY-MM-DD)
  tags?: string[]
  // Phase 4: Recurrence fields
  is_recurring?: boolean
  recurrence_type?: RecurrenceType | null
  recurrence_interval?: number
  recurrence_days?: string | null
  recurrence_end_date?: string | null
  max_occurrences?: number | null
}

/**
 * Task filter options
 */
export type TaskFilter = 'all' | 'pending' | 'completed'

/**
 * Task sort options - matches backend SortBy enum (T076)
 */
export type TaskSortBy =
  | 'due_date_soonest'
  | 'created_newest'
  | 'created_oldest'
  | 'priority_high_low'
  | 'alphabetical_az'
  // New simplified sort fields
  | 'created'
  | 'due_date'
  | 'priority'
  | 'title'

/**
 * Sort direction for task list
 */
export type TaskSortDirection = 'asc' | 'desc'

/**
 * @deprecated Use TaskSortBy instead. Kept for backward compatibility.
 */
export type TaskSort = 'newest' | 'oldest' | 'title-asc' | 'title-desc'

/**
 * Task list query parameters - matches backend API (T076)
 */
export interface TaskListParams {
  status?: TaskFilter
  search?: string
  priority?: Priority
  tags?: string[]
  sort_by?: TaskSortBy
  sort_direction?: TaskSortDirection
  limit?: number
  offset?: number
}

/**
 * Task statistics (for dashboard)
 */
export interface TaskStats {
  total: number
  pending: number
  completed: number
}
