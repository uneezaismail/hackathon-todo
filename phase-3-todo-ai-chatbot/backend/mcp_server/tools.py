"""
MCP Server for task management operations (Phase III).

This module implements an MCP server using FastMCP from the Official MCP Python SDK.
The server exposes task operations as MCP tools callable by AI agents.

MCP Tools provided:
- add_task: Create a new task for a user
- list_tasks: Retrieve tasks with optional filtering
- complete_task: Mark a task as complete
- delete_task: Remove a task from the database
- update_task: Modify task title, description, or priority
- set_priority: Update task priority level
- get_task: Retrieve a single task by ID
- bulk_update_tasks: Bulk complete or delete tasks
- list_tasks_by_priority: Filter tasks by priority level

Architecture:
- MCP Server runs as a separate process (not inside agent)
- Agent connects via MCPServerStdio transport
- Tools use @mcp.tool() decorator (NOT @function_tool)
- Tools are SYNC functions using SQLModel sessions
- FastMCP handles stdio transport automatically

Reference: openai-agents-mcp-integration skill section 3.4
"""

import os
import re
import sys
from pathlib import Path
from typing import Literal, Optional, List

# Ensure the src directory is in the path for imports
_src_path = Path(__file__).parent.parent
if str(_src_path) not in sys.path:
    sys.path.insert(0, str(_src_path))

from mcp.server.fastmcp import FastMCP
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = _src_path / ".env"
if env_path.exists():
    load_dotenv(env_path, override=True)

# Validate DATABASE_URL is set (will fail later with proper error if not)
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("WARNING: DATABASE_URL environment variable is not set. MCP server will fail on tool calls.")

# Create FastMCP instance
mcp = FastMCP(
    name=os.getenv("MCP_SERVER_NAME", "todo-task-server")
)

# Import TaskService at module level for easier mocking in tests
# Using lazy import pattern to avoid circular imports and connection issues
_TaskService = None

def _get_task_service():
    """Lazy import of TaskService to avoid import-time database connections."""
    global _TaskService
    if _TaskService is None:
        from src.services.task_service import TaskService as TS
        _TaskService = TS
    return _TaskService

# For testing: allow replacing TaskService with a mock
_mock_task_service = None

def set_mock_task_service(mock_service):
    """Set a mock TaskService for testing."""
    global _mock_task_service
    _mock_task_service = mock_service

def _clear_task_service_cache():
    """Clear the cached TaskService (for testing)."""
    global _TaskService, _mock_task_service
    _TaskService = None
    _mock_task_service = None


def detect_priority_from_text(text: str) -> str:
    """
    Detect priority level from user input text using NLP patterns.

    Args:
        text: User input text (task title/description)

    Returns:
        str: Detected priority level ("low", "medium", "high") or "medium" if not detected

    Examples:
        >>> detect_priority_from_text("Create HIGH priority task to buy milk")
        "high"
        >>> detect_priority_from_text("Add a task")
        "medium"
        >>> detect_priority_from_text("This is URGENT")
        "high"
    """
    text_lower = text.lower()

    # High priority patterns
    high_priority_patterns = [
        r'\bhigh\s*priority\b',
        r'\burgent\b',
        r'\bcritical\b',
        r'\bimportant\b',
        r'\basap\b',
        r'\bhigh\b',
        r'\bemergency\b',
        r'\bimmediately\b',
        r'\btoday\b',
        r'\bmust\b',
    ]

    # Low priority patterns
    low_priority_patterns = [
        r'\blow\s*priority\b',
        r'\bminor\b',
        r'\boptional\b',
        r'\bwhen\s*you\s*have\s*time\b',
        r'\bsomeday\b',
        r'\beventually\b',
        r'\bif\s*possible\b',
        r'\bmaybe\b',
        r'\blow\b',
    ]

    # Check for high priority first (more specific)
    for pattern in high_priority_patterns:
        if re.search(pattern, text_lower):
            return "high"

    # Check for low priority
    for pattern in low_priority_patterns:
        if re.search(pattern, text_lower):
            return "low"

    # Check for medium/normal priority patterns
    if re.search(r'\bmedium\b|\bnormal\b', text_lower):
        return "medium"

    # Default to medium if no pattern matches
    return "medium"


