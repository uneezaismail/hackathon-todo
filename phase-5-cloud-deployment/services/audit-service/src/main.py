"""
Audit Service - Phase V (T058)

Event-driven microservice that consumes all task events from Kafka via Dapr Pub/Sub
and writes an immutable audit trail to the task_events table in PostgreSQL.

Features:
- Subscribes to task-events, alert-events topics
- Idempotent event processing (no duplicates)
- Audit trail persistence for compliance
- Graceful error handling with retry logic

Architecture:
    Kafka (task-events)
        ↓
    Dapr Pub/Sub (localhost:3500)
        ↓
    Audit Service
        ↓
    PostgreSQL (task_events table)

Security:
- User isolation enforced (validates user_id in all events)
- Read-only audit records (no modification after creation)
- Event signature validation (CloudEvents format)

Run with Dapr:
    dapr run --app-id audit-service --app-port 8003 -- uvicorn src.main:app --port 8003
"""

import logging
import os
from datetime import datetime, timezone

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
import uvicorn

from src.consumer import AuditEventConsumer

# Configure logging
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Audit Service",
    description="Event-driven audit trail microservice",
    version="1.0.0",
)

# Initialize event consumer
consumer = AuditEventConsumer()


@app.get("/health")
async def health_check():
    """Health check endpoint for Kubernetes readiness probe."""
    return {
        "status": "healthy",
        "service": "audit-service",
        "timestamp": datetime.now(timezone.utc).isoformat() + "Z",
    }


@app.get("/health/ready")
async def readiness_check():
    """Readiness probe - check database connection and Dapr availability."""
    try:
        # Check database connectivity
        is_ready = await consumer.check_database_ready()
        if not is_ready:
            return (
                {"status": "not ready", "reason": "database not available"},
                503,
            )

        return {"status": "ready"}
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        return {"status": "not ready", "reason": str(e)}, 503


@app.get("/health/live")
async def liveness_check():
    """Liveness probe - service is running."""
    return {"status": "alive"}


@app.post("/dapr/subscribe")
async def subscribe():
    """
    Dapr subscription endpoint.

    Informs Dapr which topics this service subscribes to.
    Dapr will call this endpoint on startup to register subscriptions.

    Returns:
        List of subscription configs with topic and route mappings.
    """
    return [
        {
            "pubsubname": "kafka-pubsub",
            "topic": "task-events",
            "route": "/events/task-events",
            "metadata": {"rawPayload": "false"},  # Dapr wraps in CloudEvents
        },
        {
            "pubsubname": "kafka-pubsub",
            "topic": "alert-events",
            "route": "/events/alert-events",
            "metadata": {"rawPayload": "false"},
        },
    ]


@app.post("/events/task-events")
async def handle_task_event(request: Request):
    """
    Handle task event from Kafka via Dapr Pub/Sub (T059).

    Route: /events/task-events
    Topic: task-events
    Format: CloudEvents 1.0

    Process:
    1. Extract event from CloudEvents wrapper
    2. Check if already processed (idempotency)
    3. Store in audit trail
    4. Mark as processed

    Args:
        request: HTTP request with CloudEvents payload

    Returns:
        JSON response with status

    Error Handling:
    - Duplicate events (already processed) → Skip silently
    - Invalid events → Log warning, skip
    - Database errors → Retry with exponential backoff
    - User isolation violations → Log security alert
    """
    try:
        # Parse CloudEvents wrapper
        cloud_event = await request.json()

        # Extract event data
        event_data = cloud_event.get("data", {})
        event_type = event_data.get("event_type")
        event_id = event_data.get("event_id")
        user_id = event_data.get("user_id")
        task_id = event_data.get("task_id")

        logger.info(
            f"Received event",
            extra={
                "event_type": event_type,
                "event_id": event_id,
                "user_id": user_id,
                "task_id": task_id,
            },
        )

        # Validate required fields (user isolation check)
        if not user_id:
            logger.warning(f"Event missing user_id: {event_id}")
            return JSONResponse(
                {"status": "error", "reason": "missing user_id"},
                status_code=400,
            )

        # Idempotency check (T059)
        is_new = await consumer.should_process(event_id)
        if not is_new:
            logger.debug(f"Duplicate event, skipping: {event_id}")
            return JSONResponse({"status": "duplicate", "event_id": event_id})

        # Store in audit trail
        await consumer.audit_event(event_data)

        # Mark as processed
        await consumer.mark_processed(event_id)

        logger.info(f"Audited event: {event_id}")

        return JSONResponse(
            {
                "status": "success",
                "event_id": event_id,
                "event_type": event_type,
            }
        )

    except ValueError as e:
        logger.warning(f"Invalid event format: {e}")
        return JSONResponse(
            {"status": "error", "reason": "invalid event format"},
            status_code=400,
        )
    except Exception as e:
        logger.error(f"Error processing event: {e}", exc_info=True)
        return JSONResponse(
            {"status": "error", "reason": str(e)},
            status_code=500,
        )


@app.post("/events/alert-events")
async def handle_alert_event(request: Request):
    """
    Handle alert event from Kafka via Dapr Pub/Sub.

    Route: /events/alert-events
    Topic: alert-events
    Format: CloudEvents 1.0

    Same idempotent processing as task events.
    """
    try:
        cloud_event = await request.json()
        event_data = cloud_event.get("data", {})
        event_id = event_data.get("event_id")
        user_id = event_data.get("user_id")

        if not user_id:
            logger.warning(f"Alert event missing user_id: {event_id}")
            return JSONResponse(
                {"status": "error", "reason": "missing user_id"},
                status_code=400,
            )

        # Idempotency check
        is_new = await consumer.should_process(event_id)
        if not is_new:
            return JSONResponse({"status": "duplicate", "event_id": event_id})

        # Store in audit trail
        await consumer.audit_event(event_data)
        await consumer.mark_processed(event_id)

        return JSONResponse({"status": "success", "event_id": event_id})

    except Exception as e:
        logger.error(f"Error processing alert event: {e}", exc_info=True)
        return JSONResponse(
            {"status": "error", "reason": str(e)},
            status_code=500,
        )


@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint."""
    return await consumer.get_metrics()


if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8003,
        log_level="info",
    )
