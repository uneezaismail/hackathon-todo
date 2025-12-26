#!/bin/bash
# Run authentication tests for Phase 3 User Story 5

cd "$(dirname "$0")"

echo "Running Integration Tests (T023-T027)..."
echo "=========================================="
PYTHONPATH=. .venv/bin/python -m pytest tests/integration/test_auth.py -v --tb=short

echo ""
echo "Running Unit Tests (T031-T033)..."
echo "================================="
PYTHONPATH=. .venv/bin/python -m pytest tests/unit/test_jwt_validation.py -v --tb=short

echo ""
echo "=========================================="
echo "All authentication tests complete!"
