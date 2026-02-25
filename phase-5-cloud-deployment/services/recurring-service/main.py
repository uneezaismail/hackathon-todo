"""
Recurring Task Service Microservice (Phase V - T034).

This microservice handles recurring task logic:
- Consumes task.completed events from Kafka
- Calculates next occurrence using RRULE patterns
- Publishes task.create_next command event
- Publishes task.created event for new occurrences

Dapr Integration:
- Subscribes to task-events topic (via Dapr Pub/Sub)
- Filters for task.completed events
- Uses Dapr State Store for idempotency (event_id tracking)
- Uses Dapr Service Invocation to call backend service

Architecture:
- FastAPI application with Dapr sidecar
- Consumes CloudEvents format (from Dapr)
- Publishes new events back to Kafka
- UTC-only datetime handling
- User isolation via user_id in all events
"""

import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Optional

import httpx
from fastapi import FastAPI, Request, Depends
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


# Configuration
DAPR_PORT = int(os.getenv("DAPR_HTTP_PORT", "3500"))
PUBSUB_NAME = os.getenv("PUBSUB_NAME", "kafka-pubsub")
STATE_STORE_NAME = os.getenv("STATE_STORE_NAME", "statestore")
BACKEND_APP_ID = os.getenv("BACKEND_APP_ID", "backend")

# Initialize FastAPI app
app = FastAPI(
    title="Recurring Task Service",
    description="Microservice for handling recurring task logic",
    version="1.0.0"
)


# ============================================================================
# Health Check Endpoints
# ============================================================================


@app.get("/health/live", tags=["health"])
async def liveness_probe():
    """Liveness probe - service is running."""
    return {"status": "alive", "service": "recurring-task-service"}


@app.get("/health/ready", tags=["health"])
async def readiness_probe():
    """Readiness probe - check Dapr sidecar connectivity."""
    try:
        # Check if Dapr sidecar is running
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"http://localhost:{DAPR_PORT}/v1.0/healthz")
            if response.status_code != 200:
                return {"status": "not ready", "error": "Dapr sidecar not responding"}, 503
        return {"status": "ready"}
    except Exception as e:
        logger.error(f"Readiness check failed: {str(e)}")
        return {"status": "not ready", "error": str(e)}, 503


@app.get("/health", tags=["health"])
async def health_check():
    """Combined health check endpoint."""
    return {
        "status": "healthy",
        "service": "recurring-task-service",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


# ============================================================================
# Dapr Subscription Endpoint
# ============================================================================


@app.post("/dapr/subscribe", tags=["dapr"])
async def subscribe():
    """
    Dapr subscription endpoint - registers topics and routes.

    Returns:
        List of subscriptions with topic name and handler route
    """
    return [
        {
            "pubsubname": PUBSUB_NAME,
            "topic": "task-events",
            "route": "/api/events/task-events",
            "metadata": {
                "rawPayload": "false"  # Dapr wraps in CloudEvents
            }
        }
    ]


# ============================================================================
# Event Handlers
# ============================================================================


@app.post("/api/events/task-events", tags=["events"])
async def handle_task_event(request: Request):
    """
    Handle task events from Kafka (via Dapr Pub/Sub).

    Processes task.completed events and generates next occurrences.

    Expected CloudEvents format:
    {
        "specversion": "1.0",
        "type": "task.completed",
        "source": "backend",
        "id": "event-id-uuid",
        "data": {
            "event_type": "task.completed",
            "task_id": 123,
            "user_id": "user-456",
            "payload": {...}
        }
    }
    """
    try:
        cloud_event = await request.json()

        # Extract event metadata and data
        event_id = cloud_event.get("id")
        event_type = cloud_event.get("type")
        event_data = cloud_event.get("data", {})

        logger.info(f"Received event {event_id} of type {event_type}")

        # Check for duplicate events (idempotency)
        if event_id and await _is_event_processed(event_id):
            logger.info(f"Event {event_id} already processed, skipping")
            return JSONResponse({"status": "success", "duplicate": True})

        # Only process task.completed events
        if event_type != "task.completed":
            logger.debug(f"Ignoring non-task.completed event: {event_type}")
            return JSONResponse({"status": "success", "processed": False})

        # Extract required fields
        task_id = event_data.get("task_id")
        user_id = event_data.get("user_id")
        payload = event_data.get("payload", {})

        # Validate required fields
        if not task_id or not user_id:
            logger.warning(f"Event {event_id} missing required fields")
            return JSONResponse({"status": "error", "message": "Missing required fields"}, status_code=400)

        # Check if recurring task
        recurring_pattern = payload.get("recurring_pattern")
        if not recurring_pattern:
            logger.debug(f"Task {task_id} is not recurring, nothing to do")
            await _mark_event_processed(event_id)
            return JSONResponse({"status": "success", "processed": False})

        # Process recurring task
        result = await _create_next_occurrence(
            task_id=task_id,
            user_id=user_id,
            recurring_pattern=recurring_pattern,
            completed_at=payload.get("completed_at"),
            recurring_end_date=payload.get("recurring_end_date"),
            parent_payload=payload
        )

        if result:
            logger.info(f"Created next occurrence for recurring task {task_id}")
        else:
            logger.info(f"Could not create next occurrence for task {task_id}")

        # Mark event as processed
        await _mark_event_processed(event_id)

        return JSONResponse({"status": "success", "processed": True})

    except Exception as e:
        logger.error(f"Error handling task event: {str(e)}", exc_info=True)
        return JSONResponse({"status": "error", "message": str(e)}, status_code=500)


# ============================================================================
# Helper Functions
# ============================================================================


async def _is_event_processed(event_id: str) -> bool:
    """
    Check if event has been processed using Dapr State Store.

    Args:
        event_id: Event ID to check

    Returns:
        True if event was already processed, False otherwise
    """
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"http://localhost:{DAPR_PORT}/v1.0/state/{STATE_STORE_NAME}/event-{event_id}"
            )
            if response.status_code == 200:
                state = response.json()
                return state.get("processed", False)
            return False
    except Exception as e:
        logger.error(f"Error checking event status: {str(e)}")
        return False


