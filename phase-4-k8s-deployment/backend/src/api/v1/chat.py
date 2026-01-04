"""
Chat API endpoints for AI-powered task management.

Implements streaming chat with OpenAI Agents SDK, conversation persistence,
and JWT authentication integration.

SSE Event Format (per contracts/chat-api.yaml):
- type="chunk": {"type": "chunk", "content": "..."}
- type="tool_call": {"type": "tool_call", "tool": "name", "args": {...}}
- type="tool_result": {"type": "tool_result", "tool": "name", "result": {...}}
- type="done": {"type": "done", "conversation_id": "uuid"}

Reference: openai-agents-mcp-integration skill sections 3.6, 5.4
Reference: contracts/chat-api.yaml (StreamingChatResponse schema)
"""
import asyncio
import json
import logging
from typing import Optional, AsyncIterator, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

from ...auth.dependencies import get_current_user_id
from ...db.async_session import get_async_session
from ...services.chat_service import get_todo_agent
from ...services.conversation_service import ConversationService

from agents import Runner
from agents.stream_events import RawResponsesStreamEvent, RunItemStreamEvent
from agents.items import ToolCallItem, ToolCallOutputItem
from openai.types.responses import ResponseTextDeltaEvent


router = APIRouter(prefix="/chat", tags=["chat"])

# T104: Message queueing lock to ensure sequential processing
# Prevents race conditions when multiple messages arrive simultaneously
_chat_lock = asyncio.Lock()


class ChatRequest(BaseModel):
    """Request model for chat endpoint."""
    message: str = Field(..., min_length=1, max_length=2000, description="User message (max 2000 chars)")
    conversation_id: Optional[UUID] = Field(None, description="Existing conversation ID (creates new if not provided)")


class ChatResponse(BaseModel):
    """Response model for non-streaming chat (future use)."""
    conversation_id: UUID
    response: str


