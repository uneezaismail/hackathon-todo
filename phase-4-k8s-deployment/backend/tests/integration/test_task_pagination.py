"""
Integration tests for task pagination validation.

Tests pagination parameter validation for GET /api/v1/tasks endpoint:
- Limit and offset parameters work correctly
- Limit exceeding max (100) returns 422
- Negative offset returns 422

All tests verify proper user isolation and JWT authentication.
"""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session
from datetime import datetime, timedelta

from src.models.task import Task


class TestTaskPagination:
    """Test pagination parameters for task list endpoint."""

    def test_pagination_limit_and_offset(
        self,
        authenticated_client: TestClient,
        session: Session,
        mock_user_id: str
    ):
        """
        T066: Test GET /api/v1/tasks?limit=10&offset=5 returns correct pagination.

        Given: User has 20 tasks
        When: GET /api/v1/tasks?limit=10&offset=5
        Then: Returns 200 OK with 10 tasks starting from position 5 (tasks 6-15)
        """
        # Create 20 tasks with sequential titles
        for i in range(20):
            task = Task(
                user_id=mock_user_id,
                title=f"Task {i+1:02d}",  # Task 01, Task 02, etc.
                description=f"Description {i+1}",
                completed=False,
                created_at=datetime.utcnow() - timedelta(minutes=20-i)  # Oldest to newest
            )
            session.add(task)

        session.commit()

        # Request tasks with limit=10, offset=5
        # Default sort is newest first, so we expect tasks 20, 19, 18... → offset 5 = tasks 15-6
        response = authenticated_client.get("/api/v1/tasks?limit=10&offset=5")

        assert response.status_code == 200
        data = response.json()
        assert data["error"] is None
        assert data["data"]["total"] == 20
        assert data["data"]["limit"] == 10
        assert data["data"]["offset"] == 5
        assert len(data["data"]["tasks"]) == 10

        # Verify we got the correct slice (tasks 15 down to 6 in newest-first order)
        returned_titles = [task["title"] for task in data["data"]["tasks"]]
        expected_titles = [f"Task {i:02d}" for i in range(15, 5, -1)]
        assert returned_titles == expected_titles

    def test_limit_exceeds_max_returns_422(
        self,
        authenticated_client: TestClient,
        mock_user_id: str
    ):
        """
        T067: Test GET /api/v1/tasks?limit=101 returns 422 Unprocessable Entity.

        Given: Valid authentication
        When: GET /api/v1/tasks?limit=101 (exceeds max 100)
        Then: Returns 422 with validation error
        """
        response = authenticated_client.get("/api/v1/tasks?limit=101")

        assert response.status_code == 422
        data = response.json()

        # FastAPI validation errors may be wrapped in our ApiResponse format
        if "detail" in data:
            # Raw FastAPI validation error
            error_details = str(data["detail"]).lower()
        else:
            # Wrapped in ApiResponse format
            assert data["error"] is not None
            error_details = str(data["error"]["message"]).lower()

        # Verify error details mention limit validation
        assert "limit" in error_details or "less than or equal" in error_details or "100" in error_details

    def test_negative_offset_returns_422(
        self,
        authenticated_client: TestClient,
        mock_user_id: str
    ):
        """
        T068: Test GET /api/v1/tasks?offset=-1 returns 422 Unprocessable Entity.

        Given: Valid authentication
        When: GET /api/v1/tasks?offset=-1 (negative offset)
        Then: Returns 422 with validation error
        """
        response = authenticated_client.get("/api/v1/tasks?offset=-1")

        assert response.status_code == 422
        data = response.json()

        # FastAPI validation errors may be wrapped in our ApiResponse format
        if "detail" in data:
            # Raw FastAPI validation error
            error_details = str(data["detail"]).lower()
        else:
            # Wrapped in ApiResponse format
            assert data["error"] is not None
            error_details = str(data["error"]["message"]).lower()

        # Verify error details mention offset validation
        assert "offset" in error_details or "greater than or equal" in error_details or "0" in error_details

    def test_pagination_with_empty_results(
        self,
        authenticated_client: TestClient,
        session: Session,
        mock_user_id: str
    ):
        """
        Test pagination with offset beyond total results.

        Given: User has 5 tasks
        When: GET /api/v1/tasks?limit=10&offset=10
        Then: Returns 200 OK with empty task list but total=5
        """
        # Create 5 tasks
        for i in range(5):
            task = Task(
                user_id=mock_user_id,
                title=f"Task {i+1}",
                completed=False,
                created_at=datetime.utcnow() - timedelta(minutes=i)
            )
            session.add(task)

        session.commit()

        # Request tasks with offset beyond total
        response = authenticated_client.get("/api/v1/tasks?limit=10&offset=10")

        assert response.status_code == 200
        data = response.json()
        assert data["error"] is None
        assert data["data"]["total"] == 5
        assert data["data"]["limit"] == 10
        assert data["data"]["offset"] == 10
        assert len(data["data"]["tasks"]) == 0

    def test_default_pagination_values(
        self,
        authenticated_client: TestClient,
        session: Session,
        mock_user_id: str
    ):
        """
        Test default pagination values (limit=50, offset=0).

        Given: User has 10 tasks
        When: GET /api/v1/tasks (no pagination params)
        Then: Returns 200 OK with limit=50, offset=0
        """
        # Create 10 tasks
        for i in range(10):
            task = Task(
                user_id=mock_user_id,
                title=f"Task {i+1}",
                completed=False,
                created_at=datetime.utcnow() - timedelta(minutes=i)
            )
            session.add(task)

        session.commit()

        # Request tasks without pagination params
        response = authenticated_client.get("/api/v1/tasks")

        assert response.status_code == 200
        data = response.json()
        assert data["error"] is None
        assert data["data"]["total"] == 10
        assert data["data"]["limit"] == 50  # Default limit
        assert data["data"]["offset"] == 0  # Default offset
        assert len(data["data"]["tasks"]) == 10


class TestPaginationWithFilters:
    """Test pagination combined with filters."""

    def test_pagination_with_status_filter(
        self,
        authenticated_client: TestClient,
        session: Session,
        mock_user_id: str
    ):
        """
        Test pagination works correctly with status filter.

        Given: User has 15 pending and 10 completed tasks
        When: GET /api/v1/tasks?status=Pending&limit=10&offset=5
        Then: Returns 10 pending tasks starting from position 5
        """
        # Create 15 pending tasks
        for i in range(15):
            task = Task(
                user_id=mock_user_id,
                title=f"Pending {i+1:02d}",
                completed=False,
                created_at=datetime.utcnow() - timedelta(minutes=25-i)
            )
            session.add(task)

        # Create 10 completed tasks
        for i in range(10):
            task = Task(
                user_id=mock_user_id,
                title=f"Completed {i+1}",
                completed=True,
                created_at=datetime.utcnow() - timedelta(minutes=10-i)
            )
            session.add(task)

        session.commit()

        # Request pending tasks with pagination
        response = authenticated_client.get(
            "/api/v1/tasks?status=Pending&limit=10&offset=5"
        )

        assert response.status_code == 200
        data = response.json()
        assert data["error"] is None
        assert data["data"]["total"] == 15  # Total pending tasks
        assert data["data"]["limit"] == 10
        assert data["data"]["offset"] == 5
        assert len(data["data"]["tasks"]) == 10

        # Verify all returned tasks are pending
        for task in data["data"]["tasks"]:
            assert task["completed"] is False
