/**
 * Analytics Utilities for Dashboard
 *
 * Provides calculations for:
 * - Completion trends over time
 * - Priority distribution
 * - Productivity metrics (streaks, rates)
 * - Deadline analysis
 */

import { Task } from '@/types/task'
import { format, subDays, startOfDay, isToday, isTomorrow, isWithinInterval, parseISO } from 'date-fns'

export interface CompletionTrendData {
  date: string
  completed: number
  created: number
}

export interface PriorityDistribution {
  priority: string
  count: number
  percentage: number
  color: string
  [key: string]: string | number
}

export interface ProductivityMetrics {
  completionRate: number
  completionRateTrend: number
  avgCompletionTime: number // in days
  currentStreak: number
  longestStreak: number
  tasksCompletedToday: number
  tasksCompletedThisWeek: number
}

export interface UpcomingDeadline {
  task: Task
  daysUntil: number
  isOverdue: boolean
  urgency: 'critical' | 'urgent' | 'soon' | 'upcoming'
}

/**
 * Calculate completion trends for the last N days
 */
export function calculateCompletionTrends(
  tasks: Task[],
  days: number = 7
): CompletionTrendData[] {
  const today = startOfDay(new Date())
  const trends: CompletionTrendData[] = []

  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(today, i)
    const dateStr = format(date, 'MMM dd')

    // Count completed tasks on this date
    const completed = tasks.filter(task => {
      if (!task.updated_at || !task.completed) return false
      const taskDate = startOfDay(parseISO(task.updated_at))
      return taskDate.getTime() === date.getTime()
    }).length

    // Count created tasks on this date
    const created = tasks.filter(task => {
      if (!task.created_at) return false
      const taskDate = startOfDay(parseISO(task.created_at))
      return taskDate.getTime() === date.getTime()
    }).length

    trends.push({ date: dateStr, completed, created })
  }

  return trends
}

/**
 * Calculate priority distribution
 */
export function calculatePriorityDistribution(tasks: Task[]): PriorityDistribution[] {
  const priorityCounts: Record<string, number> = {
    High: 0,
    Medium: 0,
    Low: 0,
  }

  const activeTasks = tasks.filter(t => !t.completed)

  activeTasks.forEach(task => {
    const priority = task.priority || 'Medium'
    priorityCounts[priority] = (priorityCounts[priority] || 0) + 1
  })

  const total = activeTasks.length || 1 // Avoid division by zero

  const colorMap: Record<string, string> = {
    High: '#ef4444',    // red-500
    Medium: '#f59e0b',  // amber-500
    Low: '#3b82f6',     // blue-500
  }

  return Object.entries(priorityCounts).map(([priority, count]) => ({
    priority,
    count,
    percentage: Math.round((count / total) * 100),
    color: colorMap[priority] || '#6b7280',
  }))
}

/**
 * Calculate productivity metrics
 */
export function calculateProductivityMetrics(tasks: Task[]): ProductivityMetrics {
  const now = new Date()
  const todayStart = startOfDay(now)
  const weekAgo = subDays(todayStart, 7)

  const completedTasks = tasks.filter(t => t.completed)
  const totalTasks = tasks.length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0

  // Calculate completion rate for last 7 days vs previous 7 days for trend
  const recentCompleted = completedTasks.filter(t => {
    if (!t.updated_at) return false
    const date = parseISO(t.updated_at)
    return date >= weekAgo
  }).length

  const previousWeekStart = subDays(weekAgo, 7)
  const previousCompleted = completedTasks.filter(t => {
    if (!t.updated_at) return false
    const date = parseISO(t.updated_at)
    return date >= previousWeekStart && date < weekAgo
  }).length

  const completionRateTrend = previousCompleted > 0
    ? Math.round(((recentCompleted - previousCompleted) / previousCompleted) * 100)
    : recentCompleted > 0 ? 100 : 0

  // Calculate average completion time
  const completionTimes = completedTasks
    .filter(t => t.created_at && t.updated_at)
    .map(t => {
      const created = parseISO(t.created_at!)
      const completed = parseISO(t.updated_at!)
      return (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24) // days
    })

  const avgCompletionTime = completionTimes.length > 0
    ? Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length * 10) / 10
    : 0

  // Calculate streaks
  const { currentStreak, longestStreak } = calculateStreaks(completedTasks)

  // Tasks completed today
  const tasksCompletedToday = completedTasks.filter(t => {
    if (!t.updated_at) return false
    return isToday(parseISO(t.updated_at))
  }).length

  // Tasks completed this week
  const tasksCompletedThisWeek = completedTasks.filter(t => {
    if (!t.updated_at) return false
    const date = parseISO(t.updated_at)
    return date >= weekAgo
  }).length

  return {
    completionRate,
    completionRateTrend,
    avgCompletionTime,
    currentStreak,
    longestStreak,
    tasksCompletedToday,
    tasksCompletedThisWeek,
  }
}

