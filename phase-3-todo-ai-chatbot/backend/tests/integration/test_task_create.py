"""
Integration tests for task creation endpoint (User Story 1).

Tests POST /api/v1/tasks endpoint with various scenarios:
- Successful task creation with title and description
- Task creation with title only (no description)
- Validation errors (empty title, title too long)
- Authentication enforcement (missing JWT token)

All tests use authenticated_client fixture which mocks JWT authentication.
"""

import pytest
from fastapi.testclient import TestClient
from uuid import UUID


def test_create_task_with_title_and_description(
    authenticated_client: TestClient,
    mock_user_id: str
):
    """
    T035: Test successful task creation with title and description.

    Given: Authenticated user with valid JWT token
    When: POST /api/v1/tasks with title and description
    Then: Returns 201 Created with task data including id, user_id, timestamps

    Validates:
    - HTTP status code 201 Created
    - Response contains task with all fields
    - user_id matches authenticated user
    - completed defaults to False
    - created_at and updated_at are present
    - Location header is set
    """
    task_data = {
        "title": "Complete project documentation",
        "description": "Write comprehensive README and API documentation for the project",
    }

    response = authenticated_client.post("/api/v1/tasks", json=task_data)

    # Should return 201 Created
    assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.json()}"

    # Validate response format
    response_json = response.json()
    assert "data" in response_json, "Response missing 'data' field"
    assert "error" in response_json, "Response missing 'error' field"
    assert response_json["error"] is None, "Error field should be null for successful response"

    task = response_json["data"]

    # Validate task fields
    assert "id" in task, "Task missing 'id' field"
    assert "user_id" in task, "Task missing 'user_id' field"
    assert "title" in task, "Task missing 'title' field"
    assert "description" in task, "Task missing 'description' field"
    assert "completed" in task, "Task missing 'completed' field"
    assert "created_at" in task, "Task missing 'created_at' field"
    assert "updated_at" in task, "Task missing 'updated_at' field"

    # Validate field values
    assert task["title"] == task_data["title"]
    assert task["description"] == task_data["description"]
    assert task["user_id"] == mock_user_id, "user_id should match authenticated user"
    assert task["completed"] is False, "completed should default to False"

    # Validate UUID format
    try:
        UUID(task["id"])
    except ValueError:
        pytest.fail(f"Task id '{task['id']}' is not a valid UUID")

    # Validate timestamps are present (ISO 8601 format)
    assert "T" in task["created_at"], "created_at should be ISO 8601 format"
    assert "T" in task["updated_at"], "updated_at should be ISO 8601 format"

    # Validate Location header
    assert "Location" in response.headers or "location" in response.headers, "Location header should be set"


def test_create_task_with_title_only(
    authenticated_client: TestClient,
    mock_user_id: str
):
    """
    T036: Test successful task creation with title only (no description).

    Given: Authenticated user with valid JWT token
    When: POST /api/v1/tasks with title only
    Then: Returns 201 Created with task data, description is null

    Validates:
    - HTTP status code 201 Created
    - Description field is null
    - All other fields are properly populated
    """
    task_data = {
        "title": "Quick task without description",
    }

    response = authenticated_client.post("/api/v1/tasks", json=task_data)

    # Should return 201 Created
    assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.json()}"

    response_json = response.json()
    assert response_json["error"] is None

    task = response_json["data"]

    # Validate field values
    assert task["title"] == task_data["title"]
    assert task["description"] is None, "Description should be null when not provided"
    assert task["user_id"] == mock_user_id
    assert task["completed"] is False


def test_create_task_with_empty_title(
    authenticated_client: TestClient
):
    """
    T037: Test task creation with empty title returns 400 Bad Request.

    Given: Authenticated user with valid JWT token
    When: POST /api/v1/tasks with empty title
    Then: Returns 400 Bad Request (or 422 Unprocessable Entity)

    Validates:
    - HTTP status code 400 or 422
    - Error response format
    - Error message indicates validation failure
    """
    task_data = {
        "title": "",  # Empty title
        "description": "This task has an empty title",
    }

    response = authenticated_client.post("/api/v1/tasks", json=task_data)

    # Should return 400 Bad Request or 422 Unprocessable Entity
    assert response.status_code in [400, 422], f"Expected 400/422, got {response.status_code}"

    # Validate error response format
    response_json = response.json()
    assert "data" in response_json
    assert "error" in response_json
    assert response_json["data"] is None, "Data field should be null for error response"
    assert response_json["error"] is not None, "Error field should be present"

    # Error should mention validation failure
    error = response_json["error"]
    assert "message" in error or "detail" in error, "Error should have message or detail"