def parse_natural_language_date(text: str) -> Optional[str]:
    """
    Parse natural language date expressions into ISO 8601 date strings.

    Args:
        text: User input text containing date expressions

    Returns:
        str: ISO 8601 date string (YYYY-MM-DD) or None if no date found

    Examples:
        >>> parse_natural_language_date("remind me tomorrow")
        "2025-12-27"  # If today is 2025-12-26
        >>> parse_natural_language_date("due next friday")
        "2025-01-03"
        >>> parse_natural_language_date("buy milk")
        None
    """
    from datetime import datetime, timedelta

    text_lower = text.lower()
    today = datetime.now().date()

    # Today patterns
    if re.search(r'\btoday\b', text_lower):
        return today.isoformat()

    # Tomorrow patterns
    if re.search(r'\btomorrow\b', text_lower):
        return (today + timedelta(days=1)).isoformat()

    # Day after tomorrow
    if re.search(r'\bday\s+after\s+tomorrow\b', text_lower):
        return (today + timedelta(days=2)).isoformat()

    # Next week (7 days from now)
    if re.search(r'\bnext\s+week\b', text_lower):
        return (today + timedelta(days=7)).isoformat()

    # In X days patterns
    days_match = re.search(r'\bin\s+(\d+)\s+days?\b', text_lower)
    if days_match:
        days = int(days_match.group(1))
        return (today + timedelta(days=days)).isoformat()

    # In X hours (same day or next day)
    hours_match = re.search(r'\bin\s+(\d+)\s+hours?\b', text_lower)
    if hours_match:
        # For hours, we just set due date to today (time tracking not supported)
        return today.isoformat()

    # End of week (next Sunday)
    if re.search(r'\bend\s+of\s+week\b|\bthis\s+weekend\b', text_lower):
        days_until_sunday = (6 - today.weekday()) % 7
        if days_until_sunday == 0:
            days_until_sunday = 7  # If today is Sunday, get next Sunday
        return (today + timedelta(days=days_until_sunday)).isoformat()

    # End of month
    if re.search(r'\bend\s+of\s+month\b', text_lower):
        # Get last day of current month
        if today.month == 12:
            last_day = today.replace(day=31)
        else:
            next_month = today.replace(month=today.month + 1, day=1)
            last_day = next_month - timedelta(days=1)
        return last_day.isoformat()

    # Specific weekday patterns: "next monday", "this friday", etc.
    weekdays = {
        'monday': 0, 'tuesday': 1, 'wednesday': 2, 'thursday': 3,
        'friday': 4, 'saturday': 5, 'sunday': 6
    }

    for day_name, day_num in weekdays.items():
        # "next monday", "next friday", etc.
        if re.search(rf'\bnext\s+{day_name}\b', text_lower):
            days_ahead = day_num - today.weekday()
            if days_ahead <= 0:  # Target day already happened this week
                days_ahead += 7
            # "next" means the following week
            days_ahead += 7
            return (today + timedelta(days=days_ahead)).isoformat()

        # "this monday", "this friday", "on monday", etc.
        if re.search(rf'\b(this\s+)?{day_name}\b|\bon\s+{day_name}\b', text_lower):
            days_ahead = day_num - today.weekday()
            if days_ahead < 0:  # Target day already happened this week
                days_ahead += 7
            elif days_ahead == 0:
                days_ahead = 7  # If today is that day, get next week
            return (today + timedelta(days=days_ahead)).isoformat()

    # No date pattern found
    return None


def get_session():
    """
    Get a synchronous database session.

    Yields:
        Session: SQLModel database session

    Note:
        This is a generator function that must be consumed properly.
        For MCP tools, we use session.__enter__() and session.__exit__() directly.
    """
    from src.db.session import get_session as _get_session
    return _get_session()


def task_to_dict(task) -> dict:
    """Convert a Task model to dictionary format for MCP response."""
    from src.models.task import Task

    return {
        "id": str(task.id),
        "title": task.title,
        "description": task.description,
        "completed": task.completed,
        "priority": task.priority.value if hasattr(task.priority, 'value') else str(task.priority),
        "due_date": task.due_date.isoformat() if task.due_date else None,
        "created_at": task.created_at.isoformat() if hasattr(task, 'created_at') else None,
        "updated_at": task.updated_at.isoformat() if hasattr(task, 'updated_at') else None,
    }


