/**
 * Dashboard Skeleton Loaders
 *
 * Provides loading states for all dashboard components
 * Uses shimmer animation matching purple theme
 */

import * as React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// Pre-computed heights for chart bars (avoids Math.random during render)
const CHART_BAR_HEIGHTS = [45, 72, 35, 88, 55, 68, 42]

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border-2 border-border bg-card p-6 backdrop-blur-md">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-24 bg-secondary" />
          <Skeleton className="h-8 w-16 bg-secondary" />
          <Skeleton className="h-3 w-32 bg-secondary" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl bg-secondary" />
      </div>
    </div>
  )
}

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
    </div>
  )
}

export function ChartCardSkeleton() {
  return (
    <div className="rounded-2xl border-2 border-border bg-card p-6 backdrop-blur-md">
      <div className="space-y-4">
        <div>
          <Skeleton className="h-6 w-32 bg-secondary mb-2" />
          <Skeleton className="h-4 w-48 bg-secondary" />
        </div>
        <div className="h-64 flex items-end justify-between gap-2">
          {CHART_BAR_HEIGHTS.map((height, i) => (
            <Skeleton
              key={i}
              className="w-full bg-secondary"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export function TaskItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-border bg-card backdrop-blur-sm">
      <Skeleton className="h-5 w-5 rounded-full bg-secondary" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4 bg-secondary" />
        <Skeleton className="h-3 w-1/2 bg-secondary" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full bg-secondary" />
    </div>
  )
}

export function TodaysFocusSkeleton() {
  return (
    <div className="rounded-2xl border-2 border-border bg-card p-6 backdrop-blur-md">
      <div className="space-y-4">
        <div>
          <Skeleton className="h-6 w-32 bg-secondary mb-2" />
          <Skeleton className="h-4 w-48 bg-secondary" />
        </div>
        <div className="space-y-3">
          <TaskItemSkeleton />
          <TaskItemSkeleton />
          <TaskItemSkeleton />
        </div>
      </div>
    </div>
  )
}

export function UpcomingDeadlinesSkeleton() {
  return (
    <div className="rounded-2xl border-2 border-border bg-card p-6 backdrop-blur-md">
      <div className="space-y-4">
        <div>
          <Skeleton className="h-6 w-40 bg-secondary mb-2" />
          <Skeleton className="h-4 w-56 bg-secondary" />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4 bg-secondary" />
                <Skeleton className="h-3 w-1/2 bg-secondary" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full bg-secondary" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ProductivityMetricsSkeleton() {
  return (
    <div className="rounded-2xl border-2 border-border bg-card p-6 backdrop-blur-md">
      <div className="space-y-4">
        <Skeleton className="h-6 w-48 bg-secondary mb-4" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24 bg-secondary" />
              <Skeleton className="h-8 w-16 bg-secondary" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function PriorityDistributionSkeleton() {
  return (
    <div className="rounded-2xl border-2 border-border bg-card p-6 backdrop-blur-md">
      <div className="space-y-4">
        <div>
          <Skeleton className="h-6 w-48 bg-secondary mb-2" />
          <Skeleton className="h-4 w-64 bg-secondary" />
        </div>
        <div className="flex items-center justify-center h-64">
          <Skeleton className="h-48 w-48 rounded-full bg-secondary" />
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-3 rounded-full bg-secondary" />
                <Skeleton className="h-4 w-16 bg-secondary" />
              </div>
              <Skeleton className="h-4 w-12 bg-secondary" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function DashboardHomeSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Welcome Section */}
      <div>
        <Skeleton className="h-9 w-64 bg-secondary mb-2" />
        <Skeleton className="h-5 w-96 bg-secondary" />
      </div>

      {/* Stats Grid */}
      <DashboardStatsSkeleton />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCardSkeleton />
        <TodaysFocusSkeleton />
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <UpcomingDeadlinesSkeleton />
        <ProductivityMetricsSkeleton />
        <PriorityDistributionSkeleton />
      </div>
    </div>
  )
}

/**
 * Calendar Page Skeleton - Uses shimmer animation like other pages
 */
export function CalendarPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-pulse">
        <div>
          <Skeleton className="h-8 w-32 mb-2 bg-primary/10" />
          <Skeleton className="h-4 w-64 bg-primary/10" />
        </div>
        <Skeleton className="h-10 w-28 rounded-lg bg-primary/10" />
      </div>

      {/* Workload Header */}
      <div className="rounded-xl border-2 border-[#A855F7]/20 bg-gradient-to-br from-[#A855F7]/5 to-[#A855F7]/2 p-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-8 w-12 mb-1 bg-primary/10" />
                <Skeleton className="h-3 w-16 bg-primary/10" />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-16 rounded-md bg-primary/10" />
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex gap-6">
        {/* Calendar */}
        <div className="flex-1 rounded-xl border-2 border-[#A855F7]/20 bg-gradient-to-br from-[#A855F7]/5 to-[#A855F7]/2 p-4 animate-pulse">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-md bg-primary/10" />
              <Skeleton className="h-6 w-32 bg-primary/10" />
              <Skeleton className="h-8 w-8 rounded-md bg-primary/10" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20 rounded-md bg-primary/10" />
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {[...Array(7)].map((_, i) => (
              <Skeleton key={`header-${i}`} className="h-8 w-full bg-primary/10" />
            ))}
            {/* Calendar cells - 6 rows */}
            {[...Array(42)].map((_, i) => (
              <Skeleton key={`cell-${i}`} className="h-24 w-full bg-primary/10" />
            ))}
          </div>
        </div>

        {/* Sidebar - Hidden on mobile, shows on xl */}
        <div className="hidden xl:flex flex-col gap-4 w-72">
          {/* Mini Heatmap */}
          <div className="rounded-xl border-2 border-[#A855F7]/20 bg-gradient-to-br from-[#A855F7]/5 to-[#A855F7]/2 p-4 animate-pulse">
            <Skeleton className="h-5 w-24 mb-3 bg-primary/10" />
            <div className="grid grid-cols-7 gap-1">
              {[...Array(35)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-4 bg-primary/10" />
              ))}
            </div>
          </div>

          {/* Unscheduled Tasks */}
          <div className="flex-1 rounded-xl border-2 border-[#A855F7]/20 bg-gradient-to-br from-[#A855F7]/5 to-[#A855F7]/2 p-4 animate-pulse">
            <Skeleton className="h-5 w-32 mb-4 bg-primary/10" />
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-[#A855F7]/10">
                  <Skeleton className="h-4 w-4 rounded-full bg-primary/10" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24 bg-primary/10" />
                    <Skeleton className="h-3 w-16 bg-primary/10" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * T064: Analytics Dashboard Skeleton
 */
export function AnalyticsDashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-md bg-secondary" />
            <Skeleton className="h-9 w-32 bg-secondary" />
          </div>
          <Skeleton className="h-5 w-80 bg-secondary" />
        </div>
        <Skeleton className="h-10 w-64 rounded-lg bg-secondary" />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <QuickStatSkeleton key={i} />
        ))}
      </div>

      {/* Trend Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <TrendCardSkeleton key={i} />
        ))}
      </div>

      {/* Main Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap */}
        <div className="lg:col-span-2">
          <HeatmapSkeleton />
        </div>
        {/* Recurring Stats */}
        <RecurringStatsSkeleton />
      </div>

      {/* Tag Analytics */}
      <TagStatsSkeleton />

      {/* Weekly Activity */}
      <WeeklyActivitySkeleton />
    </div>
  )
}

