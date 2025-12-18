/**
 * Dashboard Page - Main Home View (Enhanced)
 *
 * Production-ready dashboard with:
 * - Welcome message
 * - Real-time statistics (total, completed, in progress, overdue)
 * - Completion trends chart (7 days)
 * - Today's focus (actionable tasks)
 * - Upcoming deadlines
 * - Productivity metrics (streaks, completion rate)
 * - Priority distribution
 *
 * For full task management, see /dashboard/tasks
 */

import { DashboardHomeEnhanced } from '@/components/dashboard/dashboard-home-enhanced'

export default function DashboardPage() {
  return <DashboardHomeEnhanced />
}
