import { Skeleton } from "@/components/ui/skeleton";

export function TaskListSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-label="Loading tasks">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-start gap-3 p-4 rounded-lg border bg-card"
        >
          {/* Checkbox skeleton */}
          <Skeleton className="h-5 w-5 rounded flex-shrink-0 mt-0.5" />

          <div className="flex-1 space-y-2">
            {/* Title skeleton */}
            <Skeleton className="h-5 w-3/4" />

            {/* Description skeleton */}
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>

          {/* Actions skeleton */}
          <div className="flex gap-2 flex-shrink-0">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading tasks...</span>
    </div>
  );
}
