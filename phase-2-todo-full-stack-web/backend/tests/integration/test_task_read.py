"""
Integration tests for task read operations (GET endpoints).

Tests verify that:
- GET /api/v1/tasks returns only authenticated user's tasks
- GET /api/v1/tasks/{id} returns task with valid ID (200 OK)
- GET /api/v1/tasks/{id} returns 404 for non-existent task
- Pagination and filtering work correctly
- Privacy guarantee: users only see their own tasks
"""

import pytest
from fastapi.testclient import TestClient
from uuid import uuid4


# T051: Integration test for GET /api/v1/tasks returning tasks for authenticated user only
def test_get_tasks_list_authenticated_user(authenticated_client: TestClient, session, mock_user_id: str):
    """
    Test that GET /api/v1/tasks returns only authenticated user's tasks.

    Setup:
    - Create 3 tasks for authenticated user

    Expected:
    - HTTP 200 OK
    - Response contains all 3 tasks
    - All tasks belong to authenticated user
    - Standardized response format: {"data": {...}, "error": null}
    """
    from src.services.task_service import TaskService
    from src.schemas.task import TaskCreate

    # Create 3 tasks for authenticated user
    created_tasks = []
    for i in range(3):
        task_create = TaskCreate(
            title=f"Task {i+1}",
            description=f"Description for task {i+1}"
        )
        task = TaskService.create_task(session, mock_user_id, task_create)
        created_tasks.append(task)

    # Request tasks list
    response = authenticated_client.get("/api/v1/tasks")

    # Verify 200 OK
    assert response.status_code == 200, (
        f"Expected 200 OK, got {response.status_code}: {response.json()}"
    )

    # Verify response format
    data = response.json()
    assert "data" in data, "Expected data field in response"
    assert data.get("error") is None, "Expected error to be null"

    # Verify response structure
    response_data = data["data"]
    assert "tasks" in response_data, "Expected tasks array in response"
    assert "total" in response_data, "Expected total count in response"
    assert "limit" in response_data, "Expected limit in response"
    assert "offset" in response_data, "Expected offset in response"

    # Verify all 3 tasks are returned
    tasks = response_data["tasks"]
    assert len(tasks) == 3, (
        f"Expected 3 tasks, got {len(tasks)}"
    )

    # Verify all tasks belong to authenticated user
    for task in tasks:
        assert task["user_id"] == mock_user_id, (
            f"Expected task to belong to {mock_user_id}, got {task['user_id']}"
        )

    # Verify task IDs match created tasks
    returned_ids = {task["id"] for task in tasks}
    created_ids = {str(task.id) for task in created_tasks}
    assert returned_ids == created_ids, (
        "Returned task IDs should match created task IDs"
    )


# T052: Integration test for GET /api/v1/tasks/{id} with valid task ID → 200 OK
def test_get_task_by_id_valid_task(authenticated_client: TestClient, session, mock_user_id: str):
    """
    Test that GET /api/v1/tasks/{id} returns task with valid ID.

    Setup:
    - Create a task for authenticated user

    Expected:
    - HTTP 200 OK
    - Response contains correct task data
    - Task belongs to authenticated user
    - Standardized response format: {"data": {...}, "error": null}
    """
    from src.services.task_service import TaskService
    from src.schemas.task import TaskCreate

    # Create a task
    task_create = TaskCreate(
        title="Test Task",
        description="Test Description"
    )
    created_task = TaskService.create_task(session, mock_user_id, task_create)
    task_id = created_task.id

    # Request task by ID
    response = authenticated_client.get(f"/api/v1/tasks/{task_id}")

    # Verify 200 OK
    assert response.status_code == 200, (
        f"Expected 200 OK, got {response.status_code}: {response.json()}"
    )

    # Verify response format
    data = response.json()
    assert "data" in data, "Expected data field in response"
    assert data.get("error") is None, "Expected error to be null"

    # Verify task data
    task = data["data"]
    assert task["id"] == str(task_id), (
        f"Expected task ID {task_id}, got {task['id']}"
    )
    assert task["user_id"] == mock_user_id, (
        f"Expected user_id {mock_user_id}, got {task['user_id']}"
    )
    assert task["title"] == "Test Task", (
        f"Expected title 'Test Task', got {task['title']}"
    )
    assert task["description"] == "Test Description", (
        f"Expected description 'Test Description', got {task['description']}"
    )
    assert task["completed"] == False, (
        "Expected completed to be False for new task"
    )
    assert "created_at" in task, "Expected created_at timestamp"
    assert "updated_at" in task, "Expected updated_at timestamp"


# T053: Integration test for GET /api/v1/tasks/{id} with non-existent task ID → 404 Not Found
def test_get_task_by_id_nonexistent_task(authenticated_client: TestClient, mock_user_id: str):
    """
    Test that GET /api/v1/tasks/{id} returns 404 for non-existent task.

    Setup:
    - Generate a random UUID that doesn't exist in database

    Expected:
    - HTTP 404 Not Found
    - Error response format: {"data": null, "error": {...}}
    - Error message indicates task not found
    """
    # Generate a random UUID that doesn't exist
    nonexistent_task_id = uuid4()

    # Request non-existent task
    response = authenticated_client.get(f"/api/v1/tasks/{nonexistent_task_id}")

    # Verify 404 Not Found
    assert response.status_code == 404, (
        f"Expected 404 Not Found, got {response.status_code}: {response.json()}"
    )

    # Verify error response format
    data = response.json()
    assert data.get("data") is None, "Expected data to be null for error"
    assert "error" in data, "Expected error field in response"

    # Verify error message
    error = data.get("error", {})
    assert "message" in error, "Expected error message"
    assert "code" in error, "Expected error code"

    error_message = error.get("message", "").lower()
    assert "not found" in error_message or "does not exist" in error_message, (
        f"Expected error about task not found, got: {error_message}"
    )


