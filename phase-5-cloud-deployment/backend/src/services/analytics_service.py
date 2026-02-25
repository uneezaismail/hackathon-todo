"""
Analytics Service for Phase 4.

Provides analytics and statistics for task data:
- Completion stats (total, completed, completion rate)
- Heatmap data (completions by day for a year)
- Recurring task statistics
- Priority distribution
"""

from datetime import date, datetime, timedelta
from typing import Dict, List, Optional, Tuple
from sqlmodel import Session, select, func
from collections import defaultdict
import logging

from ..models.task import Task, PriorityType

logger = logging.getLogger(__name__)


class AnalyticsService:
    """
    Service class for analytics operations.

    Provides methods for:
    - Get completion stats for date range
    - Generate heatmap data for a year
    - Get recurring task statistics
    - Get priority distribution
    """

    @staticmethod
    def get_completion_stats(
        session: Session,
        user_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict:
        """
        Get task completion statistics for a user within a date range.

        Args:
            session: Database session
            user_id: User ID for filtering
            start_date: Optional start date filter
            end_date: Optional end date filter

        Returns:
            Dict with total, completed, pending, completion_rate, overdue
        """
        try:
            # Base query for all tasks
            base_query = select(Task).where(Task.user_id == user_id)

            # Apply date filters on created_at
            if start_date:
                base_query = base_query.where(Task.created_at >= datetime.combine(start_date, datetime.min.time()))
            if end_date:
                base_query = base_query.where(Task.created_at <= datetime.combine(end_date, datetime.max.time()))

            tasks = list(session.exec(base_query).all())

            total = len(tasks)
            completed = sum(1 for t in tasks if t.completed)
            pending = total - completed
            completion_rate = (completed / total * 100) if total > 0 else 0

            # Count overdue tasks (not completed, due date in the past)
            now = date.today()
            overdue = sum(
                1 for t in tasks
                if not t.completed and t.due_date and t.due_date < now
            )

            logger.info(f"Retrieved completion stats for user {user_id}: {total} tasks")

            return {
                "total": total,
                "completed": completed,
                "pending": pending,
                "completion_rate": round(completion_rate, 1),
                "overdue": overdue,
            }

        except Exception as e:
            logger.error(f"Error getting completion stats for user {user_id}: {e}")
            raise

    @staticmethod
    def get_heatmap_data(
        session: Session,
        user_id: str,
        year: int
    ) -> List[Dict]:
        """
        Generate heatmap data showing completions per day for a year.

        Args:
            session: Database session
            user_id: User ID for filtering
            year: Year to generate data for

        Returns:
            List of {date: YYYY-MM-DD, count: int, level: 0-4}
        """
        try:
            # Get start and end of year
            year_start = date(year, 1, 1)
            year_end = date(year, 12, 31)

            # Query completed tasks in this year
            query = select(Task).where(
                (Task.user_id == user_id) &
                (Task.completed == True) &
                (Task.updated_at >= datetime.combine(year_start, datetime.min.time())) &
                (Task.updated_at <= datetime.combine(year_end, datetime.max.time()))
            )

            tasks = list(session.exec(query).all())

            # Count completions by day
            completions_by_day = defaultdict(int)
            for task in tasks:
                if task.updated_at:
                    day_key = task.updated_at.date().isoformat()
                    completions_by_day[day_key] += 1

            # Build heatmap data for entire year
            heatmap_data = []
            current_date = year_start
            while current_date <= year_end:
                day_str = current_date.isoformat()
                count = completions_by_day.get(day_str, 0)

                # Calculate level (0-4) based on count
                if count == 0:
                    level = 0
                elif count == 1:
                    level = 1
                elif count <= 3:
                    level = 2
                elif count <= 5:
                    level = 3
                else:
                    level = 4

                heatmap_data.append({
                    "date": day_str,
                    "count": count,
                    "level": level,
                })

                current_date += timedelta(days=1)

            logger.info(f"Generated heatmap data for user {user_id}, year {year}")

            return heatmap_data

        except Exception as e:
            logger.error(f"Error generating heatmap for user {user_id}: {e}")
            raise

    @staticmethod
    def get_recurring_stats(
        session: Session,
        user_id: str
    ) -> Dict:
        """
        Get statistics for recurring tasks.

        Args:
            session: Database session
            user_id: User ID for filtering

        Returns:
            Dict with total_patterns, active_patterns, completion_rate, current_streak
        """
        try:
            # Get all recurring patterns (parent tasks)
            patterns_query = select(Task).where(
                (Task.user_id == user_id) &
                (Task.is_recurring == True) &
                (Task.parent_task_id == None)
            )
            patterns = list(session.exec(patterns_query).all())

            total_patterns = len(patterns)
            active_patterns = sum(1 for p in patterns if not p.completed)

            # Get all instances for completion rate
            instances_query = select(Task).where(
                (Task.user_id == user_id) &
                (Task.parent_task_id != None)
            )
            instances = list(session.exec(instances_query).all())

            instance_total = len(instances)
            instance_completed = sum(1 for i in instances if i.completed)
            completion_rate = (instance_completed / instance_total * 100) if instance_total > 0 else 0

            # Calculate current streak (consecutive days with completed recurring tasks)
            streak = AnalyticsService._calculate_streak(session, user_id)

            logger.info(f"Retrieved recurring stats for user {user_id}")

            return {
                "total_patterns": total_patterns,
                "active_patterns": active_patterns,
                "total_instances": instance_total,
                "completed_instances": instance_completed,
                "completion_rate": round(completion_rate, 1),
                "current_streak": streak,
            }

        except Exception as e:
            logger.error(f"Error getting recurring stats for user {user_id}: {e}")
            raise

    @staticmethod
    def _calculate_streak(session: Session, user_id: str) -> int:
        """Calculate the current streak of consecutive days with completed recurring tasks."""
        try:
            # Get completed recurring instances ordered by completion date
            query = select(Task).where(
                (Task.user_id == user_id) &
                (Task.completed == True) &
                (Task.parent_task_id != None)
            ).order_by(Task.updated_at.desc())

            tasks = list(session.exec(query).all())

            if not tasks:
                return 0

            # Group by day
            days_with_completions = set()
            for task in tasks:
                if task.updated_at:
                    days_with_completions.add(task.updated_at.date())

            # Count consecutive days from today backwards
            streak = 0
            check_date = date.today()

            # If today hasn't had any, start from yesterday
            if check_date not in days_with_completions:
                check_date -= timedelta(days=1)

            while check_date in days_with_completions:
                streak += 1
                check_date -= timedelta(days=1)

            return streak

        except Exception as e:
            logger.error(f"Error calculating streak for user {user_id}: {e}")
            return 0

    @staticmethod
    def get_priority_distribution(
        session: Session,
        user_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict:
        """
        Get task distribution by priority.

        Args:
            session: Database session
            user_id: User ID for filtering
            start_date: Optional start date filter
            end_date: Optional end date filter

        Returns:
            Dict with High, Medium, Low counts and percentages
        """
        try:
            base_query = select(Task).where(Task.user_id == user_id)

            if start_date:
                base_query = base_query.where(Task.created_at >= datetime.combine(start_date, datetime.min.time()))
            if end_date:
                base_query = base_query.where(Task.created_at <= datetime.combine(end_date, datetime.max.time()))

            tasks = list(session.exec(base_query).all())

            total = len(tasks)
            high = sum(1 for t in tasks if t.priority == PriorityType.High)
            medium = sum(1 for t in tasks if t.priority == PriorityType.Medium)
            low = sum(1 for t in tasks if t.priority == PriorityType.Low)

            return {
                "total": total,
                "high": {"count": high, "percentage": round(high / total * 100, 1) if total else 0},
                "medium": {"count": medium, "percentage": round(medium / total * 100, 1) if total else 0},
                "low": {"count": low, "percentage": round(low / total * 100, 1) if total else 0},
            }

        except Exception as e:
            logger.error(f"Error getting priority distribution for user {user_id}: {e}")
            raise
