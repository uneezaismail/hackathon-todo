/**
 * Modern Skeleton Loaders with Shimmer Effect
 *
 * Follows 2025 best practices:
 * - Proper shimmer animations
 * - Matches actual content dimensions
 * - Prevents layout shift
 * - Works in both light and dark modes
 */

import { cn } from '@/lib/utils'

/**
 * Base Skeleton Component with Shimmer
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('skeleton bg-muted/50', className)}
      {...props}
    />
  )
}

/**
 * Modern Stat Card Skeleton
 */
export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-20" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  )
}

/**
 * Stats Grid Skeleton (4 cards)
 */
export function StatsGridSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Chart Card Skeleton
 */
export function ChartCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <Skeleton className="h-[250px] w-full rounded-lg" />
    </div>
  )
}

/**
 * Activity Feed Item Skeleton
 */
export function ActivityItemSkeleton() {
  return (
    <div className="flex items-start gap-4 p-4">
      <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

/**
 * Activity Feed Skeleton
 */
export function ActivityFeedSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="border-b border-border p-6">
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: 5 }).map((_, i) => (
          <ActivityItemSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

/**
 * Task Item Skeleton
 */
export function TaskItemSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <Skeleton className="h-5 w-5 rounded flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  )
}

/**
 * Task List Skeleton
 */
export function TaskListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <TaskItemSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Today's Focus Skeleton
 */
export function TodaysFocusSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <TaskItemSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

/**
 * Upcoming Deadlines Skeleton
 */
export function UpcomingDeadlinesSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6">
        <Skeleton className="h-6 w-40" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Metrics Grid Skeleton
 */
export function MetricsGridSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <Skeleton className="mb-6 h-6 w-40" />
      <div className="grid gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Priority Distribution Skeleton
 */
export function PriorityDistributionSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <Skeleton className="mb-6 h-6 w-40" />
      <Skeleton className="mx-auto h-48 w-48 rounded-full" />
      <div className="mt-6 grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="text-center space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="mx-auto h-5 w-10" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Full Dashboard Skeleton
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Stats Grid */}
      <StatsGridSkeleton />

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCardSkeleton />
        <TodaysFocusSkeleton />
      </div>

      {/* Three Column Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        <UpcomingDeadlinesSkeleton />
        <MetricsGridSkeleton />
        <PriorityDistributionSkeleton />
      </div>
    </div>
  )
}
