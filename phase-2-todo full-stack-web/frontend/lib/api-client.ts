/**
 * API Client with Automatic JWT Token Attachment
 *
 * This client handles all HTTP requests to the FastAPI backend with:
 * - Automatic JWT token attachment from Better Auth session
 * - Type-safe request/response handling
 * - Centralized error handling
 * - Automatic redirect on 401 Unauthorized
 */

import type { APIRequestConfig, APIClientError } from '@/types/api'
import type { Task, TaskCreate, TaskUpdate } from '@/types/task'

/**
 * Base API URL from environment variables
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/**
 * Get the current session token from Better Auth
 * This runs on the client side to extract the JWT token from cookies
 */
async function getSessionToken(): Promise<string | null> {
  try {
    // Better Auth stores the session token in cookies
    // We'll extract it using the better-auth client
    const { getSession } = await import('@/lib/auth-client')
    const sessionData = await getSession()

    // Type guard for session data
    if (sessionData && typeof sessionData === 'object' && 'data' in sessionData) {
      const data = sessionData.data
      if (data && typeof data === 'object' && 'session' in data) {
        const session = data.session as { token?: string } | null
        return session?.token || null
      }
    }

    return null
  } catch (error) {
    console.error('Failed to get session token:', error)
    return null
  }
}

/**
 * Build query string from parameters
 */
function buildQueryString(params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return ''

  const filtered = Object.entries(params).filter(([_, value]) => value !== undefined)
  if (filtered.length === 0) return ''

  const query = new URLSearchParams(
    filtered.map(([key, value]) => [key, String(value)])
  ).toString()

  return `?${query}`
}

/**
 * Generic fetch wrapper with automatic JWT token attachment
 */
async function apiRequest<T>(
  endpoint: string,
  config: APIRequestConfig = {}
): Promise<T> {
  const {
    method = 'GET',
    headers = {},
    body,
    params,
  } = config

  // Get JWT token from session
  const token = await getSessionToken()

  // Build headers
  const requestHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers,
  }

  // Add Authorization header if token exists
  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`
  }

  // Build URL with query parameters
  const queryString = buildQueryString(params)
  const url = `${API_BASE_URL}${endpoint}${queryString}`

  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    })

    // Handle 401 Unauthorized - redirect to sign-in
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/sign-in'
      }
      throw new Error('Unauthorized - redirecting to sign-in')
    }

    // Parse response
    const data = await response.json()

    // Handle non-2xx responses
    if (!response.ok) {
      const error: APIClientError = new Error(
        data.detail || data.message || 'API request failed'
      ) as APIClientError
      error.name = 'APIClientError'
      error.statusCode = response.status
      error.details = data
      throw error
    }

    return data as T
  } catch (error) {
    // Re-throw API errors
    if ((error as APIClientError).name === 'APIClientError') {
      throw error
    }

    // Handle network errors
    const networkError: APIClientError = new Error(
      'Network error - unable to reach server'
    ) as APIClientError
    networkError.name = 'APIClientError'
    networkError.details = error
    throw networkError
  }
}

/**
 * API Client with typed methods for task operations
 */
export const api = {
  /**
   * Get all tasks for the authenticated user
   */
  async getTasks(userId: string, params?: { status?: string; limit?: number; offset?: number }): Promise<Task[]> {
    return apiRequest<Task[]>(`/api/${userId}/tasks`, { params })
  },

  /**
   * Get a single task by ID
   */
  async getTask(userId: string, taskId: number): Promise<Task> {
    return apiRequest<Task>(`/api/${userId}/tasks/${taskId}`)
  },

  /**
   * Create a new task
   */
  async createTask(userId: string, data: TaskCreate): Promise<Task> {
    return apiRequest<Task>(`/api/${userId}/tasks`, {
      method: 'POST',
      body: data,
    })
  },

  /**
   * Update an existing task
   */
  async updateTask(userId: string, taskId: number, data: TaskUpdate): Promise<Task> {
    return apiRequest<Task>(`/api/${userId}/tasks/${taskId}`, {
      method: 'PUT',
      body: data,
    })
  },

  /**
   * Delete a task
   */
  async deleteTask(userId: string, taskId: number): Promise<void> {
    return apiRequest<void>(`/api/${userId}/tasks/${taskId}`, {
      method: 'DELETE',
    })
  },

  /**
   * Toggle task completion status
   */
  async toggleTaskComplete(userId: string, taskId: number): Promise<Task> {
    return apiRequest<Task>(`/api/${userId}/tasks/${taskId}/complete`, {
      method: 'PATCH',
    })
  },
}
