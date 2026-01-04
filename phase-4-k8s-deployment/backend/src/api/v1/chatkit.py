"""
ChatKit endpoint for processing chat requests.

This module provides the /chatkit endpoint that handles all ChatKit
protocol requests, including message streaming and widget rendering.

Reference: reference-phase3/backend/routers/chatkit.py
"""

import logging
from fastapi import APIRouter, Request, Depends
from fastapi.responses import Response, StreamingResponse, JSONResponse
from chatkit.server import StreamingResult

from ...auth.dependencies import get_current_user_id
from ...services.chatkit_server import TaskChatKitServer
from ...services.chatkit_store import MemoryStore

logger = logging.getLogger(__name__)

router = APIRouter(tags=["chatkit"])


# @router.options("/chatkit")
# async def chatkit_options():
#     """
#     Handle CORS preflight requests for ChatKit endpoint.

#     This is needed because the ChatKit frontend makes cross-origin requests
#     and browsers send OPTIONS preflight requests first.
#     """
#     return Response(status_code=200)

# ChatKit server will be initialized on first request
_chatkit_server = None


def get_current_user_info(user_id: str = Depends(get_current_user_id)) -> dict:
    """
    Extract user information from JWT token for ChatKit context.

    Args:
        user_id: User ID from JWT verification

    Returns:
        dict: User information (id, name)
    """
    return {
        "id": user_id,
        "name": "there",  # Could be enhanced to get actual user name
    }


async def _get_chatkit_server():
    """Get or create the global ChatKit server instance."""
    global _chatkit_server

    if _chatkit_server is None:
        # TEMPORARY: Force MemoryStore to debug message display issue
        # Set USE_MEMORY_STORE=1 to use in-memory store
        import os
        use_memory_store = os.environ.get("USE_MEMORY_STORE", "0") == "1"

        if use_memory_store:
            logger.info("Using MemoryStore (USE_MEMORY_STORE=1)")
            from ...services.chatkit_store import MemoryStore
            store = MemoryStore()
        else:
            try:
                # Create database store with async session factory
                # Import here to avoid circular dependencies
                from ...db.async_session import get_session_factory

                factory = await get_session_factory()
                if factory is None:
                    logger.warning("Session factory is None, using in-memory store")
                    from ...services.chatkit_store import MemoryStore
                    store = MemoryStore()
                else:
                    from ...services.chatkit_store import DatabaseStore
                    store = DatabaseStore(factory)
                    logger.info("Initialized ChatKit server with DatabaseStore for persistent storage")
            except Exception as e:
                logger.warning(f"Failed to initialize DatabaseStore: {e}, falling back to MemoryStore")
                from ...services.chatkit_store import MemoryStore
                store = MemoryStore()

        _chatkit_server = TaskChatKitServer(store)

    return _chatkit_server


@router.post("/chatkit")
async def chatkit_endpoint(
    request: Request,
    user_info: dict = Depends(get_current_user_info),
) -> Response:
    """
    ChatKit endpoint that processes all chat requests.

    This endpoint:
    1. Authenticates the user via JWT
    2. Extracts the request payload
    3. Processes it through the ChatKit server
    4. Returns streaming (SSE) or JSON response

    Args:
        request: FastAPI request object
        user_info: Authenticated user information from JWT

    Returns:
        Response: StreamingResponse for SSE or JSON Response
    """
    user_id = user_info["id"]
    user_name = user_info.get("name", "there")
    logger.info(f"ChatKit request from authenticated user {user_id}")

    try:
        # Read request body
        payload = await request.body()
        logger.info(f"Received payload: {len(payload)} bytes")
        logger.debug(f"Payload content: {payload.decode('utf-8')}")

        # Add user info to context for the ChatKit server
        context = {
            "user_id": user_id,
            "user_name": user_name,
        }

        # Get or create ChatKit server
        chatkit_server = await _get_chatkit_server()

        # Process through ChatKit server
        result = await chatkit_server.process(payload, context)

        # Return appropriate response type
        if isinstance(result, StreamingResult):
            logger.info(f"Returning streaming response for user {user_id}")
            return StreamingResponse(
                result,
                media_type="text/event-stream",
            )

        # JSON response
        logger.info(f"Returning JSON response for user {user_id}")
        return Response(
            content=result.json,
            media_type="application/json",
        )

    except Exception as e:
        logger.error(f"ChatKit error for user {user_id}: {e}", exc_info=True)
        return JSONResponse(
            content={"error": "Internal server error"},
            status_code=500,
        )
