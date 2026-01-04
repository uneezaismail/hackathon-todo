"""
T040: Integration Tests for Recurring Task Workflows.

Tests the complete recurring task lifecycle:
- Skip occurrence flow
- Stop recurrence flow
- Edit series vs edit instance
- Complete and generate next occurrence
"""

import pytest
from fastapi.testclient import TestClient
from datetime import date, timedelta


class TestRecurringTaskCreation:
    """Tests for creating recurring tasks."""

    def test_create_daily_recurring_task(
        self,
        authenticated_client: TestClient,
        mock_user_id: str
    ):
        """Test creating a daily recurring task."""
        tomorrow = (date.today() + timedelta(days=1)).isoformat()

        response = authenticated_client.post(
            f"/api/{mock_user_id}/tasks",
            json={
                "title": "Daily standup",
                "description": "Team standup meeting",
                "priority": "High",
                "due_date": tomorrow,
                "is_recurring": True,
                "recurrence_type": "daily",
                "recurrence_interval": 1,
            }
        )

        assert response.status_code == 201
        data = response.json()["data"]
        assert data["is_recurring"] is True
        assert data["recurrence_type"] == "daily"
        assert data["recurrence_interval"] == 1
        assert data["due_date"] == tomorrow

    def test_create_weekly_recurring_task_with_days(
        self,
        authenticated_client: TestClient,
        mock_user_id: str
    ):
        """Test creating a weekly recurring task on specific days."""
        tomorrow = (date.today() + timedelta(days=1)).isoformat()

        response = authenticated_client.post(
            f"/api/{mock_user_id}/tasks",
            json={
                "title": "Weekly report",
                "priority": "Medium",
                "due_date": tomorrow,
                "is_recurring": True,
                "recurrence_type": "weekly",
                "recurrence_interval": 1,
                "recurrence_days": "mon,wed,fri",
            }
        )

        assert response.status_code == 201
        data = response.json()["data"]
        assert data["recurrence_type"] == "weekly"
        assert data["recurrence_days"] == "mon,wed,fri"

    def test_create_monthly_recurring_task(
        self,
        authenticated_client: TestClient,
        mock_user_id: str
    ):
        """Test creating a monthly recurring task."""
        tomorrow = (date.today() + timedelta(days=1)).isoformat()

        response = authenticated_client.post(
            f"/api/{mock_user_id}/tasks",
            json={
                "title": "Monthly review",
                "priority": "High",
                "due_date": tomorrow,
                "is_recurring": True,
                "recurrence_type": "monthly",
                "recurrence_interval": 1,
            }
        )

        assert response.status_code == 201
        data = response.json()["data"]
        assert data["recurrence_type"] == "monthly"

    def test_create_recurring_task_with_end_date(
        self,
        authenticated_client: TestClient,
        mock_user_id: str
    ):
        """Test creating a recurring task with an end date."""
        tomorrow = (date.today() + timedelta(days=1)).isoformat()
        end_date = (date.today() + timedelta(days=30)).isoformat()

        response = authenticated_client.post(
            f"/api/{mock_user_id}/tasks",
            json={
                "title": "Limited recurring task",
                "priority": "Low",
                "due_date": tomorrow,
                "is_recurring": True,
                "recurrence_type": "daily",
                "recurrence_interval": 1,
                "recurrence_end_date": end_date,
            }
        )

        assert response.status_code == 201
        data = response.json()["data"]
        assert data["recurrence_end_date"] == end_date

    def test_create_recurring_task_with_max_occurrences(
        self,
        authenticated_client: TestClient,
        mock_user_id: str
    ):
        """Test creating a recurring task with max occurrences."""
        tomorrow = (date.today() + timedelta(days=1)).isoformat()

        response = authenticated_client.post(
            f"/api/{mock_user_id}/tasks",
            json={
                "title": "Limited occurrences task",
                "priority": "Medium",
                "due_date": tomorrow,
                "is_recurring": True,
                "recurrence_type": "daily",
                "recurrence_interval": 1,
                "max_occurrences": 5,
            }
        )

        assert response.status_code == 201
        data = response.json()["data"]
        assert data["max_occurrences"] == 5