# Additional test: Pagination parameters
def test_get_tasks_with_pagination(authenticated_client: TestClient, session, mock_user_id: str):
    """
    Test that GET /api/v1/tasks supports pagination parameters.

    Setup:
    - Create 10 tasks for authenticated user

    Expected:
    - limit parameter controls max tasks returned
    - offset parameter controls which tasks to skip
    - total reflects total count of user's tasks
    """
    from src.services.task_service import TaskService
    from src.schemas.task import TaskCreate

    # Create 10 tasks
    for i in range(10):
        task_create = TaskCreate(
            title=f"Task {i+1}",
            description=f"Description {i+1}"
        )
        TaskService.create_task(session, mock_user_id, task_create)

    # Test 1: limit=5, offset=0 (first 5 tasks)
    response = authenticated_client.get("/api/v1/tasks?limit=5&offset=0")
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]["tasks"]) == 5, "Expected 5 tasks with limit=5"
    assert data["data"]["total"] == 10, "Expected total=10"
    assert data["data"]["limit"] == 5
    assert data["data"]["offset"] == 0

    # Test 2: limit=5, offset=5 (next 5 tasks)
    response = authenticated_client.get("/api/v1/tasks?limit=5&offset=5")
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]["tasks"]) == 5, "Expected 5 tasks with offset=5"
    assert data["data"]["total"] == 10
    assert data["data"]["limit"] == 5
    assert data["data"]["offset"] == 5

    # Test 3: limit=3, offset=0 (first 3 tasks)
    response = authenticated_client.get("/api/v1/tasks?limit=3&offset=0")
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]["tasks"]) == 3, "Expected 3 tasks with limit=3"
    assert data["data"]["limit"] == 3


# Additional test: Filter by completed status
def test_get_tasks_filter_by_completed(authenticated_client: TestClient, session, mock_user_id: str):
    """
    Test that GET /api/v1/tasks supports filtering by completed status.

    Setup:
    - Create 3 pending tasks
    - Create 2 completed tasks

    Expected:
    - completed=false returns only pending tasks
    - completed=true returns only completed tasks
    - No filter returns all tasks
    """
    from src.services.task_service import TaskService
    from src.schemas.task import TaskCreate, TaskUpdate

    # Create 3 pending tasks
    for i in range(3):
        task_create = TaskCreate(
            title=f"Pending Task {i+1}",
            description="Not completed"
        )
        TaskService.create_task(session, mock_user_id, task_create)

    # Create 2 completed tasks
    for i in range(2):
        task_create = TaskCreate(
            title=f"Completed Task {i+1}",
            description="Completed"
        )
        task = TaskService.create_task(session, mock_user_id, task_create)
        # Mark as completed
        task_update = TaskUpdate(completed=True)
        TaskService.update_task(session, task.id, mock_user_id, task_update)

    # Test 1: Filter for pending tasks (status=Pending)
    response = authenticated_client.get("/api/v1/tasks?status=Pending")
    assert response.status_code == 200
    data = response.json()
    pending_tasks = data["data"]["tasks"]
    assert len(pending_tasks) == 3, "Expected 3 pending tasks"
    for task in pending_tasks:
        assert task["completed"] == False, "All tasks should be pending"

    # Test 2: Filter for completed tasks (status=Completed)
    response = authenticated_client.get("/api/v1/tasks?status=Completed")
    assert response.status_code == 200
    data = response.json()
    completed_tasks = data["data"]["tasks"]
    assert len(completed_tasks) == 2, "Expected 2 completed tasks"
    for task in completed_tasks:
        assert task["completed"] == True, "All tasks should be completed"

    # Test 3: No filter (all tasks)
    response = authenticated_client.get("/api/v1/tasks")
    assert response.status_code == 200
    data = response.json()
    all_tasks = data["data"]["tasks"]
    assert len(all_tasks) == 5, "Expected all 5 tasks (3 pending + 2 completed)"


# Additional test: Empty task list
def test_get_tasks_empty_list(authenticated_client: TestClient, mock_user_id: str):
    """
    Test that GET /api/v1/tasks returns empty list when user has no tasks.

    Expected:
    - HTTP 200 OK
    - Empty tasks array
    - total = 0
    """
    response = authenticated_client.get("/api/v1/tasks")

    # Verify 200 OK (not 404)
    assert response.status_code == 200, (
        f"Expected 200 OK for empty list, got {response.status_code}"
    )

    # Verify response format
    data = response.json()
    assert "data" in data
    assert data.get("error") is None

    # Verify empty list
    response_data = data["data"]
    assert response_data["tasks"] == [], "Expected empty tasks array"
    assert response_data["total"] == 0, "Expected total=0 for empty list"
