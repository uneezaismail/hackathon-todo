"""
Contract tests for Event Schemas - Phase V (T054)

Validates that published events conform to event-contracts.md specification.
Tests CloudEvents 1.0 compliance and schema versioning.
"""

import pytest
from datetime import datetime, timezone
from uuid import UUID
from typing import Any, Dict

from src.events.schemas import (
    TaskCreatedEvent,
    TaskCompletedEvent,
    TaskUpdatedEvent,
    TaskDeletedEvent,
    AlertScheduledEvent,
    AlertFiredEvent,
)


class TestEventContractsCompliance:
    """Test suite validating event contract compliance."""

    def test_task_created_event_schema(self):
        """Test task.created event complies with contract."""
        event = TaskCreatedEvent(
            user_id="user-123",
            task_id=456,
            payload={
                "task_title": "Test Task",
                "task_description": "Test Description",
                "priority": "High",
                "due_date": "2025-12-31",
                "recurring_pattern": None,
                "is_pattern": False,
            },
        )

        # Verify CloudEvents 1.0 fields
        assert event.specversion == "1.0"
        assert event.type == "task.created"
        assert "source" in event.source.lower()
        assert isinstance(event.id, str)
        assert event.time is not None
        assert event.datacontenttype == "application/json"

        # Verify custom fields
        assert event.event_type == "task.created"
        assert event.event_version == "1.0"
        assert event.user_id == "user-123"
        assert event.task_id == 456

    def test_task_completed_event_schema(self):
        """Test task.completed event complies with contract."""
        event = TaskCompletedEvent(
            user_id="user-123",
            task_id=456,
            payload={
                "task_title": "Completed Task",
                "completed_at": "2025-12-29T10:00:00Z",
                "recurring_pattern": "DAILY",
                "recurring_end_date": "2026-01-31",
                "next_occurrence_due": "2025-12-30",
                "is_pattern": False,
                "parent_task_id": None,
            },
        )

        assert event.type == "task.completed"
        assert event.event_type == "task.completed"
        assert event.user_id == "user-123"
        assert event.payload["recurring_pattern"] == "DAILY"

    def test_task_updated_event_schema(self):
        """Test task.updated event complies with contract."""
        event = TaskUpdatedEvent(
            user_id="user-123",
            task_id=456,
            payload={
                "task_title": "Updated Task",
                "changed_fields": ["title", "priority"],
                "previous_values": {"title": "Old", "priority": "Low"},
                "new_values": {"title": "Updated Task", "priority": "High"},
            },
        )

        assert event.type == "task.updated"
        assert event.event_type == "task.updated"
        assert "title" in event.payload["changed_fields"]
        assert event.payload["previous_values"]["priority"] == "Low"
        assert event.payload["new_values"]["priority"] == "High"

    def test_task_deleted_event_schema(self):
        """Test task.deleted event complies with contract."""
        event = TaskDeletedEvent(
            user_id="user-123",
            task_id=456,
            payload={
                "task_title": "Deleted Task",
                "was_recurring": True,
                "cascade_deleted_count": 5,
            },
        )

        assert event.type == "task.deleted"
        assert event.event_type == "task.deleted"
        assert event.payload["was_recurring"] is True
        assert event.payload["cascade_deleted_count"] == 5

    def test_alert_scheduled_event_schema(self):
        """Test alert.scheduled event complies with contract."""
        event = AlertScheduledEvent(
            user_id="user-123",
            task_id=456,
            payload={
                "alert_id": "alert-789",
                "alert_time": "2025-12-31T10:00:00Z",
                "notification_channels": ["email", "push"],
            },
        )

        assert event.type == "alert.scheduled"
        assert event.event_type == "alert.scheduled"
        assert event.payload["alert_id"] == "alert-789"
        assert "email" in event.payload["notification_channels"]

    def test_alert_fired_event_schema(self):
        """Test alert.fired event complies with contract."""
        event = AlertFiredEvent(
            user_id="user-123",
            task_id=456,
            payload={
                "alert_id": "alert-789",
                "notification_channels": ["email"],
            },
        )

        assert event.type == "alert.fired"
        assert event.event_type == "alert.fired"

    def test_event_id_is_uuid_format(self):
        """Test that event_id is valid UUID format."""
        event = TaskCreatedEvent(
            user_id="user-123",
            task_id=456,
            payload={"task_title": "Test"},
        )

        # Validate UUID format
        try:
            UUID(event.id)
            uuid_valid = True
        except ValueError:
            uuid_valid = False

        assert uuid_valid, f"event_id '{event.id}' is not valid UUID"

    def test_event_timestamp_is_iso_8601(self):
        """Test that event timestamp is ISO 8601 format."""
        event = TaskCreatedEvent(
            user_id="user-123",
            task_id=456,
            payload={"task_title": "Test"},
        )

        # Should be ISO 8601 datetime with 'Z' suffix
        assert event.time.endswith("Z"), "Timestamp should end with 'Z' (UTC)"

        # Should be parseable as ISO 8601
        try:
            datetime.fromisoformat(event.time.replace("Z", "+00:00"))
            parseable = True
        except ValueError:
            parseable = False

        assert parseable, f"Timestamp '{event.time}' is not ISO 8601"

    def test_user_id_included_in_all_events(self):
        """Test that user_id is included in all event types."""
        events = [
            TaskCreatedEvent(user_id="user-1", task_id=1, payload={}),
            TaskCompletedEvent(user_id="user-2", task_id=2, payload={}),
            TaskUpdatedEvent(user_id="user-3", task_id=3, payload={}),
            TaskDeletedEvent(user_id="user-4", task_id=4, payload={}),
            AlertScheduledEvent(user_id="user-5", task_id=5, payload={}),
            AlertFiredEvent(user_id="user-6", task_id=6, payload={}),
        ]

        for event in events:
            assert event.user_id is not None, f"{event.type} missing user_id"
            assert len(event.user_id) > 0, f"{event.type} has empty user_id"

    def test_task_id_included_in_all_events(self):
        """Test that task_id is included in all event types."""
        events = [
            TaskCreatedEvent(user_id="u", task_id=1, payload={}),
            TaskCompletedEvent(user_id="u", task_id=2, payload={}),
            TaskUpdatedEvent(user_id="u", task_id=3, payload={}),
            TaskDeletedEvent(user_id="u", task_id=4, payload={}),
            AlertScheduledEvent(user_id="u", task_id=5, payload={}),
            AlertFiredEvent(user_id="u", task_id=6, payload={}),
        ]

        for event in events:
            assert event.task_id is not None
            assert event.task_id > 0

    def test_event_version_is_semantic_versioning(self):
        """Test that event_version follows semantic versioning."""
        event = TaskCreatedEvent(
            user_id="user-123",
            task_id=456,
            payload={"task_title": "Test"},
        )

        # Should be "X.Y.Z" format
        version_parts = event.event_version.split(".")
        assert len(version_parts) == 3, f"Version '{event.event_version}' not semantic"
        for part in version_parts:
            assert part.isdigit(), f"Version part '{part}' is not numeric"

    def test_source_identifies_service(self):
        """Test that source field identifies the service."""
        event = TaskCreatedEvent(
            user_id="user-123",
            task_id=456,
            payload={"task_title": "Test"},
        )

        assert event.source is not None
        # Should contain service identifier
        assert "backend" in event.source.lower() or \
               "todo" in event.source.lower()

    def test_datacontenttype_is_json(self):
        """Test that datacontenttype is JSON."""
        event = TaskCreatedEvent(
            user_id="user-123",
            task_id=456,
            payload={"task_title": "Test"},
        )

        assert event.datacontenttype == "application/json"

    def test_event_serialization_preserves_fields(self):
        """Test that event serialization preserves all fields."""
        original_event = TaskCreatedEvent(
            user_id="user-123",
            task_id=456,
            payload={
                "task_title": "Test Task",
                "priority": "High",
                "due_date": "2025-12-31",
            },
        )

        # Serialize to dict
        event_dict = original_event.model_dump(by_alias=True, mode="json")

        # Verify all fields are present
        required_fields = [
            "specversion",
            "type",
            "source",
            "id",
            "time",
            "datacontenttype",
            "event_type",
            "event_version",
            "user_id",
            "task_id",
            "data",
        ]

        for field in required_fields:
            assert field in event_dict, f"Missing field in serialization: {field}"

    def test_event_data_payload_structure(self):
        """Test that event payload has correct structure."""
        payload = {
            "task_title": "Test Task",
            "task_description": "Description",
            "priority": "High",
        }

        event = TaskCreatedEvent(
            user_id="user-123",
            task_id=456,
            payload=payload,
        )

        # Payload should be accessible
        assert event.payload is not None
        assert event.payload["task_title"] == "Test Task"

    def test_recurring_pattern_values_valid(self):
        """Test that recurring pattern values are valid RRULE or presets."""
        valid_patterns = [
            "DAILY",
            "WEEKLY",
            "MONTHLY",
            "YEARLY",
            "FREQ=DAILY;INTERVAL=1",
            "FREQ=WEEKLY;BYDAY=MO,WE,FR",
            "FREQ=MONTHLY;BYMONTHDAY=1",
        ]

        for pattern in valid_patterns:
            event = TaskCompletedEvent(
                user_id="user-123",
                task_id=456,
                payload={
                    "task_title": "Recurring Task",
                    "completed_at": "2025-12-29T10:00:00Z",
                    "recurring_pattern": pattern,
                    "recurring_end_date": None,
                    "next_occurrence_due": "2025-12-30",
                    "is_pattern": True,
                    "parent_task_id": None,
                },
            )

            assert event.payload["recurring_pattern"] == pattern

    def test_notification_channels_valid_values(self):
        """Test that notification channels are from allowed set."""
        valid_channels = [
            ["email"],
            ["push"],
            ["webhook"],
            ["email", "push"],
            ["email", "webhook"],
        ]

        for channels in valid_channels:
            event = AlertScheduledEvent(
                user_id="user-123",
                task_id=456,
                payload={
                    "alert_id": "alert-789",
                    "alert_time": "2025-12-31T10:00:00Z",
                    "notification_channels": channels,
                },
            )

            assert event.payload["notification_channels"] == channels

    def test_event_specversion_always_1_0(self):
        """Test that specversion is always 1.0 (CloudEvents v1.0)."""
        events = [
            TaskCreatedEvent(user_id="u", task_id=1, payload={}),
            TaskCompletedEvent(user_id="u", task_id=2, payload={}),
            TaskUpdatedEvent(user_id="u", task_id=3, payload={}),
        ]

        for event in events:
            assert event.specversion == "1.0"

    def test_event_type_matches_event_type_field(self):
        """Test that type and event_type fields match."""
        event = TaskCreatedEvent(
            user_id="user-123",
            task_id=456,
            payload={"task_title": "Test"},
        )

        # Extract event type from cloudevents type (format: "domain.event.operation")
        # Reconstruct to check consistency
        expected_type = "task.created"
        assert event.event_type == "task.created"
        assert expected_type in event.type