async def _mark_event_processed(event_id: str) -> bool:
    """
    Mark event as processed in Dapr State Store.

    Args:
        event_id: Event ID to mark

    Returns:
        True if successfully marked, False otherwise
    """
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                f"http://localhost:{DAPR_PORT}/v1.0/state/{STATE_STORE_NAME}",
                json=[{
                    "key": f"event-{event_id}",
                    "value": {
                        "processed": True,
                        "processed_at": datetime.now(timezone.utc).isoformat()
                    }
                }]
            )
            return response.status_code == 204
    except Exception as e:
        logger.error(f"Error marking event processed: {str(e)}")
        return False


async def _create_next_occurrence(
    task_id: int,
    user_id: str,
    recurring_pattern: str,
    completed_at: Optional[str] = None,
    recurring_end_date: Optional[str] = None,
    parent_payload: Optional[dict] = None
) -> bool:
    """
    Create next occurrence for recurring task.

    Calls backend service to create the next task instance.

    Args:
        task_id: Current task ID
        user_id: Owner user ID
        recurring_pattern: RRULE pattern string
        completed_at: Completion timestamp (ISO 8601)
        recurring_end_date: Recurrence end date (ISO 8601)
        parent_payload: Original task payload for copying

    Returns:
        True if next occurrence created successfully, False otherwise
    """
    try:
        # Use completed_at or current time as base for next calculation
        base_time = completed_at or datetime.now(timezone.utc).isoformat()

        # Build create_next command event
        next_task_data = {
            "user_id": user_id,
            "parent_task_id": task_id,
            "recurring_pattern": recurring_pattern,
            "recurring_end_date": recurring_end_date,
            "from_parent": parent_payload or {}
        }

        # Invoke backend service via Dapr Service Invocation
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"http://localhost:{DAPR_PORT}/v1.0/invoke/{BACKEND_APP_ID}/method/api/tasks/create-next-occurrence",
                json=next_task_data,
                headers={"X-Service-Invocation": "true"}
            )

            if response.status_code in [200, 201]:
                logger.info(f"Backend created next occurrence: {response.status_code}")

                # Publish task.created event
                next_task = response.json().get("data")
                if next_task:
                    await _publish_task_created_event(
                        task_id=next_task.get("id"),
                        user_id=user_id,
                        task_data=next_task
                    )

                return True
            else:
                logger.error(f"Backend service failed: {response.status_code} - {response.text}")
                return False

    except Exception as e:
        logger.error(f"Error creating next occurrence: {str(e)}", exc_info=True)
        return False


async def _publish_task_created_event(
    task_id: int,
    user_id: str,
    task_data: dict
) -> bool:
    """
    Publish task.created event to Kafka.

    Args:
        task_id: New task ID
        user_id: Owner user ID
        task_data: Full task data

    Returns:
        True if published successfully, False otherwise
    """
    try:
        event = {
            "event_id": str(uuid.uuid4()),
            "event_type": "task.created",
            "event_version": "1.0",
            "task_id": task_id,
            "user_id": user_id,
            "timestamp": datetime.now(timezone.utc).isoformat() + "Z",
            "payload": {
                "task_id": task_id,
                "recurring_pattern": task_data.get("recurring_pattern"),
                "parent_task_id": task_data.get("parent_task_id"),
                "created_at": task_data.get("created_at")
            }
        }

        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                f"http://localhost:{DAPR_PORT}/v1.0/publish/{PUBSUB_NAME}/task-events",
                json=event
            )

            if response.status_code == 204:
                logger.info(f"Published task.created event for task {task_id}")
                return True
            else:
                logger.error(f"Failed to publish event: {response.status_code}")
                return False

    except Exception as e:
        logger.error(f"Error publishing task.created event: {str(e)}")
        return False


# ============================================================================
# Application Startup
# ============================================================================


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8001"))
    host = os.getenv("HOST", "0.0.0.0")

    logger.info(f"Starting Recurring Task Service on {host}:{port}")
    logger.info(f"Dapr port: {DAPR_PORT}")
    logger.info(f"Pub/Sub: {PUBSUB_NAME}")
    logger.info(f"State Store: {STATE_STORE_NAME}")

    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info"
    )
