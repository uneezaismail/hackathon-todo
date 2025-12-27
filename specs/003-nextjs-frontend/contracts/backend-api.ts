/**
 * Backend API Contract: FastAPI Endpoints
 *
 * This file defines TypeScript interfaces for all FastAPI backend endpoints.
 * These types ensure type-safe communication between Next.js Server Actions
 * and the Python FastAPI backend.
 *
 * **IMPORTANT**: All task endpoints are scoped to authenticated user via
 * dynamic URL path: `/api/{user_id}/tasks`
 */

// ============================================================================
// Base Types
// ============================================================================

/**
 * Standard API error response from FastAPI
 */
export interface ApiError {
  detail: string | {
    message: string
    code?: string
    errors?: Record<string, string[]>
  }
}

/**
 * FastAPI validation error structure
 */
export interface ValidationError {
  loc: (string | number)[]
  msg: string
  type: string
}

/**
 * FastAPI 422 validation error response
 */
export interface UnprocessableEntityError {
  detail: ValidationError[]
}

// ============================================================================
// Task Endpoints
// ============================================================================

/**
 * Task entity from backend
 */
export interface TaskResponse {
  id: string
  user_id: string
  title: string
  description: string | null
  completed: boolean
  created_at: string // ISO 8601
  updated_at: string // ISO 8601
}

/**
 * GET /api/{user_id}/tasks
 * List all tasks for authenticated user
 *
 * Query Parameters:
 * - status?: "pending" | "completed" (optional, omit for all tasks)
 */
export interface GetTasksRequest {
  userId: string // Path parameter
  params?: {
    status?: "pending" | "completed"
  }
}

export interface GetTasksResponse {
  tasks: TaskResponse[]
  total: number
}

/**
 * POST /api/{user_id}/tasks
 * Create new task for authenticated user
 */
export interface CreateTaskRequest {
  userId: string // Path parameter
  body: {
    title: string // 1-200 characters
    description?: string // 0-1000 characters, optional
  }
}

export type CreateTaskResponse = TaskResponse

/**
 * GET /api/{user_id}/tasks/{task_id}
 * Get single task by ID (must belong to user)
 */
export interface GetTaskRequest {
  userId: string // Path parameter
  taskId: string // Path parameter
}

export type GetTaskResponse = TaskResponse

/**
 * PUT /api/{user_id}/tasks/{task_id}
 * Update task (full replacement)
 */
export interface UpdateTaskRequest {
  userId: string // Path parameter
  taskId: string // Path parameter
  body: {
    title?: string // 1-200 characters
    description?: string // 0-1000 characters, nullable
    completed?: boolean
  }
}

export type UpdateTaskResponse = TaskResponse

/**
 * PATCH /api/{user_id}/tasks/{task_id}
 * Partially update task (e.g., toggle completion)
 */
export interface PatchTaskRequest {
  userId: string // Path parameter
  taskId: string // Path parameter
  body: {
    completed?: boolean
    title?: string
    description?: string
  }
}

export type PatchTaskResponse = TaskResponse

/**
 * DELETE /api/{user_id}/tasks/{task_id}
 * Delete task (must belong to user)
 */
export interface DeleteTaskRequest {
  userId: string // Path parameter
  taskId: string // Path parameter
}

export interface DeleteTaskResponse {
  message: string // "Task deleted successfully"
  id: string
}

// ============================================================================
// Health & Status Endpoints
// ============================================================================

/**
 * GET /health
 * Health check endpoint
 */
export interface HealthCheckResponse {
  status: "healthy" | "degraded" | "unhealthy"
  timestamp: string // ISO 8601
  version?: string
}

/**
 * GET /api/status
 * API status with JWT validation check
 */
export interface ApiStatusResponse {
  status: "ok"
  authenticated: boolean
  user_id?: string
}

// ============================================================================
// Error Response Types
// ============================================================================

/**
 * 400 Bad Request
 */
export interface BadRequestError extends ApiError {
  detail: string
}

/**
 * 401 Unauthorized (invalid/missing JWT token)
 */
export interface UnauthorizedError extends ApiError {
  detail: "Invalid or missing authentication token" | "Token expired"
}

/**
 * 403 Forbidden (user trying to access another user's task)
 */
export interface ForbiddenError extends ApiError {
  detail: "You do not have permission to access this resource"
}

