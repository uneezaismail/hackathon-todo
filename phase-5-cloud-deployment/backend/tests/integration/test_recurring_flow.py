"""
Integration tests for recurring task flow (Phase V - T027).

Tests end-to-end recurring task flow:
- Create recurring task with RRULE pattern
- Complete recurring task
- Verify next instance is auto-created
- Verify next_occurrence is calculated correctly

Uses test database and mocked event publisher.
"""

import pytest
from datetime import datetime, timezone, date, timedelta
from unittest.mock import patch, AsyncMock, MagicMock
from uuid import UUID

from fastapi.testclient import TestClient
from sqlmodel import Session, select

from src.models.task import Task
from src.schemas.task import TaskCreate, TaskResponse


class TestRecurringTaskCreation:
    """Test creating recurring tasks with RRULE patterns."""

    def test_create_daily_recurring_task(self, client: TestClient, auth_headers: dict):
        """Create a task with DAILY recurring pattern."""
        task_data = {
            "title": "Daily standup",
            "description": "Morning team sync",
            "priority": "High",
            "recurring_pattern": "DAILY",
        }

        response = client.post(
            "/api/test-user-123/tasks",
            json=task_data,
            headers=auth_headers
        )

        assert response.status_code == 201
        data = response.json()["data"]
        assert data["title"] == "Daily standup"
        assert data["recurring_pattern"] == "DAILY"
        assert data["next_occurrence"] is not None

    def test_create_weekly_recurring_task(self, client: TestClient, auth_headers: dict):
        """Create a task with WEEKLY recurring pattern."""
        task_data = {
            "title": "Weekly review",
            "priority": "Medium",
            "recurring_pattern": "WEEKLY",
        }

        response = client.post(
            "/api/test-user-123/tasks",
            json=task_data,
            headers=auth_headers
        )

        assert response.status_code == 201
        data = response.json()["data"]
        assert data["recurring_pattern"] == "WEEKLY"
        assert data["next_occurrence"] is not None

    def test_create_monthly_recurring_task(self, client: TestClient, auth_headers: dict):
        """Create a task with MONTHLY recurring pattern."""
        task_data = {
            "title": "Monthly report",
            "priority": "High",
            "recurring_pattern": "MONTHLY",
        }

        response = client.post(
            "/api/test-user-123/tasks",
            json=task_data,
            headers=auth_headers
        )

        assert response.status_code == 201
        data = response.json()["data"]
        assert data["recurring_pattern"] == "MONTHLY"

    def test_create_yearly_recurring_task(self, client: TestClient, auth_headers: dict):
        """Create a task with YEARLY recurring pattern."""
        task_data = {
            "title": "Annual review",
            "priority": "High",
            "recurring_pattern": "YEARLY",
        }

        response = client.post(
            "/api/test-user-123/tasks",
            json=task_data,
            headers=auth_headers
        )

        assert response.status_code == 201
        data = response.json()["data"]
        assert data["recurring_pattern"] == "YEARLY"

    def test_create_weekly_byday_recurring_task(self, client: TestClient, auth_headers: dict):
        """Create a task with WEEKLY BYDAY pattern (MO,WE,FR)."""
        task_data = {
            "title": "MWF workout",
            "priority": "Medium",
            "recurring_pattern": "FREQ=WEEKLY;BYDAY=MO,WE,FR",
        }

        response = client.post(
            "/api/test-user-123/tasks",
            json=task_data,
            headers=auth_headers
        )

        assert response.status_code == 201
        data = response.json()["data"]
        assert "BYDAY=MO,WE,FR" in data["recurring_pattern"]

    def test_create_recurring_task_with_end_date(self, client: TestClient, auth_headers: dict):
        """Create recurring task with end date."""
        task_data = {
            "title": "Limited recurrence",
            "priority": "Low",
            "recurring_pattern": "DAILY",
            "recurring_end_date": "2025-12-31",
        }

        response = client.post(
            "/api/test-user-123/tasks",
            json=task_data,
            headers=auth_headers
        )

        assert response.status_code == 201
        data = response.json()["data"]
        assert data["recurring_pattern"] == "DAILY"
        # End date should be stored
        assert data.get("recurring_end_date") is not None

    def test_create_recurring_task_invalid_pattern(self, client: TestClient, auth_headers: dict):
        """Invalid recurring pattern returns validation error."""
        task_data = {
            "title": "Invalid pattern",
            "priority": "Medium",
            "recurring_pattern": "INVALID_PATTERN",
        }

        response = client.post(
            "/api/test-user-123/tasks",
            json=task_data,
            headers=auth_headers
        )

        # Should return 400 or 422 for invalid pattern
        assert response.status_code in [400, 422]


