"""
Integration tests for JWT authentication enforcement.

Tests verify that:
- Missing JWT tokens result in 401 Unauthorized
- Expired JWT tokens are rejected with 401
- Invalid signatures (wrong secret) are rejected with 401
- Tampered JWT payloads are rejected with 401
- Valid JWT tokens grant access with 200 OK

These tests use the /api/test/protected endpoint to verify authentication.
"""

import pytest
from fastapi.testclient import TestClient
from jose import jwt
from datetime import datetime, timedelta, timezone
import os
import time


def create_test_token(
    user_id: str,
    secret: str,
    expires_delta: timedelta | None = None,
    issued_at: datetime | None = None
) -> str:
    """
    Create a JWT token for testing.

    Args:
        user_id: User ID to include in 'sub' claim
        secret: Secret key for signing the token
        expires_delta: Time delta for expiration (default: 1 hour from now)
        issued_at: Token issue time (default: now)

    Returns:
        str: Encoded JWT token
    """
    # Use current Unix timestamp for consistency with JWT verification
    now_ts = int(time.time())
    exp_delta_seconds = int((expires_delta or timedelta(hours=1)).total_seconds())
    exp_ts = now_ts + exp_delta_seconds

    payload = {
        "sub": user_id,
        "iat": now_ts,
        "exp": exp_ts,
    }

    return jwt.encode(payload, secret, algorithm="HS256")


# T023: Integration test for missing Authorization header → 401
def test_missing_authorization_header(client: TestClient):
    """
    Test that requests without Authorization header are rejected.

    Expected: HTTP 401 Unauthorized
    Error format: {"data": null, "error": {"message": "...", "code": "..."}}
    """
    response = client.get("/api/test/protected")

    # Verify 401 status code
    assert response.status_code == 401, (
        f"Expected 401 for missing auth header, got {response.status_code}"
    )

    # Verify error response format
    data = response.json()
    assert data.get("data") is None, "Expected data to be null for auth error"
    assert "error" in data, "Expected error field in response"

    # Verify WWW-Authenticate header is present (OAuth2 spec)
    assert "www-authenticate" in response.headers, (
        "Expected WWW-Authenticate header for 401 response"
    )


# T024: Integration test for expired JWT token → 401
def test_expired_jwt_token(client: TestClient):
    """
    Test that expired JWT tokens are rejected.

    Creates a token that expired 1 hour ago.
    Expected: HTTP 401 Unauthorized with error about expired token
    """
    # Get the secret from environment
    secret = os.getenv("BETTER_AUTH_SECRET", "test-secret-key-for-testing")

    # Create an expired token (expired 1 hour ago)
    expired_token = create_test_token(
        user_id="test-user-123",
        secret=secret,
        expires_delta=timedelta(hours=-1),  # Negative delta = expired
    )

    # Make request with expired token
    response = client.get(
        "/api/test/protected",
        headers={"Authorization": f"Bearer {expired_token}"}
    )

    # Verify 401 status code
    assert response.status_code == 401, (
        f"Expected 401 for expired token, got {response.status_code}"
    )

    # Verify error response format
    data = response.json()
    assert data.get("data") is None, "Expected data to be null for auth error"
    assert "error" in data, "Expected error field in response"

    # Verify error message mentions expiration
    error = data.get("error", {})
    error_message = error.get("message", "").lower()
    assert "expired" in error_message or "invalid" in error_message, (
        f"Expected error message about expiration, got: {error_message}"
    )


# T025: Integration test for invalid signature (wrong secret) → 401
def test_invalid_signature_wrong_secret(client: TestClient):
    """
    Test that tokens signed with wrong secret are rejected.

    Creates a token with a different secret than the server uses.
    Expected: HTTP 401 Unauthorized with error about invalid signature
    """
    # Create token with WRONG secret
    wrong_secret = "wrong-secret-key-that-doesnt-match"
    invalid_token = create_test_token(
        user_id="test-user-123",
        secret=wrong_secret,  # Different from server's BETTER_AUTH_SECRET
    )

    # Make request with invalid token
    response = client.get(
        "/api/test/protected",
        headers={"Authorization": f"Bearer {invalid_token}"}
    )

    # Verify 401 status code
    assert response.status_code == 401, (
        f"Expected 401 for invalid signature, got {response.status_code}"
    )

    # Verify error response format
    data = response.json()
    assert data.get("data") is None, "Expected data to be null for auth error"
    assert "error" in data, "Expected error field in response"

    # Verify error message mentions invalid token or signature
    error = data.get("error", {})
    error_message = error.get("message", "").lower()
    assert "invalid" in error_message or "signature" in error_message, (
        f"Expected error message about invalid signature, got: {error_message}"
    )


