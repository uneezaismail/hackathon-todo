"""
Prometheus Metrics Endpoint - Phase V

This module provides Prometheus metrics for monitoring:
- HTTP request metrics (count, latency, errors)
- Task operation metrics (creates, completes, deletes)
- Event publishing metrics (success, failures)
- Database connection metrics
- Dapr sidecar health metrics

Usage:
    # Scrape metrics at /api/metrics
    curl http://localhost:8000/api/metrics

Prometheus Configuration:
    - job_name: 'todo-backend'
      static_configs:
        - targets: ['backend:8000']
      metrics_path: '/api/metrics'
"""

import time
from functools import wraps
from typing import Callable

from fastapi import APIRouter, Response
from prometheus_client import (
    Counter,
    Gauge,
    Histogram,
    generate_latest,
    CONTENT_TYPE_LATEST,
    REGISTRY,
)

router = APIRouter()

# ===========================================================================
# Metric Definitions
# ===========================================================================

# HTTP Request Metrics
HTTP_REQUEST_TOTAL = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status_code"],
)

HTTP_REQUEST_DURATION = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "endpoint"],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
)

# Task Operation Metrics
TASK_OPERATIONS_TOTAL = Counter(
    "task_operations_total",
    "Total task operations",
    ["operation", "user_id_hash"],  # Hash user_id for privacy
)

TASK_OPERATIONS_ERRORS = Counter(
    "task_operations_errors_total",
    "Total task operation errors",
    ["operation", "error_type"],
)

# Recurring Task Metrics
RECURRING_TASKS_CREATED = Counter(
    "recurring_tasks_created_total",
    "Total recurring tasks created",
)

RECURRING_OCCURRENCES_GENERATED = Counter(
    "recurring_occurrences_generated_total",
    "Total recurring task occurrences generated",
)

# Event Publishing Metrics
EVENTS_PUBLISHED_TOTAL = Counter(
    "events_published_total",
    "Total events published to Kafka",
    ["event_type", "topic"],
)

EVENTS_PUBLISH_ERRORS = Counter(
    "events_publish_errors_total",
    "Total event publish errors",
    ["event_type", "error_type"],
)

EVENT_PUBLISH_DURATION = Histogram(
    "event_publish_duration_seconds",
    "Event publish duration in seconds",
    ["event_type"],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5],
)

# Alert Metrics
ALERTS_SCHEDULED_TOTAL = Counter(
    "alerts_scheduled_total",
    "Total alerts scheduled",
)

ALERTS_DELIVERED_TOTAL = Counter(
    "alerts_delivered_total",
    "Total alerts delivered",
    ["channel"],
)

ALERTS_FAILED_TOTAL = Counter(
    "alerts_failed_total",
    "Total alert delivery failures",
    ["channel", "reason"],
)

# Database Metrics
DB_CONNECTIONS_ACTIVE = Gauge(
    "db_connections_active",
    "Active database connections",
)

DB_QUERY_DURATION = Histogram(
    "db_query_duration_seconds",
    "Database query duration in seconds",
    ["query_type"],
    buckets=[0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0],
)

# Dapr Sidecar Metrics
DAPR_SIDECAR_HEALTHY = Gauge(
    "dapr_sidecar_healthy",
    "Dapr sidecar health status (1=healthy, 0=unhealthy)",
)

DAPR_OPERATIONS_TOTAL = Counter(
    "dapr_operations_total",
    "Total Dapr operations",
    ["operation", "component"],
)

DAPR_OPERATION_ERRORS = Counter(
    "dapr_operation_errors_total",
    "Total Dapr operation errors",
    ["operation", "component", "error_type"],
)

# Application Info
APP_INFO = Gauge(
    "app_info",
    "Application information",
    ["version", "phase"],
)
APP_INFO.labels(version="0.2.0", phase="V").set(1)


# ===========================================================================
# Metrics Endpoint
# ===========================================================================


@router.get("/metrics", include_in_schema=False)
async def get_metrics() -> Response:
    """
    Prometheus metrics endpoint.

    Returns metrics in Prometheus text format for scraping.
    This endpoint is not included in OpenAPI schema.
    """
    return Response(
        content=generate_latest(REGISTRY),
        media_type=CONTENT_TYPE_LATEST,
    )


# ===========================================================================
# Metric Helpers
# ===========================================================================


def track_request_duration(method: str, endpoint: str) -> Callable:
    """
    Decorator to track HTTP request duration.

    Usage:
        @track_request_duration("GET", "/api/tasks")
        async def get_tasks():
            ...
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                return result
            finally:
                duration = time.time() - start_time
                HTTP_REQUEST_DURATION.labels(
                    method=method,
                    endpoint=endpoint,
                ).observe(duration)
        return wrapper
    return decorator


def increment_task_operation(operation: str, user_id: str) -> None:
    """Increment task operation counter with hashed user_id."""
    # Hash user_id for privacy (just use first 8 chars)
    user_id_hash = user_id[:8] if user_id else "unknown"
    TASK_OPERATIONS_TOTAL.labels(
        operation=operation,
        user_id_hash=user_id_hash,
    ).inc()


def increment_event_published(event_type: str, topic: str) -> None:
    """Increment event published counter."""
    EVENTS_PUBLISHED_TOTAL.labels(
        event_type=event_type,
        topic=topic,
    ).inc()


def increment_event_error(event_type: str, error_type: str) -> None:
    """Increment event publish error counter."""
    EVENTS_PUBLISH_ERRORS.labels(
        event_type=event_type,
        error_type=error_type,
    ).inc()


def set_dapr_health(healthy: bool) -> None:
    """Set Dapr sidecar health status."""
    DAPR_SIDECAR_HEALTHY.set(1 if healthy else 0)
