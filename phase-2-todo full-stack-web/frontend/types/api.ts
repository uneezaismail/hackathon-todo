/**
 * API Response Type Definitions
 *
 * These types define the structure of API responses from the FastAPI backend.
 */

/**
 * Standard API error response
 */
export interface APIError {
  detail: string
  status_code: number
  type?: string
}

/**
 * Generic API response wrapper
 */
export interface APIResponse<T> {
  data?: T
  error?: APIError
  message?: string
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
  has_more: boolean
}

/**
 * HTTP method types
 */
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/**
 * API request configuration
 */
export interface APIRequestConfig {
  method?: HTTPMethod
  headers?: Record<string, string>
  body?: unknown
  params?: Record<string, string | number | boolean | undefined>
}

/**
 * API client error types
 */
export type APIErrorType =
  | 'NETWORK_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR'

/**
 * Structured API client error
 */
export class APIClientError extends Error {
  type: APIErrorType
  statusCode?: number
  details?: unknown

  constructor(
    message: string,
    type: APIErrorType,
    statusCode?: number,
    details?: unknown
  ) {
    super(message)
    this.name = 'APIClientError'
    this.type = type
    this.statusCode = statusCode
    this.details = details
  }
}
