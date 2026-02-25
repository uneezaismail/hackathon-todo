"""
Notification Service - Phase V Microservice (User Story 2)

Consumes alert.fired events from Kafka via Dapr Pub/Sub.
Sends notifications via email (primary) and push (fallback).
Implements retry logic and delivery tracking.

Architecture:
1. Subscribe to alert-events topic via Dapr
2. When alert.fired: Send email to user
3. If email fails: Fall back to push notification
4. Track delivery status and attempt count
5. Publish notification.sent events for audit

Environment:
- DAPR_HTTP_PORT: Dapr sidecar port (default 3500)
- APP_PORT: This service's port (default 8002)
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD: Email config
- PUSH_PROVIDER: fcm | web_push
- EMAIL_MAX_RETRIES: Max email retries (default 3)
"""

import logging
import os
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
import httpx
import asyncio

from src.email_sender import EmailSender
from src.push_sender import PushSender

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Notification Service",
    version="1.0.0",
    description="Notification delivery microservice (Phase V)",
)

# Configuration
DAPR_HTTP_PORT = int(os.getenv("DAPR_HTTP_PORT", "3500"))
PUBSUB_NAME = os.getenv("PUBSUB_NAME", "kafka-pubsub")
APP_PORT = int(os.getenv("APP_PORT", "8002"))
EMAIL_MAX_RETRIES = int(os.getenv("EMAIL_MAX_RETRIES", "3"))

# Initialize senders
email_sender = EmailSender(
    smtp_host=os.getenv("SMTP_HOST", "smtp.gmail.com"),
    smtp_port=int(os.getenv("SMTP_PORT", "587")),
    smtp_user=os.getenv("SMTP_USER", ""),
    smtp_password=os.getenv("SMTP_PASSWORD", ""),
    from_email=os.getenv("FROM_EMAIL", ""),
)

push_sender = PushSender(
    provider=os.getenv("PUSH_PROVIDER", "web_push"),
    fcm_api_key=os.getenv("FCM_API_KEY", ""),
)


# ============================================================================
# Health Endpoints
# ============================================================================


