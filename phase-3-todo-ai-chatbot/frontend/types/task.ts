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
 * Task entity - matches FastAPI TaskResponse model (T034)
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
}

/**
 * Task creation payload - matches FastAPI TaskCreate model
 */
export interface TaskCreate {
  title: string
  description?: string | null
  priority?: Priority
  due_date?: string | null // ISO 8601 date format (YYYY-MM-DD)
  tags?: string[]
}

/**
 * Task update payload - matches FastAPI TaskUpdate model
 */
export interface TaskUpdate {
  title?: string
  description?: string | null
  completed?: boolean
  priority?: Priority
  due_date?: string | null // ISO 8601 date format (YYYY-MM-DD)
  tags?: string[]
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
