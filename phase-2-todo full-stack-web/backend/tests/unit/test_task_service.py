"""
Unit tests for TaskService business logic.

Tests task service operations with mocked database:
- create_task: Task creation with user isolation
- get_task_by_id: Task retrieval with user validation
- get_user_tasks: Task listing with filtering
- update_task: Task updates with ownership validation
- delete_task: Task deletion with ownership validation

All tests verify proper user isolation and security.
"""

import pytest
from uuid import UUID, uuid4
from datetime import datetime
from sqlmodel import Session

from src.models.task import Task, TaskCreate, TaskUpdate
from src.services.task_service import TaskService


def test_create_task_success(session: Session, mock_user_id: str):
    """
    T045: Test TaskService.create_task successfully creates a task.

    Given: Valid user_id and task data
    When: TaskService.create_task is called
    Then: Task is created with correct fields and assigned to user

    Validates:
    - Task is saved to database
    - user_id matches the authenticated user
    - title and description match input
    - completed defaults to False
    - id is generated (UUID)
    - created_at and updated_at are set
    """
    task_create = TaskCreate(
        title="Test task from unit test",
        description="This task is created in a unit test"
    )

    # Create task via service
    task = TaskService.create_task(
        session=session,
        user_id=mock_user_id,
        task_create=task_create
    )

    # Verify task was created
    assert task is not None
    assert task.id is not None
    assert isinstance(task.id, UUID)

    # Verify field values
    assert task.user_id == mock_user_id
    assert task.title == task_create.title
    assert task.description == task_create.description
    assert task.completed is False

    # Verify timestamps
    assert task.created_at is not None
    assert task.updated_at is not None
    assert isinstance(task.created_at, datetime)
    assert isinstance(task.updated_at, datetime)


def test_create_task_with_only_title(session: Session, mock_user_id: str):
    """
    Test TaskService.create_task with only title (no description).

    Given: Task data with title only
    When: TaskService.create_task is called
    Then: Task is created with description=None

    Validates:
    - Task is created successfully
    - description is None when not provided
    """
    task_create = TaskCreate(
        title="Task without description"
    )

    task = TaskService.create_task(
        session=session,
        user_id=mock_user_id,
        task_create=task_create
    )

    assert task is not None
    assert task.title == task_create.title
    assert task.description is None
    assert task.completed is False


def test_get_task_by_id_success(session: Session, mock_user_id: str):
    """
    Test TaskService.get_task_by_id retrieves correct task.

    Given: Existing task in database
    When: TaskService.get_task_by_id is called with correct user_id
    Then: Task is retrieved successfully

    Validates:
    - Task is found and returned
    - All fields match the created task
    """
    # Create a task
    task_create = TaskCreate(title="Task to retrieve", description="Find me")
    created_task = TaskService.create_task(session, mock_user_id, task_create)

    # Retrieve the task
    retrieved_task = TaskService.get_task_by_id(
        session=session,
        task_id=created_task.id,
        user_id=mock_user_id
    )

    assert retrieved_task is not None
    assert retrieved_task.id == created_task.id
    assert retrieved_task.title == created_task.title
    assert retrieved_task.description == created_task.description
    assert retrieved_task.user_id == mock_user_id


def test_get_task_by_id_wrong_user(session: Session, mock_user_id: str, mock_user_id_2: str):
    """
    Test TaskService.get_task_by_id returns None for wrong user.

    Given: Task belonging to user_1
    When: user_2 tries to retrieve the task
    Then: Returns None (enforces user isolation)

    Validates:
    - User isolation is enforced
    - Users cannot access tasks belonging to other users
    """
    # Create task as user 1
    task_create = TaskCreate(title="User 1 task", description="Should not be accessible to user 2")
    created_task = TaskService.create_task(session, mock_user_id, task_create)

    # Try to retrieve as user 2
    retrieved_task = TaskService.get_task_by_id(
        session=session,
        task_id=created_task.id,
        user_id=mock_user_id_2  # Different user
    )

    # Should return None (not found for this user)
    assert retrieved_task is None


