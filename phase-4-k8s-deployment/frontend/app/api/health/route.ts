import { NextResponse } from "next/server";

/**
 * Liveness probe endpoint for Kubernetes health checks.
 * Returns 200 OK if the application process is running.
 * Used by Kubernetes to detect if container needs restart.
 */
export async function GET() {
  return NextResponse.json(
    { status: "ok" },
    { status: 200 }
  );
}
