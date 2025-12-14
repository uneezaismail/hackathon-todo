"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 px-4">
      <div className="flex items-center gap-2 text-destructive">
        <AlertCircle className="h-8 w-8" aria-hidden="true" />
        <h2 className="text-2xl font-bold">Something went wrong!</h2>
      </div>

      <p className="text-center text-muted-foreground max-w-md">
        {error.message || "An unexpected error occurred while loading the dashboard."}
      </p>

      {error.digest && (
        <p className="text-xs text-muted-foreground">
          Error ID: {error.digest}
        </p>
      )}

      <div className="flex gap-2">
        <Button
          onClick={reset}
          variant="default"
          aria-label="Try again to load the dashboard"
        >
          Try again
        </Button>
        <Button
          onClick={() => (window.location.href = "/")}
          variant="outline"
          aria-label="Go back to home page"
        >
          Go to home
        </Button>
      </div>
    </div>
  );
}
