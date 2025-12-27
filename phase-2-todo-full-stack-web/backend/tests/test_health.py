"""
Test health check endpoint.

This test verifies the health check endpoint works without authentication.
"""

import pytest
from fastapi.testclient import TestClient


def test_health_endpoint_returns_healthy_status(client: TestClient):
    """Test health endpoint returns 200 OK with healthy status."""
    response = client.get("/api/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data


def test_root_endpoint_returns_api_info(client: TestClient):
    """Test root endpoint returns API information."""
    response = client.get("/")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert data["message"] == "Todo API - Phase 2 Backend"
    assert data["docs"] == "/docs"
    assert data["health"] == "/api/health"
