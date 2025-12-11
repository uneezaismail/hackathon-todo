"""
Authentication module for JWT validation and user authorization.

This module provides JWT token validation for the FastAPI backend using
shared secret (BETTER_AUTH_SECRET) with the Next.js Better Auth frontend.

Public API:
- verify_jwt_token: Validate JWT token and return payload
- extract_user_id: Extract user_id from JWT payload
- get_current_user: FastAPI dependency for current user
- get_current_user_id: FastAPI dependency for current user ID
- security: HTTPBearer security scheme

Example usage:
    from src.auth import get_current_user_id

    @router.get("/api/{user_id}/tasks")
    async def list_tasks(
        user_id: str,
        current_user_id: str = Depends(get_current_user_id)
    ):
        # Validate user_id matches JWT token
        if user_id != current_user_id:
            raise HTTPException(403, "Not authorized")
        # ... endpoint logic
"""

from .jwt import verify_jwt_token, extract_user_id
from .dependencies import get_current_user, get_current_user_id, security

__all__ = [
    "verify_jwt_token",
    "extract_user_id",
    "get_current_user",
    "get_current_user_id",
    "security",
]
