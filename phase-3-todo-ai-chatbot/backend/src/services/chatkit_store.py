"""
In-memory and database store implementations for ChatKit.

This module provides:
- MemoryStore: Simple in-memory storage (development only)
- DatabaseStore: Persistent database storage using SQLModel (production)

Reference: reference-phase3/backend/services/chatkit_store.py
"""

import logging
import uuid
from datetime import datetime
from typing import Any, Optional, Union, Literal

from chatkit.server import (
    Store,
    ThreadMetadata,
    Page,
)
from chatkit.types import (
    UserMessageItem,
    AssistantMessageItem,
    UserMessageTextContent,
    AssistantMessageContent,
)
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from ..models.conversation import Conversation
from ..models.message import Message

# ThreadItem is a union type of message items
ThreadItem = Union[UserMessageItem, AssistantMessageItem]


class MemoryStore(Store):
    """Simple in-memory store for ChatKit threads and items."""

    def __init__(self):
        """Initialize empty storage."""
        self._threads: dict[str, ThreadMetadata] = {}
        self._items: dict[str, list[ThreadItem]] = {}
        self._attachments: dict[str, Any] = {}

    async def save_thread(
        self,
        thread: ThreadMetadata,
        context: Any,
    ) -> None:
        """Save or update a thread."""
        self._threads[thread.id] = thread

    async def load_thread(
        self,
        thread_id: str,
        context: Any,
    ) -> ThreadMetadata | None:
        """Load a thread by ID, creating it if it doesn't exist."""
        if thread_id not in self._threads:
            # Create new thread if it doesn't exist
            thread = ThreadMetadata(
                id=thread_id,
                created_at=datetime.now(),
            )
            self._threads[thread_id] = thread
        return self._threads[thread_id]

    async def load_threads(
        self,
        limit: int,
        after: str | None,
        order: str,
        context: Any,
    ) -> Page[ThreadMetadata]:
        """Load all threads with pagination."""
        threads = list(self._threads.values())
        return Page(
            data=threads[-limit:] if limit else threads,
            has_more=False,
            after=None,
        )

    async def delete_thread(
        self,
        thread_id: str,
        context: Any,
    ) -> None:
        """Delete a thread and all its items."""
        if thread_id in self._threads:
            del self._threads[thread_id]
        if thread_id in self._items:
            del self._items[thread_id]

    async def load_thread_items(
        self,
        thread_id: str,
        after: str | None,
        limit: int,
        order: str,
        context: Any,
    ) -> Page[ThreadItem]:
        """Load items (messages, widgets) for a thread."""
        items = self._items.get(thread_id, [])
        return Page(
            data=items[-limit:] if limit else items,
            has_more=False,
            after=None,
        )

    async def add_thread_item(
        self,
        thread_id: str,
        item: ThreadItem,
        context: Any,
    ) -> None:
        """Add a thread item (message, widget, etc.)."""
        if thread_id not in self._items:
            self._items[thread_id] = []
        self._items[thread_id].append(item)

    async def save_item(
        self,
        thread_id: str,
        item: ThreadItem,
        context: Any,
    ) -> None:
        """Save/update a thread item."""
        if thread_id not in self._items:
            self._items[thread_id] = []

        # Update existing item or append new one
        items = self._items[thread_id]
        for i, existing in enumerate(items):
            if existing.id == item.id:
                items[i] = item
                return
        items.append(item)

    async def load_item(
        self,
        thread_id: str,
        item_id: str,
        context: Any,
    ) -> ThreadItem:
        """Load a single item by ID."""
        items = self._items.get(thread_id, [])
        for item in items:
            if item.id == item_id:
                return item
        raise ValueError(f"Item {item_id} not found in thread {thread_id}")

    async def delete_thread_item(
        self,
        thread_id: str,
        item_id: str,
        context: Any,
    ) -> None:
        """Delete a thread item."""
        if thread_id in self._items:
            self._items[thread_id] = [
                item for item in self._items[thread_id]
                if item.id != item_id
            ]

    async def save_attachment(
        self,
        attachment: Any,
        context: Any,
    ) -> None:
        """Save an attachment (file or image)."""
        self._attachments[attachment.id] = attachment

    async def load_attachment(
        self,
        attachment_id: str,
        context: Any,
    ) -> Any:
        """Load an attachment by ID."""
        attachment = self._attachments.get(attachment_id)
        if not attachment:
            raise ValueError(f"Attachment {attachment_id} not found")
        return attachment

    async def delete_attachment(
        self,
        attachment_id: str,
        context: Any,
    ) -> None:
        """Delete an attachment."""
        if attachment_id in self._attachments:
            del self._attachments[attachment_id]

    def generate_thread_id(self, context: Any) -> str:
        """Generate a unique thread ID."""
        return str(uuid.uuid4())

    def generate_item_id(
        self,
        item_type: Literal["message", "tool_call", "task", "workflow", "attachment"],
        thread: ThreadMetadata,
        context: Any,
    ) -> str:
        """Generate a unique item ID."""
        return str(uuid.uuid4())