@mcp.tool()
def add_task(
    user_id: str,
    title: str,
    description: Optional[str] = None,
    priority: Optional[str] = None,
    due_date: Optional[str] = None,
) -> dict:
    """
    Create a new task for a user.

    MCP Tool Contract:
    - Purpose: Add a task to user's todo list
    - Stateless: All state persisted to database
    - User Isolation: Enforced via user_id parameter
    - Priority Detection: Extracts priority from title/description if not provided
    - Due Date Parsing: Supports natural language dates like "tomorrow", "next friday"

    Args:
        user_id: User's unique identifier (string UUID from Better Auth)
        title: Task title (required, max 200 characters)
        description: Task description (optional, max 1000 characters)
        priority: Task priority level (optional: "low", "medium", "high")
            - If not provided, automatically detects from title + description
        due_date: Due date (optional). Supports:
            - ISO 8601 format: "2025-12-31"
            - Natural language: "tomorrow", "next friday", "in 3 days", "end of week"

    Returns:
        dict: Task creation result
            - task_id (str): Created task UUID
            - status (str): "created"
            - title (str): Task title
            - priority (str): Assigned priority level
            - due_date (str|None): ISO 8601 due date if set

    Example:
        >>> add_task(user_id="user-123", title="Buy groceries", priority="high")
        {"task_id": "...", "status": "created", "title": "Buy groceries", "priority": "high"}
        >>> add_task(user_id="user-123", title="Call mom", due_date="tomorrow")
        {"task_id": "...", "status": "created", "title": "Call mom", "due_date": "2025-12-27"}
    """
    # DEBUG: Use stderr for logging (stdout is reserved for MCP JSONRPC protocol)
    import sys
    from datetime import date
    print(f"[MCP TOOL] add_task CALLED: user_id={user_id}, title={title}, due_date={due_date}", file=sys.stderr, flush=True)

    from sqlmodel import Session
    from src.models.task import TaskCreate, PriorityType

    # Detect priority from title and description if not provided
    combined_text = f"{title} {description or ''}"
    if priority is None:
        normalized_priority = detect_priority_from_text(combined_text)
    else:
        normalized_priority = priority.lower()
        if normalized_priority not in ["low", "medium", "high"]:
            normalized_priority = "medium"

    # Parse due date - try natural language first, then ISO format
    parsed_due_date = None
    if due_date:
        # First try natural language parsing
        natural_date = parse_natural_language_date(due_date)
        if natural_date:
            parsed_due_date = date.fromisoformat(natural_date)
        else:
            # Try ISO format directly
            try:
                parsed_due_date = date.fromisoformat(due_date)
            except ValueError:
                # Invalid date format - log but continue without due date
                print(f"[MCP TOOL] Invalid due_date format: {due_date}", file=sys.stderr, flush=True)
    else:
        # Try to extract due date from title/description
        natural_date = parse_natural_language_date(combined_text)
        if natural_date:
            parsed_due_date = date.fromisoformat(natural_date)

    # Get database session
    session = next(get_session())

    try:
        # Map priority string to PriorityType enum
        priority_map = {
            "high": PriorityType.High,
            "medium": PriorityType.Medium,
            "low": PriorityType.Low,
        }
        priority_enum = priority_map.get(normalized_priority, PriorityType.Medium)

        # Get TaskService (use mock if set for testing)
        TaskServiceClass = _mock_task_service if _mock_task_service is not None else _get_task_service()

        # Create task using task_service
        # Note: tags must be an empty list (not None) since TaskCreate expects List[str]
        task_data = TaskCreate(
            title=title,
            description=description,
            priority=priority_enum,
            due_date=parsed_due_date,
            tags=[],  # Empty list, not None
        )

        created_task = TaskServiceClass.create_task(
            session=session,
            user_id=user_id,
            task_create=task_data
        )

        # Return MCP tool response
        return {
            "task_id": str(created_task.id),
            "status": "created",
            "title": created_task.title,
            "priority": created_task.priority.value if hasattr(created_task.priority, 'value') else str(created_task.priority),
            "due_date": created_task.due_date.isoformat() if created_task.due_date else None,
        }

    except Exception as e:
        return {
            "task_id": None,
            "status": "error",
            "message": f"Failed to create task: {str(e)}",
        }

    finally:
        session.close()


@mcp.tool()
def list_tasks(
    user_id: str,
    status: Literal["all", "pending", "completed"] = "all",
    priority: Optional[str] = None,
    search: Optional[str] = None,
) -> dict:
    """
    Retrieve tasks from user's todo list.

    MCP Tool Contract:
    - Purpose: List tasks with optional status/priority/search filtering
    - Stateless: Queries database on each invocation
    - User Isolation: Enforced via user_id parameter

    Args:
        user_id: User's unique identifier (string UUID from Better Auth)
        status: Filter by completion status (default: "all")
            - "all": All tasks
            - "pending": Incomplete tasks only
            - "completed": Completed tasks only
        priority: Filter by priority level (optional: "low", "medium", "high")
        search: Search keyword for title and description (optional)

    Returns:
        dict: Task list result
            - tasks (list): Array of task objects
            - count (int): Total number of tasks returned

    Example:
        >>> list_tasks(user_id="user-123", status="pending")
        {"tasks": [{"id": "...", "title": "Buy groceries", ...}], "count": 1}
    """
    from src.services.task_service import TaskService
    from src.schemas.common import SortBy

    # Get database session
    session = next(get_session())

    try:
        # Map status string to boolean for TaskService
        completed_filter = None  # None means all tasks
        if status == "pending":
            completed_filter = False
        elif status == "completed":
            completed_filter = True

        # Map priority string to PriorityType enum
        priority_map = {
            "high": "High",
            "medium": "Medium",
            "low": "Low",
        }
        priority_filter = priority_map.get(priority.lower()) if priority else None

        # Get tasks using task_service
        # Note: get_user_tasks returns (tasks: List[TaskResponse], total: int)
        tasks, total = TaskService.get_user_tasks(
            session=session,
            user_id=user_id,
            search=search,
            completed=completed_filter,
            priority=priority_filter,
            limit=100,
        )

        # Convert tasks to dict format
        task_list = []
        for task in tasks:
            task_list.append({
                "id": str(task.id),
                "title": task.title,
                "description": task.description,
                "completed": task.completed,
                "priority": task.priority.value if hasattr(task.priority, 'value') else str(task.priority),
                "due_date": task.due_date.isoformat() if task.due_date else None,
                "created_at": task.created_at.isoformat(),
                "updated_at": task.updated_at.isoformat(),
                "tags": task.tags,
            })

        # Return MCP tool response
        return {
            "tasks": task_list,
            "count": len(task_list),
            "total": total,
        }

    except Exception as e:
        return {
            "tasks": [],
            "count": 0,
            "total": 0,
            "message": f"Failed to list tasks: {str(e)}",
        }

    finally:
        session.close()