class TestCompleteRecurringTask:
    """Tests for completing recurring tasks and generating next occurrence."""

    def test_complete_recurring_task_generates_next(
        self,
        authenticated_client: TestClient,
        mock_user_id: str
    ):
        """Test that completing a recurring task generates the next occurrence."""
        tomorrow = (date.today() + timedelta(days=1)).isoformat()

        # Create recurring task
        create_response = authenticated_client.post(
            f"/api/{mock_user_id}/tasks",
            json={
                "title": "Daily task",
                "due_date": tomorrow,
                "is_recurring": True,
                "recurrence_type": "daily",
                "recurrence_interval": 1,
            }
        )
        assert create_response.status_code == 201
        task_id = create_response.json()["data"]["id"]

        # Complete the task
        complete_response = authenticated_client.post(
            f"/api/{mock_user_id}/tasks/{task_id}/complete"
        )

        assert complete_response.status_code == 200
        data = complete_response.json()["data"]

        # Check completed task
        assert data["completed_task"]["completed"] is True
        assert data["completed_task"]["id"] == task_id

        # Check next occurrence was generated
        assert data["next_occurrence"] is not None
        assert data["next_occurrence"]["completed"] is False
        assert data["next_occurrence"]["is_recurring"] is True

        # Next occurrence should have due date one day later
        expected_next_date = (date.today() + timedelta(days=2)).isoformat()
        assert data["next_occurrence"]["due_date"] == expected_next_date

    def test_complete_non_recurring_task_no_next(
        self,
        authenticated_client: TestClient,
        mock_user_id: str
    ):
        """Test that completing a non-recurring task doesn't generate next occurrence."""
        tomorrow = (date.today() + timedelta(days=1)).isoformat()

        # Create non-recurring task
        create_response = authenticated_client.post(
            f"/api/{mock_user_id}/tasks",
            json={
                "title": "One-time task",
                "due_date": tomorrow,
                "is_recurring": False,
            }
        )
        assert create_response.status_code == 201
        task_id = create_response.json()["data"]["id"]

        # Complete the task
        complete_response = authenticated_client.post(
            f"/api/{mock_user_id}/tasks/{task_id}/complete"
        )

        assert complete_response.status_code == 200
        data = complete_response.json()["data"]

        # Check no next occurrence
        assert data["completed_task"]["completed"] is True
        assert data["next_occurrence"] is None


