"""
Idempotency Service using Dapr State Store - Phase V

This module provides idempotent event processing using Dapr's State Store API.
Events are tracked by event_id to prevent duplicate processing.

The idempotency key pattern is: "event-processed-{event_id}"
Keys have a TTL of 24 hours (configurable) for automatic cleanup.

Usage:
    idempotency = IdempotencyService()

    # Check and mark as processed (atomic operation)
    is_new = await idempotency.check_and_mark_processed(event_id)
    if not is_new:
        return  # Already processed, skip

    # Process event...
    await process_event(event)

    # Alternative: Manual check/mark
    if await idempotency.is_processed(event_id):
        return
    # Process event...
    await idempotency.mark_processed(event_id)
"""

import logging
import os
from datetime import datetime, timezone
from typing import Any

import httpx

logger = logging.getLogger(__name__)


class IdempotencyService:
    """
    Idempotent event processing using Dapr State Store.

    Uses Redis (via Dapr) to track processed event IDs.
    This prevents duplicate processing when events are redelivered
    (e.g., due to consumer restart or network issues).

    Attributes:
        dapr_port: Dapr sidecar HTTP port (default: 3500)
        store_name: Dapr State Store component name (default: statestore)
        key_prefix: Prefix for idempotency keys (default: event-processed)
        ttl_seconds: TTL for idempotency keys in seconds (default: 86400 = 24h)
    """

    def __init__(
        self,
        dapr_port: int | None = None,
        store_name: str | None = None,
        key_prefix: str = "event-processed",
        ttl_seconds: int = 86400,
    ):
        self.dapr_port = dapr_port or int(os.getenv("DAPR_HTTP_PORT", "3500"))
        self.store_name = store_name or os.getenv("STATE_STORE_NAME", "statestore")
        self.key_prefix = key_prefix
        self.ttl_seconds = ttl_seconds
        self._base_url = f"http://localhost:{self.dapr_port}"

    def _make_key(self, event_id: str) -> str:
        """Generate state store key from event_id."""
        return f"{self.key_prefix}-{event_id}"

    async def is_processed(self, event_id: str) -> bool:
        """
        Check if event has already been processed.

        Args:
            event_id: Unique event identifier

        Returns:
            True if event was previously processed, False otherwise
        """
        key = self._make_key(event_id)
        url = f"{self._base_url}/v1.0/state/{self.store_name}/{key}"

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(url)

                if response.status_code == 200:
                    # Key exists, event was processed
                    logger.debug(f"Event {event_id} already processed")
                    return True
                elif response.status_code == 204:
                    # Key doesn't exist, event is new
                    return False
                else:
                    logger.warning(
                        f"Unexpected status checking idempotency: {response.status_code}"
                    )
                    return False

        except httpx.RequestError as e:
            logger.error(f"Failed to check idempotency for event {event_id}: {e}")
            # Fail open: assume not processed to avoid dropping events
            return False

    async def mark_processed(
        self,
        event_id: str,
        metadata: dict[str, Any] | None = None,
    ) -> bool:
        """
        Mark event as processed in state store.

        Args:
            event_id: Unique event identifier
            metadata: Optional metadata to store with the key

        Returns:
            True if marked successfully, False otherwise
        """
        key = self._make_key(event_id)
        url = f"{self._base_url}/v1.0/state/{self.store_name}"

        value = {
            "processed": True,
            "processed_at": datetime.now(timezone.utc).isoformat() + "Z",
            **(metadata or {}),
        }

        payload = [
            {
                "key": key,
                "value": value,
                "metadata": {
                    "ttlInSeconds": str(self.ttl_seconds),
                },
            }
        ]

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(
                    url,
                    json=payload,
                    headers={"Content-Type": "application/json"},
                )
                response.raise_for_status()

                logger.debug(f"Marked event {event_id} as processed")
                return True

        except httpx.HTTPStatusError as e:
            logger.error(
                f"Failed to mark event {event_id} as processed: {e.response.status_code}"
            )
            return False
        except httpx.RequestError as e:
            logger.error(f"Network error marking event {event_id} as processed: {e}")
            return False

    async def check_and_mark_processed(
        self,
        event_id: str,
        metadata: dict[str, Any] | None = None,
    ) -> bool:
        """
        Atomically check if event is new and mark it as processed.

        This is the preferred method for idempotent processing.
        Returns True if this is the first time processing the event.

        Args:
            event_id: Unique event identifier
            metadata: Optional metadata to store with the key

        Returns:
            True if event is new (not previously processed), False if duplicate

        Example:
            if await idempotency.check_and_mark_processed(event_id):
                # Process event (first time)
                await process_event(event)
            else:
                # Skip duplicate
                logger.info(f"Skipping duplicate event {event_id}")
        """
        # Check if already processed
        if await self.is_processed(event_id):
            return False

        # Mark as processed
        # Note: There's a small race window here. For truly atomic operation,
        # consider using Dapr's transaction API or a distributed lock.
        success = await self.mark_processed(event_id, metadata)

        if not success:
            # Failed to mark, but we should still try to process
            # (better to risk duplicate than drop event)
            logger.warning(
                f"Failed to mark event {event_id} as processed, proceeding anyway"
            )

        return True

    async def remove_processed(self, event_id: str) -> bool:
        """
        Remove event from processed set (for reprocessing).

        Use with caution - this allows the event to be processed again.

        Args:
            event_id: Unique event identifier

        Returns:
            True if removed successfully, False otherwise
        """
        key = self._make_key(event_id)
        url = f"{self._base_url}/v1.0/state/{self.store_name}/{key}"

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.delete(url)
                # 200 or 204 both indicate success
                if response.status_code in (200, 204):
                    logger.info(f"Removed event {event_id} from processed set")
                    return True
                else:
                    logger.warning(
                        f"Unexpected status removing idempotency key: {response.status_code}"
                    )
                    return False

        except httpx.RequestError as e:
            logger.error(f"Failed to remove event {event_id} from processed set: {e}")
            return False


# Global service instance (lazy initialization)
_idempotency_service: IdempotencyService | None = None


def get_idempotency_service() -> IdempotencyService:
    """Get or create global IdempotencyService instance."""
    global _idempotency_service
    if _idempotency_service is None:
        _idempotency_service = IdempotencyService()
    return _idempotency_service