@mcp.tool()
def complete_task(
    user_id: str,
    task_id: str,
) -> dict:
    """
    Mark a task as complete.

    MCP Tool Contract:
    - Purpose: Toggle task completion status to completed
    - Stateless: Updates database and returns result
    - User Isolation: Enforced via user_id parameter

    Args:
        user_id: User's unique identifier (string UUID from Better Auth)
        task_id: Task ID to mark as complete

    Returns:
        dict: Task completion result
            - task_id (str): Updated task ID
            - status (str): "completed"
            - title (str): Task title

    Example:
        >>> complete_task(user_id="user-123", task_id="550e8400-...")
        {"task_id": "...", "status": "completed", "title": "Call dentist"}
    """
    from uuid import UUID
    from src.services.task_service import TaskService

    # Validate task_id is a valid UUID
    try:
        task_uuid = UUID(task_id)
    except ValueError:
        return {
            "task_id": task_id,
            "status": "error",
            "message": "Invalid task_id format. Must be a valid UUID.",
        }

    # Get database session
    session = next(get_session())

    try:
        # Get task first to get the title
        task = TaskService.get_task_by_id(session, task_uuid, user_id)
        if not task:
            return {
                "task_id": task_id,
                "status": "error",
                "message": "Task not found or you don't have permission to access it.",
            }

        # Mark task as complete using task_service
        from src.models.task import TaskUpdate
        updated_task = TaskService.update_task(
            session=session,
            task_id=task_uuid,
            user_id=user_id,
            task_update=TaskUpdate(completed=True)
        )

        # Return MCP tool response
        return {
            "task_id": task_id,
            "status": "completed",
            "title": updated_task.title if updated_task else task.title,
        }

    except Exception as e:
        return {
            "task_id": task_id,
            "status": "error",
            "message": f"Failed to complete task: {str(e)}",
        }

    finally:
        session.close()


@mcp.tool()
def delete_task(
    user_id: str,
    task_id: str,
) -> dict:
    """
    Remove a task from the todo list.

    MCP Tool Contract:
    - Purpose: Permanently delete task from database
    - Stateless: Deletes from database and returns confirmation
    - User Isolation: Enforced via user_id parameter

    Args:
        user_id: User's unique identifier (string UUID from Better Auth)
        task_id: Task ID to delete

    Returns:
        dict: Task deletion result
            - task_id (str): Deleted task ID
            - status (str): "deleted"
            - title (str): Task title (from pre-deletion state)

    Example:
        >>> delete_task(user_id="user-123", task_id="550e8400-...")
        {"task_id": "...", "status": "deleted", "title": "Old reminder"}
    """
    from uuid import UUID
    from src.services.task_service import TaskService

    # Validate task_id is a valid UUID
    try:
        task_uuid = UUID(task_id)
    except ValueError:
        return {
            "task_id": task_id,
            "status": "error",
            "message": "Invalid task_id format. Must be a valid UUID.",
        }

    # Get database session
    session = next(get_session())

    try:
        # Get task details before deletion (for response)
        task = TaskService.get_task_by_id(session, task_uuid, user_id)

        if not task:
            return {
                "task_id": task_id,
                "status": "error",
                "message": "Task not found or you don't have permission to access it.",
            }

        task_title = task.title

        # Delete task using task_service
        deleted = TaskService.delete_task(session, task_uuid, user_id)

        if deleted:
            return {
                "task_id": task_id,
                "status": "deleted",
                "title": task_title,
            }
        else:
            return {
                "task_id": task_id,
                "status": "error",
                "message": "Failed to delete task.",
            }

    except Exception as e:
        return {
            "task_id": task_id,
            "status": "error",
            "message": f"Failed to delete task: {str(e)}",
        }

    finally:
        session.close()


