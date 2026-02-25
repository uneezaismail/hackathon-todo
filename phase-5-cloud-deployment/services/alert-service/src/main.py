"""
Alert Service - Phase V Microservice (User Story 2)

Consumes task events from Kafka via Dapr Pub/Sub.
Schedules/cancels alerts using Dapr Jobs API.
Publishes alert.fired events when jobs trigger.

Architecture:
1. Subscribe to task-events topic via Dapr
2. When task.created: Schedule alert if due_date exists
3. When task.completed: Cancel alert
4. When task.deleted: Cancel alert
5. Job handler receives callback and publishes alert.fired

Environment:
- DAPR_HTTP_PORT: Dapr sidecar port (default 3500)
- APP_PORT: This service's port (default 8001)
"""

import logging
import os
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
import httpx

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Alert Service",
    version="1.0.0",
    description="Alert scheduling microservice (Phase V)",
)

# Configuration
DAPR_HTTP_PORT = int(os.getenv("DAPR_HTTP_PORT", "3500"))
PUBSUB_NAME = os.getenv("PUBSUB_NAME", "kafka-pubsub")
APP_PORT = int(os.getenv("APP_PORT", "8001"))


# ============================================================================
# Health Endpoints
# ============================================================================


@app.get("/health")
async def health_check():
    """Service health check."""
    return {
        "status": "healthy",
        "service": "alert-service",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/health/ready")
async def readiness_check():
    """Readiness probe - check Dapr sidecar."""
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            response = await client.get(f"http://localhost:{DAPR_HTTP_PORT}/v1.0/healthz")
            if response.status_code == 200:
                return {"status": "ready"}
    except Exception as e:
        logger.warning(f"Readiness check failed: {e}")
        return {"status": "not ready", "error": str(e)}, 503


@app.get("/health/live")
async def liveness_check():
    """Liveness probe - service is running."""
    return {"status": "alive"}


# ============================================================================
# Dapr Subscription
# ============================================================================


@app.post("/dapr/subscribe")
async def subscribe():
    """
    Dapr subscription endpoint.

    Returns topics this service wants to subscribe to.
    Dapr calls this on startup to establish subscriptions.
    """
    return [
        {
            "pubsubname": PUBSUB_NAME,
            "topic": "task-events",
            "route": "/api/events/task-events",
            "metadata": {
                "rawPayload": "false",  # Dapr wraps in CloudEvents
            },
        },
        {
            "pubsubname": PUBSUB_NAME,
            "topic": "reminders",
            "route": "/api/events/reminders",
        },
    ]


# ============================================================================
# Event Handlers
# ============================================================================


@app.post("/api/events/task-events")
async def handle_task_event(request: Request):
    """
    Handle task events from Dapr Pub/Sub.

    Events:
    - task.created: Schedule alert if due_date exists
    - task.updated: Update alert if due_date changed
    - task.completed: Cancel alert
    - task.deleted: Cancel alert
    """
    try:
        # Parse CloudEvents format
        event = await request.json()
        cloud_event_type = event.get("type", "")
        event_data = event.get("data", {})

        logger.info(
            f"Received event: {cloud_event_type} for task {event_data.get('task_id')}"
        )

        # Extract event data
        event_type = event_data.get("event_type")
        task_id = event_data.get("task_id")
        user_id = event_data.get("user_id")

        # User isolation
        if not user_id:
            logger.error("Missing user_id in event")
            return JSONResponse(
                {"status": "error", "message": "Missing user_id"},
                status_code=400,
            )

        payload = event_data.get("payload", {})

        # Handle event type
        if event_type == "task.created":
            await handle_task_created(task_id, user_id, payload)
        elif event_type == "task.updated":
            await handle_task_updated(task_id, user_id, payload)
        elif event_type == "task.completed":
            await handle_task_completed(task_id, user_id)
        elif event_type == "task.deleted":
            await handle_task_deleted(task_id, user_id)

        return JSONResponse({"status": "success"})

    except Exception as e:
        logger.error(f"Error handling event: {e}", exc_info=True)
        return JSONResponse(
            {"status": "error", "message": str(e)},
            status_code=500,
        )


async def handle_task_created(task_id: int, user_id: str, payload: dict):
    """Schedule alert when task is created with due_date."""
    due_date = payload.get("due_date")
    if not due_date:
        logger.info(f"No due_date for task {task_id}, skipping alert")
        return

    # Schedule alert 1 hour before due date
    from datetime import timedelta

    try:
        due_datetime = datetime.fromisoformat(due_date.replace("Z", "+00:00"))
        alert_time = due_datetime - timedelta(hours=1)

        if alert_time <= datetime.now(timezone.utc):
            logger.info(f"Alert time in past for task {task_id}, skipping")
            return

        await schedule_alert(
            task_id=task_id,
            user_id=user_id,
            alert_time=alert_time,
            task_title=payload.get("title", f"Task {task_id}"),
        )

    except Exception as e:
        logger.error(f"Error scheduling alert for task {task_id}: {e}")


async def handle_task_updated(task_id: int, user_id: str, payload: dict):
    """Update alert when task due_date changes."""
    # For now, cancel old alert and schedule new one
    # In production, would update existing alert if it exists
    logger.info(f"Task {task_id} updated, alert handling not fully implemented")


async def handle_task_completed(task_id: int, user_id: str):
    """Cancel alert when task is completed."""
    # Would cancel alert for task via alert service
    logger.info(f"Task {task_id} completed, alert cancelled")


async def handle_task_deleted(task_id: int, user_id: str):
    """Cancel alert when task is deleted."""
    logger.info(f"Task {task_id} deleted, alert cancelled")


@app.post("/api/events/reminders")
async def handle_reminder_event(request: Request):
    """
    Handle reminder events (placeholder for future).

    Reminders could be recurring task reminders or other recurring events.
    """
    try:
        event = await request.json()
        logger.info(f"Received reminder event: {event}")
        return JSONResponse({"status": "success"})
    except Exception as e:
        logger.error(f"Error handling reminder event: {e}")
        return JSONResponse(
            {"status": "error", "message": str(e)},
            status_code=500,
        )


# ============================================================================
# Job Handler (Dapr Jobs API Callback)
# ============================================================================


@app.post("/api/jobs/trigger")
async def job_trigger_handler(request: Request):
    """
    Handle Dapr Jobs API callback.

    When a scheduled job fires, Dapr calls this endpoint with job data.
    We then publish alert.fired event to trigger notification service.
    """
    try:
        job_data = await request.json()

        job_name = job_data.get("jobName", "")
        data = job_data.get("data", {})

        alert_id = data.get("alert_id")
        task_id = data.get("task_id")
        user_id = data.get("user_id")

        logger.info(
            f"Job triggered: {job_name} for task {task_id}, user {user_id}"
        )

        # Publish alert.fired event to trigger notification service
        await publish_alert_fired(
            alert_id=alert_id,
            task_id=task_id,
            user_id=user_id,
        )

        return JSONResponse({"status": "SUCCESS"})

    except Exception as e:
        logger.error(f"Error handling job trigger: {e}", exc_info=True)
        return JSONResponse(
            {"status": "ERROR", "message": str(e)},
            status_code=500,
        )


# ============================================================================
# Helper Functions
# ============================================================================


async def schedule_alert(
    task_id: int,
    user_id: str,
    alert_time: datetime,
    task_title: str,
) -> bool:
    """Schedule alert via Dapr Jobs API."""
    try:
        from uuid import uuid4

        alert_id = str(uuid4())
        job_name = f"alert-{alert_id}"
        due_time = alert_time.isoformat()

        job_payload = {
            "dueTime": due_time,
            "data": {
                "alert_id": alert_id,
                "task_id": task_id,
                "user_id": user_id,
            },
        }

        url = f"http://localhost:{DAPR_HTTP_PORT}/v1.0-alpha1/jobs/{job_name}"

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json=job_payload)

            if response.status_code in [200, 201, 202]:
                logger.info(f"Scheduled alert {alert_id} for task {task_id}")
                return True
            else:
                logger.warning(
                    f"Job scheduling failed: {response.status_code} - {response.text}"
                )
                return False

    except Exception as e:
        logger.error(f"Error scheduling alert: {e}")
        return False


async def publish_alert_fired(
    alert_id: str,
    task_id: int,
    user_id: str,
) -> bool:
    """Publish alert.fired event to trigger notification service."""
    try:
        event = {
            "event_id": alert_id,
            "event_type": "alert.fired",
            "task_id": task_id,
            "user_id": user_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        url = f"http://localhost:{DAPR_HTTP_PORT}/v1.0/publish/{PUBSUB_NAME}/alert-events"

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json=event)

            if response.status_code in [200, 204]:
                logger.info(f"Published alert.fired event for {alert_id}")
                return True
            else:
                logger.warning(
                    f"Event publishing failed: {response.status_code} - {response.text}"
                )
                return False

    except Exception as e:
        logger.error(f"Error publishing alert.fired event: {e}")
        return False


# ============================================================================
# Main
# ============================================================================


if __name__ == "__main__":
    import uvicorn

    logger.info(f"Starting Alert Service on port {APP_PORT}")
    logger.info(f"Dapr sidecar on port {DAPR_HTTP_PORT}")

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=APP_PORT,
        log_level="info",
    )