@app.get("/health")
async def health_check():
    """Service health check."""
    return {
        "status": "healthy",
        "service": "notification-service",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/health/ready")
async def readiness_check():
    """Readiness probe - check dependencies."""
    try:
        # Check Dapr sidecar
        async with httpx.AsyncClient(timeout=2.0) as client:
            response = await client.get(f"http://localhost:{DAPR_HTTP_PORT}/v1.0/healthz")
            if response.status_code != 200:
                return {"status": "not ready", "error": "Dapr sidecar unhealthy"}, 503

        # Check email configuration
        if not os.getenv("SMTP_USER"):
            logger.warning("Email not configured")

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
    """
    return [
        {
            "pubsubname": PUBSUB_NAME,
            "topic": "alert-events",
            "route": "/api/events/alert-events",
            "metadata": {
                "rawPayload": "false",  # Dapr wraps in CloudEvents
            },
        },
    ]


# ============================================================================
# Event Handlers
# ============================================================================


@app.post("/api/events/alert-events")
async def handle_alert_event(request: Request):
    """
    Handle alert events from Dapr Pub/Sub.

    When alert fires, sends notification via email (primary) and push (fallback).
    """
    try:
        # Parse CloudEvents format
        event = await request.json()
        event_data = event.get("data", {})

        logger.info(f"Received alert event: {event_data.get('event_type')}")

        # Extract event data
        event_type = event_data.get("event_type")
        alert_id = event_data.get("event_id")
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

        # Handle event
        if event_type == "alert.fired":
            await handle_alert_fired(
                alert_id=alert_id,
                task_id=task_id,
                user_id=user_id,
                payload=payload,
            )

        return JSONResponse({"status": "success"})

    except Exception as e:
        logger.error(f"Error handling alert event: {e}", exc_info=True)
        return JSONResponse(
            {"status": "error", "message": str(e)},
            status_code=500,
        )


async def handle_alert_fired(
    alert_id: str,
    task_id: int,
    user_id: str,
    payload: dict,
):
    """
    Handle alert.fired event.

    Multi-channel notification strategy (Option B):
    1. PRIMARY: In-app notification via WebSocket (always sent)
    2. SECONDARY: Email notification (optional, only if user has email)
    3. TERTIARY: Push notification (fallback if email fails)

    This ensures users always receive notifications even without email.
    """
    try:
        task_title = payload.get("task_title", f"Task {task_id}")
        user_email = payload.get("user_email", "")  # Optional
        notification_channels = payload.get("notification_channels", ["in_app"])

        logger.info(f"Processing alert {alert_id} for task {task_id}, user {user_id}")
        logger.info(f"Notification channels: {notification_channels}")

        # Track delivery success
        in_app_sent = False
        email_sent = False
        push_sent = False

        # 1. PRIMARY: Send in-app notification (always, no email required)
        if "in_app" in notification_channels:
            in_app_sent = await send_in_app_notification(
                alert_id=alert_id,
                task_id=task_id,
                user_id=user_id,
                task_title=task_title,
            )
            if in_app_sent:
                logger.info(f"✓ In-app notification sent for alert {alert_id}")
            else:
                logger.warning(f"✗ In-app notification failed for alert {alert_id}")

        # 2. SECONDARY: Send email notification (optional)
        if "email" in notification_channels and user_email:
            email_sent = await send_email_with_retry(
                alert_id=alert_id,
                task_id=task_id,
                user_id=user_id,
                user_email=user_email,
                task_title=task_title,
                max_retries=EMAIL_MAX_RETRIES,
            )
            if email_sent:
                logger.info(f"✓ Email notification sent for alert {alert_id}")
            else:
                logger.warning(f"✗ Email notification failed for alert {alert_id}")

        # 3. TERTIARY: Send push notification (fallback)
        if "push" in notification_channels and not email_sent:
            push_sent = await send_push_notification(
                alert_id=alert_id,
                task_id=task_id,
                user_id=user_id,
                task_title=task_title,
            )
            if push_sent:
                logger.info(f"✓ Push notification sent for alert {alert_id}")

        # Publish notification.sent event for audit
        # Success if ANY channel succeeded (prioritize in-app)
        success = in_app_sent or email_sent or push_sent
        await publish_notification_sent(
            alert_id=alert_id,
            task_id=task_id,
            user_id=user_id,
            success=success,
            channels_sent={
                "in_app": in_app_sent,
                "email": email_sent,
                "push": push_sent,
            },
        )

        if not success:
            logger.error(f"All notification channels failed for alert {alert_id}")

    except Exception as e:
        logger.error(f"Error handling alert.fired: {e}", exc_info=True)


async def send_email_with_retry(
    alert_id: str,
    task_id: int,
    user_id: str,
    user_email: str,
    task_title: str,
    max_retries: int = 10,  # Increased from 3 to 10 (reference-phase-5 standard)
) -> bool:
    """
    Send email with exponential backoff retry (10 attempts).

    Retry strategy matches reference-phase-5:
    - 10 retries with exponential backoff
    - Delays: 1s, 2s, 4s, 8s, 16s, 32s, 64s, 128s, 256s, 512s
    - Total retry time: ~17 minutes

    Args:
        alert_id: Alert ID
        task_id: Task ID
        user_id: User ID
        user_email: User email address
        task_title: Task title
        max_retries: Maximum retry attempts (default: 10)

    Returns:
        True if sent successfully, False otherwise
    """
    subject = f"Reminder: {task_title}"
    body, html_body = email_sender.get_email_template(
        task_title=task_title,
        alert_message=f"Your task '{task_title}' is due soon",
    )

    # Exponential backoff delays: 1s, 2s, 4s, 8s, 16s, 32s, 64s, 128s, 256s, 512s
    retry_delays = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512]

    for attempt in range(max_retries):
        try:
            logger.info(
                f"Email send attempt {attempt + 1}/{max_retries} for alert {alert_id}"
            )

            result = await email_sender.send(
                to=user_email,
                subject=subject,
                body=body,
                html_body=html_body,
            )

            if result:
                logger.info(f"Email sent successfully to {user_email}")
                return True

        except Exception as e:
            logger.warning(f"Email send attempt {attempt + 1} failed: {e}")

        # Exponential backoff
        if attempt < max_retries - 1:
            delay = retry_delays[attempt] if attempt < len(retry_delays) else 512
            logger.info(f"Retrying in {delay} seconds...")
            await asyncio.sleep(delay)

    logger.error(f"Failed to send email after {max_retries} attempts")
    return False


async def send_in_app_notification(
    alert_id: str,
    task_id: int,
    user_id: str,
    task_title: str,
) -> bool:
    """
    Send in-app notification via WebSocket service (PRIMARY channel).

    Broadcasts notification to WebSocket service which pushes to connected clients.
    This is the primary notification channel - always works, no email required.

    Args:
        alert_id: Alert ID
        task_id: Task ID
        user_id: User ID
        task_title: Task title

    Returns:
        True if sent successfully, False otherwise
    """
    try:
        # Publish to task-updates topic for WebSocket service
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                f"http://localhost:{DAPR_HTTP_PORT}/v1.0/publish/{PUBSUB_NAME}/task-updates",
                json={
                    "specversion": "1.0",
                    "type": "notification.alert",
                    "source": "notification-service",
                    "id": alert_id,
                    "datacontenttype": "application/json",
                    "data": {
                        "event_type": "notification.alert",
                        "user_id": user_id,
                        "task_id": task_id,
                        "alert_id": alert_id,
                        "title": f"Reminder: {task_title}",
                        "message": f"Your task '{task_title}' is due soon",
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    },
                },
            )

            if response.status_code == 200:
                logger.info(f"In-app notification published for user {user_id}")
                return True
            else:
                logger.warning(
                    f"Failed to publish in-app notification: {response.status_code}"
                )
                return False

    except Exception as e:
        logger.error(f"Error sending in-app notification: {e}")
        return False


async def send_push_notification(
    alert_id: str,
    task_id: int,
    user_id: str,
    task_title: str,
) -> bool:
    """
    Send push notification (tertiary fallback).

    Args:
        alert_id: Alert ID
        task_id: Task ID
        user_id: User ID
        task_title: Task title

    Returns:
        True if sent successfully, False otherwise
    """
    try:
        result = await push_sender.send(
            user_id=user_id,
            title=f"Reminder: {task_title}",
            message=f"Your task is due soon",
            task_id=task_id,
        )

        if result:
            logger.info(f"Push notification sent to user {user_id}")
        else:
            logger.warning(f"Push notification failed for user {user_id}")

        return result

    except Exception as e:
        logger.error(f"Error sending push notification: {e}")
        return False


async def publish_notification_sent(
    alert_id: str,
    task_id: int,
    user_id: str,
    success: bool,
    channels_sent: dict = None,
) -> bool:
    """
    Publish notification.sent event for audit trail.

    Args:
        alert_id: Alert ID
        task_id: Task ID
        user_id: User ID
        success: Whether notification was sent successfully
        channels_sent: Dict of channel delivery status (e.g., {"in_app": True, "email": False})

    Returns:
        True if event published, False otherwise
    """
    try:
        if channels_sent is None:
            channels_sent = {}

        event = {
            "event_id": alert_id,
            "event_type": "notification.sent",
            "task_id": task_id,
            "user_id": user_id,
            "success": success,
            "channels_sent": channels_sent,  # Track which channels succeeded
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        url = f"http://localhost:{DAPR_HTTP_PORT}/v1.0/publish/{PUBSUB_NAME}/audit-events"

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json=event)

            if response.status_code in [200, 204]:
                logger.info(f"Published notification.sent event for {alert_id}")
                return True
            else:
                logger.warning(f"Event publishing failed: {response.status_code}")
                return False

    except Exception as e:
        logger.error(f"Error publishing notification.sent event: {e}")
        return False


# ============================================================================
# Test Endpoints
# ============================================================================


@app.post("/api/test/send-email")
async def test_send_email(
    to: str,
    subject: str,
    message: str,
) -> dict:
    """Test email sending (development only)."""
    result = await email_sender.send(
        to=to,
        subject=subject,
        body=message,
    )

    return {
        "success": result,
        "to": to,
        "subject": subject,
    }


@app.post("/api/test/send-push")
async def test_send_push(
    user_id: str,
    title: str,
    message: str,
    task_id: int = 0,
) -> dict:
    """Test push notification sending (development only)."""
    result = await push_sender.send(
        user_id=user_id,
        title=title,
        message=message,
        task_id=task_id,
    )

    return {
        "success": result,
        "user_id": user_id,
        "title": title,
    }


# ============================================================================
# Main
# ============================================================================


if __name__ == "__main__":
    import uvicorn

    logger.info(f"Starting Notification Service on port {APP_PORT}")
    logger.info(f"Dapr sidecar on port {DAPR_HTTP_PORT}")

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=APP_PORT,
        log_level="info",
    )
