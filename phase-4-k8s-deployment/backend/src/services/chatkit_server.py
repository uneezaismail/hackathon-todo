"""
ChatKit server implementation with task management.

This module provides a ChatKit server that integrates with the existing
Agent SDK and MCP tools to provide a chat interface.

Features:
- Conversation context management via SQLiteSession
- Automatic memory of previous messages within a thread
- User-specific conversation isolation
- Multi-provider LLM support via agent_config factory
- Automatic thread title generation based on first message

Reference: reference-phase3/backend/services/chatkit_server.py
"""

import asyncio
import logging
import os
from typing import Any, AsyncIterator

from agents import Agent, Runner, SQLiteSession
from chatkit.server import ChatKitServer, ThreadStreamEvent, ThreadMetadata, UserMessageItem, Store
from chatkit.agents import AgentContext, stream_agent_response, simple_to_agent_input
from chatkit.types import ProgressUpdateEvent

from src.agent_config import TodoAgent, create_model

logger = logging.getLogger(__name__)

# Disable OpenAI telemetry for faster responses
os.environ.setdefault("OTEL_SDK_DISABLED", "true")
os.environ.setdefault("OTEL_TRACES_EXPORTER", "none")
os.environ.setdefault("OTEL_METRICS_EXPORTER", "none")


def create_title_agent() -> Agent:
    """Create an agent specifically for generating thread titles."""
    return Agent(
        name="title_generator",
        model=create_model(),
        instructions="""You are a thread title generator. Your task is to create a short, descriptive title (3-6 words max) that summarizes what the user is asking about.

Rules:
- Keep titles SHORT (3-6 words maximum)
- Be specific about the action or topic
- Use title case
- No punctuation at the end
- Focus on the main intent

Examples:
- "Show me my tasks" → "View All Tasks"
- "Add a task to buy groceries" → "Add Grocery Task"
- "What's due today?" → "Today's Due Tasks"
- "Delete the meeting task" → "Delete Meeting Task"
- "Mark my homework as done" → "Complete Homework Task"
- "What high priority tasks do I have?" → "High Priority Tasks"
- "Help me organize my day" → "Daily Task Planning"

Output ONLY the title, nothing else.""",
    )