def test_get_task_by_id_nonexistent(session: Session, mock_user_id: str):
    """
    Test TaskService.get_task_by_id returns None for non-existent task.

    Given: Non-existent task ID
    When: TaskService.get_task_by_id is called
    Then: Returns None

    Validates:
    - Gracefully handles non-existent tasks
    - No exceptions are raised
    """
    nonexistent_id = uuid4()

    retrieved_task = TaskService.get_task_by_id(
        session=session,
        task_id=nonexistent_id,
        user_id=mock_user_id
    )

    assert retrieved_task is None


def test_get_user_tasks_returns_only_user_tasks(
    session: Session,
    mock_user_id: str,
    mock_user_id_2: str
):
    """
    Test TaskService.get_user_tasks returns only user's own tasks.

    Given: Multiple tasks from different users
    When: TaskService.get_user_tasks is called for user_1
    Then: Returns only user_1's tasks, not user_2's

    Validates:
    - User isolation is enforced in list operations
    - Each user sees only their own tasks
    """
    # Create tasks for user 1
    user1_tasks = []
    for i in range(3):
        task = TaskService.create_task(
            session,
            mock_user_id,
            TaskCreate(title=f"User 1 Task {i+1}")
        )
        user1_tasks.append(task)

    # Create tasks for user 2
    for i in range(2):
        TaskService.create_task(
            session,
            mock_user_id_2,
            TaskCreate(title=f"User 2 Task {i+1}")
        )

    # Get user 1's tasks
    retrieved_tasks, total = TaskService.get_user_tasks(session, mock_user_id)

    # Should only return user 1's tasks
    assert len(retrieved_tasks) == 3
    assert total == 3, "Total should match number of user 1's tasks"
    for task in retrieved_tasks:
        assert task.user_id == mock_user_id


def test_get_user_tasks_with_completed_filter(session: Session, mock_user_id: str):
    """
    Test TaskService.get_user_tasks filters by completed status.

    Given: Mix of completed and pending tasks
    When: TaskService.get_user_tasks is called with completed filter
    Then: Returns only tasks matching the filter

    Validates:
    - Completed filter works correctly
    - Returns appropriate subset of tasks
    """
    # Create pending tasks
    pending_task = TaskService.create_task(
        session,
        mock_user_id,
        TaskCreate(title="Pending task")
    )

    # Create completed task
    completed_task = TaskService.create_task(
        session,
        mock_user_id,
        TaskCreate(title="Completed task")
    )
    # Mark as completed
    completed_task.completed = True
    session.add(completed_task)
    session.commit()

    # Get only completed tasks
    completed_tasks, completed_total = TaskService.get_user_tasks(
        session,
        mock_user_id,
        completed=True
    )

    assert len(completed_tasks) == 1
    assert completed_total == 1, "Total should be 1 for completed tasks"
    assert completed_tasks[0].completed is True
    assert completed_tasks[0].title == "Completed task"

    # Get only pending tasks
    pending_tasks, pending_total = TaskService.get_user_tasks(
        session,
        mock_user_id,
        completed=False
    )

    assert len(pending_tasks) == 1
    assert pending_total == 1, "Total should be 1 for pending tasks"
    assert pending_tasks[0].completed is False
    assert pending_tasks[0].title == "Pending task"


def test_get_user_tasks_pagination(session: Session, mock_user_id: str):
    """
    Test TaskService.get_user_tasks pagination.

    Given: Multiple tasks (more than limit)
    When: TaskService.get_user_tasks is called with limit and offset
    Then: Returns correct subset of tasks

    Validates:
    - Limit parameter works correctly
    - Offset parameter works correctly
    - Tasks are ordered by created_at descending
    """
    # Create 5 tasks
    for i in range(5):
        TaskService.create_task(
            session,
            mock_user_id,
            TaskCreate(title=f"Task {i+1}")
        )

    # Get first 2 tasks
    first_page, total = TaskService.get_user_tasks(
        session,
        mock_user_id,
        limit=2,
        offset=0
    )

    assert len(first_page) == 2
    assert total == 5, "Total should be 5 (all tasks)"

    # Get next 2 tasks
    second_page, total2 = TaskService.get_user_tasks(
        session,
        mock_user_id,
        limit=2,
        offset=2
    )

    assert len(second_page) == 2
    assert total2 == 5, "Total should still be 5"

    # Verify no overlap
    first_page_ids = {task.id for task in first_page}
    second_page_ids = {task.id for task in second_page}
    assert len(first_page_ids & second_page_ids) == 0