/**
 * Calculate current and longest completion streaks
 */
function calculateStreaks(completedTasks: Task[]): { currentStreak: number; longestStreak: number } {
  if (completedTasks.length === 0) {
    return { currentStreak: 0, longestStreak: 0 }
  }

  // Sort tasks by completion date (newest first)
  const sortedTasks = [...completedTasks]
    .filter(t => t.updated_at)
    .sort((a, b) => parseISO(b.updated_at!).getTime() - parseISO(a.updated_at!).getTime())

  // Get unique days with completions
  const completionDays = new Set<string>()
  sortedTasks.forEach(task => {
    if (task.updated_at) {
      const dayStr = format(startOfDay(parseISO(task.updated_at)), 'yyyy-MM-dd')
      completionDays.add(dayStr)
    }
  })

  const uniqueDays = Array.from(completionDays).sort().reverse()

  // Calculate current streak
  let currentStreak = 0
  const today = format(startOfDay(new Date()), 'yyyy-MM-dd')
  const yesterday = format(subDays(startOfDay(new Date()), 1), 'yyyy-MM-dd')

  // Streak starts from today or yesterday
  if (uniqueDays[0] === today || uniqueDays[0] === yesterday) {
    let expectedDate = uniqueDays[0] === today ? today : yesterday

    for (const day of uniqueDays) {
      if (day === expectedDate) {
        currentStreak++
        expectedDate = format(subDays(parseISO(expectedDate), 1), 'yyyy-MM-dd')
      } else {
        break
      }
    }
  }

  // Calculate longest streak
  let longestStreak = 0
  let tempStreak = 1

  for (let i = 1; i < uniqueDays.length; i++) {
    const prevDate = parseISO(uniqueDays[i - 1])
    const currDate = parseISO(uniqueDays[i])
    const dayDiff = Math.round((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24))

    if (dayDiff === 1) {
      tempStreak++
    } else {
      longestStreak = Math.max(longestStreak, tempStreak)
      tempStreak = 1
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak)

  return { currentStreak, longestStreak }
}

/**
 * Get upcoming deadlines sorted by urgency
 */
export function getUpcomingDeadlines(
  tasks: Task[],
  limit: number = 5
): UpcomingDeadline[] {
  const now = new Date()
  const pendingTasks = tasks.filter(t => !t.completed && t.due_date)

  const deadlines: UpcomingDeadline[] = pendingTasks.map(task => {
    const dueDate = parseISO(task.due_date!)
    const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const isOverdue = daysUntil < 0

    let urgency: UpcomingDeadline['urgency'] = 'upcoming'
    if (isOverdue) {
      urgency = 'critical'
    } else if (daysUntil === 0) {
      urgency = 'critical' // due today
    } else if (daysUntil === 1) {
      urgency = 'urgent' // due tomorrow
    } else if (daysUntil <= 3) {
      urgency = 'soon' // due within 3 days
    }

    return {
      task,
      daysUntil,
      isOverdue,
      urgency,
    }
  })

  // Sort by urgency (overdue first, then by days until due)
  return deadlines
    .sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1
      if (!a.isOverdue && b.isOverdue) return 1
      return a.daysUntil - b.daysUntil
    })
    .slice(0, limit)
}

