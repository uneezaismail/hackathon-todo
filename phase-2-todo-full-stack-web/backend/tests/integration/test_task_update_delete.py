"""
Integration tests for Task Update and Delete operations (User Story 4).

Tests PATCH and DELETE endpoints with:
- T075-T083: Integration tests for update and delete operations

CRITICAL SECURITY:
- All operations validate that task belongs to authenticated user
- Cross-user attempts return 404 Not Found (privacy protection, not 403)
- Empty title validation returns 400 Bad Request

RED-GREEN-REFACTOR:
- These tests should FAIL initially (RED phase)
- Implementation will make them pass (GREEN phase)
- Service layer unit tests follow (REFACTOR phase)
"""

import pytest
from fastapi.testclient import TestClient
from uuid import UUID


class TestTaskUpdate:
    """
    Integration tests for PATCH /api/v1/tasks/{id} endpoint.

    Tests T075-T080:
    - T075: Update title → 200 OK
    - T076: Update description → 200 OK
    - T077: Mark completed → 200 OK
    - T078: Empty title → 400 Bad Request
    - T079: Non-existent task → 404 Not Found
    - T080: Other user's task → 404 Not Found (privacy protection)
    """

    def test_update_task_title_returns_200(
        self,
        authenticated_client: TestClient,
        mock_user_id: str
    ):
        """
        T075: Test PATCH /api/v1/tasks/{id} updating title → 200 OK with updated task.

        Scenario:
        1. Create a task with initial title
        2. Update the task with new title
        3. Verify response is 200 OK with updated title
        4. Verify updated_at timestamp changed
        """
        # Create initial task
        create_response = authenticated_client.post(
            "/api/v1/tasks",
            json={
                "title": "Original Title",
                "description": "Original description"
            }
        )
        assert create_response.status_code == 201
        task_data = create_response.json()["data"]
        task_id = task_data["id"]
        original_updated_at = task_data["updated_at"]

        # Update task title
        update_response = authenticated_client.patch(
            f"/api/v1/tasks/{task_id}",
            json={"title": "Updated Title"}
        )

        # Verify response
        assert update_response.status_code == 200
        response_data = update_response.json()

        # Verify response format
        assert "data" in response_data
        assert "error" in response_data
        assert response_data["error"] is None

        # Verify updated task data
        updated_task = response_data["data"]
        assert updated_task["id"] == task_id
        assert updated_task["user_id"] == mock_user_id
        assert updated_task["title"] == "Updated Title"
        assert updated_task["description"] == "Original description"  # Unchanged
        assert updated_task["completed"] is False  # Unchanged
        assert updated_task["updated_at"] != original_updated_at  # Timestamp changed

    def test_update_task_description_returns_200(
        self,
        authenticated_client: TestClient,
        mock_user_id: str
    ):
        """
        T076: Test PATCH /api/v1/tasks/{id} updating description → 200 OK.

        Scenario:
        1. Create a task with initial description
        2. Update the task with new description
        3. Verify response is 200 OK with updated description
        """
        # Create initial task
        create_response = authenticated_client.post(
            "/api/v1/tasks",
            json={
                "title": "Test Task",
                "description": "Original description"
            }
        )
        assert create_response.status_code == 201
        task_id = create_response.json()["data"]["id"]

        # Update task description
        update_response = authenticated_client.patch(
            f"/api/v1/tasks/{task_id}",
            json={"description": "Updated description"}
        )

        # Verify response
        assert update_response.status_code == 200
        response_data = update_response.json()

        # Verify updated task data
        updated_task = response_data["data"]
        assert updated_task["title"] == "Test Task"  # Unchanged
        assert updated_task["description"] == "Updated description"
        assert updated_task["completed"] is False  # Unchanged

    def test_update_task_mark_completed_returns_200(
        self,
        authenticated_client: TestClient,
        mock_user_id: str
    ):
        """
        T077: Test PATCH /api/v1/tasks/{id} marking completed=true → 200 OK.

        Scenario:
        1. Create a task (default: completed=false)
        2. Update the task to mark it as completed
        3. Verify response is 200 OK with completed=true
        """
        # Create initial task (default: completed=false)
        create_response = authenticated_client.post(
            "/api/v1/tasks",
            json={
                "title": "Task to complete",
                "description": "This task will be marked as done"
            }
        )
        assert create_response.status_code == 201
        task_id = create_response.json()["data"]["id"]

        # Mark task as completed
        update_response = authenticated_client.patch(
            f"/api/v1/tasks/{task_id}",
            json={"completed": True}
        )

        # Verify response
        assert update_response.status_code == 200
        response_data = update_response.json()

        # Verify completed status
        updated_task = response_data["data"]
        assert updated_task["completed"] is True
        assert updated_task["title"] == "Task to complete"  # Unchanged
        assert updated_task["description"] == "This task will be marked as done"  # Unchanged

    def test_update_task_empty_title_returns_400(
        self,
        authenticated_client: TestClient,
        mock_user_id: str
    ):
        """
        T078: Test PATCH /api/v1/tasks/{id} with empty title → 400 Bad Request.

        Scenario:
        1. Create a task
        2. Attempt to update with empty title
        3. Verify response is 400 Bad Request with validation error
        """
        # Create initial task
        create_response = authenticated_client.post(
            "/api/v1/tasks",
            json={
                "title": "Valid Title",
                "description": "Valid description"
            }
        )
        assert create_response.status_code == 201
        task_id = create_response.json()["data"]["id"]

        # Attempt to update with empty title
        update_response = authenticated_client.patch(
            f"/api/v1/tasks/{task_id}",
            json={"title": ""}
        )

        # Verify response
        assert update_response.status_code == 422  # FastAPI validation error
        response_data = update_response.json()

        # Verify error format (standardized API error format)
        assert "data" in response_data
        assert "error" in response_data
        assert response_data["data"] is None
        assert response_data["error"] is not None

        # Check that validation error mentions title
        error_message = response_data["error"]["message"].lower()
        assert "title" in error_message
        assert "validation" in error_message or "character" in error_message

    def test_update_nonexistent_task_returns_404(
        self,
        authenticated_client: TestClient,
        mock_user_id: str
    ):
        """
        T079: Test PATCH /api/v1/tasks/{id} for non-existent task → 404 Not Found.

        Scenario:
        1. Attempt to update a task that doesn't exist
        2. Verify response is 404 Not Found
        """
        # Use a UUID that doesn't exist
        nonexistent_id = "550e8400-e29b-41d4-a716-446655440000"

        # Attempt to update non-existent task
        update_response = authenticated_client.patch(
            f"/api/v1/tasks/{nonexistent_id}",
            json={"title": "Updated Title"}
        )

        # Verify response
        assert update_response.status_code == 404
        response_data = update_response.json()

        # Verify error format
        assert "data" in response_data
        assert "error" in response_data
        assert response_data["data"] is None
        assert response_data["error"] is not None
        assert "not found" in response_data["error"]["message"].lower()

    def test_update_other_user_task_returns_404(
        self,
        authenticated_client: TestClient,
        mock_user_id: str,
        session
    ):
        """
        T080: Test PATCH /api/v1/tasks/{id} for other user's task → 404 Not Found.

        CRITICAL SECURITY: Privacy protection - return 404 (not 403) to prevent
        information leakage about task existence.

        Scenario:
        1. Create a task as user A (using authenticated_client)
        2. Override authentication to user B
        3. Attempt to update user A's task as user B
        4. Verify response is 404 Not Found (privacy protection)
        """
        from src.main import app
        from src.auth.dependencies import get_current_user_id

        # Create task as user A
        create_response = authenticated_client.post(
            "/api/v1/tasks",
            json={
                "title": "User A's Task",
                "description": "This belongs to user A"
            }
        )
        assert create_response.status_code == 201
        task_id = create_response.json()["data"]["id"]

        # Switch to user B
        user_b_id = "test-user-456"
        def override_get_current_user_id():
            return user_b_id

        app.dependency_overrides[get_current_user_id] = override_get_current_user_id

        try:
            # Attempt to update user A's task as user B
            update_response = authenticated_client.patch(
                f"/api/v1/tasks/{task_id}",
                json={"title": "User B trying to update"}
            )

            # Verify response is 404 (privacy protection)
            assert update_response.status_code == 404
            response_data = update_response.json()

            # Verify error format
            assert response_data["data"] is None
            assert response_data["error"] is not None
            assert "not found" in response_data["error"]["message"].lower()
        finally:
            # Restore original authentication
            app.dependency_overrides.clear()