@router.post("")
async def chat_with_agent(
    request: ChatRequest,
    current_user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_async_session)
):
    """
    Stream chat response from AI agent with task management tools.

    SSE Event Format (per contracts/chat-api.yaml):
    - type="chunk": {"type": "chunk", "content": "..."} - Partial text chunks
    - type="tool_call": {"type": "tool_call", "tool": "name", "args": {...}} - Tool invocation
    - type="tool_result": {"type": "tool_result", "tool": "name", "result": {...}} - Tool result
    - type="done": {"type": "done", "conversation_id": "uuid"} - Response complete

    Flow:
    1. Get or create conversation
    2. Load conversation history (stateless - full history every time)
    3. Stream agent response via SSE with proper event types
    4. Save user message and assistant response to database
    5. Return conversation_id in done event

    Args:
        request: Chat request with message and optional conversation_id
        current_user_id: Authenticated user ID from JWT
        session: Async database session

    Returns:
        StreamingResponse with SSE events per chat-api.yaml schema

    Reference: contracts/chat-api.yaml (StreamingChatResponse schema)
    Reference: openai-agents-mcp-integration skill section 3.6
    """
    # T104: Use lock to ensure sequential message processing
    # Prevents concurrent chat requests from interfering with each other
    async with _chat_lock:
        try:
            # Get or create conversation
            conversation = await ConversationService.get_or_create_conversation(
                session, current_user_id, request.conversation_id
            )

            # Load conversation history (stateless architecture)
            history = await ConversationService.get_conversation_history(
                session, conversation.id, current_user_id, limit=500
            )

            # Get agent instance
            todo_agent = get_todo_agent()
            agent = todo_agent.get_agent()

            # Define async generator for streaming SSE events
            async def event_generator() -> AsyncIterator[str]:
                """
                Generate SSE events for streaming response.

                Yields:
                    str: SSE formatted events (data: {...}\n\n)
                """
                response_chunks: list[str] = []
                tool_calls_in_progress: dict[str, dict] = {}

                # Save user message to database BEFORE starting the agent
                # This ensures the user's input is captured even if the agent fails
                try:
                    await ConversationService.add_message(
                        session,
                        current_user_id,
                        conversation.id,
                        "user",
                        request.message
                    )
                except Exception as e:
                    logger.error(f"Failed to save user message: {e}")
                    error_event = {
                        "type": "error",
                        "message": "Failed to save message history."
                    }
                    yield f"data: {json.dumps(error_event)}\n\n"
                    return

                try:
                    # MCP server context manager (required for tool execution)
                    async with todo_agent.mcp_server:
                        # T102: Wrap entire agent streaming with 30-second timeout (FR-031)
                        # Create the stream
                        stream = Runner.run_streamed(
                            agent=agent,
                            messages=history + [{"role": "user", "content": request.message}],
                            context_variables={"user_id": current_user_id}  # Inject user_id for tools
                        )

                        # Create async generator wrapper for timeout
                        async def stream_with_timeout():
                            """Wrap stream with timeout to prevent hanging."""
                            try:
                                async for event in stream:
                                    yield event
                            except asyncio.TimeoutError:
                                logger.warning(f"Chat timeout for user {current_user_id}")
                                raise

                        # Apply 30-second timeout to entire streaming operation
                        try:
                            async for event in asyncio.wait_for(
                                stream_with_timeout().__aiter__(),
                                timeout=30.0
                            ):
                                # T072: Handle chunk events (type="chunk")
                                # Check for ResponseTextDeltaEvent in raw_response_event
                                if isinstance(event, RawResponsesStreamEvent):
                                    if isinstance(event.data, ResponseTextDeltaEvent):
                                        if event.data.delta:
                                            response_chunks.append(event.data.delta)
                                            # Emit chunk event per chat-api.yaml
                                            chunk_event = {
                                                "type": "chunk",
                                                "content": event.data.delta
                                            }
                                            yield f"data: {json.dumps(chunk_event)}\n\n"

                                # T073: Handle tool call events (type="tool_call")
                                # Check for ToolCallItem in run_item_stream_event
                                elif isinstance(event, RunItemStreamEvent):
                                    if isinstance(event.item, ToolCallItem):
                                        tool_call = event.item.raw_item
                                        # Handle different tool call types
                                        if hasattr(tool_call, 'function'):
                                            # Standard function call
                                            tool_name = getattr(tool_call.function, 'name', 'unknown')
                                            tool_args_str = getattr(tool_call.function, 'arguments', '{}')
                                        elif hasattr(tool_call, 'name'):
                                            # MCP tool call
                                            tool_name = getattr(tool_call, 'name', 'unknown')
                                            tool_args_str = '{}'
                                        else:
                                            tool_name = 'unknown'
                                            tool_args_str = '{}'

                                        # Parse arguments if string
                                        if isinstance(tool_args_str, str):
                                            try:
                                                tool_args = json.loads(tool_args_str)
                                            except json.JSONDecodeError:
                                                tool_args = {"raw": tool_args_str}
                                        else:
                                            tool_args = tool_args_str

                                        # Store for result matching
                                        if hasattr(event.item, 'id'):
                                            tool_calls_in_progress[event.item.id] = {
                                                "tool": tool_name,
                                                "args": tool_args
                                            }

                                        # Emit tool_call event per chat-api.yaml
                                        tool_call_event = {
                                            "type": "tool_call",
                                            "tool": tool_name,
                                            "args": tool_args
                                        }
                                        yield f"data: {json.dumps(tool_call_event)}\n\n"

                                    # T074: Handle tool result events (type="tool_result")
                                    elif isinstance(event.item, ToolCallOutputItem):
                                        # Get tool name from stored mapping
                                        tool_name = "unknown"
                                        if hasattr(event.item, 'id') and event.item.id in tool_calls_in_progress:
                                            tool_info = tool_calls_in_progress.pop(event.item.id)
                                            tool_name = tool_info.get("tool", "unknown")

                                        # Extract output from the item
                                        result = str(event.item.output) if hasattr(event.item, 'output') else "success"

                                        # Emit tool_result event per chat-api.yaml
                                        tool_result_event = {
                                            "type": "tool_result",
                                            "tool": tool_name,
                                            "result": {"output": result}
                                        }
                                        yield f"data: {json.dumps(tool_result_event)}\n\n"

                        except asyncio.TimeoutError:
                            # Return 504 error event to client
                            error_event = {
                                "type": "error",
                                "message": "The AI took too long to respond. Please try again."
                            }
                            yield f"data: {json.dumps(error_event)}\n\n"
                            logger.warning(f"Chat timeout for user {current_user_id}")
                            # Don't return here, proceed to save what we have
                            
                    # Combine all chunks into full response
                    full_response = "".join(response_chunks)
                    
                    if not full_response and not tool_calls_in_progress:
                        logger.warning(f"Empty response from agent for user {current_user_id}")
                        # Don't save empty messages unless there were tool calls? 
                        # But we should save something to indicate completion.

                    # T075: Save messages and emit done event (type="done")
                    # Save assistant response to database
                    if full_response or response_chunks:
                        await ConversationService.add_message(
                            session,
                            current_user_id,
                            conversation.id,
                            "assistant",
                            full_response
                        )

                    # Emit done event per chat-api.yaml
                    done_event = {
                        "type": "done",
                        "conversation_id": str(conversation.id)
                    }
                    yield f"data: {json.dumps(done_event)}\n\n"

                except Exception as e:
                    # Stream error to client
                    logger.error(f"Error in chat stream: {e}", exc_info=True)
                    error_event = {
                        "type": "error",
                        "message": str(e)
                    }
                    yield f"data: {json.dumps(error_event)}\n\n"
                    # We might want to re-raise if we want the connection to close with error?
                    # But yielding error event is usually better for SSE.

            # Return streaming response with proper SSE headers
            return StreamingResponse(
                event_generator(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "X-Accel-Buffering": "no"  # Disable nginx buffering
                }
            )

        except PermissionError as e:
            raise HTTPException(status_code=403, detail=str(e))
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/conversations")
async def list_conversations(
    current_user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_async_session)
):
    """
    List user's conversations sorted by most recent.

    Args:
        current_user_id: Authenticated user ID from JWT
        session: Async database session

    Returns:
        List of conversations with metadata
    """
    conversations = await ConversationService.get_user_conversations(
        session, current_user_id, limit=100
    )

    return {
        "conversations": [
            {
                "id": str(conv.id),
                "created_at": conv.created_at.isoformat(),
                "updated_at": conv.updated_at.isoformat()
            }
            for conv in conversations
        ],
        "count": len(conversations)
    }