/**
 * 404 Not Found (task doesn't exist or doesn't belong to user)
 */
export interface NotFoundError extends ApiError {
  detail: "Task not found" | "Resource not found"
}

/**
 * 422 Unprocessable Entity (validation errors)
 */
export interface ValidationErrorResponse extends UnprocessableEntityError {
  detail: ValidationError[]
}

/**
 * 500 Internal Server Error
 */
export interface InternalServerError extends ApiError {
  detail: "Internal server error"
}

// ============================================================================
// HTTP Client Type Helpers
// ============================================================================

/**
 * HTTP methods used in backend API
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

/**
 * HTTP status codes returned by backend
 */
export type HttpStatusCode =
  | 200 // OK
  | 201 // Created
  | 204 // No Content
  | 400 // Bad Request
  | 401 // Unauthorized
  | 403 // Forbidden
  | 404 // Not Found
  | 422 // Unprocessable Entity
  | 500 // Internal Server Error

/**
 * Generic API response wrapper
 */
export type ApiResponse<T> =
  | { success: true; data: T; status: HttpStatusCode }
  | { success: false; error: ApiError; status: HttpStatusCode }

// ============================================================================
// Request Headers
// ============================================================================

/**
 * Required headers for authenticated API requests
 */
export interface AuthenticatedHeaders {
  "Authorization": `Bearer ${string}` // JWT token
  "Content-Type"?: "application/json"
}

// ============================================================================
// Endpoint Registry (for reference)
// ============================================================================

/**
 * Complete list of backend API endpoints
 */
export const API_ENDPOINTS = {
  // Health
  HEALTH: "/health",
  STATUS: "/api/status",

  // Tasks (user-scoped)
  TASKS_LIST: (userId: string) => `/api/${userId}/tasks` as const,
  TASKS_CREATE: (userId: string) => `/api/${userId}/tasks` as const,
  TASKS_GET: (userId: string, taskId: string) => `/api/${userId}/tasks/${taskId}` as const,
  TASKS_UPDATE: (userId: string, taskId: string) => `/api/${userId}/tasks/${taskId}` as const,
  TASKS_PATCH: (userId: string, taskId: string) => `/api/${userId}/tasks/${taskId}` as const,
  TASKS_DELETE: (userId: string, taskId: string) => `/api/${userId}/tasks/${taskId}` as const,
} as const

// ============================================================================
// Usage Examples (for documentation)
// ============================================================================

/**
 * Example: Fetching tasks with type-safe contract
 *
 * ```typescript
 * import { API_ENDPOINTS, GetTasksResponse } from "@/contracts/backend-api"
 *
 * async function getTasks(userId: string, filter?: "pending" | "completed") {
 *   const url = new URL(API_ENDPOINTS.TASKS_LIST(userId), process.env.NEXT_PUBLIC_API_BASE_URL)
 *   if (filter) url.searchParams.set("status", filter)
 *
 *   const response = await fetch(url, {
 *     headers: {
 *       "Authorization": `Bearer ${token}`,
 *     },
 *   })
 *
 *   if (!response.ok) throw new Error("Failed to fetch tasks")
 *
 *   const data: GetTasksResponse = await response.json()
 *   return data.tasks
 * }
 * ```
 */

/**
 * Example: Creating a task with validation
 *
 * ```typescript
 * import { API_ENDPOINTS, CreateTaskRequest, CreateTaskResponse } from "@/contracts/backend-api"
 *
 * async function createTask(userId: string, title: string, description?: string) {
 *   const body: CreateTaskRequest["body"] = {
 *     title,
 *     description,
 *   }
 *
 *   const response = await fetch(
 *     `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ENDPOINTS.TASKS_CREATE(userId)}`,
 *     {
 *       method: "POST",
 *       headers: {
 *         "Authorization": `Bearer ${token}`,
 *         "Content-Type": "application/json",
 *       },
 *       body: JSON.stringify(body),
 *     }
 *   )
 *
 *   if (!response.ok) {
 *     if (response.status === 422) {
 *       const error: ValidationErrorResponse = await response.json()
 *       throw new Error(`Validation failed: ${error.detail[0].msg}`)
 *     }
 *     throw new Error("Failed to create task")
 *   }
 *
 *   const task: CreateTaskResponse = await response.json()
 *   return task
 * }
 * ```
 */
