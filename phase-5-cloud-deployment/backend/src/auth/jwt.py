"""
JWT token validation using python-jose with shared BETTER_AUTH_SECRET.

This module provides JWT verification for tokens issued by Better Auth (Next.js frontend).
Uses HS256 symmetric signing algorithm with shared secret key.

Security:
- Validates token signature using BETTER_AUTH_SECRET
- Verifies token expiration (exp claim)
- Extracts user_id from 'sub' claim
- Raises appropriate exceptions for invalid/expired tokens
"""

from dotenv import load_dotenv
from jose import jwt, JWTError
from typing import Dict, Any
import os

load_dotenv()
# JWT configuration - shared secret with Next.js Better Auth
SECRET_KEY = os.getenv("BETTER_AUTH_SECRET")
if not SECRET_KEY:
    raise ValueError("BETTER_AUTH_SECRET environment variable is required")

ALGORITHM = "HS256"  # Symmetric signing algorithm


def verify_jwt_token(token: str) -> Dict[str, Any]:
    """
    Verify JWT token using shared secret from Better Auth (Next.js).

    This validates tokens issued by Better Auth using the shared BETTER_AUTH_SECRET.
    Uses HS256 algorithm for symmetric signature verification.

    Args:
        token (str): JWT token string from Authorization header

    Returns:
        Dict[str, Any]: Decoded JWT payload containing:
            - sub (str): User ID
            - exp (int): Expiration timestamp
            - iat (int): Issued at timestamp
            - iss (str): Issuer (optional)
            - aud (str): Audience (optional)
            - Other claims from Better Auth

    Raises:
        ValueError: If token is invalid, expired, or missing required claims

    Example:
        >>> token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        >>> payload = verify_jwt_token(token)
        >>> user_id = payload["sub"]
    """
    try:
        # Decode and verify JWT signature with shared secret
        # Optional: validate issuer and audience for added security
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
            options={
                # Make issuer and audience validation optional (don't require them in payload)
                "verify_iss": False,
                "verify_aud": False,
            },
        )

        # Validate required claims exist
        if "sub" not in payload:
            raise ValueError("Token missing 'sub' claim (user_id)")

        # Optional: Validate issuer if present (for additional security)
        if "iss" in payload and payload["iss"] != "nextjs-frontend":
            raise ValueError(f"Invalid token issuer: {payload['iss']}")

        # Optional: Validate audience if present (for additional security)
        if "aud" in payload and payload["aud"] != "fastapi-backend":
            raise ValueError(f"Invalid token audience: {payload['aud']}")

        return payload

    except JWTError as e:
        # Handle JWT-specific errors (expired, invalid signature, etc.)
        raise ValueError(f"Invalid JWT token: {str(e)}")
    except Exception as e:
        # Handle any other unexpected errors
        raise ValueError(f"Token validation failed: {str(e)}")


def extract_user_id(payload: Dict[str, Any]) -> str:
    """
    Extract user_id from decoded JWT payload.

    Args:
        payload (Dict[str, Any]): Decoded JWT payload from verify_jwt_token()

    Returns:
        str: User ID from 'sub' claim

    Raises:
        ValueError: If 'sub' claim is missing or invalid

    Example:
        >>> payload = verify_jwt_token(token)
        >>> user_id = extract_user_id(payload)
    """
    user_id = payload.get("sub")
    if not user_id:
        raise ValueError("Invalid token: missing user_id in 'sub' claim")

    if not isinstance(user_id, str):
        raise ValueError("Invalid token: user_id must be a string")

    return user_id
