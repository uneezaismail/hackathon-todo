/**
 * Modern Task Skeleton Loader
 *
 * Features:
 * - Shimmer animation effect
 * - Realistic task card structure
 * - Purple theme accent
 * - Responsive design
 */

import { cn } from '@/lib/utils'

interface TaskSkeletonProps {
  count?: number
  className?: string
}

export function TaskSkeleton({ count = 5, className }: TaskSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "relative overflow-hidden rounded-xl border p-4",
            "dark:bg-[#1a1a2e] dark:border-[#2a2a3e]",
            "light:bg-white light:border-[#e5e5ea]",
            "animate-pulse"
          )}
        >
          {/* Shimmer overlay */}
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-purple-400/10 to-transparent" />

          <div className="flex items-start gap-4">
            {/* Checkbox */}
            <div className="mt-1 h-5 w-5 rounded border-2 dark:border-[#2a2a3e] light:border-[#e5e5ea]" />

            {/* Content */}
            <div className="flex-1 space-y-3">
              {/* Title */}
              <div className="h-5 w-3/4 rounded-lg dark:bg-[#2a2a3e] light:bg-[#e5e5ea]" />

              {/* Description */}
              <div className="h-4 w-full rounded-lg dark:bg-[#2a2a3e] light:bg-[#e5e5ea]" />
              <div className="h-4 w-5/6 rounded-lg dark:bg-[#2a2a3e] light:bg-[#e5e5ea]" />

              {/* Tags and metadata */}
              <div className="flex items-center gap-2 pt-2">
                <div className="h-6 w-16 rounded-full dark:bg-purple-500/20 light:bg-purple-100" />
                <div className="h-6 w-20 rounded-full dark:bg-[#2a2a3e] light:bg-[#e5e5ea]" />
                <div className="h-6 w-24 rounded-full dark:bg-[#2a2a3e] light:bg-[#e5e5ea]" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <div className="h-9 w-9 rounded-lg dark:bg-[#2a2a3e] light:bg-[#e5e5ea]" />
              <div className="h-9 w-9 rounded-lg dark:bg-[#2a2a3e] light:bg-[#e5e5ea]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Compact skeleton for mobile view
 */
export function TaskSkeletonCompact({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "relative overflow-hidden rounded-lg border p-3",
            "dark:bg-[#1a1a2e] dark:border-[#2a2a3e]",
            "light:bg-white light:border-[#e5e5ea]",
            "animate-pulse"
          )}
        >
          {/* Shimmer overlay */}
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-purple-400/10 to-transparent" />

          <div className="flex items-center gap-3">
            <div className="h-5 w-5 rounded border-2 dark:border-[#2a2a3e] light:border-[#e5e5ea]" />
            <div className="flex-1">
              <div className="h-4 w-3/4 rounded-lg dark:bg-[#2a2a3e] light:bg-[#e5e5ea] mb-2" />
              <div className="h-3 w-1/2 rounded-lg dark:bg-[#2a2a3e] light:bg-[#e5e5ea]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