class TestRecurringTaskCompletion:
    """Test completing recurring tasks and auto-generation of next instance."""

    @pytest.fixture
    def daily_recurring_task(self, client: TestClient, auth_headers: dict) -> dict:
        """Create a daily recurring task for testing completion."""
        task_data = {
            "title": "Daily task for completion test",
            "priority": "Medium",
            "recurring_pattern": "DAILY",
        }
        response = client.post(
            "/api/test-user-123/tasks",
            json=task_data,
            headers=auth_headers
        )
        return response.json()["data"]

    @patch("src.events.publisher.EventPublisher.publish_task_completed")
    def test_complete_recurring_task_creates_next_instance(
        self,
        mock_publish: AsyncMock,
        client: TestClient,
        auth_headers: dict,
        daily_recurring_task: dict
    ):
        """Completing a recurring task creates the next instance."""
        mock_publish.return_value = True
        task_id = daily_recurring_task["id"]

        # Complete the task
        response = client.post(
            f"/api/test-user-123/tasks/{task_id}/complete",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()["data"]

        # Original task should be completed
        assert data["completed_task"]["completed"] is True

        # Next occurrence should be created
        assert data.get("next_occurrence") is not None
        next_task = data["next_occurrence"]
        assert next_task["completed"] is False
        assert next_task["recurring_pattern"] == "DAILY"

    @patch("src.events.publisher.EventPublisher.publish_task_completed")
    def test_complete_publishes_task_completed_event(
        self,
        mock_publish: AsyncMock,
        client: TestClient,
        auth_headers: dict,
        daily_recurring_task: dict
    ):
        """Completing task publishes task.completed event."""
        mock_publish.return_value = True
        task_id = daily_recurring_task["id"]

        response = client.post(
            f"/api/test-user-123/tasks/{task_id}/complete",
            headers=auth_headers
        )

        assert response.status_code == 200
        # Verify event was published
        mock_publish.assert_called_once()
        call_args = mock_publish.call_args
        # Should include task_id, user_id, and recurring info
        assert call_args.kwargs.get("user_id") == "test-user-123"

    def test_complete_non_recurring_task_no_next_instance(
        self,
        client: TestClient,
        auth_headers: dict
    ):
        """Completing non-recurring task does not create next instance."""
        # Create non-recurring task
        task_data = {
            "title": "One-time task",
            "priority": "Low",
        }
        create_response = client.post(
            "/api/test-user-123/tasks",
            json=task_data,
            headers=auth_headers
        )
        task_id = create_response.json()["data"]["id"]

        # Complete the task
        response = client.post(
            f"/api/test-user-123/tasks/{task_id}/complete",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()["data"]
        assert data["completed_task"]["completed"] is True
        assert data.get("next_occurrence") is None


class TestNextOccurrenceCalculation:
    """Test next_occurrence field calculation."""

    def test_daily_next_occurrence_is_tomorrow(self, client: TestClient, auth_headers: dict):
        """Daily task's next_occurrence should be 1 day from creation."""
        task_data = {
            "title": "Daily task",
            "priority": "Medium",
            "recurring_pattern": "DAILY",
        }

        response = client.post(
            "/api/test-user-123/tasks",
            json=task_data,
            headers=auth_headers
        )

        data = response.json()["data"]
        next_occurrence = datetime.fromisoformat(data["next_occurrence"].replace("Z", "+00:00"))

        # Should be approximately 1 day from now
        now = datetime.now(timezone.utc)
        expected_min = now + timedelta(hours=23)
        expected_max = now + timedelta(hours=25)

        assert expected_min < next_occurrence < expected_max

    def test_weekly_next_occurrence_is_next_week(self, client: TestClient, auth_headers: dict):
        """Weekly task's next_occurrence should be 7 days from creation."""
        task_data = {
            "title": "Weekly task",
            "priority": "Medium",
            "recurring_pattern": "WEEKLY",
        }

        response = client.post(
            "/api/test-user-123/tasks",
            json=task_data,
            headers=auth_headers
        )

        data = response.json()["data"]
        next_occurrence = datetime.fromisoformat(data["next_occurrence"].replace("Z", "+00:00"))

        # Should be approximately 7 days from now
        now = datetime.now(timezone.utc)
        expected_min = now + timedelta(days=6, hours=23)
        expected_max = now + timedelta(days=7, hours=1)

        assert expected_min < next_occurrence < expected_max


class TestRecurringTaskWithEndDate:
    """Test recurring tasks with end date boundary."""

    @patch("src.events.publisher.EventPublisher.publish_task_completed")
    def test_no_next_instance_after_end_date(
        self,
        mock_publish: AsyncMock,
        client: TestClient,
        auth_headers: dict
    ):
        """No next instance created when past end date."""
        mock_publish.return_value = True

        # Create task with end date in the past
        yesterday = (date.today() - timedelta(days=1)).isoformat()
        task_data = {
            "title": "Ended recurrence",
            "priority": "Low",
            "recurring_pattern": "DAILY",
            "recurring_end_date": yesterday,
        }

        create_response = client.post(
            "/api/test-user-123/tasks",
            json=task_data,
            headers=auth_headers
        )
        task_id = create_response.json()["data"]["id"]

        # Complete the task
        response = client.post(
            f"/api/test-user-123/tasks/{task_id}/complete",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()["data"]
        # No next instance since end date passed
        assert data.get("next_occurrence") is None


class TestUserIsolation:
    """Test user isolation in recurring tasks."""

    def test_user_cannot_complete_other_users_task(
        self,
        client: TestClient,
        session: Session
    ):
        """User cannot complete another user's recurring task."""
        # Create task for user-1
        task = Task(
            user_id="user-1",
            title="User 1's task",
            recurring_pattern="DAILY",
            completed=False,
        )
        session.add(task)
        session.commit()
        session.refresh(task)

        # Try to complete as user-2 (should fail)
        headers = {"Authorization": "Bearer fake-token-user-2"}

        response = client.post(
            f"/api/user-2/tasks/{task.id}/complete",
            headers=headers
        )

        # Should be forbidden or not found
        assert response.status_code in [403, 404]

    def test_next_instance_belongs_to_same_user(
        self,
        client: TestClient,
        auth_headers: dict
    ):
        """Next instance is created for the same user."""
        task_data = {
            "title": "User isolation test",
            "priority": "Medium",
            "recurring_pattern": "DAILY",
        }

        # Create task
        create_response = client.post(
            "/api/test-user-123/tasks",
            json=task_data,
            headers=auth_headers
        )
        original_task = create_response.json()["data"]

        with patch("src.events.publisher.EventPublisher.publish_task_completed") as mock:
            mock.return_value = True

            # Complete task
            complete_response = client.post(
                f"/api/test-user-123/tasks/{original_task['id']}/complete",
                headers=auth_headers
            )

            data = complete_response.json()["data"]
            if data.get("next_occurrence"):
                next_task = data["next_occurrence"]
                assert next_task["user_id"] == "test-user-123"


class TestDatabaseIntegrity:
    """Test database integrity for recurring tasks."""

    def test_parent_task_id_links_instances(
        self,
        client: TestClient,
        auth_headers: dict,
        session: Session
    ):
        """Parent task ID correctly links instances."""
        task_data = {
            "title": "Linked task",
            "priority": "Medium",
            "recurring_pattern": "DAILY",
        }

        # Create original task
        create_response = client.post(
            "/api/test-user-123/tasks",
            json=task_data,
            headers=auth_headers
        )
        original_task = create_response.json()["data"]
        original_id = original_task["id"]

        with patch("src.events.publisher.EventPublisher.publish_task_completed") as mock:
            mock.return_value = True

            # Complete task
            complete_response = client.post(
                f"/api/test-user-123/tasks/{original_id}/complete",
                headers=auth_headers
            )

            data = complete_response.json()["data"]
            if data.get("next_occurrence"):
                next_task = data["next_occurrence"]
                # Next instance should link to original task
                assert next_task.get("parent_task_id") == original_id

    def test_recurring_pattern_preserved_in_chain(
        self,
        client: TestClient,
        auth_headers: dict
    ):
        """Recurring pattern is preserved through completion chain."""
        task_data = {
            "title": "Chain test",
            "priority": "Low",
            "recurring_pattern": "WEEKLY",
        }

        # Create original task
        create_response = client.post(
            "/api/test-user-123/tasks",
            json=task_data,
            headers=auth_headers
        )
        task = create_response.json()["data"]

        with patch("src.events.publisher.EventPublisher.publish_task_completed") as mock:
            mock.return_value = True

            # Complete first instance
            response = client.post(
                f"/api/test-user-123/tasks/{task['id']}/complete",
                headers=auth_headers
            )

            data = response.json()["data"]
            if data.get("next_occurrence"):
                next_task = data["next_occurrence"]
                # Pattern should be preserved
                assert next_task["recurring_pattern"] == "WEEKLY"


# Pytest fixtures for this test module
@pytest.fixture
def auth_headers() -> dict:
    """Return authorization headers for test user."""
    # This will be mocked by conftest.py
    return {"Authorization": "Bearer test-token"}
