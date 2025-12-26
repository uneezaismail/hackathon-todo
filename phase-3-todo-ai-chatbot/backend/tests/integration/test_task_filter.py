"""
Integration tests for task filtering and sorting.

Tests filter and sort functionality for GET /api/v1/tasks endpoint:
- Filter by status (Pending/Completed)
- Sort by creation date (ascending/descending)
- Validation of filter parameters

All tests verify proper user isolation and JWT authentication.
"""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session
from datetime import datetime, timedelta
from uuid import UUID

from src.models.task import Task
from src.schemas.task import TaskCreate


class TestTaskStatusFilter:
    """Test task filtering by completion status."""

    def test_filter_pending_tasks_only(
        self,
        authenticated_client: TestClient,
        session: Session,
        mock_user_id: str
    ):
        """
        T061: Test GET /api/v1/tasks?status=Pending returns only pending tasks.

        Given: User has 3 pending and 2 completed tasks
        When: GET /api/v1/tasks?status=Pending
        Then: Returns 200 OK with only 3 pending tasks
        """
        # Create 3 pending tasks
        for i in range(3):
            task = Task(
                user_id=mock_user_id,
                title=f"Pending task {i+1}",
                description=f"Description {i+1}",
                completed=False,
                created_at=datetime.utcnow() - timedelta(minutes=i)
            )
            session.add(task)

        # Create 2 completed tasks
        for i in range(2):
            task = Task(
                user_id=mock_user_id,
                title=f"Completed task {i+1}",
                description=f"Description {i+1}",
                completed=True,
                created_at=datetime.utcnow() - timedelta(minutes=i)
            )
            session.add(task)

        session.commit()

        # Request pending tasks only
        response = authenticated_client.get("/api/v1/tasks?status=Pending")

        assert response.status_code == 200
        data = response.json()
        assert data["error"] is None
        assert data["data"]["total"] == 3
        assert len(data["data"]["tasks"]) == 3

        # Verify all returned tasks are pending
        for task in data["data"]["tasks"]:
            assert task["completed"] is False

    def test_filter_completed_tasks_only(
        self,
        authenticated_client: TestClient,
        session: Session,
        mock_user_id: str
    ):
        """
        T062: Test GET /api/v1/tasks?status=Completed returns only completed tasks.

        Given: User has 3 pending and 2 completed tasks
        When: GET /api/v1/tasks?status=Completed
        Then: Returns 200 OK with only 2 completed tasks
        """
        # Create 3 pending tasks
        for i in range(3):
            task = Task(
                user_id=mock_user_id,
                title=f"Pending task {i+1}",
                description=f"Description {i+1}",
                completed=False,
                created_at=datetime.utcnow() - timedelta(minutes=i)
            )
            session.add(task)

        # Create 2 completed tasks
        for i in range(2):
            task = Task(
                user_id=mock_user_id,
                title=f"Completed task {i+1}",
                description=f"Description {i+1}",
                completed=True,
                created_at=datetime.utcnow() - timedelta(minutes=i)
            )
            session.add(task)

        session.commit()

        # Request completed tasks only
        response = authenticated_client.get("/api/v1/tasks?status=Completed")

        assert response.status_code == 200
        data = response.json()
        assert data["error"] is None
        assert data["data"]["total"] == 2
        assert len(data["data"]["tasks"]) == 2

        # Verify all returned tasks are completed
        for task in data["data"]["tasks"]:
            assert task["completed"] is True

    def test_filter_invalid_status_returns_400(
        self,
        authenticated_client: TestClient,
        mock_user_id: str
    ):
        """
        T063: Test GET /api/v1/tasks?status=Invalid returns 422 Unprocessable Entity.

        Given: Valid authentication
        When: GET /api/v1/tasks?status=Invalid
        Then: Returns 422 Unprocessable Entity (FastAPI validation error for invalid enum)
        """
        response = authenticated_client.get("/api/v1/tasks?status=Invalid")

        # FastAPI returns 422 for enum validation errors
        assert response.status_code == 422
        data = response.json()
        # FastAPI's validation errors come wrapped in our ApiResponse format
        # Check if error contains validation information
        if "detail" in data:
            # Raw FastAPI validation error
            assert "detail" in data
        else:
            # Wrapped in ApiResponse format
            assert data["error"] is not None
            assert "validation" in data["error"]["message"].lower() or \
                   "pending" in data["error"]["message"].lower() or \
                   "completed" in data["error"]["message"].lower()


