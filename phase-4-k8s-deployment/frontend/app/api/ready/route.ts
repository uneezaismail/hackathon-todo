import { NextResponse } from "next/server";

/**
 * Readiness probe endpoint for Kubernetes health checks.
 * Returns 200 OK if the application is ready to serve traffic.
 * Returns 503 Service Unavailable if critical configuration is missing.
 * Used by Kubernetes to control traffic routing.
 */
export async function GET() {
  try {
    // Validate required environment variables
    const requiredEnvVars = [
      "BETTER_AUTH_SECRET",
      "DATABASE_URL",
      "NEXT_PUBLIC_API_URL",
    ];

    const missingEnvVars = requiredEnvVars.filter(
      (envVar) => !process.env[envVar]
    );

    if (missingEnvVars.length > 0) {
      return NextResponse.json(
        {
          status: "not ready",
          error: "Missing required environment variables",
          missing: missingEnvVars,
        },
        { status: 503 }
      );
    }

    // Application is ready
    return NextResponse.json(
      {
        status: "ready",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "not ready",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}
