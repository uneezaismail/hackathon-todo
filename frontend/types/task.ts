/**
 * Task Type Definitions
 *
 * These types MUST match the FastAPI backend Pydantic models.
 * Tasks are never stored in the frontend database - only fetched from the backend API.
 */

/**
 * Task entity - matches FastAPI TaskResponse model
 */
export interface Task {
  id: string // UUID v4 from backend
  title: string
  description: string | null
  completed: boolean
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
}

/**
 * Task update payload - matches FastAPI TaskUpdate model
 */
export interface TaskUpdate {
  title?: string
  description?: string | null
  completed?: boolean
}

/**
 * Task filter options
 */
export type TaskFilter = 'all' | 'pending' | 'completed'

/**
 * Task sort options
 */
export type TaskSort = 'newest' | 'oldest' | 'title-asc' | 'title-desc'

/**
 * Task list query parameters
 */
export interface TaskListParams {
  status?: TaskFilter
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