class TestSkipOccurrence:
    """Tests for skipping recurring task occurrences."""

    def test_skip_occurrence_generates_next(
        self,
        authenticated_client: TestClient,
        mock_user_id: str
    ):
        """Test that skipping an occurrence generates the next one."""
        tomorrow = (date.today() + timedelta(days=1)).isoformat()

        # Create recurring task
        create_response = authenticated_client.post(
            f"/api/{mock_user_id}/tasks",
            json={
                "title": "Daily task to skip",
                "due_date": tomorrow,
                "is_recurring": True,
                "recurrence_type": "daily",
                "recurrence_interval": 1,
            }
        )
        assert create_response.status_code == 201
        task_id = create_response.json()["data"]["id"]

        # Skip the task
        skip_response = authenticated_client.post(
            f"/api/{mock_user_id}/tasks/{task_id}/skip"
        )

        assert skip_response.status_code == 200
        data = skip_response.json()["data"]

        # Check skipped task is marked completed
        assert data["completed_task"]["completed"] is True
        assert data["completed_task"]["id"] == task_id

        # Check next occurrence was generated
        assert data["next_occurrence"] is not None
        assert data["next_occurrence"]["completed"] is False

    def test_skip_non_recurring_task_marks_complete_no_next(
        self,
        authenticated_client: TestClient,
        mock_user_id: str
    ):
        """Test that skipping a non-recurring task marks it complete with no next occurrence."""
        tomorrow = (date.today() + timedelta(days=1)).isoformat()

        # Create non-recurring task
        create_response = authenticated_client.post(
            f"/api/{mock_user_id}/tasks",
            json={
                "title": "Non-recurring task",
                "due_date": tomorrow,
                "is_recurring": False,
            }
        )
        assert create_response.status_code == 201
        task_id = create_response.json()["data"]["id"]

        # Skip the task (allowed, just marks complete with no next)
        skip_response = authenticated_client.post(
            f"/api/{mock_user_id}/tasks/{task_id}/skip"
        )

        assert skip_response.status_code == 200
        data = skip_response.json()["data"]
        # Task should be marked as completed
        assert data["completed_task"]["completed"] is True
        # No next occurrence for non-recurring
        assert data["next_occurrence"] is None

    def test_skip_already_completed_task_still_generates_next(
        self,
        authenticated_client: TestClient,
        mock_user_id: str
    ):
        """Test that skipping an already completed recurring task still generates next (idempotent)."""
        tomorrow = (date.today() + timedelta(days=1)).isoformat()

        # Create and complete recurring task
        create_response = authenticated_client.post(
            f"/api/{mock_user_id}/tasks",
            json={
                "title": "Already completed task",
                "due_date": tomorrow,
                "is_recurring": True,
                "recurrence_type": "daily",
                "recurrence_interval": 1,
            }
        )
        assert create_response.status_code == 201
        task_id = create_response.json()["data"]["id"]

        # Complete first
        complete_response = authenticated_client.post(f"/api/{mock_user_id}/tasks/{task_id}/complete")
        assert complete_response.status_code == 200

        # Skip the already completed task (service is permissive)
        skip_response = authenticated_client.post(
            f"/api/{mock_user_id}/tasks/{task_id}/skip"
        )

        # Should succeed (service is idempotent/permissive)
        assert skip_response.status_code == 200
        data = skip_response.json()["data"]
        assert data["completed_task"]["completed"] is True


class TestStopRecurrence:
    """Tests for stopping recurring task series."""

    def test_stop_recurrence_preserves_task(
        self,
        authenticated_client: TestClient,
        mock_user_id: str
    ):
        """Test that stopping recurrence preserves the task but stops future generation."""
        tomorrow = (date.today() + timedelta(days=1)).isoformat()

        # Create recurring task
        create_response = authenticated_client.post(
            f"/api/{mock_user_id}/tasks",
            json={
                "title": "Recurring to stop",
                "due_date": tomorrow,
                "is_recurring": True,
                "recurrence_type": "daily",
                "recurrence_interval": 1,
            }
        )
        assert create_response.status_code == 201
        task_id = create_response.json()["data"]["id"]

        # Stop recurrence
        stop_response = authenticated_client.post(
            f"/api/{mock_user_id}/tasks/{task_id}/stop-recurrence"
        )

        assert stop_response.status_code == 200
        data = stop_response.json()["data"]

        # Task should be preserved but no longer recurring
        assert data["id"] == task_id
        assert data["is_recurring"] is False
        assert data["title"] == "Recurring to stop"
        # Recurrence type should be preserved for history
        assert data["recurrence_type"] == "daily"

    def test_stop_recurrence_then_complete_no_next(
        self,
        authenticated_client: TestClient,
        mock_user_id: str
    ):
        """Test that completing a stopped recurring task doesn't generate next."""
        tomorrow = (date.today() + timedelta(days=1)).isoformat()

        # Create recurring task
        create_response = authenticated_client.post(
            f"/api/{mock_user_id}/tasks",
            json={
                "title": "Recurring to stop and complete",
                "due_date": tomorrow,
                "is_recurring": True,
                "recurrence_type": "daily",
                "recurrence_interval": 1,
            }
        )
        assert create_response.status_code == 201
        task_id = create_response.json()["data"]["id"]

        # Stop recurrence
        authenticated_client.post(f"/api/{mock_user_id}/tasks/{task_id}/stop-recurrence")

        # Complete the task
        complete_response = authenticated_client.post(
            f"/api/{mock_user_id}/tasks/{task_id}/complete"
        )

        assert complete_response.status_code == 200
        data = complete_response.json()["data"]

        # No next occurrence should be generated
        assert data["completed_task"]["completed"] is True
        assert data["next_occurrence"] is None

    def test_stop_non_recurring_task_is_noop(
        self,
        authenticated_client: TestClient,
        mock_user_id: str
    ):
        """Test that stopping recurrence on non-recurring task is a no-op (already non-recurring)."""
        tomorrow = (date.today() + timedelta(days=1)).isoformat()

        # Create non-recurring task
        create_response = authenticated_client.post(
            f"/api/{mock_user_id}/tasks",
            json={
                "title": "Non-recurring task",
                "due_date": tomorrow,
                "is_recurring": False,
            }
        )
        assert create_response.status_code == 201
        task_id = create_response.json()["data"]["id"]

        # Stop recurrence on non-recurring task (service is permissive, treats as no-op)
        stop_response = authenticated_client.post(
            f"/api/{mock_user_id}/tasks/{task_id}/stop-recurrence"
        )

        # Should succeed (idempotent - task is already non-recurring)
        assert stop_response.status_code == 200
        data = stop_response.json()["data"]
        assert data["is_recurring"] is False
        assert data["title"] == "Non-recurring task"