@mcp.tool()
def update_task(
    user_id: str,
    task_id: str,
    title: Optional[str] = None,
    description: Optional[str] = None,
    priority: Optional[str] = None,
    completed: Optional[bool] = None,
    tags: Optional[List[str]] = None,
) -> dict:
    """
    Modify task details including title, description, priority, completion status, and tags.

    MCP Tool Contract:
    - Purpose: Update task details
    - Stateless: Updates database and returns result
    - User Isolation: Enforced via user_id parameter
    - Partial Updates: At least one field must be provided

    Args:
        user_id: User's unique identifier (string UUID from Better Auth)
        task_id: Task ID to update
        title: New task title (optional, max 200 characters)
        description: New task description (optional, max 1000 characters)
        priority: New priority (optional: "low", "medium", "high")
        completed: New completion status (optional: true/false)
        tags: New list of tags (optional, replaces existing tags)

    Returns:
        dict: Task update result
            - task_id (str): Updated task ID
            - status (str): "updated"
            - title (str): Updated task title
            - priority (str): Updated priority level
            - tags (list): Updated tags list

    Example:
        >>> update_task(user_id="user-123", task_id="550e8400-...", title="Buy groceries and fruits", priority="high")
        {"task_id": "...", "status": "updated", "title": "...", "priority": "high"}
        >>> update_task(user_id="user-123", task_id="550e8400-...", tags=["work", "urgent"])
        {"task_id": "...", "status": "updated", "tags": ["work", "urgent"]}
    """
    from uuid import UUID
    from src.services.task_service import TaskService
    from src.models.task import TaskUpdate, PriorityType

    # Validate: at least one field must be provided
    if title is None and description is None and priority is None and completed is None and tags is None:
        return {
            "task_id": task_id,
            "status": "error",
            "message": "At least one of 'title', 'description', 'priority', 'completed', or 'tags' must be provided",
        }

    # Validate task_id is a valid UUID
    try:
        task_uuid = UUID(task_id)
    except ValueError:
        return {
            "task_id": task_id,
            "status": "error",
            "message": "Invalid task_id format. Must be a valid UUID.",
        }

    # Get database session
    session = next(get_session())

    try:
        # Map priority string to PriorityType enum
        priority_map = {
            "high": PriorityType.High,
            "medium": PriorityType.Medium,
            "low": PriorityType.Low,
        }

        # Create update request
        update_data = TaskUpdate()

        if title is not None:
            update_data.title = title

        if description is not None:
            update_data.description = description

        if priority is not None:
            normalized = priority.lower()
            if normalized in ["low", "medium", "high"]:
                update_data.priority = priority_map[normalized]
            else:
                return {
                    "task_id": task_id,
                    "status": "error",
                    "message": "Priority must be one of: 'low', 'medium', 'high'",
                }

        if completed is not None:
            update_data.completed = completed

        if tags is not None:
            update_data.tags = tags

        # Update task using task_service
        updated_task = TaskService.update_task(
            session=session,
            task_id=task_uuid,
            user_id=user_id,
            task_update=update_data
        )

        if updated_task is None:
            return {
                "task_id": task_id,
                "status": "error",
                "message": "Task not found or you don't have permission to access it.",
            }

        # Return MCP tool response
        return {
            "task_id": task_id,
            "status": "updated",
            "title": updated_task.title,
            "priority": updated_task.priority.value if hasattr(updated_task.priority, 'value') else str(updated_task.priority),
            "completed": updated_task.completed,
            "tags": updated_task.tags if hasattr(updated_task, 'tags') else [],
        }

    except Exception as e:
        return {
            "task_id": task_id,
            "status": "error",
            "message": f"Failed to update task: {str(e)}",
        }

    finally:
        session.close()


@mcp.tool()
def add_tags(
    user_id: str,
    task_id: str,
    tags: List[str],
) -> dict:
    """
    Add tags to a task. This is a convenience tool for adding tags without modifying other fields.

    MCP Tool Contract:
    - Purpose: Add tags to a task
    - Stateless: Updates database and returns result
    - User Isolation: Enforced via user_id parameter

    Args:
        user_id: User's unique identifier (string UUID from Better Auth)
        task_id: Task ID to update
        tags: List of tag names to add to the task (replaces existing tags)

    Returns:
        dict: Tag update result
            - task_id (str): Updated task ID
            - status (str): "updated"
            - tags (list): Updated tags list

    Example:
        >>> add_tags(user_id="user-123", task_id="550e8400-...", tags=["dedication", "gratitude"])
        {"task_id": "...", "status": "updated", "tags": ["dedication", "gratitude"]}
    """
    from uuid import UUID
    from src.services.task_service import TaskService
    from src.models.task import TaskUpdate

    # Validate task_id is a valid UUID
    try:
        task_uuid = UUID(task_id)
    except ValueError:
        return {
            "task_id": task_id,
            "status": "error",
            "message": "Invalid task_id format. Must be a valid UUID.",
        }

    # Get database session
    session = next(get_session())

    try:
        # Get task first to verify it exists
        task = TaskService.get_task_by_id(session, task_uuid, user_id)
        if not task:
            return {
                "task_id": task_id,
                "status": "error",
                "message": "Task not found or you don't have permission to access it.",
            }

        # Update task with new tags
        update_data = TaskUpdate(tags=tags)

        updated_task = TaskService.update_task(
            session=session,
            task_id=task_uuid,
            user_id=user_id,
            task_update=update_data
        )

        if updated_task is None:
            return {
                "task_id": task_id,
                "status": "error",
                "message": "Failed to update task tags.",
            }

        # Return MCP tool response
        return {
            "task_id": task_id,
            "status": "updated",
            "title": updated_task.title,
            "tags": updated_task.tags if hasattr(updated_task, 'tags') else [],
        }

    except Exception as e:
        return {
            "task_id": task_id,
            "status": "error",
            "message": f"Failed to add tags: {str(e)}",
        }

    finally:
        session.close()


