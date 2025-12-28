/**
 * Server Actions for Task Management (T070-T076)
 *
 * These Server Actions handle all task CRUD operations by:
 * 1. Getting authenticated user from Better Auth session
 * 2. Minting JWT token signed with shared secret (HS256)
 * 3. Making authenticated requests to FastAPI backend with JWT
 * 4. Handling errors and returning results
 *
 * Server Actions automatically handle revalidation and caching.
 */

'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import jwt from 'jsonwebtoken'
import type { Task, TaskCreate, TaskUpdate, Tag, TaskSortBy, TaskSortDirection } from '@/types/task'

/**
 * Backend API response structure for task list
 * Matches TaskListResponse from backend schemas/task.py
 */
interface TaskListResponse {
  tasks: Task[]
  total: number
  limit: number
  offset: number
}

/**
 * Get the authenticated user from Better Auth session and mint API JWT token
 * This runs on the server and has access to cookies
 */
async function getAuthenticatedUser(): Promise<{ userId: string; token: string } | null> {
  try {
    // Import Better Auth server instance
    const { auth } = await import('@/lib/auth')

    // Get session from cookies
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) {
      return null
    }

    // Get the shared secret for JWT signing
    const API_JWT_SECRET = process.env.BETTER_AUTH_SECRET
    if (!API_JWT_SECRET) {
      console.error('BETTER_AUTH_SECRET not configured')
      return null
    }

    // Mint a JWT token for the FastAPI backend
    // This JWT is signed with the same secret the backend uses for verification
    const claims = {
      sub: String(session.user.id), // User ID as subject
      email: session.user.email,
      name: session.user.name,
    }

    const token = jwt.sign(claims, API_JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: '15m', // Short-lived for security
      issuer: 'nextjs-frontend',
      audience: 'fastapi-backend',
    })

    return {
      userId: session.user.id,
      token,
    }
  } catch (error) {
    console.error('Failed to get authenticated user:', error)
    return null
  }
}

/**
 * Make authenticated API request to FastAPI backend
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string }> {
  const auth = await getAuthenticatedUser()

  if (!auth) {
    return { error: 'Unauthorized - please sign in' }
  }

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.token}`,
        ...options.headers,
      },
    })

    // Handle 401 Unauthorized
    if (response.status === 401) {
      return { error: 'Session expired - please sign in again' }
    }

    // Handle other errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        error: errorData.detail || errorData.message || `Request failed with status ${response.status}`,
      }
    }

    // Handle successful DELETE (no content)
    if (response.status === 204 || options.method === 'DELETE') {
      return { data: undefined as T }
    }

    // Parse JSON response
    const data = await response.json()
    return { data }
  } catch (error) {
    console.error('API request failed:', error)
    return {
      error: error instanceof Error ? error.message : 'Network error - unable to reach server',
    }
  }
}

/**
 * T070, T072, T076: Fetch all tasks for the authenticated user with search, filter, and sort support
 */
export async function fetchTasks(params?: {
  search?: string
  status?: string
  priority?: string
  tags?: string[]
  sort_by?: TaskSortBy
  sort_direction?: TaskSortDirection
  limit?: number
  offset?: number
}): Promise<{ tasks?: Task[]; total?: number; error?: string }> {
  const auth = await getAuthenticatedUser()

  if (!auth) {
    return { error: 'Unauthorized - please sign in' }
  }

  // T072: Build query parameters including search, priority, and tags
  const queryParams = new URLSearchParams()

  // Add search parameter
  if (params?.search) {
    queryParams.append('search', params.search)
  }

  // Add status filter
  if (params?.status && params.status !== 'all') {
    // Capitalize status for backend API (expects "Pending" or "Completed")
    const capitalizedStatus = params.status.charAt(0).toUpperCase() + params.status.slice(1)
    queryParams.append('status', capitalizedStatus)
  }

  // Add priority filter
  if (params?.priority && params.priority !== 'all') {
    queryParams.append('priority', params.priority)
  }

  // Add tags filter (array)
  if (params?.tags && params.tags.length > 0) {
    params.tags.forEach(tag => {
      queryParams.append('tags', tag)
    })
  }

  // T076: Add sort_by parameter - map new simple values to backend values
  if (params?.sort_by) {
    // Map simplified sort values to backend values based on direction
    const sortDirection = params.sort_direction || 'desc'
    let backendSortBy = params.sort_by

    // Convert new simplified values to backend-compatible values
    if (params.sort_by === 'created') {
      backendSortBy = sortDirection === 'desc' ? 'created_newest' : 'created_oldest'
    } else if (params.sort_by === 'due_date') {
      backendSortBy = 'due_date_soonest' // Backend only has one due_date sort
    } else if (params.sort_by === 'priority') {
      backendSortBy = 'priority_high_low' // Backend only has high to low
    } else if (params.sort_by === 'title') {
      backendSortBy = 'alphabetical_az' // Backend only has A-Z
    }

    queryParams.append('sort_by', backendSortBy)
  }

  // Add pagination
  if (params?.limit) queryParams.append('limit', params.limit.toString())
  if (params?.offset) queryParams.append('offset', params.offset.toString())

  const queryString = queryParams.toString()
  const endpoint = `/api/${auth.userId}/tasks${queryString ? `?${queryString}` : ''}`

  const result = await apiRequest<TaskListResponse>(endpoint, {
    method: 'GET',
  })

  if (result.error) {
    return { error: result.error }
  }

  // Extract tasks array and total count from double-nested response structure
  // Backend wraps in ApiResponse, then apiRequest wraps it again
  const taskListResponse = result.data as unknown as { data?: TaskListResponse }
  const tasks = taskListResponse?.data?.tasks || []
  const total = taskListResponse?.data?.total || 0

  return { tasks, total }
}