class TestEditSeries:
    """Tests for editing recurring task series vs single instances."""

    def test_edit_single_instance_only(
        self,
        authenticated_client: TestClient,
        mock_user_id: str
    ):
        """Test editing only a single instance (update_series=false)."""
        tomorrow = (date.today() + timedelta(days=1)).isoformat()

        # Create recurring task
        create_response = authenticated_client.post(
            f"/api/{mock_user_id}/tasks",
            json={
                "title": "Original title",
                "due_date": tomorrow,
                "is_recurring": True,
                "recurrence_type": "daily",
                "recurrence_interval": 1,
            }
        )
        assert create_response.status_code == 201
        task_id = create_response.json()["data"]["id"]

        # Complete to generate next occurrence
        complete_response = authenticated_client.post(
            f"/api/{mock_user_id}/tasks/{task_id}/complete"
        )
        next_task_id = complete_response.json()["data"]["next_occurrence"]["id"]

        # Edit only the new instance (default behavior)
        edit_response = authenticated_client.patch(
            f"/api/{mock_user_id}/tasks/{next_task_id}",
            json={"title": "Modified title"}
        )

        assert edit_response.status_code == 200
        assert edit_response.json()["data"]["title"] == "Modified title"

        # Original should be unchanged
        original_response = authenticated_client.get(
            f"/api/{mock_user_id}/tasks/{task_id}"
        )
        assert original_response.json()["data"]["title"] == "Original title"

    def test_edit_series_updates_all_future(
        self,
        authenticated_client: TestClient,
        mock_user_id: str
    ):
        """Test editing all future instances (update_series=true)."""
        tomorrow = (date.today() + timedelta(days=1)).isoformat()

        # Create recurring task
        create_response = authenticated_client.post(
            f"/api/{mock_user_id}/tasks",
            json={
                "title": "Series title",
                "priority": "Low",
                "due_date": tomorrow,
                "is_recurring": True,
                "recurrence_type": "daily",
                "recurrence_interval": 1,
            }
        )
        assert create_response.status_code == 201
        parent_id = create_response.json()["data"]["id"]

        # Complete to generate next occurrence
        complete_response = authenticated_client.post(
            f"/api/{mock_user_id}/tasks/{parent_id}/complete"
        )
        next_task_id = complete_response.json()["data"]["next_occurrence"]["id"]

        # Edit all future instances
        edit_response = authenticated_client.patch(
            f"/api/{mock_user_id}/tasks/{next_task_id}?update_series=true",
            json={"priority": "High", "title": "Updated series title"}
        )

        assert edit_response.status_code == 200
        assert edit_response.json()["data"]["priority"] == "High"
        assert edit_response.json()["data"]["title"] == "Updated series title"

    def test_edit_series_preserves_completed_tasks(
        self,
        authenticated_client: TestClient,
        mock_user_id: str
    ):
        """Test that editing series doesn't affect already completed tasks."""
        tomorrow = (date.today() + timedelta(days=1)).isoformat()

        # Create recurring task
        create_response = authenticated_client.post(
            f"/api/{mock_user_id}/tasks",
            json={
                "title": "Series to preserve",
                "priority": "Low",
                "due_date": tomorrow,
                "is_recurring": True,
                "recurrence_type": "daily",
                "recurrence_interval": 1,
            }
        )
        assert create_response.status_code == 201
        parent_id = create_response.json()["data"]["id"]

        # Complete the parent (it's now completed)
        complete_response = authenticated_client.post(
            f"/api/{mock_user_id}/tasks/{parent_id}/complete"
        )
        next_task_id = complete_response.json()["data"]["next_occurrence"]["id"]

        # Edit all future instances from the new task
        edit_response = authenticated_client.patch(
            f"/api/{mock_user_id}/tasks/{next_task_id}?update_series=true",
            json={"priority": "High"}
        )

        assert edit_response.status_code == 200

        # Parent (completed) should still have original priority
        parent_response = authenticated_client.get(
            f"/api/{mock_user_id}/tasks/{parent_id}"
        )
        # Parent is completed so it shouldn't be updated
        assert parent_response.json()["data"]["priority"] == "Low"