def test_create_task_with_title_too_long(
    authenticated_client: TestClient
):
    """
    T038: Test task creation with title >200 chars returns 400 Bad Request.

    Given: Authenticated user with valid JWT token
    When: POST /api/v1/tasks with title exceeding 200 characters
    Then: Returns 400 Bad Request (or 422 Unprocessable Entity)

    Validates:
    - HTTP status code 400 or 422
    - Error response format
    - Error message indicates validation failure for title length
    """
    task_data = {
        "title": "A" * 201,  # 201 characters (exceeds max of 200)
        "description": "This task has a title that is too long",
    }

    response = authenticated_client.post("/api/v1/tasks", json=task_data)

    # Should return 400 Bad Request or 422 Unprocessable Entity
    assert response.status_code in [400, 422], f"Expected 400/422, got {response.status_code}"

    # Validate error response format
    response_json = response.json()
    assert "data" in response_json
    assert "error" in response_json
    assert response_json["data"] is None
    assert response_json["error"] is not None


def test_create_task_without_jwt_token(
    client: TestClient  # Note: Using non-authenticated client
):
    """
    T039: Test task creation without JWT token returns 401 Unauthorized.

    Given: Request without JWT token in Authorization header
    When: POST /api/v1/tasks
    Then: Returns 401 Unauthorized

    Validates:
    - HTTP status code 401
    - Error response format
    - WWW-Authenticate header is present
    """
    task_data = {
        "title": "Attempt to create task without authentication",
        "description": "This should fail with 401 Unauthorized",
    }

    response = client.post("/api/v1/tasks", json=task_data)

    # Should return 401 Unauthorized
    assert response.status_code == 401, f"Expected 401, got {response.status_code}"

    # Validate error response format
    response_json = response.json()
    assert "data" in response_json
    assert "error" in response_json
    assert response_json["data"] is None
    assert response_json["error"] is not None

    # WWW-Authenticate header should be present
    assert "WWW-Authenticate" in response.headers or "www-authenticate" in response.headers


def test_create_task_with_description_too_long(
    authenticated_client: TestClient
):
    """
    Additional test: Task creation with description >1000 chars returns 400 Bad Request.

    Given: Authenticated user with valid JWT token
    When: POST /api/v1/tasks with description exceeding 1000 characters
    Then: Returns 400 Bad Request (or 422 Unprocessable Entity)

    Validates:
    - HTTP status code 400 or 422
    - Error response format
    """
    task_data = {
        "title": "Task with very long description",
        "description": "D" * 1001,  # 1001 characters (exceeds max of 1000)
    }

    response = authenticated_client.post("/api/v1/tasks", json=task_data)

    # Should return 400 Bad Request or 422 Unprocessable Entity
    assert response.status_code in [400, 422], f"Expected 400/422, got {response.status_code}"

    response_json = response.json()
    assert response_json["data"] is None
    assert response_json["error"] is not None


def test_create_task_missing_title_field(
    authenticated_client: TestClient
):
    """
    Additional test: Task creation without title field returns 400 Bad Request.

    Given: Authenticated user with valid JWT token
    When: POST /api/v1/tasks without title field
    Then: Returns 400 Bad Request (or 422 Unprocessable Entity)

    Validates:
    - HTTP status code 400 or 422
    - Error indicates missing required field
    """
    task_data = {
        "description": "Task without title field",
    }

    response = authenticated_client.post("/api/v1/tasks", json=task_data)

    # Should return 400 Bad Request or 422 Unprocessable Entity
    assert response.status_code in [400, 422], f"Expected 400/422, got {response.status_code}"

    response_json = response.json()
    assert response_json["data"] is None
    assert response_json["error"] is not None
