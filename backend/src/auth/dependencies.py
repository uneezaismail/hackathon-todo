"""
FastAPI authentication dependencies for JWT validation.

Provides dependency injection functions for extracting and validating
JWT tokens from Authorization header in API endpoints.

Security:
- HTTPBearer security scheme for Authorization header
- Validates JWT token signature using shared secret
- Extracts user_id from token for authorization checks
- Raises HTTPException 401 for authentication failures
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any
from .jwt import verify_jwt_token, extract_user_id


# HTTPBearer security scheme for Authorization header with Bearer token
# This tells FastAPI to expect: Authorization: Bearer <token>
security = HTTPBearer(
    scheme_name="BearerAuth",
    description="JWT token from Better Auth (Next.js)",
    auto_error=True  # Automatically raise 401 if Authorization header is missing
)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """
    FastAPI dependency to get current user from JWT token.

    Extracts token from Authorization header, validates signature using
    shared BETTER_AUTH_SECRET, and returns decoded payload.

    Args:
        credentials: HTTPAuthorizationCredentials from HTTPBearer security scheme

    Returns:
        Dict[str, Any]: Decoded JWT payload containing user information

    Raises:
        HTTPException 401: If token is missing, invalid, or expired

    Example usage in endpoint:
        @app.get("/api/{user_id}/tasks")
        async def list_tasks(
            user_id: str,
            current_user: Dict[str, Any] = Depends(get_current_user)
        ):
            # Validate user_id matches token
            if user_id != current_user["sub"]:
                raise HTTPException(403, "Not authorized")
            # ... endpoint logic
    """
    try:
        # Extract token from credentials
        token = credentials.credentials

        # Verify JWT signature and decode payload
        payload = verify_jwt_token(token)

        return payload

    except ValueError as e:
        # Token validation failed (invalid, expired, missing claims)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        # Unexpected error during token validation
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user_id(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> str:
    """
    FastAPI dependency to get current user ID from JWT token.

    Extracts user_id from the 'sub' claim of the decoded JWT payload.
    This is the primary dependency to use in endpoints requiring authentication.

    CRITICAL: All endpoints MUST validate that this user_id matches the user_id
    in the URL path to ensure proper user data isolation.

    Args:
        current_user: Decoded JWT payload from get_current_user dependency

    Returns:
        str: User ID from 'sub' claim

    Raises:
        HTTPException 401: If 'sub' claim is missing or invalid

    Example usage in endpoint:
        @app.get("/api/{user_id}/tasks")
        async def list_tasks(
            user_id: str,
            current_user_id: str = Depends(get_current_user_id)
        ):
            # CRITICAL: Validate user_id matches token
            if user_id != current_user_id:
                raise HTTPException(
                    status_code=403,
                    detail="Not authorized to access this user's tasks"
                )
            # ... endpoint logic
    """
    try:
        user_id = extract_user_id(current_user)
        return user_id

    except ValueError as e:
        # Missing or invalid user_id in token
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
