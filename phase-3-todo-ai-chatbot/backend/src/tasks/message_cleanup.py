"""
Background task for message cleanup (Phase 3).

Deletes messages older than 2 days per retention policy.
Run this daily via cron or APScheduler.

Reference: openai-agents-mcp-integration skill section 5.6
"""

from datetime import datetime, timedelta
from typing import Any

from sqlmodel import Session, select
import logging

from ..db.session import get_engine
from ..models.message import Message

logger = logging.getLogger(__name__)

# Configuration for retention policy
RETENTION_DAYS = 2


def cleanup_expired_messages() -> dict[str, Any]:
    """
    Delete messages where expires_at < now().

    This is a SYNC function (not async) for background job compatibility.
    Uses Phase 2's sync engine for simplicity.

    Returns:
        dict: {"success": bool, "deleted_count": int, "timestamp": str}

    Usage:
        # Run daily via cron:
        # 0 2 * * * cd /app && uv run python -c "from src.tasks.message_cleanup import cleanup_expired_messages; cleanup_expired_messages()"

        # Or import and call directly:
        from src.tasks.message_cleanup import cleanup_expired_messages
        result = cleanup_expired_messages()
    """
    with Session(get_engine()) as session:
        try:
            now = datetime.utcnow()

            # Query expired messages (expires_at < now)
            statement = select(Message).where(Message.expires_at < now)
            expired_messages = session.exec(statement).all()

            deleted_count = len(expired_messages)

            if deleted_count > 0:
                for message in expired_messages:
                    session.delete(message)
                session.commit()
                logger.info(f"Deleted {deleted_count} expired messages at {now.isoformat()}")
            else:
                logger.debug(f"No expired messages found at {now.isoformat()}")

            return {
                "success": True,
                "deleted_count": deleted_count,
                "timestamp": now.isoformat(),
                "retention_days": RETENTION_DAYS,
            }

        except Exception as e:
            logger.error(f"Message cleanup failed: {str(e)}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
                "retention_days": RETENTION_DAYS,
            }


def get_retention_stats() -> dict[str, Any]:
    """
    Get statistics about message retention status.

    Returns:
        dict: Statistics about expired and active messages
    """
    with Session(get_engine()) as session:
        now = datetime.utcnow()

        # Count expired messages
        expired_statement = select(Message).where(Message.expires_at < now)
        expired_count = len(session.exec(expired_statement).all())

        # Count active messages
        active_statement = select(Message).where(Message.expires_at >= now)
        active_count = len(session.exec(active_statement).all())

        # Count messages expiring in next 24 hours
        tomorrow = now + timedelta(days=1)
        expiring_soon_statement = select(Message).where(
            Message.expires_at >= now,
            Message.expires_at <= tomorrow
        )
        expiring_soon_count = len(session.exec(expiring_soon_statement).all())

        return {
            "total_messages": expired_count + active_count,
            "expired_messages": expired_count,
            "active_messages": active_count,
            "expiring_soon_24h": expiring_soon_count,
            "retention_days": RETENTION_DAYS,
            "check_timestamp": now.isoformat(),
        }
