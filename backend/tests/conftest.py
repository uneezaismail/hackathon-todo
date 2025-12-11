"""
Pytest configuration and shared fixtures for Todo API tests.

This module provides:
- Test database setup with SQLite in-memory
- Test client fixture for API testing
- Mock JWT authentication for authenticated endpoints
"""

import pytest
import os
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool
from typing import Generator, Dict, Any
from datetime import datetime, timedelta

# Set environment variables before importing app modules
# This ensures jwt.py and other modules don't fail on import
if "BETTER_AUTH_SECRET" not in os.environ:
    os.environ["BETTER_AUTH_SECRET"] = "test-secret-key-for-testing-minimum-32-characters-long"
if "DATABASE_URL" not in os.environ:
    os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from src.main import app
from src.db.session import get_session
from src.auth.dependencies import get_current_user_id


# Test database URL (SQLite in-memory for fast tests)
TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(name="engine")
def engine_fixture():
    """
    Create a test database engine.

    Uses SQLite in-memory database for fast, isolated tests.
    Each test gets a fresh database.

    Yields:
        Engine: SQLModel database engine
    """
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    yield engine
    SQLModel.metadata.drop_all(engine)


@pytest.fixture(name="session")
def session_fixture(engine) -> Generator[Session, None, None]:
    """
    Create a test database session.

    Provides a database session for tests that need direct DB access.
    Session is rolled back after each test for isolation.

    Args:
        engine: Test database engine from engine_fixture

    Yields:
        Session: SQLModel database session
    """
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session) -> Generator[TestClient, None, None]:
    """
    Create a test client with mocked database session.

    Provides a FastAPI TestClient for API endpoint testing.
    Overrides the database session dependency to use test database.

    Args:
        session: Test database session from session_fixture

    Yields:
        TestClient: FastAPI test client

    Example:
        def test_health_endpoint(client: TestClient):
            response = client.get("/api/health")
            assert response.status_code == 200
    """
    def override_get_session():
        return session

    app.dependency_overrides[get_session] = override_get_session

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture(name="mock_user_id")
def mock_user_id_fixture() -> str:
    """
    Mock user ID for authenticated tests.

    Returns:
        str: Mock user ID (Better Auth user ID format)

    Example:
        def test_create_task(client: TestClient, mock_user_id: str):
            # User is authenticated with this user_id
            response = client.post(f"/api/{mock_user_id}/tasks", ...)
    """
    return "test-user-123"


@pytest.fixture(name="authenticated_client")
def authenticated_client_fixture(
    client: TestClient,
    mock_user_id: str
) -> Generator[TestClient, None, None]:
    """
    Create a test client with mocked JWT authentication.

    Overrides the JWT dependency to return a mock user ID.
    Use this fixture for testing authenticated endpoints.

    Args:
        client: Test client from client_fixture
        mock_user_id: Mock user ID from mock_user_id_fixture

    Yields:
        TestClient: Authenticated test client

    Example:
        def test_list_tasks(authenticated_client: TestClient, mock_user_id: str):
            response = authenticated_client.get(f"/api/{mock_user_id}/tasks")
            assert response.status_code == 200
    """
    def override_get_current_user_id():
        return mock_user_id

    app.dependency_overrides[get_current_user_id] = override_get_current_user_id

    yield client

    app.dependency_overrides.clear()


@pytest.fixture(name="mock_jwt_payload")
def mock_jwt_payload_fixture(mock_user_id: str) -> Dict[str, Any]:
    """
    Mock JWT payload for testing token validation.

    Args:
        mock_user_id: Mock user ID from mock_user_id_fixture

    Returns:
        Dict[str, Any]: Mock JWT payload with standard claims

    Example:
        def test_jwt_validation(mock_jwt_payload: Dict[str, Any]):
            user_id = mock_jwt_payload["sub"]
            assert user_id == "test-user-123"
    """
    now = datetime.utcnow()
    return {
        "sub": mock_user_id,  # User ID (subject claim)
        "iat": int(now.timestamp()),  # Issued at
        "exp": int((now + timedelta(days=7)).timestamp()),  # Expires in 7 days
        "aud": "todo-app",  # Audience
        "iss": "better-auth",  # Issuer
    }


@pytest.fixture(name="mock_user_id_2")
def mock_user_id_2_fixture() -> str:
    """
    Second mock user ID for testing user isolation.

    Use this to test that users cannot access each other's data.

    Returns:
        str: Second mock user ID

    Example:
        def test_user_isolation(
            authenticated_client: TestClient,
            mock_user_id: str,
            mock_user_id_2: str
        ):
            # Create task as user 1
            response = authenticated_client.post(
                f"/api/{mock_user_id}/tasks",
                json={"title": "User 1 task"}
            )

            # Try to access as user 2 (should fail)
            response = authenticated_client.get(f"/api/{mock_user_id_2}/tasks")
            # Should not see user 1's tasks
    """
    return "test-user-456"