@router.get("/conversations/{conversation_id}/history")
async def get_conversation_history(
    conversation_id: UUID,
    current_user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_async_session)
):
    """
    Get conversation message history.

    Args:
        conversation_id: Conversation ID
        current_user_id: Authenticated user ID from JWT
        session: Async database session

    Returns:
        List of messages in chronological order
    """
    try:
        history = await ConversationService.get_conversation_history(
            session, conversation_id, current_user_id, limit=500
        )
        return {"messages": history, "count": len(history)}
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


# T084: Admin endpoint for manual cleanup trigger
@router.post("/admin/cleanup/messages")
async def trigger_message_cleanup(
    current_user_id: str = Depends(get_current_user_id),
):
    """
    Trigger message retention cleanup manually (admin only).

    This endpoint deletes all messages older than 2 days.
    Normally runs automatically via daily cron job.

    Args:
        current_user_id: Authenticated user ID from JWT

    Returns:
        Cleanup result with deleted count and timestamp
    """
    # In production, add admin authentication check here
    # For now, any authenticated user can trigger cleanup

    from ...tasks.message_cleanup import cleanup_expired_messages, get_retention_stats

    # Get stats before cleanup
    stats_before = get_retention_stats()

    # Run cleanup
    result = cleanup_expired_messages()

    # Get stats after cleanup
    stats_after = get_retention_stats()

    return {
        "cleanup_result": result,
        "stats_before": stats_before,
        "stats_after": stats_after,
    }


@router.get("/admin/retention/stats")
async def get_retention_statistics(
    current_user_id: str = Depends(get_current_user_id),
):
    """
    Get message retention statistics.

    Returns counts of expired, active, and soon-to-expire messages.

    Args:
        current_user_id: Authenticated user ID from JWT

    Returns:
        Retention statistics
    """
    from ...tasks.message_cleanup import get_retention_stats

    stats = get_retention_stats()

    return stats
