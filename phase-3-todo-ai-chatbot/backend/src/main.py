"""
FastAPI application entry point.

Main application instance with:
- CORS middleware configuration for Next.js frontend
- Health check endpoint
- Global exception handlers for standardized error responses
"""

from fastapi import FastAPI, Request, status, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from datetime import datetime
import logging

from .config import get_settings
from .services.exceptions import TaskNotFoundError, UnauthorizedError
from .schemas.common import ErrorResponse
from .auth.dependencies import get_current_user_id
from .api.v1 import tasks, chatkit
# Note: chat module not imported since it's disabled (see line 73)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get application settings
settings = get_settings()

# Create FastAPI application instance
app = FastAPI(
    title="Todo API - Phase 3 (AI Chatbot)",
    description="FastAPI backend for Todo application with AI chatbot and JWT authentication",
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS middleware for Next.js frontend
# CRITICAL: Allow Authorization header for JWT tokens from Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include API routers
# Tasks router - handles all task CRUD operations
app.include_router(tasks.router)

# ==============================================================================
# Phase 3 AI Chatbot Endpoints
# ==============================================================================
# DECISION: Use official ChatKit protocol endpoint only (/chatkit)
#
# We have TWO AI chatbot endpoints available:
# 1. /api/v1/chat - Custom SSE streaming endpoint (COMMENTED OUT)
# 2. /api/chatkit - Official ChatKit protocol endpoint (ACTIVE)
#
# Per user requirement: "if only one chatkit is needed the official one not the custom"
# We are using the official ChatKit endpoint only for:
# - Standard ChatKit protocol compliance
# - Built-in widget rendering support
# - Better integration with ChatKit frontend components
# - Automatic conversation memory via SQLiteSession
#
# The custom /chat endpoint remains in codebase for reference but is disabled.
# ==============================================================================

# COMMENTED OUT: Custom SSE chat endpoint (not needed with ChatKit)
# app.include_router(chat.router, prefix="/api/v1")

# ACTIVE: Official ChatKit protocol endpoint
app.include_router(chatkit.router, prefix="/api")


# Health check endpoint (no authentication required)
@app.get("/api/health", tags=["health"])
async def health_check():
    """
    Health check endpoint.

    Returns server health status and current timestamp.
    This endpoint does not require authentication.

    Returns:
        dict: Health status and ISO 8601 timestamp
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


# Global Exception Handlers
# All handlers return standardized {"data": null, "error": {...}} format


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Handle Pydantic validation errors.

    Returns HTTP 422 Unprocessable Entity with validation error details.

    Args:
        request: FastAPI request object
        exc: Pydantic validation error

    Returns:
        JSONResponse: Standardized error response with validation details
    """
    logger.warning(f"Validation error on {request.url}: {exc.errors()}")

    # Extract first validation error for user-friendly message
    first_error = exc.errors()[0]
    field = " -> ".join(str(loc) for loc in first_error["loc"])
    message = f"Validation error in {field}: {first_error['msg']}"

    error_response = ErrorResponse(
        message=message,
        code="VALIDATION_ERROR",
    )

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "data": None,
            "error": error_response.model_dump(),
        },
    )


@app.exception_handler(TaskNotFoundError)
async def task_not_found_exception_handler(request: Request, exc: TaskNotFoundError):
    """
    Handle TaskNotFoundError exceptions.

    Returns HTTP 404 Not Found when a task doesn't exist.

    Args:
        request: FastAPI request object
        exc: TaskNotFoundError exception

    Returns:
        JSONResponse: Standardized error response
    """
    logger.info(f"Task not found on {request.url}: {exc}")

    error_response = ErrorResponse(
        message=str(exc),
        code="NOT_FOUND",
    )

    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={
            "data": None,
            "error": error_response.model_dump(),
        },
    )


@app.exception_handler(UnauthorizedError)
async def unauthorized_exception_handler(request: Request, exc: UnauthorizedError):
    """
    Handle UnauthorizedError exceptions.

    Returns HTTP 403 Forbidden when user is not authorized for a resource.

    Args:
        request: FastAPI request object
        exc: UnauthorizedError exception

    Returns:
        JSONResponse: Standardized error response
    """
    logger.warning(f"Authorization failed on {request.url}: {exc}")

    error_response = ErrorResponse(
        message=str(exc),
        code="UNAUTHORIZED",
    )

    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={
            "data": None,
            "error": error_response.model_dump(),
        },
    )


@app.exception_handler(status.HTTP_401_UNAUTHORIZED)
async def unauthorized_authentication_handler(request: Request, exc: HTTPException):
    """
    Handle HTTPException 401 Unauthorized (authentication failures).

    Returns HTTP 401 Unauthorized with standardized error format.

    Args:
        request: FastAPI request object
        exc: HTTPException with 401 status

    Returns:
        JSONResponse: Standardized error response
    """
    logger.warning(f"Authentication failed on {request.url}: {exc.detail}")

    error_response = ErrorResponse(
        message=exc.detail if isinstance(exc.detail, str) else "Authentication required",
        code="UNAUTHORIZED",
    )

    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={
            "data": None,
            "error": error_response.model_dump(),
        },
        headers={"WWW-Authenticate": "Bearer"},
    )


@app.exception_handler(status.HTTP_404_NOT_FOUND)
async def not_found_handler(request: Request, exc: HTTPException):
    """
    Handle HTTPException 404 Not Found.

    Returns HTTP 404 Not Found with standardized error format.

    Args:
        request: FastAPI request object
        exc: HTTPException with 404 status

    Returns:
        JSONResponse: Standardized error response
    """
    logger.info(f"Resource not found on {request.url}: {exc.detail}")

    error_response = ErrorResponse(
        message=exc.detail if isinstance(exc.detail, str) else "Resource not found",
        code="NOT_FOUND",
    )

    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={
            "data": None,
            "error": error_response.model_dump(),
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """
    Handle all unhandled exceptions.

    Returns HTTP 500 Internal Server Error for unexpected errors.

    Args:
        request: FastAPI request object
        exc: Any unhandled exception

    Returns:
        JSONResponse: Standardized error response
    """
    logger.error(f"Unhandled exception on {request.url}: {exc}", exc_info=True)

    error_response = ErrorResponse(
        message="An internal error occurred",
        code="INTERNAL_ERROR",
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "data": None,
            "error": error_response.model_dump(),
        },
    )


# Root endpoint
@app.get("/", tags=["root"])
async def root():
    """
    Root endpoint.

    Returns basic API information.
    """
    return {
        "message": "Todo API - Phase 2 Backend",
        "status": "ready",
        "docs": "/docs",
        "health": "/api/health",
    }


# Protected test endpoint for authentication testing
# This endpoint requires a valid JWT token
@app.get("/api/test/protected", tags=["testing"])
async def protected_test_endpoint(
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Protected test endpoint requiring JWT authentication.

    This endpoint is used by integration tests to verify that
    authentication is properly enforced. It requires a valid
    JWT token in the Authorization header.

    Returns:
        dict: Success message with authenticated user_id

    Raises:
        HTTPException 401: If token is missing, invalid, or expired
    """
    return {
        "data": {
            "user_id": current_user_id,
            "message": "Authentication successful",
        },
        "error": None,
    }
