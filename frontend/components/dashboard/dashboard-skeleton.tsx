/**
 * Dashboard Skeleton Loaders
 *
 * Provides loading states for all dashboard components
 */

import * as React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

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
          {[...Array(7)].map((_, i) => (
            <Skeleton
              key={i}
              className="w-full bg-secondary"
              style={{ height: `${Math.random() * 80 + 20}%` }}
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
