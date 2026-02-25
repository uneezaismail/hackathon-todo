"""
Health Check Endpoints - Phase V

This module provides comprehensive health check endpoints for:
- Kubernetes liveness/readiness probes
- Dapr sidecar health verification
- Database connectivity checks
- Kafka connectivity checks (via Dapr Pub/Sub)

Endpoints:
- GET /api/health/live - Liveness probe (basic health)
- GET /api/health/ready - Readiness probe (full dependency check)
- GET /api/health/dapr - Dapr sidecar health
- GET /api/health/full - Detailed health with all components
"""

import logging
import os
from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/health", tags=["health"])


# ===========================================================================
# Response Models
# ===========================================================================


class ComponentHealth(BaseModel):
    """Health status of a single component."""

    status: str  # "healthy", "unhealthy", "degraded"
    latency_ms: float | None = None
    message: str | None = None


class FullHealthResponse(BaseModel):
    """Full health check response with all components."""

    status: str  # "healthy", "unhealthy", "degraded"
    timestamp: str
    version: str
    phase: str
    components: dict[str, ComponentHealth]


# ===========================================================================
# Helper Functions
# ===========================================================================


async def check_dapr_health() -> tuple[bool, float | None, str | None]:
    """
    Check Dapr sidecar health.

    Returns:
        Tuple of (healthy: bool, latency_ms: float | None, message: str | None)
    """
    dapr_port = int(os.getenv("DAPR_HTTP_PORT", "3500"))
    url = f"http://localhost:{dapr_port}/v1.0/healthz"

    try:
        start = datetime.now(timezone.utc)
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(url)
            latency = (datetime.now(timezone.utc) - start).total_seconds() * 1000

            if response.status_code == 200:
                return True, latency, None
            else:
                return False, latency, f"Dapr returned status {response.status_code}"

    except httpx.ConnectError:
        return False, None, "Dapr sidecar not running (connection refused)"
    except httpx.TimeoutException:
        return False, None, "Dapr sidecar timeout"
    except Exception as e:
        return False, None, f"Dapr health check error: {str(e)}"


async def check_database_health() -> tuple[bool, float | None, str | None]:
    """
    Check database connectivity.

    Returns:
        Tuple of (healthy: bool, latency_ms: float | None, message: str | None)
    """
    from sqlmodel import Session, text

    from src.db.session import get_session

    try:
        start = datetime.now(timezone.utc)
        session_gen = get_session()
        session: Session = next(session_gen)

        try:
            result = session.exec(text("SELECT 1")).first()
            latency = (datetime.now(timezone.utc) - start).total_seconds() * 1000

            if result == (1,):
                return True, latency, None
            else:
                return False, latency, "Database query returned unexpected result"
        finally:
            session.close()

    except Exception as e:
        return False, None, f"Database error: {str(e)}"


async def check_kafka_health() -> tuple[bool, float | None, str | None]:
    """
    Check Kafka connectivity via Dapr Pub/Sub metadata endpoint.

    Returns:
        Tuple of (healthy: bool, latency_ms: float | None, message: str | None)
    """
    dapr_port = int(os.getenv("DAPR_HTTP_PORT", "3500"))
    pubsub_name = os.getenv("PUBSUB_NAME", "kafka-pubsub")
    url = f"http://localhost:{dapr_port}/v1.0/metadata"

    try:
        start = datetime.now(timezone.utc)
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(url)
            latency = (datetime.now(timezone.utc) - start).total_seconds() * 1000

            if response.status_code == 200:
                metadata = response.json()
                components = metadata.get("components", [])

                # Check if Kafka pubsub component is registered
                kafka_found = any(
                    c.get("name") == pubsub_name and c.get("type", "").startswith("pubsub")
                    for c in components
                )

                if kafka_found:
                    return True, latency, None
                else:
                    return False, latency, f"Kafka pubsub component '{pubsub_name}' not found"
            else:
                return False, latency, f"Dapr metadata returned status {response.status_code}"

    except httpx.ConnectError:
        return False, None, "Cannot check Kafka (Dapr sidecar not running)"
    except Exception as e:
        return False, None, f"Kafka health check error: {str(e)}"


# ===========================================================================
# Endpoints
# ===========================================================================


@router.get("/live")
async def liveness_probe() -> dict[str, Any]:
    """
    Kubernetes liveness probe.

    Simple health check to verify the service is running.
    Does NOT check dependencies (use /ready for that).

    Returns:
        dict: Status and timestamp
    """
    return {
        "status": "alive",
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


@router.get("/ready")
async def readiness_probe() -> dict[str, Any]:
    """
    Kubernetes readiness probe.

    Checks if the service is ready to accept traffic by verifying:
    - Database connectivity
    - Required environment variables

    Returns 503 if not ready.

    Returns:
        dict: Status and timestamp
    """
    from src.config import get_settings

    settings = get_settings()

    # Check required environment variables
    required_vars = ["DATABASE_URL", "BETTER_AUTH_SECRET"]
    missing_vars = [
        var for var in required_vars if not getattr(settings, var.lower(), None)
    ]

    if missing_vars:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Missing required environment variables: {', '.join(missing_vars)}",
        )

    # Check database
    db_healthy, _, db_message = await check_database_health()
    if not db_healthy:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database not ready: {db_message}",
        )

    return {
        "status": "ready",
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


@router.get("/dapr")
async def dapr_health() -> dict[str, Any]:
    """
    Dapr sidecar health check.

    Verifies that Dapr sidecar is running and healthy.
    This is required for event publishing and service invocation.

    Returns:
        dict: Dapr health status
    """
    healthy, latency, message = await check_dapr_health()

    if not healthy:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Dapr sidecar unhealthy: {message}",
        )

    return {
        "status": "healthy",
        "latency_ms": latency,
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


@router.get("/full", response_model=FullHealthResponse)
async def full_health_check() -> FullHealthResponse:
    """
    Comprehensive health check for all components.

    Checks:
    - Database connectivity
    - Dapr sidecar health
    - Kafka connectivity (via Dapr)

    Returns:
        FullHealthResponse: Detailed health status for each component
    """
    components: dict[str, ComponentHealth] = {}
    overall_healthy = True

    # Check database
    db_healthy, db_latency, db_message = await check_database_health()
    components["database"] = ComponentHealth(
        status="healthy" if db_healthy else "unhealthy",
        latency_ms=db_latency,
        message=db_message,
    )
    if not db_healthy:
        overall_healthy = False

    # Check Dapr sidecar
    dapr_healthy, dapr_latency, dapr_message = await check_dapr_health()
    components["dapr"] = ComponentHealth(
        status="healthy" if dapr_healthy else "unhealthy",
        latency_ms=dapr_latency,
        message=dapr_message,
    )
    # Dapr being unhealthy means "degraded" not "unhealthy" for overall status
    # Service can still serve traffic, just not publish events

    # Check Kafka (only if Dapr is healthy)
    if dapr_healthy:
        kafka_healthy, kafka_latency, kafka_message = await check_kafka_health()
        components["kafka"] = ComponentHealth(
            status="healthy" if kafka_healthy else "degraded",
            latency_ms=kafka_latency,
            message=kafka_message,
        )
    else:
        components["kafka"] = ComponentHealth(
            status="unknown",
            message="Cannot check Kafka (Dapr unavailable)",
        )

    # Determine overall status
    if not overall_healthy:
        overall_status = "unhealthy"
    elif not dapr_healthy:
        overall_status = "degraded"
    else:
        overall_status = "healthy"

    return FullHealthResponse(
        status=overall_status,
        timestamp=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        version="0.2.0",
        phase="V",
        components=components,
    )
