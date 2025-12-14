"""
Unit tests for JWT validation functions.

Tests verify that:
- verify_jwt_token() correctly decodes valid tokens
- verify_jwt_token() raises ValueError for expired tokens
- verify_jwt_token() raises ValueError for invalid signatures
- extract_user_id() correctly extracts user_id from payload
- extract_user_id() raises ValueError for missing/invalid user_id

These tests focus on the JWT validation logic in isolation.
"""

import pytest
from jose import jwt
from datetime import datetime, timedelta, timezone
import os
import time

from src.auth.jwt import verify_jwt_token, extract_user_id


def create_test_token(
    user_id: str,
    secret: str,
    expires_delta: timedelta | None = None,
    issued_at: datetime | None = None,
    include_sub: bool = True
) -> str:
    """
    Create a JWT token for testing.

    Args:
        user_id: User ID to include in 'sub' claim
        secret: Secret key for signing the token
        expires_delta: Time delta for expiration (default: 1 hour from now)
        issued_at: Token issue time (default: now)
        include_sub: Whether to include 'sub' claim (for testing missing claim)

    Returns:
        str: Encoded JWT token
    """
    # Use current Unix timestamp for consistency with JWT verification
    now_ts = int(time.time())
    exp_delta_seconds = int((expires_delta or timedelta(hours=1)).total_seconds())
    exp_ts = now_ts + exp_delta_seconds

    payload = {
        "iat": now_ts,
        "exp": exp_ts,
    }

    if include_sub:
        payload["sub"] = user_id

    return jwt.encode(payload, secret, algorithm="HS256")


# T031: Unit test for JWT decode with valid token
def test_verify_jwt_token_with_valid_token():
    """
    Test that verify_jwt_token() correctly decodes valid tokens.

    Creates a valid token and verifies:
    - Function returns decoded payload
    - Payload contains expected claims (sub, iat, exp)
    - No exceptions are raised
    """
    # Get the secret from environment
    secret = os.getenv("BETTER_AUTH_SECRET", "test-secret-key-for-testing")

    # Create a valid token
    user_id = "test-user-123"
    token = create_test_token(
        user_id=user_id,
        secret=secret,
        expires_delta=timedelta(hours=1),
    )

    # Verify token decoding
    payload = verify_jwt_token(token)

    # Verify payload structure
    assert isinstance(payload, dict), "Expected payload to be a dictionary"

    # Verify required claims exist
    assert "sub" in payload, "Expected 'sub' claim in payload"
    assert "iat" in payload, "Expected 'iat' claim in payload"
    assert "exp" in payload, "Expected 'exp' claim in payload"

    # Verify user_id is correct
    assert payload["sub"] == user_id, (
        f"Expected user_id {user_id}, got {payload['sub']}"
    )

    # Verify timestamps are valid integers
    assert isinstance(payload["iat"], int), "Expected iat to be an integer timestamp"
    assert isinstance(payload["exp"], int), "Expected exp to be an integer timestamp"

    # Verify expiration is in the future
    assert payload["exp"] > time.time(), (
        "Expected expiration to be in the future"
    )


# T032: Unit test for JWT decode with expired token
def test_verify_jwt_token_with_expired_token():
    """
    Test that verify_jwt_token() raises ValueError for expired tokens.

    Creates a token that expired 1 hour ago and verifies:
    - ValueError is raised
    - Error message mentions expiration or invalid token
    """
    # Get the secret from environment
    secret = os.getenv("BETTER_AUTH_SECRET", "test-secret-key-for-testing")

    # Create an expired token (expired 1 hour ago)
    expired_token = create_test_token(
        user_id="test-user-123",
        secret=secret,
        expires_delta=timedelta(hours=-1),  # Negative delta = expired
    )

    # Verify that ValueError is raised
    with pytest.raises(ValueError) as exc_info:
        verify_jwt_token(expired_token)

    # Verify error message mentions expiration or invalid token
    error_message = str(exc_info.value).lower()
    assert "expired" in error_message or "invalid" in error_message, (
        f"Expected error message about expiration, got: {error_message}"
    )


# T033: Unit test for JWT decode with invalid signature
def test_verify_jwt_token_with_invalid_signature():
    """
    Test that verify_jwt_token() raises ValueError for invalid signatures.

    Creates a token with wrong secret and verifies:
    - ValueError is raised
    - Error message mentions invalid token or signature
    """
    # Get the correct secret from environment
    correct_secret = os.getenv("BETTER_AUTH_SECRET", "test-secret-key-for-testing")

    # Create token with WRONG secret
    wrong_secret = "wrong-secret-key-that-doesnt-match"
    invalid_token = create_test_token(
        user_id="test-user-123",
        secret=wrong_secret,  # Different from BETTER_AUTH_SECRET
    )

    # Verify that ValueError is raised when validating with correct secret
    with pytest.raises(ValueError) as exc_info:
        verify_jwt_token(invalid_token)

    # Verify error message mentions invalid token or signature
    error_message = str(exc_info.value).lower()
    assert "invalid" in error_message or "signature" in error_message, (
        f"Expected error message about invalid signature, got: {error_message}"
    )