/**
 * Get tasks for "Today's Focus" section
 */
export function getTodaysFocus(tasks: Task[]): {
  dueToday: Task[]
  overdue: Task[]
  highPriority: Task[]
} {
  const now = new Date()
  const pendingTasks = tasks.filter(t => !t.completed)

  const dueToday = pendingTasks.filter(t => {
    if (!t.due_date) return false
    return isToday(parseISO(t.due_date))
  })

  const overdue = pendingTasks.filter(t => {
    if (!t.due_date) return false
    const dueDate = parseISO(t.due_date)
    return dueDate < startOfDay(now)
  })

  const highPriority = pendingTasks
    .filter(t => t.priority === 'High' && !dueToday.includes(t) && !overdue.includes(t))
    .slice(0, 3) // Top 3 high priority tasks

  return {
    dueToday,
    overdue,
    highPriority,
  }
}

// =============================================================================
// Phase 7: Analytics Enhancements - Heatmap and Recurring Task Stats
// =============================================================================

/**
 * Heatmap data cell representing a single day
 */
export interface HeatmapCell {
  date: string // ISO date format (YYYY-MM-DD)
  count: number // Number of completed tasks
  level: 0 | 1 | 2 | 3 | 4 // Activity level (0=none, 4=high)
}

/**
 * Weekly row for heatmap display
 */
export interface HeatmapWeek {
  weekNumber: number
  cells: HeatmapCell[]
}

/**
 * Heatmap data structure for GitHub-style activity visualization
 */
export interface HeatmapData {
  weeks: HeatmapWeek[]
  maxCount: number
  totalCompleted: number
  activeDays: number
  dateRange: {
    start: string
    end: string
  }
}

/**
 * Recurring task statistics
 */
export interface RecurringTaskStats {
  totalRecurringTasks: number
  activeRecurringTasks: number
  completedOccurrences: number
  recurringByType: {
    daily: number
    weekly: number
    monthly: number
    yearly: number
  }
  completionRateByType: {
    daily: number
    weekly: number
    monthly: number
    yearly: number
  }
  streakByRecurring: number // Current streak for recurring tasks
}

/**
 * Tag statistics
 */
export interface TagStats {
  name: string
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  completionRate: number
  avgCompletionTime: number // in days
}

/**
 * Calculate heatmap data for task completions
 * Creates a GitHub-style contribution graph
 */
export function calculateHeatmapData(
  tasks: Task[],
  weeks: number = 12
): HeatmapData {
  const today = startOfDay(new Date())
  const startDate = subDays(today, weeks * 7 - 1)

  // Build a map of date -> completion count
  const completionMap = new Map<string, number>()

  const completedTasks = tasks.filter(t => t.completed && t.updated_at)
  completedTasks.forEach(task => {
    const completionDate = format(startOfDay(parseISO(task.updated_at!)), 'yyyy-MM-dd')
    const currentCount = completionMap.get(completionDate) || 0
    completionMap.set(completionDate, currentCount + 1)
  })

  // Find max count for level calculation
  const counts = Array.from(completionMap.values())
  const maxCount = counts.length > 0 ? Math.max(...counts) : 0

  // Build weeks array
  const weeksData: HeatmapWeek[] = []
  let currentDate = startDate
  let weekNumber = 0
  let activeDays = 0
  let totalCompleted = 0

  // Adjust to start from Sunday of that week
  const dayOfWeek = currentDate.getDay()
  currentDate = subDays(currentDate, dayOfWeek)

  while (currentDate <= today) {
    const cells: HeatmapCell[] = []

    for (let i = 0; i < 7; i++) {
      const dateStr = format(currentDate, 'yyyy-MM-dd')
      const count = completionMap.get(dateStr) || 0

      if (count > 0) {
        activeDays++
        totalCompleted += count
      }

      // Calculate level (0-4) based on count relative to max
      let level: HeatmapCell['level'] = 0
      if (count > 0 && maxCount > 0) {
        const ratio = count / maxCount
        if (ratio <= 0.25) level = 1
        else if (ratio <= 0.5) level = 2
        else if (ratio <= 0.75) level = 3
        else level = 4
      }

      cells.push({
        date: dateStr,
        count,
        level,
      })

      currentDate = subDays(currentDate, -1) // Add 1 day
    }

    weeksData.push({
      weekNumber,
      cells,
    })
    weekNumber++
  }

  return {
    weeks: weeksData,
    maxCount,
    totalCompleted,
    activeDays,
    dateRange: {
      start: format(startDate, 'yyyy-MM-dd'),
      end: format(today, 'yyyy-MM-dd'),
    },
  }
}