@mcp.tool()
def set_priority(
    user_id: str,
    task_id: str,
    priority: str,
) -> dict:
    """
    Set or update a task's priority level.

    MCP Tool Contract:
    - Purpose: Update task priority level
    - Stateless: Updates database and returns result
    - User Isolation: Enforced via user_id parameter

    Args:
        user_id: User's unique identifier (string UUID from Better Auth)
        task_id: Task ID to update
        priority: New priority level ("low", "medium", "high")

    Returns:
        dict: Priority update result
            - task_id (str): Updated task ID
            - status (str): "updated"
            - priority (str): New priority level
            - title (str): Task title

    Example:
        >>> set_priority(user_id="user-123", task_id="550e8400-...", priority="high")
        {"task_id": "...", "status": "updated", "priority": "high", "title": "Call dentist"}
    """
    from uuid import UUID
    from src.services.task_service import TaskService
    from src.models.task import TaskUpdate, PriorityType

    # Validate priority value
    normalized_priority = priority.lower()
    if normalized_priority not in ["low", "medium", "high"]:
        return {
            "task_id": task_id,
            "status": "error",
            "message": "Priority must be one of: 'low', 'medium', 'high'",
        }

    # Validate task_id is a valid UUID
    try:
        task_uuid = UUID(task_id)
    except ValueError:
        return {
            "task_id": task_id,
            "status": "error",
            "message": "Invalid task_id format. Must be a valid UUID.",
        }

    # Map priority string to PriorityType enum
    priority_map = {
        "high": PriorityType.High,
        "medium": PriorityType.Medium,
        "low": PriorityType.Low,
    }

    # Get database session
    session = next(get_session())

    try:
        # Get task first to get the title
        task = TaskService.get_task_by_id(session, task_uuid, user_id)
        if not task:
            return {
                "task_id": task_id,
                "status": "error",
                "message": "Task not found or you don't have permission to access it.",
            }

        # Use update_task with priority parameter
        updated_task = TaskService.update_task(
            session=session,
            task_id=task_uuid,
            user_id=user_id,
            task_update=TaskUpdate(priority=priority_map[normalized_priority])
        )

        # Return MCP tool response
        return {
            "task_id": task_id,
            "status": "updated",
            "priority": normalized_priority,
            "title": updated_task.title if updated_task else task.title,
        }

    except Exception as e:
        return {
            "task_id": task_id,
            "status": "error",
            "message": f"Failed to set priority: {str(e)}",
        }

    finally:
        session.close()


@mcp.tool()
def get_task(
    user_id: str,
    task_id: str,
) -> dict:
    """
    Get a specific task by ID.

    MCP Tool Contract:
    - Purpose: Retrieve a single task
    - Stateless: Queries database and returns result
    - User Isolation: Enforced via user_id parameter

    Args:
        user_id: User's unique identifier (string UUID from Better Auth)
        task_id: Task ID to retrieve

    Returns:
        dict: Task object or error message

    Example:
        >>> get_task(user_id="user-123", task_id="550e8400-...")
        {"task": {"id": "...", "title": "Buy groceries", ...}}
    """
    from uuid import UUID
    from src.services.task_service import TaskService

    # Validate task_id is a valid UUID
    try:
        task_uuid = UUID(task_id)
    except ValueError:
        return {
            "task": None,
            "message": "Invalid task_id format. Must be a valid UUID.",
        }

    # Get database session
    session = next(get_session())

    try:
        # Get task using task_service
        task = TaskService.get_task_by_id(session, task_uuid, user_id)

        if not task:
            return {
                "task": None,
                "message": "Task not found or you don't have permission to access it.",
            }

        # Convert task to dict format
        task_dict = {
            "id": str(task.id),
            "title": task.title,
            "description": task.description,
            "completed": task.completed,
            "priority": task.priority.value if hasattr(task.priority, 'value') else str(task.priority),
            "due_date": task.due_date.isoformat() if task.due_date else None,
            "created_at": task.created_at.isoformat(),
            "updated_at": task.updated_at.isoformat(),
        }

        # Return MCP tool response
        return {
            "task": task_dict,
            "message": "Task retrieved successfully",
        }

    except Exception as e:
        return {
            "task": None,
            "message": f"Failed to get task: {str(e)}",
        }

    finally:
        session.close()