# Additional unit test: Missing 'sub' claim
def test_verify_jwt_token_with_missing_sub_claim():
    """
    Test that verify_jwt_token() raises ValueError for tokens missing 'sub' claim.

    Creates a token without the 'sub' claim and verifies:
    - ValueError is raised
    - Error message mentions missing 'sub' claim
    """
    # Get the secret from environment
    secret = os.getenv("BETTER_AUTH_SECRET", "test-secret-key-for-testing")

    # Create token WITHOUT 'sub' claim
    token_without_sub = create_test_token(
        user_id="test-user-123",
        secret=secret,
        include_sub=False,  # Don't include 'sub' claim
    )

    # Verify that ValueError is raised
    with pytest.raises(ValueError) as exc_info:
        verify_jwt_token(token_without_sub)

    # Verify error message mentions missing 'sub' claim
    error_message = str(exc_info.value).lower()
    assert "sub" in error_message or "user_id" in error_message, (
        f"Expected error message about missing 'sub' claim, got: {error_message}"
    )


# Unit test for extract_user_id with valid payload
def test_extract_user_id_with_valid_payload():
    """
    Test that extract_user_id() correctly extracts user_id from payload.

    Creates a valid payload and verifies:
    - Function returns correct user_id
    - No exceptions are raised
    """
    user_id = "test-user-123"
    now_ts = int(time.time())
    payload = {
        "sub": user_id,
        "iat": now_ts,
        "exp": now_ts + 3600,
    }

    # Extract user_id
    extracted_user_id = extract_user_id(payload)

    # Verify user_id is correct
    assert extracted_user_id == user_id, (
        f"Expected user_id {user_id}, got {extracted_user_id}"
    )


# Unit test for extract_user_id with missing 'sub' claim
def test_extract_user_id_with_missing_sub():
    """
    Test that extract_user_id() raises ValueError for missing 'sub' claim.

    Creates a payload without 'sub' and verifies:
    - ValueError is raised
    - Error message mentions missing user_id
    """
    now_ts = int(time.time())
    payload = {
        "iat": now_ts,
        "exp": now_ts + 3600,
        # Missing 'sub' claim
    }

    # Verify that ValueError is raised
    with pytest.raises(ValueError) as exc_info:
        extract_user_id(payload)

    # Verify error message mentions missing user_id
    error_message = str(exc_info.value).lower()
    assert "user_id" in error_message or "sub" in error_message, (
        f"Expected error message about missing user_id, got: {error_message}"
    )


# Unit test for extract_user_id with invalid type
def test_extract_user_id_with_invalid_type():
    """
    Test that extract_user_id() raises ValueError for non-string user_id.

    Creates a payload with integer 'sub' and verifies:
    - ValueError is raised
    - Error message mentions invalid user_id type
    """
    now_ts = int(time.time())
    payload = {
        "sub": 12345,  # Integer instead of string
        "iat": now_ts,
        "exp": now_ts + 3600,
    }

    # Verify that ValueError is raised
    with pytest.raises(ValueError) as exc_info:
        extract_user_id(payload)

    # Verify error message mentions invalid user_id type
    error_message = str(exc_info.value).lower()
    assert "string" in error_message or "type" in error_message or "user_id" in error_message, (
        f"Expected error message about invalid user_id type, got: {error_message}"
    )


# Unit test for verify_jwt_token with malformed token
def test_verify_jwt_token_with_malformed_token():
    """
    Test that verify_jwt_token() raises ValueError for malformed tokens.

    Tests with completely malformed token strings and verifies:
    - ValueError is raised
    - Error message indicates invalid token
    """
    malformed_tokens = [
        "not.a.jwt",
        "completely-invalid-token",
        "",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature",
    ]

    for malformed_token in malformed_tokens:
        # Verify that ValueError is raised
        with pytest.raises(ValueError) as exc_info:
            verify_jwt_token(malformed_token)

        # Verify error message indicates invalid token
        error_message = str(exc_info.value).lower()
        assert "invalid" in error_message or "failed" in error_message, (
            f"Expected error message about invalid token, got: {error_message}"
        )
