"""
WebSocket Connection Manager - Phase V

Manages SSE connections grouped by user_id.
Handles connection lifecycle and event broadcasting.
"""

import logging
import uuid
import asyncio
from datetime import datetime, timezone
from typing import Dict, Set, Any, Optional
from collections import defaultdict

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Manages SSE connections and broadcasts events to clients.

    Features:
    - User-scoped connections (multiple connections per user)
    - Event queue per connection
    - Connection timeout detection
    - Metrics tracking
    """

    def __init__(self):
        """Initialize connection manager."""
        # Map: connection_id -> {'user_id': str, 'queue': asyncio.Queue, 'created_at': datetime}
        self.connections: Dict[str, Dict[str, Any]] = {}

        # Map: user_id -> Set[connection_id]
        self.user_connections: Dict[str, Set[str]] = defaultdict(set)

        # Metrics
        self.metrics = {
            "total_connections": 0,
            "current_connections": 0,
            "messages_sent": 0,
        }

    async def add_connection(self, user_id: str) -> str:
        """
        Add new SSE connection for user.

        Args:
            user_id: User identifier

        Returns:
            Connection ID (UUID)
        """
        connection_id = str(uuid.uuid4())
        queue = asyncio.Queue()

        self.connections[connection_id] = {
            "user_id": user_id,
            "queue": queue,
            "created_at": datetime.now(timezone.utc),
        }

        self.user_connections[user_id].add(connection_id)

        self.metrics["total_connections"] += 1
        self.metrics["current_connections"] = len(self.connections)

        logger.info(
            f"Connection added",
            extra={"connection_id": connection_id, "user_id": user_id},
        )

        return connection_id

    async def remove_connection(self, connection_id: str) -> bool:
        """
        Remove SSE connection.

        Args:
            connection_id: Connection ID to remove

        Returns:
            True if removed, False if not found
        """
        if connection_id not in self.connections:
            return False

        conn = self.connections.pop(connection_id)
        user_id = conn["user_id"]

        self.user_connections[user_id].discard(connection_id)
        if not self.user_connections[user_id]:
            del self.user_connections[user_id]

        self.metrics["current_connections"] = len(self.connections)

        logger.info(
            f"Connection removed",
            extra={"connection_id": connection_id, "user_id": user_id},
        )

        return True

    async def get_next_event(self, connection_id: str) -> Dict[str, Any]:
        """
        Wait for next event on connection.

        Args:
            connection_id: Connection ID

        Returns:
            Event data dictionary
        """
        if connection_id not in self.connections:
            raise ValueError(f"Connection not found: {connection_id}")

        queue = self.connections[connection_id]["queue"]
        event = await queue.get()

        self.metrics["messages_sent"] += 1

        return event

    async def broadcast_to_user(self, user_id: str, event_data: Dict[str, Any]) -> int:
        """
        Broadcast event to all connections for a user.

        Args:
            user_id: User identifier
            event_data: Event data to broadcast

        Returns:
            Number of connections event was sent to
        """
        if user_id not in self.user_connections:
            logger.debug(f"No connections for user: {user_id}")
            return 0

        connection_ids = self.user_connections[user_id].copy()
        broadcast_count = 0

        for connection_id in connection_ids:
            try:
                if connection_id in self.connections:
                    queue = self.connections[connection_id]["queue"]
                    await queue.put(event_data)
                    broadcast_count += 1
            except Exception as e:
                logger.warning(
                    f"Error broadcasting to connection {connection_id}: {e}"
                )
                # Remove failed connection
                await self.remove_connection(connection_id)

        logger.debug(
            f"Broadcast complete",
            extra={
                "user_id": user_id,
                "recipients": broadcast_count,
                "event_type": event_data.get("event_type"),
            },
        )

        return broadcast_count

    async def get_stats(self) -> Dict[str, Any]:
        """
        Get connection statistics.

        Returns:
            Statistics dictionary
        """
        # Calculate connection duration statistics
        now = datetime.now(timezone.utc)
        durations = []
        for conn in self.connections.values():
            created_at = conn.get("created_at")
            if created_at:
                duration = (now - created_at).total_seconds()
                durations.append(duration)

        avg_duration = sum(durations) / len(durations) if durations else 0

        return {
            "total_connections": self.metrics["total_connections"],
            "current_connections": self.metrics["current_connections"],
            "messages_sent": self.metrics["messages_sent"],
            "active_users": len(self.user_connections),
            "avg_connection_duration_seconds": avg_duration,
            "connections_by_user": {
                user_id: len(conn_ids)
                for user_id, conn_ids in self.user_connections.items()
            },
        }
