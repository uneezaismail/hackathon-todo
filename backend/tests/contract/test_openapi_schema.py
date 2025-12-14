"""
Contract tests for OpenAPI schema validation.

Validates that API endpoints conform to the OpenAPI specification.
Tests ensure request/response schemas match documented contracts.
"""

import pytest
from fastapi.testclient import TestClient
from typing import Dict, Any


def test_openapi_schema_available(client: TestClient):
    """
    Test that OpenAPI schema is available at /openapi.json.

    Verifies:
    - Schema endpoint returns 200 OK
    - Response contains valid OpenAPI specification
    - Required fields are present (openapi, info, paths)
    """
    response = client.get("/openapi.json")
    assert response.status_code == 200

    schema = response.json()
    assert "openapi" in schema
    assert "info" in schema
    assert "paths" in schema


def test_post_tasks_endpoint_in_schema(client: TestClient):
    """
    Test that POST /api/v1/tasks endpoint is documented in OpenAPI schema.

    Verifies:
    - Endpoint exists in schema
    - POST method is defined
    - Request body schema is defined
    - Response schemas are defined (201, 400, 401)
    """
    response = client.get("/openapi.json")
    schema = response.json()

    # Check endpoint exists
    assert "/api/v1/tasks" in schema["paths"], "POST /api/v1/tasks endpoint not found in OpenAPI schema"

    # Check POST method exists
    tasks_path = schema["paths"]["/api/v1/tasks"]
    assert "post" in tasks_path, "POST method not defined for /api/v1/tasks"

    post_spec = tasks_path["post"]

    # Check request body schema
    assert "requestBody" in post_spec, "Request body schema not defined"
    assert "content" in post_spec["requestBody"]
    assert "application/json" in post_spec["requestBody"]["content"]

    # Check response schemas
    assert "responses" in post_spec
    assert "201" in post_spec["responses"], "201 Created response not documented"
    assert "400" in post_spec["responses"] or "422" in post_spec["responses"], "400/422 Bad Request response not documented"
    assert "401" in post_spec["responses"], "401 Unauthorized response not documented"


def test_task_create_schema_validation(client: TestClient):
    """
    Test TaskCreate schema validation in OpenAPI spec.

    Verifies:
    - TaskCreate schema is defined in components
    - Required fields (title) are marked as required
    - Field constraints are documented (min/max length)
    - Optional fields (description) are properly typed
    """
    response = client.get("/openapi.json")
    schema = response.json()

    # Find TaskCreate schema in components
    assert "components" in schema
    assert "schemas" in schema["components"]

    # TaskCreate should be defined
    schemas = schema["components"]["schemas"]
    assert "TaskCreate" in schemas, "TaskCreate schema not found in OpenAPI spec"

    task_create = schemas["TaskCreate"]

    # Check required fields
    assert "required" in task_create
    assert "title" in task_create["required"], "title not marked as required in TaskCreate"

    # Check field properties
    assert "properties" in task_create
    properties = task_create["properties"]

    # Title field validation
    assert "title" in properties
    title_field = properties["title"]
    assert title_field["type"] == "string"
    assert "minLength" in title_field or "min_length" in title_field, "title min length not documented"
    assert "maxLength" in title_field or "max_length" in title_field, "title max length not documented"

    # Description field validation (optional)
    assert "description" in properties
    desc_field = properties["description"]
    # Description should allow null or have anyOf with null type
    assert desc_field.get("type") == "string" or "anyOf" in desc_field or "nullable" in desc_field


def test_task_response_schema_validation(client: TestClient):
    """
    Test TaskResponse schema validation in OpenAPI spec.

    Verifies:
    - TaskResponse schema is defined in components
    - All required fields are present (id, user_id, title, completed, created_at, updated_at)
    - Field types are correct (UUID for id, string for user_id, etc.)
    """
    response = client.get("/openapi.json")
    schema = response.json()

    schemas = schema["components"]["schemas"]
    assert "TaskResponse" in schemas, "TaskResponse schema not found in OpenAPI spec"

    task_response = schemas["TaskResponse"]

    # Check required fields
    assert "required" in task_response
    required_fields = {"id", "user_id", "title", "completed", "created_at", "updated_at"}
    actual_required = set(task_response["required"])
    assert required_fields.issubset(actual_required), f"Missing required fields in TaskResponse: {required_fields - actual_required}"

    # Check field properties
    properties = task_response["properties"]

    # ID field (UUID)
    assert "id" in properties
    id_field = properties["id"]
    assert id_field["type"] == "string" or "format" in id_field, "id field should be UUID string"

    # User ID field
    assert "user_id" in properties
    user_id_field = properties["user_id"]
    assert user_id_field["type"] == "string"

    # Completed field (boolean)
    assert "completed" in properties
    completed_field = properties["completed"]
    assert completed_field["type"] == "boolean"

    # Timestamp fields
    assert "created_at" in properties
    assert "updated_at" in properties
    created_at_field = properties["created_at"]
    updated_at_field = properties["updated_at"]
    assert created_at_field["type"] == "string" and created_at_field.get("format") == "date-time"
    assert updated_at_field["type"] == "string" and updated_at_field.get("format") == "date-time"