/**
 * T071: Create a new task
 */
export async function createTask(
  data: TaskCreate
): Promise<{ task?: Task; error?: string }> {
  const auth = await getAuthenticatedUser()

  if (!auth) {
    return { error: 'Unauthorized - please sign in' }
  }

  // Validate input
  if (!data.title || data.title.trim().length === 0) {
    return { error: 'Title is required' }
  }

  if (data.title.length > 200) {
    return { error: 'Title must be less than 200 characters' }
  }

  if (data.description && data.description.length > 1000) {
    return { error: 'Description must be less than 1000 characters' }
  }

  const endpoint = `/api/${auth.userId}/tasks`

  const result = await apiRequest<Task>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  })

  if (result.error) {
    return { error: result.error }
  }

  // Extract task from double-nested response (backend wraps in ApiResponse)
  const taskResponse = result.data as unknown as { data?: Task } | Task
  const task = (taskResponse as { data?: Task })?.data || (taskResponse as Task)

  // Revalidate dashboard path to show new task
  revalidatePath('/dashboard')

  return { task }
}

/**
 * T072: Update an existing task
 */
export async function updateTask(
  taskId: string,
  data: TaskUpdate
): Promise<{ task?: Task; error?: string }> {
  const auth = await getAuthenticatedUser()

  if (!auth) {
    return { error: 'Unauthorized - please sign in' }
  }

  // Validate input
  if (data.title !== undefined) {
    if (!data.title || data.title.trim().length === 0) {
      return { error: 'Title is required' }
    }

    if (data.title.length > 200) {
      return { error: 'Title must be less than 200 characters' }
    }
  }

  if (data.description !== undefined && data.description && data.description.length > 1000) {
    return { error: 'Description must be less than 1000 characters' }
  }

  const endpoint = `/api/${auth.userId}/tasks/${taskId}`

  const result = await apiRequest<Task>(endpoint, {
    method: 'PATCH',  // Backend uses PATCH, not PUT
    body: JSON.stringify(data),
  })

  if (result.error) {
    return { error: result.error }
  }

  // Extract task from double-nested response (backend wraps in ApiResponse)
  const taskResponse = result.data as unknown as { data?: Task } | Task
  const task = (taskResponse as { data?: Task })?.data || (taskResponse as Task)

  // Revalidate dashboard path to show updated task
  revalidatePath('/dashboard')

  return { task }
}

/**
 * T073: Delete a task
 */
export async function deleteTask(
  taskId: string
): Promise<{ success?: boolean; error?: string }> {
  const auth = await getAuthenticatedUser()

  if (!auth) {
    return { error: 'Unauthorized - please sign in' }
  }

  const endpoint = `/api/${auth.userId}/tasks/${taskId}`

  const result = await apiRequest<void>(endpoint, {
    method: 'DELETE',
  })

  if (result.error) {
    return { error: result.error }
  }

  // Revalidate dashboard path to remove deleted task
  revalidatePath('/dashboard')

  return { success: true }
}

/**
 * T074: Toggle task completion status
 *
 * Since backend doesn't have a dedicated /complete endpoint,
 * we use the regular PATCH endpoint to update the completed field
 */
export async function toggleTaskComplete(
  taskId: string,
  currentCompleted: boolean
): Promise<{ task?: Task; error?: string }> {
  const auth = await getAuthenticatedUser()

  if (!auth) {
    return { error: 'Unauthorized - please sign in' }
  }

  // Toggle the completion status
  const newCompleted = !currentCompleted

  const endpoint = `/api/${auth.userId}/tasks/${taskId}`

  const result = await apiRequest<Task>(endpoint, {
    method: 'PATCH',
    body: JSON.stringify({ completed: newCompleted }),
  })

  // Extract task from double-nested response (same as update)
  if (result.error) {
    return { error: result.error }
  }

  // Extract task from response
  const taskResponse = result.data as unknown as { data?: Task } | Task
  const task = (taskResponse as { data?: Task })?.data || (taskResponse as Task)

  // Revalidate dashboard path to show updated task
  revalidatePath('/dashboard')

  return { task }
}

/**
 * T039: Fetch user's tags for autocomplete
 */
export async function fetchTags(params?: {
  search?: string
  limit?: number
}): Promise<{ tags?: Tag[]; error?: string }> {
  const auth = await getAuthenticatedUser()

  if (!auth) {
    return { error: 'Unauthorized - please sign in' }
  }

  // Build query parameters
  const queryParams = new URLSearchParams()
  if (params?.search) queryParams.append('search', params.search)
  if (params?.limit) queryParams.append('limit', params.limit.toString())

  const queryString = queryParams.toString()
  // Tags endpoint is at /api/{user_id}/tags (relative to tasks router)
  const endpoint = `/api/${auth.userId}/tags${queryString ? `?${queryString}` : ''}`

  const result = await apiRequest<Tag[]>(endpoint, {
    method: 'GET',
  })

  if (result.error) {
    return { error: result.error }
  }

  // Tags come directly as array (not wrapped in ApiResponse for this endpoint)
  const tags = result.data || []

  return { tags }
}