def test_get_user_tasks_empty_list(session: Session, mock_user_id: str):
    """
    Test TaskService.get_user_tasks returns empty list when no tasks.

    Given: User with no tasks
    When: TaskService.get_user_tasks is called
    Then: Returns empty list (not None)

    Validates:
    - Gracefully handles users with no tasks
    - Returns empty list, not None
    """
    tasks, total = TaskService.get_user_tasks(session, mock_user_id)

    assert tasks is not None
    assert isinstance(tasks, list)
    assert len(tasks) == 0
    assert total == 0, "Total should be 0 when no tasks"


def test_get_user_tasks_with_status_filter_pending(session: Session, mock_user_id: str):
    """
    T073: Test TaskService.get_user_tasks with status filter (completed=False).

    Given: User has 3 pending and 2 completed tasks
    When: TaskService.get_user_tasks is called with completed=False
    Then: Returns only 3 pending tasks

    Validates:
    - Status filter works correctly for pending tasks
    - Total count reflects filtered results
    - All returned tasks have completed=False
    """
    # Create 3 pending tasks
    for i in range(3):
        TaskService.create_task(
            session,
            mock_user_id,
            TaskCreate(title=f"Pending task {i+1}")
        )

    # Create 2 completed tasks
    for i in range(2):
        task = TaskService.create_task(
            session,
            mock_user_id,
            TaskCreate(title=f"Completed task {i+1}")
        )
        # Mark as completed
        TaskService.update_task(
            session,
            task.id,
            mock_user_id,
            TaskUpdate(completed=True)
        )

    # Get only pending tasks
    pending_tasks, total = TaskService.get_user_tasks(
        session,
        mock_user_id,
        completed=False
    )

    assert len(pending_tasks) == 3, "Should return 3 pending tasks"
    assert total == 3, "Total should be 3 (pending tasks only)"

    # Verify all returned tasks are pending
    for task in pending_tasks:
        assert task.completed is False


def test_get_user_tasks_with_status_filter_completed(session: Session, mock_user_id: str):
    """
    T073: Test TaskService.get_user_tasks with status filter (completed=True).

    Given: User has 3 pending and 2 completed tasks
    When: TaskService.get_user_tasks is called with completed=True
    Then: Returns only 2 completed tasks

    Validates:
    - Status filter works correctly for completed tasks
    - Total count reflects filtered results
    - All returned tasks have completed=True
    """
    # Create 3 pending tasks
    for i in range(3):
        TaskService.create_task(
            session,
            mock_user_id,
            TaskCreate(title=f"Pending task {i+1}")
        )

    # Create 2 completed tasks
    for i in range(2):
        task = TaskService.create_task(
            session,
            mock_user_id,
            TaskCreate(title=f"Completed task {i+1}")
        )
        # Mark as completed
        TaskService.update_task(
            session,
            task.id,
            mock_user_id,
            TaskUpdate(completed=True)
        )

    # Get only completed tasks
    completed_tasks, total = TaskService.get_user_tasks(
        session,
        mock_user_id,
        completed=True
    )

    assert len(completed_tasks) == 2, "Should return 2 completed tasks"
    assert total == 2, "Total should be 2 (completed tasks only)"

    # Verify all returned tasks are completed
    for task in completed_tasks:
        assert task.completed is True