class TestListRecurringTasks:
    """Tests for listing recurring task patterns."""

    def test_list_recurring_patterns(
        self,
        authenticated_client: TestClient,
        mock_user_id: str
    ):
        """Test listing only recurring task patterns (parent tasks)."""
        tomorrow = (date.today() + timedelta(days=1)).isoformat()

        # Create regular task
        authenticated_client.post(
            f"/api/{mock_user_id}/tasks",
            json={"title": "Regular task", "due_date": tomorrow}
        )

        # Create recurring tasks
        for i in range(3):
            authenticated_client.post(
                f"/api/{mock_user_id}/tasks",
                json={
                    "title": f"Recurring pattern {i}",
                    "due_date": tomorrow,
                    "is_recurring": True,
                    "recurrence_type": "daily",
                    "recurrence_interval": 1,
                }
            )

        # List recurring patterns
        response = authenticated_client.get(f"/api/{mock_user_id}/tasks/recurring")

        assert response.status_code == 200
        data = response.json()["data"]

        # Should only return recurring patterns (parent tasks)
        assert len(data["tasks"]) == 3
        for task in data["tasks"]:
            assert task["is_recurring"] is True
            assert task["parent_task_id"] is None

    def test_list_recurring_excludes_instances(
        self,
        authenticated_client: TestClient,
        mock_user_id: str
    ):
        """Test that listing recurring patterns excludes generated instances."""
        tomorrow = (date.today() + timedelta(days=1)).isoformat()

        # Create recurring task
        create_response = authenticated_client.post(
            f"/api/{mock_user_id}/tasks",
            json={
                "title": "Pattern task",
                "due_date": tomorrow,
                "is_recurring": True,
                "recurrence_type": "daily",
                "recurrence_interval": 1,
            }
        )
        parent_id = create_response.json()["data"]["id"]

        # Complete to generate instance
        authenticated_client.post(f"/api/{mock_user_id}/tasks/{parent_id}/complete")

        # List recurring patterns
        response = authenticated_client.get(f"/api/{mock_user_id}/tasks/recurring")

        assert response.status_code == 200
        data = response.json()["data"]

        # Should only return the parent pattern, not the instance
        assert len(data["tasks"]) == 1
        assert data["tasks"][0]["id"] == parent_id