@mcp.tool()
def bulk_update_tasks(
    user_id: str,
    action: Literal["complete", "delete", "set_priority"] = "complete",
    filter_status: Literal["all", "pending", "completed", "overdue"] = "pending",
    new_priority: Optional[str] = None,
) -> dict:
    """
    Perform bulk operations on multiple tasks at once.

    MCP Tool Contract:
    - Purpose: Update multiple tasks efficiently in a single operation
    - Stateless: All state persisted to database
    - User Isolation: Enforced via user_id parameter
    - Efficiency: Uses service layer methods for optimal performance

    Args:
        user_id: User's unique identifier (string UUID from Better Auth)
        action: Bulk operation to perform (default: "complete")
            - "complete": Mark all matching tasks as completed
            - "delete": Delete all matching tasks
            - "set_priority": Change priority of all matching tasks (requires new_priority)
        filter_status: Filter which tasks to update (default: "pending")
            - "pending": Only incomplete tasks
            - "completed": Only complete tasks
            - "all": All tasks
            - "overdue": Only tasks past their due date (pending only)
        new_priority: New priority level for "set_priority" action ("low", "medium", "high")

    Returns:
        dict: Bulk operation result
            - count (int): Number of tasks affected
            - action (str): Action performed ("completed" | "deleted" | "priority_updated")
            - message (str): Human-readable result message

    Example:
        >>> bulk_update_tasks(user_id="user-123", action="complete", filter_status="pending")
        {"count": 5, "action": "completed", "message": "Marked 5 task(s) as completed"}

        >>> bulk_update_tasks(user_id="user-123", action="delete", filter_status="completed")
        {"count": 3, "action": "deleted", "message": "Deleted 3 task(s)"}

        >>> bulk_update_tasks(user_id="user-123", action="set_priority", filter_status="overdue", new_priority="high")
        {"count": 2, "action": "priority_updated", "message": "Updated priority to high for 2 task(s)"}
    """
    from src.services.task_service import TaskService
    from datetime import date

    # Validate set_priority action has new_priority
    if action == "set_priority" and not new_priority:
        return {
            "count": 0,
            "action": action,
            "message": "new_priority is required for set_priority action",
        }

    if new_priority and new_priority.lower() not in ["low", "medium", "high"]:
        return {
            "count": 0,
            "action": action,
            "message": "new_priority must be one of: 'low', 'medium', 'high'",
        }

    # Get database session
    session = next(get_session())

    try:
        # Map status filter to TaskService parameters
        completed_filter = None
        filter_overdue = False
        if filter_status == "pending":
            completed_filter = False
        elif filter_status == "completed":
            completed_filter = True
        elif filter_status == "overdue":
            completed_filter = False  # Only pending tasks can be overdue
            filter_overdue = True
        # filter_status == "all" -> completed_filter = None (no filter)

        # First, get count of tasks that will be affected
        # This also validates user_id and ensures we only count user's tasks
        # Note: get_user_tasks returns (tasks: List[TaskResponse], total: int)
        tasks, _ = TaskService.get_user_tasks(
            session=session,
            user_id=user_id,
            search=None,
            completed=completed_filter,
            priority=None,
            limit=1000,  # High limit to get accurate count
        )

        # Filter overdue tasks if requested
        if filter_overdue:
            today = date.today()
            tasks = [t for t in tasks if t.due_date and t.due_date < today]

        count = len(tasks)

        if count == 0:
            return {
                "count": 0,
                "action": action,
                "message": f"No {filter_status} tasks found to {action}",
            }

        # Perform bulk action based on action type
        if action == "complete":
            # Use TaskService to update each task
            # Note: For production scale, this could be optimized with bulk SQL
            updated_count = 0
            from src.models.task import TaskUpdate

            for task in tasks:
                try:
                    TaskService.update_task(
                        session=session,
                        task_id=task.id,
                        user_id=user_id,
                        task_update=TaskUpdate(completed=True)
                    )
                    updated_count += 1
                except Exception:
                    # Skip tasks that fail (e.g., already completed)
                    continue

            return {
                "count": updated_count,
                "action": "completed",
                "message": f"Marked {updated_count} task(s) as completed",
            }

        elif action == "delete":
            # Use TaskService to delete each task
            deleted_count = 0

            for task in tasks:
                try:
                    deleted = TaskService.delete_task(
                        session=session,
                        task_id=task.id,
                        user_id=user_id
                    )
                    if deleted:
                        deleted_count += 1
                except Exception:
                    # Skip tasks that fail to delete
                    continue

            return {
                "count": deleted_count,
                "action": "deleted",
                "message": f"Deleted {deleted_count} task(s)",
            }

        elif action == "set_priority":
            # Use TaskService to update priority for each task
            from src.models.task import TaskUpdate, PriorityType

            priority_map = {
                "high": PriorityType.High,
                "medium": PriorityType.Medium,
                "low": PriorityType.Low,
            }
            priority_enum = priority_map[new_priority.lower()]

            updated_count = 0
            for task in tasks:
                try:
                    TaskService.update_task(
                        session=session,
                        task_id=task.id,
                        user_id=user_id,
                        task_update=TaskUpdate(priority=priority_enum)
                    )
                    updated_count += 1
                except Exception:
                    # Skip tasks that fail to update
                    continue

            return {
                "count": updated_count,
                "action": "priority_updated",
                "message": f"Updated priority to {new_priority} for {updated_count} task(s)",
            }

        else:
            return {
                "count": 0,
                "action": action,
                "message": f"Unsupported bulk action: {action}",
            }

    except Exception as e:
        return {
            "count": 0,
            "action": action,
            "message": f"Bulk operation failed: {str(e)}",
        }

    finally:
        session.close()


