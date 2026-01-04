/**
 * Analytics Skeleton Loaders with Shimmer Effect
 *
 * Matches analytics dashboard layout and prevents layout shift
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
 * Analytics Header Skeleton
 */
export function AnalyticsHeaderSkeleton() {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-6 w-80" />
      </div>
      <Skeleton className="h-10 w-64 rounded-lg" />
    </div>
  )
}

/**
 * Quick Stat Card Skeleton
 */
export function QuickStatCardSkeleton() {
  return (
    <div className={cn(
      "rounded-2xl border p-6",
      "dark:border-[#2a2a3e] light:border-[#e5e5ea]",
      "dark:bg-[#1a1a2e] light:bg-white"
    )}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  )
}

/**
 * Quick Stats Grid Skeleton (4 cards)
 */
export function QuickStatsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <QuickStatCardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Trend Card Skeleton
 */
export function TrendCardSkeleton() {
  return (
    <div className={cn(
      "rounded-2xl border p-6",
      "dark:border-[#2a2a3e] light:border-[#e5e5ea]",
      "dark:bg-[#1a1a2e] light:bg-white"
    )}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
      <Skeleton className="h-9 w-28 mb-2" />
      <Skeleton className="h-4 w-40" />
    </div>
  )
}

/**
 * Trend Cards Grid Skeleton (3 cards)
 */
export function TrendCardsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <TrendCardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Heatmap Skeleton
 */
export function HeatmapSkeleton() {
  return (
    <div className={cn(
      "rounded-2xl border",
      "dark:border-[#2a2a3e] light:border-[#e5e5ea]",
      "dark:bg-[#1a1a2e] light:bg-white"
    )}>
      <div className={cn(
        "p-6 border-b",
        "dark:border-[#2a2a3e] light:border-[#e5e5ea]"
      )}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="p-6">
        {/* Month labels */}
        <Skeleton className="h-3 w-full mb-2" />

        {/* Heatmap grid */}
        <div className="space-y-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-full" />
          ))}
        </div>

        {/* Stats summary */}
        <div className={cn(
          "mt-6 pt-6 border-t grid grid-cols-3 gap-4",
          "dark:border-[#2a2a3e] light:border-[#e5e5ea]"
        )}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="text-center space-y-2">
              <Skeleton className="h-7 w-12 mx-auto" />
              <Skeleton className="h-3 w-24 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Recurring Stats Card Skeleton
 */
export function RecurringStatsSkeleton() {
  return (
    <div className={cn(
      "rounded-2xl border",
      "dark:border-[#2a2a3e] light:border-[#e5e5ea]",
      "dark:bg-[#1a1a2e] light:bg-white"
    )}>
      <div className={cn(
        "p-6 border-b",
        "dark:border-[#2a2a3e] light:border-[#e5e5ea]"
      )}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>
      <div className="p-6 space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className={cn(
              "p-4 rounded-xl border",
              "dark:border-[#2a2a3e] light:border-[#e5e5ea]"
            )}>
              <Skeleton className="h-9 w-12 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>

        {/* Type breakdown */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-8 rounded-full" />
                </div>
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Tag Stats Card Skeleton
 */
export function TagStatsSkeleton() {
  return (
    <div className={cn(
      "rounded-2xl border",
      "dark:border-[#2a2a3e] light:border-[#e5e5ea]",
      "dark:bg-[#1a1a2e] light:bg-white"
    )}>
      <div className={cn(
        "p-6 border-b",
        "dark:border-[#2a2a3e] light:border-[#e5e5ea]"
      )}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <div className="p-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-4 w-10" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-14" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Weekly Activity Summary Skeleton
 */
export function WeeklyActivitySkeleton() {
  return (
    <div className={cn(
      "rounded-2xl border",
      "dark:border-[#2a2a3e] light:border-[#e5e5ea]",
      "dark:bg-[#1a1a2e] light:bg-white"
    )}>
      <div className={cn(
        "p-6 border-b",
        "dark:border-[#2a2a3e] light:border-[#e5e5ea]"
      )}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={cn(
              "text-center p-4 rounded-xl border",
              "dark:border-[#2a2a3e] light:border-[#e5e5ea]"
            )}>
              <Skeleton className="h-9 w-12 mx-auto mb-2" />
              <Skeleton className="h-3 w-24 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Full Analytics Dashboard Skeleton
 */
export function AnalyticsDashboardSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      {/* Header */}
      <AnalyticsHeaderSkeleton />

      {/* Quick Stats */}
      <QuickStatsGridSkeleton />

      {/* Trend Cards */}
      <TrendCardsGridSkeleton />

      {/* Heatmap and Recurring Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <HeatmapSkeleton />
        </div>
        <RecurringStatsSkeleton />
      </div>

      {/* Tag Stats */}
      <TagStatsSkeleton />

      {/* Weekly Activity */}
      <WeeklyActivitySkeleton />
    </div>
  )
}