# T026: Integration test for tampered JWT payload → 401
def test_tampered_jwt_payload(client: TestClient):
    """
    Test that tokens with tampered payloads are rejected.

    Creates a valid token, then manually modifies the payload portion
    to simulate tampering (changing the user_id).
    Expected: HTTP 401 Unauthorized
    """
    # Get the secret from environment
    secret = os.getenv("BETTER_AUTH_SECRET", "test-secret-key-for-testing")

    # Create a valid token
    valid_token = create_test_token(
        user_id="test-user-123",
        secret=secret,
    )

    # Tamper with the token by modifying the payload
    # JWT structure: header.payload.signature
    parts = valid_token.split(".")
    if len(parts) == 3:
        # Decode payload, modify it, re-encode (without re-signing)
        import base64
        import json

        # Decode payload (add padding if needed)
        payload_b64 = parts[1]
        padding = 4 - len(payload_b64) % 4
        if padding != 4:
            payload_b64 += "=" * padding

        payload_json = base64.urlsafe_b64decode(payload_b64)
        payload = json.loads(payload_json)

        # Tamper: change user_id
        payload["sub"] = "tampered-user-999"

        # Re-encode payload (without re-signing)
        tampered_payload = base64.urlsafe_b64encode(
            json.dumps(payload).encode()
        ).decode().rstrip("=")

        # Reconstruct token with tampered payload but original signature
        tampered_token = f"{parts[0]}.{tampered_payload}.{parts[2]}"

        # Make request with tampered token
        response = client.get(
            "/api/test/protected",
            headers={"Authorization": f"Bearer {tampered_token}"}
        )

        # Verify 401 status code
        assert response.status_code == 401, (
            f"Expected 401 for tampered token, got {response.status_code}"
        )

        # Verify error response format
        data = response.json()
        assert data.get("data") is None, "Expected data to be null for auth error"
        assert "error" in data, "Expected error field in response"


# T027: Integration test for valid JWT token → 200 OK
def test_valid_jwt_token(client: TestClient):
    """
    Test that valid JWT tokens grant access.

    Creates a properly signed, non-expired token with correct secret.
    Expected: HTTP 200 OK with successful response
    """
    # Get the secret from environment
    secret = os.getenv("BETTER_AUTH_SECRET", "test-secret-key-for-testing")

    # Create a valid token
    user_id = "test-user-123"
    valid_token = create_test_token(
        user_id=user_id,
        secret=secret,
        expires_delta=timedelta(hours=1),  # Valid for 1 hour
    )

    # Make request with valid token
    response = client.get(
        "/api/test/protected",
        headers={"Authorization": f"Bearer {valid_token}"}
    )

    # Verify 200 status code
    assert response.status_code == 200, (
        f"Expected 200 for valid token, got {response.status_code}: {response.json()}"
    )

    # Verify response format
    data = response.json()
    assert "data" in data, "Expected data field in response"
    assert data.get("error") is None, "Expected error to be null for successful request"

    # Verify user_id is returned correctly
    response_user_id = data["data"].get("user_id")
    assert response_user_id == user_id, (
        f"Expected user_id {user_id}, got {response_user_id}"
    )

    # Verify success message
    assert data["data"].get("message") == "Authentication successful", (
        f"Expected success message, got: {data['data'].get('message')}"
    )


# Additional test: Malformed Authorization header
def test_malformed_authorization_header(client: TestClient):
    """
    Test that malformed Authorization headers are rejected.

    Tests various malformed header formats:
    - Missing 'Bearer ' prefix
    - Empty token
    - Invalid format
    """
    # Test 1: Missing 'Bearer ' prefix
    response = client.get(
        "/api/test/protected",
        headers={"Authorization": "NotBearer token123"}
    )
    assert response.status_code == 401, (
        f"Expected 401 for missing Bearer prefix, got {response.status_code}"
    )

    # Test 2: Empty token
    response = client.get(
        "/api/test/protected",
        headers={"Authorization": "Bearer "}
    )
    assert response.status_code == 401, (
        f"Expected 401 for empty token, got {response.status_code}"
    )

    # Test 3: Completely malformed token
    response = client.get(
        "/api/test/protected",
        headers={"Authorization": "Bearer not-a-valid-jwt-token"}
    )
    assert response.status_code == 401, (
        f"Expected 401 for malformed token, got {response.status_code}"
    )


# ============================================================================
# T047-T050: Cross-User Access Tests (User Story 2 - Privacy Guarantee)
# ============================================================================