@mcp.tool()
def list_tasks_by_priority(
    user_id: str,
    priority: str,
    status: Literal["all", "pending", "completed"] = "all",
) -> dict:
    """
    Retrieve tasks filtered by priority level.

    MCP Tool Contract:
    - Purpose: List tasks filtered by priority and optional completion status
    - Stateless: Queries database on each invocation
    - User Isolation: Enforced via user_id parameter

    Args:
        user_id: User's unique identifier (string UUID from Better Auth)
        priority: Priority level to filter ("low", "medium", "high")
        status: Additional filter by completion status (default: "all")
            - "all": All tasks at this priority
            - "pending": Incomplete tasks only
            - "completed": Completed tasks only

    Returns:
        dict: Filtered task list result
            - tasks (list): Array of task objects matching priority
                - id (str): Task UUID
                - title (str): Task title
                - priority (str): Priority level
                - completed (bool): Completion status
                - description (str|None): Task description
                - due_date (str|None): ISO 8601 date
                - created_at (str): ISO 8601 timestamp
                - updated_at (str): ISO 8601 timestamp
            - count (int): Total number of tasks returned
            - priority (str): Filter priority level
            - status (str): Filter status

    Example:
        >>> list_tasks_by_priority(user_id="user-123", priority="high", status="pending")
        {
            "tasks": [
                {"id": "550e8400-...", "title": "Call dentist", "priority": "High", "completed": False, ...},
                {"id": "6ba7b810-...", "title": "Fix bug", "priority": "High", "completed": False, ...}
            ],
            "count": 2,
            "priority": "high",
            "status": "pending"
        }
    """
    from src.services.task_service import TaskService

    # Get database session
    session = next(get_session())

    try:
        # Validate priority value
        normalized_priority = priority.lower()
        if normalized_priority not in ["low", "medium", "high"]:
            return {
                "tasks": [],
                "count": 0,
                "priority": priority,
                "status": status,
                "message": "Priority must be one of: 'low', 'medium', 'high'",
            }

        # Map priority string to PriorityType enum format (capitalized)
        priority_map = {
            "high": "High",
            "medium": "Medium",
            "low": "Low",
        }
        priority_filter = priority_map[normalized_priority]

        # Map status filter to completed boolean
        completed_filter = None
        if status == "pending":
            completed_filter = False
        elif status == "completed":
            completed_filter = True
        # status == "all" -> completed_filter = None

        # Get tasks using task_service with priority filter
        # Note: get_user_tasks returns (tasks: List[TaskResponse], total: int)
        tasks, _ = TaskService.get_user_tasks(
            session=session,
            user_id=user_id,
            search=None,
            completed=completed_filter,
            priority=priority_filter,
            limit=100,
        )

        # Convert tasks to dict format
        task_list = [
            {
                "id": str(task.id),
                "title": task.title,
                "priority": task.priority.value if hasattr(task.priority, 'value') else str(task.priority),
                "completed": task.completed,
                "description": task.description,
                "due_date": task.due_date.isoformat() if task.due_date else None,
                "created_at": task.created_at.isoformat(),
                "updated_at": task.updated_at.isoformat(),
            }
            for task in tasks
        ]

        # Return MCP tool response
        return {
            "tasks": task_list,
            "count": len(task_list),
            "priority": normalized_priority,
            "status": status,
        }

    except Exception as e:
        return {
            "tasks": [],
            "count": 0,
            "priority": priority,
            "status": status,
            "message": f"Failed to list tasks by priority: {str(e)}",
        }

    finally:
        session.close()