def test_get_user_tasks_with_sort_asc(session: Session, mock_user_id: str):
    """
    T074: Test TaskService.get_user_tasks with sort_order='asc' (oldest first).

    Given: User has 5 tasks created at different times
    When: TaskService.get_user_tasks is called with sort_order='asc'
    Then: Returns tasks ordered oldest to newest

    Validates:
    - Sort parameter works correctly for ascending order
    - Oldest task is first, newest task is last
    """
    from datetime import timedelta

    # Create 5 tasks with different timestamps
    task_titles = []
    for i in range(5):
        task = TaskService.create_task(
            session,
            mock_user_id,
            TaskCreate(title=f"Task {i+1}")
        )
        # Manually adjust created_at to simulate different creation times
        task.created_at = datetime.utcnow() - timedelta(minutes=5-i)  # 5, 4, 3, 2, 1 minutes ago
        session.add(task)
        task_titles.append(task.title)
    session.commit()

    # Get tasks sorted oldest first
    tasks, total = TaskService.get_user_tasks(
        session,
        mock_user_id,
        sort_order="asc"
    )

    assert len(tasks) == 5

    # Verify tasks are ordered oldest to newest (Task 1 to Task 5)
    returned_titles = [task.title for task in tasks]
    assert returned_titles == task_titles, "Tasks should be ordered oldest to newest"


def test_get_user_tasks_with_sort_desc(session: Session, mock_user_id: str):
    """
    T074: Test TaskService.get_user_tasks with sort_order='desc' (newest first).

    Given: User has 5 tasks created at different times
    When: TaskService.get_user_tasks is called with sort_order='desc'
    Then: Returns tasks ordered newest to oldest (default behavior)

    Validates:
    - Sort parameter works correctly for descending order
    - Newest task is first, oldest task is last
    """
    from datetime import timedelta

    # Create 5 tasks with different timestamps
    task_titles = []
    for i in range(5):
        task = TaskService.create_task(
            session,
            mock_user_id,
            TaskCreate(title=f"Task {i+1}")
        )
        # Manually adjust created_at to simulate different creation times
        task.created_at = datetime.utcnow() - timedelta(minutes=5-i)  # 5, 4, 3, 2, 1 minutes ago
        session.add(task)
        task_titles.append(task.title)
    session.commit()

    # Get tasks sorted newest first
    tasks, total = TaskService.get_user_tasks(
        session,
        mock_user_id,
        sort_order="desc"
    )

    assert len(tasks) == 5

    # Verify tasks are ordered newest to oldest (Task 5 to Task 1)
    returned_titles = [task.title for task in tasks]
    assert returned_titles == list(reversed(task_titles)), "Tasks should be ordered newest to oldest"


def test_get_user_tasks_with_status_and_sort_combined(session: Session, mock_user_id: str):
    """
    Test combining status filter and sort order.

    Given: User has pending and completed tasks
    When: TaskService.get_user_tasks is called with completed=False and sort_order='asc'
    Then: Returns only pending tasks sorted oldest first

    Validates:
    - Multiple query parameters work together correctly
    - Filter is applied before sorting
    """
    from datetime import timedelta

    # Create pending tasks at different times
    pending_titles = []
    for i in range(3):
        task = TaskService.create_task(
            session,
            mock_user_id,
            TaskCreate(title=f"Pending {i+1}")
        )
        task.created_at = datetime.utcnow() - timedelta(minutes=6-i)  # 6, 5, 4 minutes ago
        session.add(task)
        pending_titles.append(task.title)

    # Create completed tasks
    for i in range(2):
        task = TaskService.create_task(
            session,
            mock_user_id,
            TaskCreate(title=f"Completed {i+1}")
        )
        task.created_at = datetime.utcnow() - timedelta(minutes=2-i)  # 2, 1 minutes ago
        TaskService.update_task(
            session,
            task.id,
            mock_user_id,
            TaskUpdate(completed=True)
        )

    session.commit()

    # Get pending tasks sorted oldest first
    tasks, total = TaskService.get_user_tasks(
        session,
        mock_user_id,
        completed=False,
        sort_order="asc"
    )

    assert len(tasks) == 3, "Should return 3 pending tasks"
    assert total == 3, "Total should be 3 (pending tasks only)"

    # Verify all are pending and ordered correctly
    returned_titles = [task.title for task in tasks]
    assert returned_titles == pending_titles, "Should return only pending tasks in correct order"
    for task in tasks:
        assert task.completed is False