/**
 * Get statistics for recurring tasks
 */
export function getRecurringTaskStats(tasks: Task[]): RecurringTaskStats {
  // Filter recurring tasks (either is_recurring=true or has parent_task_id)
  const recurringTasks = tasks.filter(t => t.is_recurring)
  const recurringInstances = tasks.filter(t => t.parent_task_id !== null)
  const allRecurringRelated = [...recurringTasks, ...recurringInstances]

  // Unique recurring patterns (original tasks)
  const activeRecurring = recurringTasks.filter(t => !t.completed)

  // Count completed occurrences (instances that are completed)
  const completedOccurrences = recurringInstances.filter(t => t.completed).length
    + recurringTasks.filter(t => t.completed).length

  // Count by recurrence type
  const recurringByType = {
    daily: 0,
    weekly: 0,
    monthly: 0,
    yearly: 0,
  }

  recurringTasks.forEach(task => {
    const type = task.recurrence_type
    if (type && type in recurringByType) {
      recurringByType[type as keyof typeof recurringByType]++
    }
  })

  // Calculate completion rate by type
  const completionRateByType = {
    daily: calculateTypeCompletionRate(allRecurringRelated, 'daily'),
    weekly: calculateTypeCompletionRate(allRecurringRelated, 'weekly'),
    monthly: calculateTypeCompletionRate(allRecurringRelated, 'monthly'),
    yearly: calculateTypeCompletionRate(allRecurringRelated, 'yearly'),
  }

  // Calculate streak for recurring tasks
  const streakByRecurring = calculateRecurringStreak(allRecurringRelated)

  return {
    totalRecurringTasks: recurringTasks.length,
    activeRecurringTasks: activeRecurring.length,
    completedOccurrences,
    recurringByType,
    completionRateByType,
    streakByRecurring,
  }
}

/**
 * Calculate completion rate for a specific recurrence type
 */
function calculateTypeCompletionRate(tasks: Task[], type: string): number {
  const typeTasks = tasks.filter(t => t.recurrence_type === type)
  if (typeTasks.length === 0) return 0

  const completed = typeTasks.filter(t => t.completed).length
  return Math.round((completed / typeTasks.length) * 100)
}

/**
 * Calculate current streak for recurring tasks
 */
