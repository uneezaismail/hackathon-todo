"""
Cleanup job for old completed recurring task instances.

This background task removes old completed instances of recurring tasks
to prevent database bloat while preserving:
- Recurring patterns (is_pattern=True) - kept forever
- Recent completed instances (last 30 days) - kept for history
- All active/pending instances - kept

Runs daily via scheduler or cron job.
"""

import logging
from datetime import datetime, timedelta
from sqlmodel import Session, select
from typing import Tuple

from ..db.session import get_session
from ..models.task import Task

logger = logging.getLogger(__name__)


def cleanup_old_recurring_instances(
    session: Session,
    retention_days: int = 30
) -> Tuple[int, int]:
    """
    Delete old completed recurring task instances.

    Args:
        session: Database session
        retention_days: Number of days to keep completed instances (default: 30)

    Returns:
        Tuple of (deleted_count, error_count)

    Business Rules:
        - KEEP: All patterns (is_pattern=True)
        - KEEP: All active/pending tasks (completed=False)
        - KEEP: Recently completed instances (updated_at > retention_days ago)
        - DELETE: Old completed instances (completed=True, is_pattern=False, updated_at < retention_days ago)
    """
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=retention_days)

        # Find old completed instances to delete
        query = select(Task).where(
            Task.is_recurring == True,  # Only recurring tasks
            Task.is_pattern == False,   # Only instances, not patterns
            Task.completed == True,      # Only completed tasks
            Task.updated_at < cutoff_date  # Older than retention period
        )

        old_instances = session.exec(query).all()
        deleted_count = len(old_instances)

        if deleted_count == 0:
            logger.info(f"Cleanup: No old recurring instances to delete (retention: {retention_days} days)")
            return 0, 0

        # Delete old instances
        for instance in old_instances:
            session.delete(instance)
            logger.debug(f"Deleting old instance: {instance.id} ({instance.title}) - completed {instance.updated_at}")

        session.commit()
        logger.info(
            f"Cleanup: Successfully deleted {deleted_count} old recurring instances "
            f"(retention: {retention_days} days)"
        )

        return deleted_count, 0

    except Exception as e:
        logger.error(f"Cleanup: Error deleting old recurring instances: {e}", exc_info=True)
        session.rollback()
        return 0, 1


def cleanup_all_users(retention_days: int = 30) -> dict:
    """
    Run cleanup for all users in the database.

    This is the main entry point for the cleanup cron job.

    Args:
        retention_days: Number of days to keep completed instances

    Returns:
        dict: Cleanup statistics
    """
    session = next(get_session())

    try:
        deleted_count, error_count = cleanup_old_recurring_instances(
            session=session,
            retention_days=retention_days
        )

        return {
            "status": "success" if error_count == 0 else "partial",
            "deleted_instances": deleted_count,
            "errors": error_count,
            "retention_days": retention_days,
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        logger.error(f"Cleanup job failed: {e}", exc_info=True)
        return {
            "status": "error",
            "deleted_instances": 0,
            "errors": 1,
            "error_message": str(e),
            "timestamp": datetime.utcnow().isoformat(),
        }

    finally:
        session.close()


if __name__ == "__main__":
    # Allow running cleanup manually: python -m src.tasks.cleanup_old_instances
    print("Running manual cleanup of old recurring task instances...")
    result = cleanup_all_users(retention_days=30)
    print(f"Cleanup result: {result}")
