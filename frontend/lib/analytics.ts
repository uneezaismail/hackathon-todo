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
      if (!task.updated_at || task.status !== 'completed') return false
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

  const activeTasks = tasks.filter(t => t.status === 'pending')

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

  const completedTasks = tasks.filter(t => t.status === 'completed')
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
  const pendingTasks = tasks.filter(t => t.status === 'pending' && t.due_date)

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
  const pendingTasks = tasks.filter(t => t.status === 'pending')

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