class TestTaskSorting:
    """Test task sorting by creation date."""

    def test_sort_by_created_at_asc_oldest_first(
        self,
        authenticated_client: TestClient,
        session: Session,
        mock_user_id: str
    ):
        """
        T064: Test GET /api/v1/tasks?sort=created_at_asc returns oldest first.

        Given: User has 5 tasks created at different times
        When: GET /api/v1/tasks?sort=created_at_asc
        Then: Returns 200 OK with tasks ordered oldest to newest
        """
        # Create tasks with different timestamps (oldest to newest)
        task_titles = []
        for i in range(5):
            task = Task(
                user_id=mock_user_id,
                title=f"Task {i+1}",
                description=f"Created {i+1} minutes ago",
                completed=False,
                created_at=datetime.utcnow() - timedelta(minutes=5-i)  # 5, 4, 3, 2, 1 minutes ago
            )
            session.add(task)
            task_titles.append(task.title)

        session.commit()

        # Request tasks sorted oldest first
        response = authenticated_client.get("/api/v1/tasks?sort=created_at_asc")

        assert response.status_code == 200
        data = response.json()
        assert data["error"] is None
        assert len(data["data"]["tasks"]) == 5

        # Verify tasks are ordered oldest to newest (Task 1 to Task 5)
        returned_titles = [task["title"] for task in data["data"]["tasks"]]
        assert returned_titles == task_titles

    def test_sort_by_created_at_desc_newest_first(
        self,
        authenticated_client: TestClient,
        session: Session,
        mock_user_id: str
    ):
        """
        T065: Test GET /api/v1/tasks?sort=created_at_desc returns newest first.

        Given: User has 5 tasks created at different times
        When: GET /api/v1/tasks?sort=created_at_desc
        Then: Returns 200 OK with tasks ordered newest to oldest (default behavior)
        """
        # Create tasks with different timestamps (oldest to newest)
        task_titles = []
        for i in range(5):
            task = Task(
                user_id=mock_user_id,
                title=f"Task {i+1}",
                description=f"Created {i+1} minutes ago",
                completed=False,
                created_at=datetime.utcnow() - timedelta(minutes=5-i)  # 5, 4, 3, 2, 1 minutes ago
            )
            session.add(task)
            task_titles.append(task.title)

        session.commit()

        # Request tasks sorted newest first (should be default)
        response = authenticated_client.get("/api/v1/tasks?sort=created_at_desc")

        assert response.status_code == 200
        data = response.json()
        assert data["error"] is None
        assert len(data["data"]["tasks"]) == 5

        # Verify tasks are ordered newest to oldest (Task 5 to Task 1)
        returned_titles = [task["title"] for task in data["data"]["tasks"]]
        assert returned_titles == list(reversed(task_titles))

    def test_default_sort_is_newest_first(
        self,
        authenticated_client: TestClient,
        session: Session,
        mock_user_id: str
    ):
        """
        Test default sort order is created_at_desc (newest first).

        Given: User has 5 tasks created at different times
        When: GET /api/v1/tasks (no sort parameter)
        Then: Returns 200 OK with tasks ordered newest to oldest
        """
        # Create tasks with different timestamps
        task_titles = []
        for i in range(5):
            task = Task(
                user_id=mock_user_id,
                title=f"Task {i+1}",
                description=f"Created {i+1} minutes ago",
                completed=False,
                created_at=datetime.utcnow() - timedelta(minutes=5-i)
            )
            session.add(task)
            task_titles.append(task.title)

        session.commit()

        # Request tasks without sort parameter (should default to newest first)
        response = authenticated_client.get("/api/v1/tasks")

        assert response.status_code == 200
        data = response.json()
        assert data["error"] is None
        assert len(data["data"]["tasks"]) == 5

        # Verify tasks are ordered newest to oldest (default)
        returned_titles = [task["title"] for task in data["data"]["tasks"]]
        assert returned_titles == list(reversed(task_titles))


class TestCombinedFiltersAndSort:
    """Test combining multiple query parameters."""

    def test_filter_pending_and_sort_asc(
        self,
        authenticated_client: TestClient,
        session: Session,
        mock_user_id: str
    ):
        """
        Test combining status filter and sort parameter.

        Given: User has pending and completed tasks
        When: GET /api/v1/tasks?status=Pending&sort=created_at_asc
        Then: Returns only pending tasks sorted oldest first
        """
        # Create pending tasks
        for i in range(3):
            task = Task(
                user_id=mock_user_id,
                title=f"Pending {i+1}",
                completed=False,
                created_at=datetime.utcnow() - timedelta(minutes=3-i)
            )
            session.add(task)

        # Create completed tasks
        for i in range(2):
            task = Task(
                user_id=mock_user_id,
                title=f"Completed {i+1}",
                completed=True,
                created_at=datetime.utcnow() - timedelta(minutes=2-i)
            )
            session.add(task)

        session.commit()

        # Request pending tasks sorted oldest first
        response = authenticated_client.get(
            "/api/v1/tasks?status=Pending&sort=created_at_asc"
        )

        assert response.status_code == 200
        data = response.json()
        assert data["error"] is None
        assert data["data"]["total"] == 3

        # Verify all returned tasks are pending and sorted oldest first
        tasks = data["data"]["tasks"]
        assert len(tasks) == 3
        assert all(task["completed"] is False for task in tasks)
        assert tasks[0]["title"] == "Pending 1"
        assert tasks[1]["title"] == "Pending 2"
        assert tasks[2]["title"] == "Pending 3"