class DatabaseStore(Store):
    """Database-backed store for ChatKit threads and items using SQLModel."""

    def __init__(self, session_factory: Any):
        """
        Initialize the database store.

        Args:
            session_factory: Async session factory for database operations
        """
        self.session_factory = session_factory

    async def _get_conversation_id(
        self,
        thread_id: str,
        user_id: str,
    ):
        """
        Get or create conversation ID from ChatKit thread_id.

        1. First checks if conversation with this thread_id already exists
        2. If exists, returns its UUID id
        3. If not exists, creates new conversation and returns its id

        Args:
            thread_id: Thread ID (UUID string from ChatKit)
            user_id: User's ID

        Returns:
            UUID: Conversation ID, or None if operation fails
        """
        import logging

        # First, check if conversation with this thread_id already exists
        try:
            async with self.session_factory() as session:
                result = await session.execute(
                    select(Conversation).where(
                        Conversation.thread_id == thread_id,
                        Conversation.user_id == user_id
                    )
                )
                existing = result.scalar_one_or_none()
                if existing:
                    logging.debug(f"Found existing conversation {existing.id} for thread {thread_id}")
                    return existing.id
        except Exception as e:
            logging.warning(f"Error checking for existing conversation: {e}")

        # Conversation doesn't exist - create new one
        try:
            # Use naive datetime (UTC) to match TIMESTAMP WITHOUT TIME ZONE column
            now = datetime.utcnow()
            title = f"Conversation {now.strftime('%Y-%m-%d %H:%M')}"

            async with self.session_factory() as session:
                conversation = Conversation(
                    user_id=user_id,
                    thread_id=thread_id,  # Use ChatKit's thread_id (required, NOT NULL, UNIQUE)
                    title=title,
                    is_active=True,
                    created_at=now,
                    updated_at=now,
                )
                session.add(conversation)
                await session.commit()
                await session.refresh(conversation)
                logging.debug(f"Created new conversation {conversation.id} for thread {thread_id}")
                return conversation.id
        except Exception as e:
            logging.warning(f"Failed to create conversation for thread {thread_id}: {e}")
            # Try one more time to get existing (race condition handling)
            try:
                async with self.session_factory() as session:
                    result = await session.execute(
                        select(Conversation).where(
                            Conversation.thread_id == thread_id,
                            Conversation.user_id == user_id
                        )
                    )
                    existing = result.scalar_one_or_none()
                    if existing:
                        return existing.id
            except Exception:
                pass
            return None

    async def save_thread(
        self,
        thread: ThreadMetadata,
        context: Any,
    ) -> None:
        """Save or update a thread (conversation)."""
        import logging

        user_id = context.get("user_id")
        if not user_id:
            logging.warning("save_thread: No user_id in context")
            return

        original_thread_id = thread.id
        logging.info(f"save_thread: Incoming thread_id={original_thread_id}, user_id={user_id}")

        # Get or create conversation ID
        conv_id = await self._get_conversation_id(thread.id, user_id)
        if not conv_id:
            logging.warning(f"save_thread: Failed to get/create conversation for thread_id={thread.id}")
            return

        logging.info(f"save_thread: Got conv_id={conv_id} for thread_id={original_thread_id}")

        # Update existing conversation's timestamp
        async with self.session_factory() as session:
            result = await session.execute(
                select(Conversation).where(
                    Conversation.id == conv_id,
                    Conversation.user_id == user_id
                )
            )
            conversation = result.scalar_one_or_none()

            if conversation:
                # Use naive datetime (UTC) to match TIMESTAMP WITHOUT TIME ZONE column
                conversation.updated_at = datetime.utcnow()
                session.add(conversation)
                await session.commit()

    async def load_thread(
        self,
        thread_id: str,
        context: Any,
    ) -> ThreadMetadata | None:
        """Load a thread (conversation) by ID."""
        user_id = context.get("user_id")
        if not user_id:
            return None

        conv_id = await self._get_conversation_id(thread_id, user_id)
        if not conv_id:
            logging.warning(f"load_thread: No conversation found for thread_id={thread_id}, user_id={user_id}")
            return None

        async with self.session_factory() as session:
            result = await session.execute(
                select(Conversation).where(
                    Conversation.id == conv_id,
                    Conversation.user_id == user_id
                )
            )
            conversation = result.scalar_one_or_none()

            if conversation:
                # Return the original thread_id (ChatKit's UUID), not the internal DB id
                metadata = ThreadMetadata(
                    id=conversation.thread_id,
                    created_at=conversation.created_at,
                )
                logging.debug(f"load_thread: Returning metadata for thread_id={thread_id}, created_at={metadata.created_at}")
                return metadata

            logging.warning(f"load_thread: Conversation not found for conv_id={conv_id}")
            return None

    async def load_threads(
        self,
        limit: int,
        after: str | None,
        order: str,
        context: Any,
    ) -> Page[ThreadMetadata]:
        """Load all threads (conversations) for user."""
        user_id = context.get("user_id")
        if not user_id:
            return Page(data=[], has_more=False, after=None)

        try:
            async with self.session_factory() as session:
                from sqlalchemy import desc
                query = select(Conversation).where(
                    Conversation.user_id == user_id
                ).order_by(desc(Conversation.updated_at))

                if limit:
                    query = query.limit(limit)

                result = await session.execute(query)
                conversations = result.scalars().all()

                # Return original thread_id (ChatKit's UUID), not internal DB id
                threads = [
                    ThreadMetadata(
                        id=c.thread_id,
                        created_at=c.created_at,
                    )
                    for c in conversations
                ]
                return Page(data=threads, has_more=False, after=None)
        except Exception as e:
            import logging
            logging.warning(f"Failed to load threads from database: {e}, returning empty list")
            return Page(data=[], has_more=False, after=None)

    async def delete_thread(
        self,
        thread_id: str,
        context: Any,
    ) -> None:
        """Delete a thread and all its items (archive conversation)."""
        user_id = context.get("user_id")
        if not user_id:
            return

        conv_id = await self._get_conversation_id(thread_id, user_id)
        if not conv_id:
            return

        async with self.session_factory() as session:
            result = await session.execute(
                select(Conversation).where(
                    Conversation.id == conv_id,
                    Conversation.user_id == user_id
                )
            )
            conversation = result.scalar_one_or_none()

            if conversation:
                # Mark as inactive instead of deleting
                conversation.is_active = False
                session.add(conversation)
                await session.commit()

    async def load_thread_items(
        self,
        thread_id: str,
        after: str | None,
        limit: int,
        order: str,
        context: Any,
    ) -> Page:
        """Load items (messages) for a thread."""
        import logging

        user_id = context.get("user_id")
        if not user_id:
            logging.warning("load_thread_items: No user_id in context")
            return Page(data=[], has_more=False, after=None)

        logging.info(f"load_thread_items: thread_id={thread_id}, user_id={user_id}, limit={limit}")

        conv_id = await self._get_conversation_id(thread_id, user_id)
        if not conv_id:
            logging.warning(f"load_thread_items: No conversation found for thread_id={thread_id}")
            return Page(data=[], has_more=False, after=None)

        logging.info(f"load_thread_items: Found conv_id={conv_id} for thread_id={thread_id}")

        async with self.session_factory() as session:
            query = select(Message).where(
                Message.conversation_id == conv_id,
                Message.user_id == user_id
            ).order_by(Message.created_at)

            if limit:
                query = query.limit(limit)

            result = await session.execute(query)
            messages = result.scalars().all()

            items = []
            for m in messages:
                # CRITICAL: Use chatkit_item_id instead of database ID
                # This ensures frontend message IDs match what was streamed
                # and prevents the "first message disappears" bug
                item_id = m.chatkit_item_id
                if m.role == "user":
                    # Create UserMessageItem with proper content structure
                    item = UserMessageItem(
                        id=item_id,  # Use preserved ChatKit ID
                        thread_id=thread_id,
                        created_at=m.created_at,
                        content=[UserMessageTextContent(type="input_text", text=m.content)],
                        inference_options={},
                    )
                else:
                    # Create AssistantMessageItem with proper content structure
                    item = AssistantMessageItem(
                        id=item_id,  # Use preserved ChatKit ID
                        thread_id=thread_id,
                        created_at=m.created_at,
                        content=[AssistantMessageContent(type="output_text", text=m.content)],
                    )
                items.append(item)
                logging.debug(f"  Loaded item: id={item_id[:8]}..., role={m.role}, created_at={m.created_at.isoformat()}")

            logging.info(f"load_thread_items: Returning {len(items)} items for thread_id={thread_id}")
            return Page(data=items, has_more=False, after=None)

    async def add_thread_item(
        self,
        thread_id: str,
        item: ThreadItem,
        context: Any,
    ) -> None:
        """Add a thread item (message) to database."""
        import logging

        user_id = context.get("user_id")
        if not user_id:
            return

        conv_id = await self._get_conversation_id(thread_id, user_id)
        if not conv_id:
            return

        try:
            # Extract content - handle both string and list of content objects
            content = getattr(item, "content", str(item))
            if isinstance(content, list):
                # ChatKit sends content as list of content objects
                # Extract text from each and join
                text_parts = []
                for content_item in content:
                    if hasattr(content_item, "text"):
                        # UserMessageTextContent, AssistantMessageContent have .text
                        text = str(content_item.text).strip()
                        if text:  # Only add non-empty text
                            text_parts.append(text)
                    elif hasattr(content_item, "type") and content_item.type in ("input_text", "output_text"):
                        # Handle content items with type field
                        text = str(getattr(content_item, "text", "")).strip()
                        if text:
                            text_parts.append(text)
                    else:
                        # Fallback for other content types
                        text = str(content_item).strip()
                        if text:
                            text_parts.append(text)
                content = " ".join(text_parts) if text_parts else ""
            else:
                # Already a string
                content = str(content).strip()

            # Skip empty messages - don't save them to database
            if not content:
                logging.debug(f"Skipping empty message for thread {thread_id}")
                return

            # Determine role from item type attribute
            # ChatKit uses .type: "user_message" or "assistant_message"
            # NOT .role attribute
            item_type = getattr(item, "type", None)
            if item_type == "user_message":
                role = "user"
            elif item_type == "assistant_message":
                role = "assistant"
            else:
                # Fallback: check class name
                class_name = type(item).__name__
                if "User" in class_name:
                    role = "user"
                elif "Assistant" in class_name:
                    role = "assistant"
                else:
                    role = "user"  # Default fallback

            logging.info(f"add_thread_item: Saving message role={role}, type={item_type}, thread_id={thread_id}, conv_id={conv_id}, content={content[:50]}...")

            async with self.session_factory() as session:
                # CRITICAL: Preserve the original ChatKit item ID
                # This ensures frontend message IDs match what was streamed
                # and prevents the "first message disappears" bug
                chatkit_id = getattr(item, "id", None)

                # Handle __fake_id__ from stream_agent_response
                # The OpenAI Agents SDK's stream_agent_response generates __fake_id__
                # for assistant messages. We need to generate real UUIDs.
                if not chatkit_id or str(chatkit_id) == "__fake_id__":
                    chatkit_id = str(uuid.uuid4())
                    logging.debug(f"Generated new UUID for item: {chatkit_id}")
                else:
                    chatkit_id = str(chatkit_id)

                new_message = Message(
                    chatkit_item_id=chatkit_id,  # Preserve original ChatKit ID
                    conversation_id=conv_id,
                    user_id=user_id,
                    role=role,
                    content=content,
                    created_at=getattr(item, "created_at", datetime.utcnow()),
                )
                session.add(new_message)
                await session.commit()
                logging.info(f"add_thread_item: Saved message id={new_message.id}, chatkit_id={chatkit_id} for conversation {conv_id}")
        except Exception as e:
            logging.warning(f"Failed to add message to database: {e}")

    async def save_item(
        self,
        thread_id: str,
        item: ThreadItem,
        context: Any,
    ) -> None:
        """Save/update a thread item (message)."""
        # For now, treat like add since we don't update messages
        await self.add_thread_item(thread_id, item, context)

    async def load_item(
        self,
        thread_id: str,
        item_id: str,
        context: Any,
    ):
        """Load a single item by ID."""
        user_id = context.get("user_id")
        if not user_id:
            raise ValueError("No user_id in context")

        # Get conversation ID for user isolation check
        conv_id = await self._get_conversation_id(thread_id, user_id)
        if not conv_id:
            raise ValueError(f"Thread {thread_id} not found")

        async with self.session_factory() as session:
            # Search by chatkit_item_id (the preserved ChatKit item ID)
            result = await session.execute(
                select(Message).where(
                    Message.chatkit_item_id == item_id,
                    Message.conversation_id == conv_id,
                    Message.user_id == user_id
                )
            )
            message = result.scalar_one_or_none()

            if message:
                if message.role == "user":
                    item = UserMessageItem(
                        id=message.chatkit_item_id,  # Use preserved ChatKit ID
                        thread_id=thread_id,
                        created_at=message.created_at,
                        content=[UserMessageTextContent(type="input_text", text=message.content)],
                        inference_options={},
                    )
                else:
                    item = AssistantMessageItem(
                        id=message.chatkit_item_id,  # Use preserved ChatKit ID
                        thread_id=thread_id,
                        created_at=message.created_at,
                        content=[AssistantMessageContent(type="output_text", text=message.content)],
                    )
                return item
            raise ValueError(f"Item {item_id} not found")

    async def delete_thread_item(
        self,
        thread_id: str,
        item_id: str,
        context: Any,
    ) -> None:
        """Delete a thread item (message)."""
        # Messages are immutable - don't actually delete
        pass

    async def save_attachment(
        self,
        attachment: Any,
        context: Any,
    ) -> None:
        """Save an attachment (not implemented for database store)."""
        pass

    async def load_attachment(
        self,
        attachment_id: str,
        context: Any,
    ) -> Any:
        """Load an attachment (not implemented for database store)."""
        raise ValueError(f"Attachment {attachment_id} not found")

    async def delete_attachment(
        self,
        attachment_id: str,
        context: Any,
    ) -> None:
        """Delete an attachment (not implemented for database store)."""
        pass

    def generate_thread_id(self, context: Any) -> str:
        """Generate a unique thread ID (conversation ID)."""
        # This will be overwritten when saving to database
        return str(uuid.uuid4())

    def generate_item_id(
        self,
        item_type: Literal["message", "tool_call", "task", "workflow", "attachment"],
        thread: ThreadMetadata,
        context: Any,
    ) -> str:
        """Generate a unique item ID."""
        return str(uuid.uuid4())