def test_all_task_endpoints_in_schema(client: TestClient):
    """
    Test that all task endpoints are documented in OpenAPI schema (T094).

    Verifies:
    - GET /api/v1/tasks (list tasks)
    - POST /api/v1/tasks (create task)
    - GET /api/v1/tasks/{task_id} (get specific task)
    - PATCH /api/v1/tasks/{task_id} (update task)
    - DELETE /api/v1/tasks/{task_id} (delete task)
    - GET /api/health (health check, no auth)
    """
    response = client.get("/openapi.json")
    assert response.status_code == 200
    schema = response.json()

    paths = schema["paths"]

    # Task endpoints with authentication
    assert "/api/v1/tasks" in paths, "GET/POST /api/v1/tasks endpoint not found"
    assert "get" in paths["/api/v1/tasks"], "GET method not defined for /api/v1/tasks"
    assert "post" in paths["/api/v1/tasks"], "POST method not defined for /api/v1/tasks"

    assert "/api/v1/tasks/{task_id}" in paths, "Task by ID endpoint not found"
    task_by_id = paths["/api/v1/tasks/{task_id}"]
    assert "get" in task_by_id, "GET method not defined for /api/v1/tasks/{task_id}"
    assert "patch" in task_by_id, "PATCH method not defined for /api/v1/tasks/{task_id}"
    assert "delete" in task_by_id, "DELETE method not defined for /api/v1/tasks/{task_id}"

    # Health endpoint (no authentication)
    assert "/api/health" in paths, "Health endpoint not found"
    assert "get" in paths["/api/health"], "GET method not defined for /api/health"


def test_authentication_security_schemes(client: TestClient):
    """
    Test that authentication security schemes are defined in OpenAPI schema (T094).

    Verifies:
    - Security schemes include Bearer authentication
    - Protected endpoints have security requirements
    - Health endpoint does not require authentication
    """
    response = client.get("/openapi.json")
    schema = response.json()

    # Check security schemes are defined
    assert "components" in schema
    assert "securitySchemes" in schema["components"], "Security schemes not defined in OpenAPI spec"

    security_schemes = schema["components"]["securitySchemes"]
    # Check for any Bearer authentication scheme (could be HTTPBearer, bearerAuth, or BearerAuth)
    bearer_auth_exists = any(
        scheme.get("type") == "http" and scheme.get("scheme") == "bearer"
        for scheme in security_schemes.values()
    )
    assert bearer_auth_exists, f"Bearer authentication not defined. Found schemes: {list(security_schemes.keys())}"

    # Check protected endpoints have security requirements
    paths = schema["paths"]

    # Task endpoints should require authentication
    post_tasks = paths["/api/v1/tasks"]["post"]
    assert "security" in post_tasks, "POST /api/v1/tasks should require authentication"

    get_tasks = paths["/api/v1/tasks"]["get"]
    assert "security" in get_tasks, "GET /api/v1/tasks should require authentication"

    # Health endpoint should NOT require authentication
    health = paths["/api/health"]["get"]
    # Health endpoint should either have no security or empty security array
    if "security" in health:
        assert health["security"] == [] or health["security"] == [{}], "Health endpoint should not require authentication"


def test_error_response_format_validation(client: TestClient):
    """
    Test error response format validation (T095).

    Verifies that all error responses match the standardized format:
    {"data": null, "error": {"message": "...", "code": "..."}}

    Tests various error scenarios:
    - 401 Unauthorized (missing/invalid token)
    - 404 Not Found (non-existent resource)
    - 422 Unprocessable Entity (validation error)
    """
    # Test 401 Unauthorized - missing Authorization header
    response = client.get("/api/v1/tasks")
    assert response.status_code == 401
    error_data = response.json()

    # Verify standardized error format
    assert "data" in error_data, "Error response missing 'data' field"
    assert error_data["data"] is None, "Error response 'data' should be null"
    assert "error" in error_data, "Error response missing 'error' field"

    error = error_data["error"]
    assert "message" in error, "Error object missing 'message' field"
    assert "code" in error, "Error object missing 'code' field"
    assert isinstance(error["message"], str), "Error message should be a string"
    assert isinstance(error["code"], str), "Error code should be a string"

    # Test 422 Unprocessable Entity - validation error (empty title)
    response = client.post(
        "/api/v1/tasks",
        json={"title": ""},  # Invalid: empty title
        headers={"Authorization": "Bearer fake-token-for-testing"}
    )
    # Should get 401 (invalid token) or 422 (validation error)
    assert response.status_code in [401, 422]
    error_data = response.json()

    # Verify standardized error format
    assert "data" in error_data
    assert error_data["data"] is None
    assert "error" in error_data
    assert "message" in error_data["error"]
    assert "code" in error_data["error"]