function calculateRecurringStreak(tasks: Task[]): number {
  const completedRecurring = tasks.filter(t => t.completed && t.updated_at)
  if (completedRecurring.length === 0) return 0

  // Get unique completion days
  const completionDays = new Set<string>()
  completedRecurring.forEach(task => {
    if (task.updated_at) {
      const dayStr = format(startOfDay(parseISO(task.updated_at)), 'yyyy-MM-dd')
      completionDays.add(dayStr)
    }
  })

  const uniqueDays = Array.from(completionDays).sort().reverse()
  if (uniqueDays.length === 0) return 0

  // Calculate streak starting from today or yesterday
  let streak = 0
  const today = format(startOfDay(new Date()), 'yyyy-MM-dd')
  const yesterday = format(subDays(startOfDay(new Date()), 1), 'yyyy-MM-dd')

  if (uniqueDays[0] === today || uniqueDays[0] === yesterday) {
    let expectedDate = uniqueDays[0]

    for (const day of uniqueDays) {
      if (day === expectedDate) {
        streak++
        expectedDate = format(subDays(parseISO(expectedDate), 1), 'yyyy-MM-dd')
      } else {
        break
      }
    }
  }

  return streak
}

/**
 * Get statistics for each tag
 */
export function getTagStats(tasks: Task[]): TagStats[] {
  const tagMap = new Map<string, Task[]>()

  // Group tasks by tag
  tasks.forEach(task => {
    if (task.tags && task.tags.length > 0) {
      task.tags.forEach(tag => {
        const existing = tagMap.get(tag) || []
        existing.push(task)
        tagMap.set(tag, existing)
      })
    }
  })

  // Calculate stats for each tag
  const stats: TagStats[] = []

  tagMap.forEach((tagTasks, tagName) => {
    const completed = tagTasks.filter(t => t.completed)
    const pending = tagTasks.filter(t => !t.completed)

    // Calculate average completion time
    const completionTimes = completed
      .filter(t => t.created_at && t.updated_at)
      .map(t => {
        const created = parseISO(t.created_at)
        const completedAt = parseISO(t.updated_at!)
        return (completedAt.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
      })

    const avgTime = completionTimes.length > 0
      ? Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length * 10) / 10
      : 0

    stats.push({
      name: tagName,
      totalTasks: tagTasks.length,
      completedTasks: completed.length,
      pendingTasks: pending.length,
      completionRate: tagTasks.length > 0
        ? Math.round((completed.length / tagTasks.length) * 100)
        : 0,
      avgCompletionTime: avgTime,
    })
  })

  // Sort by total tasks (descending)
  return stats.sort((a, b) => b.totalTasks - a.totalTasks)
}

/**
 * Filter tasks by date range
 */
export function filterTasksByDateRange(
  tasks: Task[],
  startDate: Date | null,
  endDate: Date | null
): Task[] {
  if (!startDate && !endDate) return tasks

  return tasks.filter(task => {
    // Use created_at for filtering
    if (!task.created_at) return false

    const taskDate = parseISO(task.created_at)

    if (startDate && taskDate < startOfDay(startDate)) return false
    if (endDate && taskDate > startOfDay(subDays(endDate, -1))) return false

    return true
  })
}

/**
 * Get human-readable recurrence pattern text for a task
 * Returns null if task is not recurring
 */
export function getRecurrencePatternText(task: Task): string | null {
  if (!task.is_recurring || !task.recurrence_type) return null

  const type = task.recurrence_type
  const interval = task.recurrence_interval || 1

  // Build pattern description
  let pattern = ""

  if (interval > 1) {
    pattern += `Every ${interval} `
  } else {
    pattern += "Every "
  }

  switch (type) {
    case "daily":
      pattern += interval > 1 ? "days" : "day"
      break
    case "weekly":
      pattern += interval > 1 ? "weeks" : "week"
      // Add specific days if available
      if (task.recurrence_days) {
        const days = task.recurrence_days.split(",").map(d => {
          const dayMap: Record<string, string> = {
            "mon": "Mon", "tue": "Tue", "wed": "Wed", "thu": "Thu",
            "fri": "Fri", "sat": "Sat", "sun": "Sun"
          }
          return dayMap[d.toLowerCase()] || d
        })
        pattern += ` on ${days.join(", ")}`
      }
      break
    case "monthly":
      pattern += interval > 1 ? "months" : "month"
      break
    case "yearly":
      pattern += interval > 1 ? "years" : "year"
      break
  }

  return pattern
}
