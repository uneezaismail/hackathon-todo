"""
Alerts API Endpoints - Phase V (User Story 2)

REST API for managing task alerts and reminders.

Endpoints:
- POST /api/v1/tasks/{task_id}/alerts - Create alert
- GET /api/v1/tasks/{task_id}/alerts - Get task alerts
- PATCH /api/v1/alerts/{alert_id} - Update alert
- DELETE /api/v1/alerts/{alert_id} - Cancel alert

All endpoints require JWT authentication.
User ID is validated against URL path for security.
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlmodel import Session

from src.auth.jwt_handler import verify_jwt_token
from src.db.session import get_session
from src.services.alert_service import AlertService
from src.schemas.alert import (
    AlertCreate,
    AlertResponse,
    AlertUpdate,
    AlertListResponse,
    AlertCancelResponse,
)
from src.models.alert import NotificationChannel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["alerts"])

# Alert service instance
alert_service = AlertService()


@router.post(
    "/tasks/{task_id}/alerts",
    response_model=AlertResponse,
    summary="Create alert for task",
    description="Schedule an alert/reminder for a task at specific time",
)
async def create_alert(
    user_id: str = Path(..., description="User ID"),
    task_id: int = Path(..., description="Task ID"),
    alert_data: AlertCreate = None,
    current_user: dict = Depends(verify_jwt_token),
    session: Session = Depends(get_session),
) -> AlertResponse:
    """
    Create alert for a task with database persistence.

    Schedules alert via Dapr Jobs API to fire at alert_time.
    When alert fires, notification will be sent via specified channels.
    Alert is persisted to PostgreSQL for reliability.

    Args:
        user_id: User ID from URL path
        task_id: Task ID from URL path
        alert_data: Alert creation data
        current_user: JWT token payload
        session: Database session

    Returns:
        AlertResponse with alert details

    Raises:
        HTTPException: 403 if user_id doesn't match token, 400 if validation fails
    """
    # User isolation check
    if user_id != current_user.get("user_id"):
        logger.warning(
            f"Unauthorized alert creation: {current_user.get('user_id')} != {user_id}"
        )
        raise HTTPException(status_code=403, detail="Forbidden")

    if alert_data is None:
        raise HTTPException(status_code=400, detail="Alert data required")

    # Validate alert_time is in future
    if alert_data.alert_time <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Alert time must be in the future")

    # Validate alert_time is UTC
    if (
        alert_data.alert_time.tzinfo is None
        or alert_data.alert_time.tzinfo != timezone.utc
    ):
        raise HTTPException(status_code=400, detail="Alert time must be in UTC")

    try:
        # Convert schema channels to model channels
        channels = [
            NotificationChannel[ch.upper()] for ch in alert_data.notification_channels
        ]

        # Schedule alert via alert service (now with database persistence)
        alert = await alert_service.schedule_alert(
            session=session,
            task_id=str(task_id),
            user_id=user_id,
            alert_time=alert_data.alert_time,
            notification_channels=channels,
            task_title=alert_data.task_title or f"Task {task_id}",
        )

        if alert is None:
            raise HTTPException(
                status_code=500, detail="Failed to schedule alert"
            )

        return AlertResponse(
            alert_id=alert.alert_id,
            task_id=alert.task_id,
            user_id=alert.user_id,
            alert_time=alert.alert_time,
            notification_channels=alert.notification_channels,
            delivery_status=alert.delivery_status,
            delivery_attempts=alert.delivery_attempts,
            failed_reason=alert.failed_reason,
            dapr_job_id=alert.dapr_job_id,
            delivered_at=alert.delivered_at,
            created_at=alert.created_at,
            updated_at=alert.updated_at,
        )

    except ValueError as e:
        logger.error(f"Alert validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating alert: {e}")
        raise HTTPException(status_code=500, detail="Failed to create alert")


@router.get(
    "/tasks/{task_id}/alerts",
    response_model=AlertListResponse,
    summary="Get alerts for task",
    description="Get all alerts scheduled for a specific task from database",
)
async def get_task_alerts(
    user_id: str = Path(..., description="User ID"),
    task_id: int = Path(..., description="Task ID"),
    current_user: dict = Depends(verify_jwt_token),
    session: Session = Depends(get_session),
) -> AlertListResponse:
    """
    Get all alerts for a task from PostgreSQL database.

    Returns list of alerts scheduled for the task,
    filtered by user_id for security.

    Args:
        user_id: User ID from URL path
        task_id: Task ID from URL path
        current_user: JWT token payload
        session: Database session

    Returns:
        AlertListResponse with list of alerts

    Raises:
        HTTPException: 403 if user_id doesn't match token
    """
    # User isolation check
    if user_id != current_user.get("user_id"):
        logger.warning(f"Unauthorized access: {current_user.get('user_id')} != {user_id}")
        raise HTTPException(status_code=403, detail="Forbidden")

    try:
        # Get alerts from database
        alerts = await alert_service.get_task_alerts(
            session=session,
            task_id=str(task_id),
            user_id=user_id,
        )

        # Convert to response format
        alert_responses = [
            AlertResponse(
                alert_id=alert.alert_id,
                task_id=alert.task_id,
                user_id=alert.user_id,
                alert_time=alert.alert_time,
                notification_channels=alert.notification_channels,
                delivery_status=alert.delivery_status,
                delivery_attempts=alert.delivery_attempts,
                failed_reason=alert.failed_reason,
                dapr_job_id=alert.dapr_job_id,
                delivered_at=alert.delivered_at,
                created_at=alert.created_at,
                updated_at=alert.updated_at,
            )
            for alert in alerts
        ]

        return AlertListResponse(
            alerts=alert_responses,
            total=len(alert_responses),
        )

    except Exception as e:
        logger.error(f"Error fetching alerts: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch alerts")


@router.patch(
    "/alerts/{alert_id}",
    response_model=AlertResponse,
    summary="Update alert",
    description="Update alert time or notification channels",
)
async def update_alert(
    user_id: str = Query(..., description="User ID"),
    alert_id: str = Path(..., description="Alert ID"),
    alert_data: AlertUpdate = None,
    current_user: dict = Depends(verify_jwt_token),
    session: Session = Depends(get_session),
) -> AlertResponse:
    """
    Update alert.

    Note: In production, this would fetch from database to verify ownership.
    For now, user_id is required as query parameter for verification.

    Args:
        user_id: User ID (for verification)
        alert_id: Alert ID to update
        alert_data: Updated alert data
        current_user: JWT token payload
        session: Database session

    Returns:
        Updated AlertResponse

    Raises:
        HTTPException: 403 if unauthorized, 404 if not found
    """
    # User isolation check
    if user_id != current_user.get("user_id"):
        logger.warning(f"Unauthorized update: {current_user.get('user_id')} != {user_id}")
        raise HTTPException(status_code=403, detail="Forbidden")

    # In production, would fetch alert from DB and verify ownership
    # For now, return placeholder
    raise HTTPException(status_code=501, detail="Update alert not yet implemented")


@router.delete(
    "/alerts/{alert_id}",
    response_model=AlertCancelResponse,
    summary="Cancel alert",
    description="Cancel a scheduled alert",
)
async def cancel_alert(
    user_id: str = Query(..., description="User ID"),
    alert_id: str = Path(..., description="Alert ID"),
    current_user: dict = Depends(verify_jwt_token),
    session: Session = Depends(get_session),
) -> AlertCancelResponse:
    """
    Cancel alert.

    Cancels the alert and removes the corresponding Dapr job.

    Args:
        user_id: User ID (for verification)
        alert_id: Alert ID to cancel
        current_user: JWT token payload
        session: Database session

    Returns:
        AlertCancelResponse

    Raises:
        HTTPException: 403 if unauthorized, 404 if not found
    """
    # User isolation check
    if user_id != current_user.get("user_id"):
        logger.warning(f"Unauthorized cancel: {current_user.get('user_id')} != {user_id}")
        raise HTTPException(status_code=403, detail="Forbidden")

    try:
        # Cancel alert via alert service (updates database)
        success = await alert_service.cancel_alert(
            session=session,
            alert_id=alert_id,
        )

        if not success:
            logger.warning(f"Alert not found: {alert_id}")
            raise HTTPException(status_code=404, detail="Alert not found")

        return AlertCancelResponse(
            success=True,
            message="Alert canceled successfully",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error canceling alert: {e}")
        raise HTTPException(status_code=500, detail="Failed to cancel alert")


@router.post(
    "/alerts/{alert_id}/test",
    summary="Test alert (dev only)",
    description="Manually trigger alert for testing",
)
async def test_alert(
    user_id: str = Query(..., description="User ID"),
    alert_id: str = Path(..., description="Alert ID"),
    current_user: dict = Depends(verify_jwt_token),
    session: Session = Depends(get_session),
) -> dict:
    """
    Test alert by manually triggering it (development only).

    Args:
        user_id: User ID
        alert_id: Alert ID to test
        current_user: JWT token
        session: Database session

    Returns:
        Status message
    """
    # User isolation check
    if user_id != current_user.get("user_id"):
        raise HTTPException(status_code=403, detail="Forbidden")

    # In production, would retrieve alert and trigger notification
    return {
        "status": "success",
        "message": f"Alert {alert_id} test triggered",
    }