function QuickStatSkeleton() {
  return (
    <div className="rounded-xl border-2 border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-lg bg-secondary" />
        <div>
          <Skeleton className="h-7 w-12 bg-secondary mb-1" />
          <Skeleton className="h-3 w-16 bg-secondary" />
        </div>
      </div>
    </div>
  )
}

function TrendCardSkeleton() {
  return (
    <div className="rounded-xl border-2 border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28 bg-secondary" />
        <Skeleton className="h-4 w-12 bg-secondary" />
      </div>
      <Skeleton className="h-7 w-20 bg-secondary mt-2" />
      <Skeleton className="h-3 w-24 bg-secondary mt-1" />
    </div>
  )
}

function HeatmapSkeleton() {
  return (
    <div className="rounded-xl border-2 border-border bg-card p-6">
      <div className="mb-4">
        <Skeleton className="h-6 w-40 bg-secondary mb-2" />
        <Skeleton className="h-4 w-64 bg-secondary" />
      </div>
      {/* Heatmap grid */}
      <div className="space-y-1">
        {[...Array(7)].map((_, rowIdx) => (
          <div key={rowIdx} className="flex gap-1">
            {[...Array(12)].map((_, colIdx) => (
              <Skeleton key={colIdx} className="h-4 w-8 rounded-sm bg-secondary/50" />
            ))}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-4">
        <Skeleton className="h-3 w-8 bg-secondary" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-4 w-4 rounded-sm bg-secondary/50" />
        ))}
        <Skeleton className="h-3 w-8 bg-secondary" />
      </div>
    </div>
  )
}

function RecurringStatsSkeleton() {
  return (
    <div className="rounded-xl border-2 border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-5 w-5 rounded bg-secondary" />
        <Skeleton className="h-6 w-36 bg-secondary" />
      </div>
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-4 w-28 bg-secondary" />
            <Skeleton className="h-6 w-12 bg-secondary" />
          </div>
        ))}
      </div>
    </div>
  )
}

function TagStatsSkeleton() {
  return (
    <div className="rounded-xl border-2 border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-5 w-5 rounded bg-secondary" />
        <Skeleton className="h-6 w-28 bg-secondary" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="p-3 rounded-lg border border-border">
            <Skeleton className="h-4 w-16 bg-secondary mb-2" />
            <Skeleton className="h-6 w-8 bg-secondary mb-1" />
            <Skeleton className="h-3 w-20 bg-secondary" />
          </div>
        ))}
      </div>
    </div>
  )
}

function WeeklyActivitySkeleton() {
  return (
    <div className="rounded-xl border-2 border-border bg-card p-6">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Skeleton className="h-5 w-5 rounded bg-secondary" />
          <Skeleton className="h-6 w-40 bg-secondary" />
        </div>
        <Skeleton className="h-4 w-56 bg-secondary" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="text-center p-4 rounded-lg bg-secondary/20">
            <Skeleton className="h-8 w-12 mx-auto bg-secondary mb-2" />
            <Skeleton className="h-3 w-24 mx-auto bg-secondary" />
          </div>
        ))}
      </div>
    </div>
  )
}