class TestTaskDelete:
    """
    Integration tests for DELETE /api/v1/tasks/{id} endpoint.

    Tests T081-T083:
    - T081: Delete task → 204 No Content
    - T082: Delete non-existent task → 404 Not Found
    - T083: Verify task no longer in list after deletion
    """

    def test_delete_task_returns_204(
        self,
        authenticated_client: TestClient,
        mock_user_id: str
    ):
        """
        T081: Test DELETE /api/v1/tasks/{id} → 204 No Content.

        Scenario:
        1. Create a task
        2. Delete the task
        3. Verify response is 204 No Content
        """
        # Create task
        create_response = authenticated_client.post(
            "/api/v1/tasks",
            json={
                "title": "Task to delete",
                "description": "This task will be deleted"
            }
        )
        assert create_response.status_code == 201
        task_id = create_response.json()["data"]["id"]

        # Delete task
        delete_response = authenticated_client.delete(
            f"/api/v1/tasks/{task_id}"
        )

        # Verify response
        assert delete_response.status_code == 204
        # 204 No Content should have empty body
        assert delete_response.text == ""

    def test_delete_nonexistent_task_returns_404(
        self,
        authenticated_client: TestClient,
        mock_user_id: str
    ):
        """
        T082: Test DELETE /api/v1/tasks/{id} for non-existent task → 404 Not Found.

        Scenario:
        1. Attempt to delete a task that doesn't exist
        2. Verify response is 404 Not Found
        """
        # Use a UUID that doesn't exist
        nonexistent_id = "550e8400-e29b-41d4-a716-446655440000"

        # Attempt to delete non-existent task
        delete_response = authenticated_client.delete(
            f"/api/v1/tasks/{nonexistent_id}"
        )

        # Verify response
        assert delete_response.status_code == 404
        response_data = delete_response.json()

        # Verify error format
        assert "data" in response_data
        assert "error" in response_data
        assert response_data["data"] is None
        assert response_data["error"] is not None
        assert "not found" in response_data["error"]["message"].lower()

    def test_delete_verification_task_not_in_list(
        self,
        authenticated_client: TestClient,
        mock_user_id: str
    ):
        """
        T083: Test DELETE verification - task no longer appears in GET /api/v1/tasks list.

        Scenario:
        1. Create two tasks
        2. Delete one task
        3. List all tasks
        4. Verify deleted task is not in the list
        5. Verify other task is still in the list
        """
        # Create two tasks
        create_response_1 = authenticated_client.post(
            "/api/v1/tasks",
            json={
                "title": "Task to keep",
                "description": "This task stays"
            }
        )
        assert create_response_1.status_code == 201
        task_1_id = create_response_1.json()["data"]["id"]

        create_response_2 = authenticated_client.post(
            "/api/v1/tasks",
            json={
                "title": "Task to delete",
                "description": "This task will be deleted"
            }
        )
        assert create_response_2.status_code == 201
        task_2_id = create_response_2.json()["data"]["id"]

        # Verify both tasks exist in list
        list_response_before = authenticated_client.get("/api/v1/tasks")
        assert list_response_before.status_code == 200
        tasks_before = list_response_before.json()["data"]["tasks"]
        assert len(tasks_before) == 2
        task_ids_before = [task["id"] for task in tasks_before]
        assert task_1_id in task_ids_before
        assert task_2_id in task_ids_before

        # Delete task 2
        delete_response = authenticated_client.delete(
            f"/api/v1/tasks/{task_2_id}"
        )
        assert delete_response.status_code == 204

        # Verify task 2 is no longer in list
        list_response_after = authenticated_client.get("/api/v1/tasks")
        assert list_response_after.status_code == 200
        tasks_after = list_response_after.json()["data"]["tasks"]
        assert len(tasks_after) == 1
        task_ids_after = [task["id"] for task in tasks_after]

        # Verify task 1 is still in list
        assert task_1_id in task_ids_after
        # Verify task 2 is not in list
        assert task_2_id not in task_ids_after

        # Verify attempting to GET deleted task returns 404
        get_response = authenticated_client.get(
            f"/api/v1/tasks/{task_2_id}"
        )
        assert get_response.status_code == 404