class TaskChatKitServer(ChatKitServer):
    """ChatKit server for task management."""

    def __init__(self, store: Store, session_db_path: str = "chat_sessions.db"):
        """
        Initialize the ChatKit server.

        Args:
            store: ChatKit store for persisting threads and messages
            session_db_path: Path to SQLite database for conversation sessions
        """
        super().__init__(store)

        # Create TodoAgent using factory pattern
        self.todo_agent = TodoAgent()
        self.agent = self.todo_agent.get_agent()
        self.mcp_server = self.todo_agent.mcp_server

        # Create title generation agent
        self.title_agent = create_title_agent()

        # Store session database path
        self.session_db_path = session_db_path

        logger.info(f"TaskChatKitServer initialized with session DB: {session_db_path}")

    async def maybe_update_thread_title(
        self,
        thread: ThreadMetadata,
        input_item: UserMessageItem,
    ) -> None:
        """
        Generate and update thread title based on first user message.

        This runs asynchronously and updates the thread title without blocking
        the main response stream. The ChatKitServer's _process_events method
        automatically detects thread changes and persists them.

        Args:
            thread: Thread metadata to update
            input_item: User message to generate title from
        """
        # PERFORMANCE FIX: Disable automatic title generation to save 1 API call per conversation
        # Titles will show as "New Chat" instead
        logger.debug(f"Title generation disabled for performance - thread {thread.id}")
        return

        # Skip if thread already has a title
        if thread.title is not None:
            logger.debug(f"Thread {thread.id} already has title: {thread.title}")
            return

        try:
            # Convert user message to agent input format
            agent_input = await simple_to_agent_input(input_item)

            # Run the title agent to generate a title
            run = await Runner.run(self.title_agent, input=agent_input)

            # Extract the generated title
            generated_title = run.final_output
            if generated_title:
                # Clean up the title (remove quotes, extra whitespace)
                generated_title = generated_title.strip().strip('"\'')

                # Update thread title - ChatKitServer automatically persists this
                thread.title = generated_title

                logger.info(f"Generated title for thread {thread.id}: {generated_title}")
            else:
                logger.warning(f"Title agent returned empty title for thread {thread.id}")

        except Exception as e:
            # Don't fail the main response if title generation fails
            logger.error(f"Failed to generate title for thread {thread.id}: {e}")

    async def respond(
        self,
        thread: ThreadMetadata,
        input: UserMessageItem | None,
        context: Any,
    ) -> AsyncIterator[ThreadStreamEvent]:
        """
        Process user messages and stream responses with conversation memory.

        Args:
            thread: Thread metadata
            input: User message
            context: Request context containing user_id

        Yields:
            ThreadStreamEvent: Chat events (text, widgets, etc.)
        """
        # Extract user_id from context
        user_id = context.get("user_id")
        if not user_id:
            logger.error("No user_id in context")
            return

        logger.info(f"=== CHATKIT REQUEST ===")
        logger.info(f"Processing message for user {user_id}, thread {thread.id}")
        logger.info(f"Thread metadata: id={thread.id}, title={thread.title}, created_at={getattr(thread, 'created_at', 'N/A')}")

        # Generate thread title asynchronously on first message
        # This runs in background without blocking the response
        if input is not None:
            asyncio.create_task(self.maybe_update_thread_title(thread, input))

        # Create agent context with user info
        agent_context = AgentContext(
            thread=thread,
            store=self.store,
            request_context=context,
        )

        # Add user name to context for personalization
        user_name = context.get("user_name", "there")
        logger.info(f"User name for personalization: {user_name}")

        # Create SQLiteSession for this user+thread combination
        session_id = f"user_{user_id}_thread_{thread.id}"
        session = SQLiteSession(session_id, self.session_db_path)
        logger.info(f"Created session: {session_id}")

        # Check if this is the first message in the session
        history = await session.get_items()
        if not history:
            # First message - add system context to session
            # IMPORTANT: user_id is for internal tool calls only - NEVER mention it to the user
            system_message = {
                "role": "system",
                "content": f"""The user's name is {user_name}. Address them by their name when appropriate, but NEVER mention their user ID in any response. The user ID ({user_id}) is ONLY for internal tool calls (like list_tasks, add_task, etc.) and must NEVER appear in your text responses, greetings, task listings, or any user-facing messages. If you see a user ID in your own responses, you are making an error - user IDs should never be visible to users."""
            }
            await session.add_items([system_message])
            logger.info(f"Added system message to new session {session_id}")

        # Extract the user message as a string
        if input and input.content:
            content_item = input.content[0] if input.content else None
            if content_item and hasattr(content_item, 'text'):
                user_message = content_item.text
            elif content_item and isinstance(content_item, dict):
                user_message = content_item.get('text', '')
            else:
                user_message = str(content_item) if content_item else ""
        else:
            user_message = ""

        logger.info(f"User message extracted: {user_message}")

        # Emit initial progress event to show typing indicator
        yield ProgressUpdateEvent(text="Thinking...", icon="bolt")

        # Run agent with streaming AND session within MCP server context
        # IMPORTANT: Pass string input (not list) when using sessions!
        # The session automatically manages conversation history
        async with self.mcp_server:
            result = Runner.run_streamed(
                self.agent,
                user_message,  # String input (required when using session)
                context=agent_context,
                session=session,  # Enable conversation memory
            )

            # Generate a real message ID upfront to replace __fake_id__
            # This ensures frontend and database have matching IDs
            import uuid
            real_message_id = str(uuid.uuid4())
            fake_id_map: dict[str, str] = {}  # Map __fake_id__ variants to real UUIDs

            # Track if we've seen any text content yet
            has_text_content = False

            # Stream agent response with ID replacement
            async for event in stream_agent_response(agent_context, result):
                # Replace __fake_id__ with real UUID in events
                if hasattr(event, 'item') and hasattr(event.item, 'id'):
                    item_id = str(event.item.id)
                    if item_id == "__fake_id__" or item_id.startswith("__fake_id__"):
                        # Map this fake ID to a real UUID
                        if item_id not in fake_id_map:
                            fake_id_map[item_id] = real_message_id
                        # Create a copy of the event with the real ID
                        event.item.id = fake_id_map[item_id]

                # Track when we get actual text content - stop emitting progress after this
                event_type = getattr(event, 'type', None)
                if not has_text_content and event_type in ('thread.item.added', 'thread.item.updated'):
                    item = getattr(event, 'item', None)
                    if item and getattr(item, 'type', None) == 'assistant_message':
                        # Check if this message has actual text content
                        content = getattr(item, 'content', [])
                        if content and len(content) > 0:
                            first_block = content[0]
                            # Check for text in dict or object format
                            has_text = (isinstance(first_block, dict) and first_block.get('text')) or \
                                      (hasattr(first_block, 'text') and first_block.text)
                            if has_text:
                                has_text_content = True
                                logger.info("First text content detected - stopping progress indicators")

                # Emit periodic progress updates ONLY before we get text content
                # This keeps the indicator visible during tool execution and LLM processing
                if not has_text_content:
                    # Emit progress on tool-related events
                    if event_type in ('thread.item.added', 'thread.item.updated'):
                        item = getattr(event, 'item', None)
                        if item:
                            item_type = getattr(item, 'type', None)
                            if item_type in ('function_call', 'tool_call', 'function_call_output'):
                                yield ProgressUpdateEvent(text="Working on your request...", icon="bolt")

                yield event

        logger.info(f"Completed response for thread {thread.id}")