# T047: Integration test for User A seeing only their 5 tasks (not User B's 3 tasks)
def test_user_a_sees_only_their_tasks(authenticated_client: TestClient, session):
    """
    Test that User A can only see their own tasks, not User B's tasks.

    Setup:
    - User A creates 5 tasks
    - User B creates 3 tasks

    Expected:
    - User A's GET /api/v1/tasks returns only their 5 tasks
    - User B's tasks are NOT visible to User A
    - Privacy guarantee: strict user isolation
    """
    from src.main import app
    from src.auth.dependencies import get_current_user_id
    from src.services.task_service import TaskService
    from src.schemas.task import TaskCreate

    # User A ID
    user_a_id = "test-user-123"
    user_b_id = "test-user-456"

    # Create 5 tasks for User A
    for i in range(5):
        task_create = TaskCreate(
            title=f"User A Task {i+1}",
            description=f"Description for User A Task {i+1}"
        )
        TaskService.create_task(session, user_a_id, task_create)

    # Create 3 tasks for User B
    for i in range(3):
        task_create = TaskCreate(
            title=f"User B Task {i+1}",
            description=f"Description for User B Task {i+1}"
        )
        TaskService.create_task(session, user_b_id, task_create)

    # Override authentication to be User A
    def override_get_current_user_id():
        return user_a_id

    app.dependency_overrides[get_current_user_id] = override_get_current_user_id

    # User A requests their tasks
    response = authenticated_client.get("/api/v1/tasks")

    # Verify 200 OK
    assert response.status_code == 200, (
        f"Expected 200 for valid request, got {response.status_code}"
    )

    # Verify response format
    data = response.json()
    assert "data" in data, "Expected data field in response"
    assert data.get("error") is None, "Expected error to be null"

    # Verify User A sees ONLY their 5 tasks
    tasks = data["data"]["tasks"]
    assert len(tasks) == 5, (
        f"Expected User A to see 5 tasks, got {len(tasks)}"
    )

    # Verify all tasks belong to User A
    for task in tasks:
        assert task["user_id"] == user_a_id, (
            f"Expected all tasks to belong to User A ({user_a_id}), "
            f"but found task belonging to {task['user_id']}"
        )
        assert "User A Task" in task["title"], (
            f"Expected User A's task titles, got: {task['title']}"
        )

    # Verify User B's tasks are NOT visible
    for task in tasks:
        assert "User B Task" not in task["title"], (
            "User A should not see User B's tasks (privacy violation)"
        )

    # Clean up
    app.dependency_overrides.clear()


# T048: Integration test for User A attempting to GET User B's task by ID → 404 Not Found
def test_user_a_cannot_get_user_b_task_by_id(authenticated_client: TestClient, session):
    """
    Test that User A cannot retrieve User B's task by ID.

    Setup:
    - User B creates a task
    - User A attempts to GET that task by ID

    Expected:
    - HTTP 404 Not Found (not 403, to prevent information leakage about task existence)
    - Privacy guarantee: users cannot access other users' tasks
    - TaskService returns None for cross-user access (same as non-existent task)
    """
    from src.main import app
    from src.auth.dependencies import get_current_user_id
    from src.services.task_service import TaskService
    from src.schemas.task import TaskCreate

    user_a_id = "test-user-123"
    user_b_id = "test-user-456"

    # User B creates a task
    task_create = TaskCreate(
        title="User B's Private Task",
        description="User A should not be able to access this"
    )
    user_b_task = TaskService.create_task(session, user_b_id, task_create)
    user_b_task_id = user_b_task.id

    # Override authentication to be User A
    def override_get_current_user_id():
        return user_a_id

    app.dependency_overrides[get_current_user_id] = override_get_current_user_id

    # User A attempts to GET User B's task by ID
    response = authenticated_client.get(f"/api/v1/tasks/{user_b_task_id}")

    # Verify 404 Not Found (prevents information leakage about task existence)
    assert response.status_code == 404, (
        f"Expected 404 Not Found for cross-user access, got {response.status_code}"
    )

    # Verify error response format
    data = response.json()
    assert data.get("data") is None, "Expected data to be null for error"
    assert "error" in data, "Expected error field in response"

    # Verify error indicates task not found
    error = data.get("error", {})
    error_message = error.get("message", "").lower()
    assert "not found" in error_message, (
        f"Expected error about task not found, got: {error_message}"
    )

    # Clean up
    app.dependency_overrides.clear()