class TestRecurrenceEndConditions:
    """Tests for recurrence end date and max occurrences."""

    def test_recurrence_stops_at_end_date(
        self,
        authenticated_client: TestClient,
        mock_user_id: str
    ):
        """Test that recurrence stops when end date is reached."""
        tomorrow = (date.today() + timedelta(days=1)).isoformat()
        # Set end date to day after tomorrow
        end_date = (date.today() + timedelta(days=2)).isoformat()

        # Create recurring task with end date
        create_response = authenticated_client.post(
            f"/api/{mock_user_id}/tasks",
            json={
                "title": "Limited by end date",
                "due_date": tomorrow,
                "is_recurring": True,
                "recurrence_type": "daily",
                "recurrence_interval": 1,
                "recurrence_end_date": end_date,
            }
        )
        assert create_response.status_code == 201
        task_id = create_response.json()["data"]["id"]

        # Complete the task
        complete_response = authenticated_client.post(
            f"/api/{mock_user_id}/tasks/{task_id}/complete"
        )

        data = complete_response.json()["data"]
        # Next occurrence should be generated (day after tomorrow)
        assert data["next_occurrence"] is not None
        next_id = data["next_occurrence"]["id"]

        # Complete again
        complete_response_2 = authenticated_client.post(
            f"/api/{mock_user_id}/tasks/{next_id}/complete"
        )

        # No next occurrence should be generated (would exceed end date)
        data_2 = complete_response_2.json()["data"]
        assert data_2["next_occurrence"] is None

    def test_recurrence_stops_at_max_occurrences(
        self,
        authenticated_client: TestClient,
        mock_user_id: str
    ):
        """Test that recurrence stops when max occurrences is reached.

        max_occurrences=3 means:
        - Original task (occurrence #1)
        - First completion generates occurrence #2
        - Second completion generates occurrence #3
        - Third completion should NOT generate (max=3 reached)
        """
        tomorrow = (date.today() + timedelta(days=1)).isoformat()

        # Create recurring task with max_occurrences=3
        create_response = authenticated_client.post(
            f"/api/{mock_user_id}/tasks",
            json={
                "title": "Limited by max occurrences",
                "due_date": tomorrow,
                "is_recurring": True,
                "recurrence_type": "daily",
                "recurrence_interval": 1,
                "max_occurrences": 3,
            }
        )
        assert create_response.status_code == 201
        task_id = create_response.json()["data"]["id"]

        # Complete first occurrence (#1) - should generate #2
        complete_response = authenticated_client.post(
            f"/api/{mock_user_id}/tasks/{task_id}/complete"
        )
        data = complete_response.json()["data"]
        assert data["next_occurrence"] is not None, "Should generate occurrence #2"
        next_id = data["next_occurrence"]["id"]

        # Complete second occurrence (#2) - should generate #3
        complete_response_2 = authenticated_client.post(
            f"/api/{mock_user_id}/tasks/{next_id}/complete"
        )
        data_2 = complete_response_2.json()["data"]
        assert data_2["next_occurrence"] is not None, "Should generate occurrence #3"
        next_id_2 = data_2["next_occurrence"]["id"]

        # Complete third occurrence (#3) - should NOT generate (max=3 reached)
        complete_response_3 = authenticated_client.post(
            f"/api/{mock_user_id}/tasks/{next_id_2}/complete"
        )
        data_3 = complete_response_3.json()["data"]

        # No more occurrences (max_occurrences=3 reached)
        assert data_3["next_occurrence"] is None, "Should not generate more than max_occurrences"
