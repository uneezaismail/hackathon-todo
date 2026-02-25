"""
Alert Schemas - Phase V (User Story 2)

Pydantic schemas for alert API endpoints.
All times are UTC (ISO 8601 format).
"""

from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Optional, List
from enum import Enum

from src.models.alert import NotificationChannel, AlertStatus


class NotificationChannelEnum(str, Enum):
    """Notification channel options."""

    IN_APP = "in_app"  # Primary: In-app notifications (always available)
    EMAIL = "email"    # Secondary: Email notifications (optional)
    PUSH = "push"      # Tertiary: Push notifications (optional)
    WEBHOOK = "webhook"  # Optional: Webhook notifications


class AlertCreate(BaseModel):
    """
    Create alert request.

    Fields:
        alert_time: When alert should fire (ISO 8601 UTC)
        notification_channels: List of notification methods
        task_title: Title of task (for notification content)
    """

    alert_time: datetime = Field(
        ...,
        description="When alert should fire (ISO 8601 format, must be UTC)",
        example="2025-12-29T16:00:00Z",
    )
    notification_channels: List[NotificationChannelEnum] = Field(
        ..., description="Notification channels (email, push, webhook)"
    )
    task_title: Optional[str] = Field(
        None, description="Task title for notification content"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "alert_time": "2025-12-29T16:00:00Z",
                "notification_channels": ["in_app", "email"],
                "task_title": "Complete Project Proposal",
            }
        }


class AlertUpdate(BaseModel):
    """
    Update alert request.

    Fields:
        alert_time: New alert time (optional)
        notification_channels: Updated channels (optional)
    """

    alert_time: Optional[datetime] = Field(
        None, description="New alert time (ISO 8601 UTC)"
    )
    notification_channels: Optional[List[NotificationChannelEnum]] = Field(
        None, description="Updated notification channels"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "alert_time": "2025-12-29T18:00:00Z",
                "notification_channels": ["push"],
            }
        }


class AlertResponse(BaseModel):
    """
    Alert response.

    Fields:
        id: Alert ID (UUID)
        task_id: Associated task ID
        alert_time: When alert fires (ISO 8601 UTC)
        notification_channels: Notification methods
        delivery_status: Current delivery status
        delivery_attempts: Number of delivery attempts
        created_at: When alert was created
        failed_reason: Error message if delivery failed
    """

    id: str = Field(..., description="Alert ID")
    task_id: int = Field(..., description="Task ID")
    alert_time: datetime = Field(
        ..., description="When alert fires (ISO 8601 UTC)"
    )
    notification_channels: List[NotificationChannelEnum] = Field(
        ..., description="Notification channels"
    )
    delivery_status: str = Field(
        ...,
        description="Delivery status (pending, delivered, failed)",
        example="pending",
    )
    delivery_attempts: int = Field(..., description="Number of delivery attempts")
    created_at: datetime = Field(..., description="When alert was created")
    failed_reason: Optional[str] = Field(
        None, description="Failure reason if delivery failed"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "task_id": 123,
                "alert_time": "2025-12-29T16:00:00Z",
                "notification_channels": ["email", "push"],
                "delivery_status": "pending",
                "delivery_attempts": 0,
                "created_at": "2025-12-28T10:00:00Z",
                "failed_reason": None,
            }
        }


class AlertListResponse(BaseModel):
    """
    List of alerts.

    Fields:
        alerts: List of alert responses
        total: Total number of alerts
    """

    alerts: List[AlertResponse] = Field(..., description="List of alerts")
    total: int = Field(..., description="Total count")

    class Config:
        json_schema_extra = {
            "example": {
                "alerts": [
                    {
                        "id": "123e4567-e89b-12d3-a456-426614174000",
                        "task_id": 123,
                        "alert_time": "2025-12-29T16:00:00Z",
                        "notification_channels": ["email"],
                        "delivery_status": "pending",
                        "delivery_attempts": 0,
                        "created_at": "2025-12-28T10:00:00Z",
                        "failed_reason": None,
                    }
                ],
                "total": 1,
            }
        }


class AlertCancelRequest(BaseModel):
    """Request to cancel an alert."""

    reason: Optional[str] = Field(None, description="Reason for cancellation")


class AlertCancelResponse(BaseModel):
    """Response after canceling alert."""

    success: bool = Field(..., description="Whether cancellation succeeded")
    message: str = Field(..., description="Status message")

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Alert canceled successfully",
            }
        }


class AlertDeliveryStatusUpdate(BaseModel):
    """Update alert delivery status."""

    status: str = Field(
        ...,
        description="Delivery status (pending, delivered, failed, cancelled)",
    )
    delivery_attempts: int = Field(..., description="Number of delivery attempts")
    failed_reason: Optional[str] = Field(None, description="Failure reason")


class AlertFirePayload(BaseModel):
    """
    Payload when Dapr Jobs API fires an alert.

    This is the payload that the alert-service receives from Dapr
    when a scheduled job fires.
    """

    jobName: str = Field(..., description="Job name from Dapr")
    data: dict = Field(
        ...,
        description="Job data (alert_id, task_id, user_id)",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "jobName": "alert-123e4567-e89b-12d3-a456-426614174000",
                "data": {
                    "alert_id": "123e4567-e89b-12d3-a456-426614174000",
                    "task_id": 123,
                    "user_id": "user-456",
                },
            }
        }