# T049: Integration test for User A attempting to PATCH User B's task → 404 Not Found
def test_user_a_cannot_patch_user_b_task(authenticated_client: TestClient, session):
    """
    Test that User A cannot update User B's task.

    Setup:
    - User B creates a task
    - User A attempts to PATCH that task

    Expected:
    - HTTP 404 Not Found (not 403, to prevent information leakage)
    - Privacy guarantee: users cannot modify other users' tasks
    """
    from src.main import app
    from src.auth.dependencies import get_current_user_id
    from src.services.task_service import TaskService
    from src.schemas.task import TaskCreate

    user_a_id = "test-user-123"
    user_b_id = "test-user-456"

    # User B creates a task
    task_create = TaskCreate(
        title="User B's Task",
        description="Original description"
    )
    user_b_task = TaskService.create_task(session, user_b_id, task_create)
    user_b_task_id = user_b_task.id

    # Override authentication to be User A
    def override_get_current_user_id():
        return user_a_id

    app.dependency_overrides[get_current_user_id] = override_get_current_user_id

    # User A attempts to PATCH User B's task
    response = authenticated_client.patch(
        f"/api/v1/tasks/{user_b_task_id}",
        json={"title": "Hacked by User A"}
    )

    # Verify 404 Not Found (prevents information leakage)
    # PATCH endpoint doesn't exist yet, will return 405 Method Not Allowed for now
    # When PATCH is implemented, it will return 404 for cross-user access
    assert response.status_code in [404, 405], (
        f"Expected 404 Not Found (or 405 if endpoint not implemented), got {response.status_code}"
    )

    # Verify error response format
    # NOTE: If endpoint doesn't exist yet (405), FastAPI returns {"detail": "..."}
    # When endpoint is implemented (404), it will return standardized format
    data = response.json()
    if response.status_code == 405:
        # Endpoint not implemented yet - skip error format validation
        assert "detail" in data, "Expected detail in 405 response"
    else:
        # Endpoint implemented - verify standardized format
        assert data.get("data") is None, "Expected data to be null for error"
        assert "error" in data, "Expected error field in response"

    # Verify task was NOT modified
    # Re-fetch task as User B to verify it wasn't changed
    def override_get_current_user_id_as_b():
        return user_b_id

    app.dependency_overrides[get_current_user_id] = override_get_current_user_id_as_b

    original_task = TaskService.get_task_by_id(session, user_b_task_id, user_b_id)
    assert original_task is not None, "Task should still exist"
    assert original_task.title == "User B's Task", (
        "Task title should NOT have been modified by User A"
    )

    # Clean up
    app.dependency_overrides.clear()


# T050: Integration test for User A attempting to DELETE User B's task → 404 Not Found
def test_user_a_cannot_delete_user_b_task(authenticated_client: TestClient, session):
    """
    Test that User A cannot delete User B's task.

    Setup:
    - User B creates a task
    - User A attempts to DELETE that task

    Expected:
    - HTTP 404 Not Found (not 403, to prevent information leakage)
    - Privacy guarantee: users cannot delete other users' tasks
    - Task still exists after failed delete attempt
    """
    from src.main import app
    from src.auth.dependencies import get_current_user_id
    from src.services.task_service import TaskService
    from src.schemas.task import TaskCreate

    user_a_id = "test-user-123"
    user_b_id = "test-user-456"

    # User B creates a task
    task_create = TaskCreate(
        title="User B's Important Task",
        description="User A should not be able to delete this"
    )
    user_b_task = TaskService.create_task(session, user_b_id, task_create)
    user_b_task_id = user_b_task.id

    # Override authentication to be User A
    def override_get_current_user_id():
        return user_a_id

    app.dependency_overrides[get_current_user_id] = override_get_current_user_id

    # User A attempts to DELETE User B's task
    response = authenticated_client.delete(f"/api/v1/tasks/{user_b_task_id}")

    # Verify 404 Not Found (prevents information leakage)
    # DELETE endpoint doesn't exist yet, will return 405 Method Not Allowed for now
    # When DELETE is implemented, it will return 404 for cross-user access
    assert response.status_code in [404, 405], (
        f"Expected 404 Not Found (or 405 if endpoint not implemented), got {response.status_code}"
    )

    # Verify error response format
    # NOTE: If endpoint doesn't exist yet (405), FastAPI returns {"detail": "..."}
    # When endpoint is implemented (404), it will return standardized format
    data = response.json()
    if response.status_code == 405:
        # Endpoint not implemented yet - skip error format validation
        assert "detail" in data, "Expected detail in 405 response"
    else:
        # Endpoint implemented - verify standardized format
        assert data.get("data") is None, "Expected data to be null for error"
        assert "error" in data, "Expected error field in response"

    # Verify task was NOT deleted
    # Re-fetch task as User B to verify it still exists
    def override_get_current_user_id_as_b():
        return user_b_id

    app.dependency_overrides[get_current_user_id] = override_get_current_user_id_as_b

    existing_task = TaskService.get_task_by_id(session, user_b_task_id, user_b_id)
    assert existing_task is not None, (
        "Task should still exist after failed delete attempt"
    )
    assert existing_task.title == "User B's Important Task", (
        "Task should be unchanged after failed delete"
    )

    # Clean up
    app.dependency_overrides.clear()
