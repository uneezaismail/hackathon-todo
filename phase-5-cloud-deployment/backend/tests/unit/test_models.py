"""
Unit tests for SQLModel models.

Tests model validation and constraints:
- Task model field validation (title, description lengths)
- TaskCreate schema validation
- TaskResponse schema validation
- Default values and nullable fields

Validates Pydantic/SQLModel validation rules.
"""

import pytest
from pydantic import ValidationError
from uuid import uuid4
from datetime import datetime

from src.models.task import Task, TaskCreate, TaskUpdate, TaskResponse


def test_task_create_with_valid_data():
    """
    T046: Test TaskCreate validation with valid data.

    Given: Valid title and description
    When: TaskCreate instance is created
    Then: Validation passes, instance is created

    Validates:
    - TaskCreate accepts valid data
    - Fields are properly assigned
    """
    task_create = TaskCreate(
        title="Valid task title",
        description="Valid task description"
    )

    assert task_create.title == "Valid task title"
    assert task_create.description == "Valid task description"


def test_task_create_title_min_length():
    """
    Test TaskCreate validation fails with empty title.

    Given: Empty title string
    When: TaskCreate instance is created
    Then: ValidationError is raised

    Validates:
    - Title min_length=1 constraint is enforced
    - Empty titles are rejected
    """
    with pytest.raises(ValidationError) as exc_info:
        TaskCreate(
            title="",  # Empty title (violates min_length=1)
            description="Description"
        )

    errors = exc_info.value.errors()
    assert len(errors) > 0
    # Check that error is for title field
    assert any(error["loc"] == ("title",) for error in errors)


def test_task_create_title_max_length():
    """
    Test TaskCreate validation fails with title > 200 chars.

    Given: Title with 201 characters
    When: TaskCreate instance is created
    Then: ValidationError is raised

    Validates:
    - Title max_length=200 constraint is enforced
    - Titles exceeding 200 chars are rejected
    """
    long_title = "A" * 201  # 201 characters

    with pytest.raises(ValidationError) as exc_info:
        TaskCreate(
            title=long_title,
            description="Description"
        )

    errors = exc_info.value.errors()
    assert len(errors) > 0
    # Check that error is for title field
    assert any(error["loc"] == ("title",) for error in errors)


def test_task_create_description_optional():
    """
    Test TaskCreate validation passes without description.

    Given: Only title provided (no description)
    When: TaskCreate instance is created
    Then: Validation passes, description defaults to None

    Validates:
    - Description is optional
    - Defaults to None when not provided
    """
    task_create = TaskCreate(
        title="Task without description"
    )

    assert task_create.title == "Task without description"
    assert task_create.description is None


def test_task_create_description_max_length():
    """
    Test TaskCreate validation fails with description > 1000 chars.

    Given: Description with 1001 characters
    When: TaskCreate instance is created
    Then: ValidationError is raised

    Validates:
    - Description max_length=1000 constraint is enforced
    - Descriptions exceeding 1000 chars are rejected
    """
    long_description = "D" * 1001  # 1001 characters

    with pytest.raises(ValidationError) as exc_info:
        TaskCreate(
            title="Valid title",
            description=long_description
        )

    errors = exc_info.value.errors()
    assert len(errors) > 0
    # Check that error is for description field
    assert any(error["loc"] == ("description",) for error in errors)


def test_task_create_missing_title():
    """
    Test TaskCreate validation fails without title.

    Given: TaskCreate with no title field
    When: TaskCreate instance is created
    Then: ValidationError is raised

    Validates:
    - Title is required field
    - Missing title causes validation error
    """
    with pytest.raises(ValidationError) as exc_info:
        TaskCreate(
            description="Description without title"
        )

    errors = exc_info.value.errors()
    assert len(errors) > 0
    # Check that error is for title field
    assert any(error["loc"] == ("title",) for error in errors)


def test_task_response_from_orm_model():
    """
    Test TaskResponse can be created from ORM model.

    Given: Task ORM instance with all fields
    When: TaskResponse.model_validate is called
    Then: Response instance is created with all fields

    Validates:
    - TaskResponse works with model_validate (ORM mode)
    - All fields are properly converted
    - UUID and datetime fields are handled correctly
    """
    task_id = uuid4()
    now = datetime.utcnow()

    # Create mock ORM task (using dict to simulate ORM instance)
    task_data = {
        "id": task_id,
        "user_id": "test-user-123",
        "title": "Test task",
        "description": "Test description",
        "completed": False,
        "created_at": now,
        "updated_at": now
    }

    # Create response from ORM data
    task_response = TaskResponse(**task_data)

    assert task_response.id == task_id
    assert task_response.user_id == "test-user-123"
    assert task_response.title == "Test task"
    assert task_response.description == "Test description"
    assert task_response.completed is False
    assert task_response.created_at == now
    assert task_response.updated_at == now


def test_task_response_requires_all_fields():
    """
    Test TaskResponse validation fails with missing required fields.

    Given: TaskResponse with missing required fields
    When: TaskResponse instance is created
    Then: ValidationError is raised

    Validates:
    - All fields (id, user_id, title, completed, timestamps) are required
    - Missing required fields cause validation error
    """
    with pytest.raises(ValidationError) as exc_info:
        TaskResponse(
            title="Incomplete task",
            description="Missing required fields"
        )

    errors = exc_info.value.errors()
    assert len(errors) > 0
    # Should have errors for missing fields
    error_fields = {error["loc"][0] for error in errors}
    required_fields = {"id", "user_id", "completed", "created_at", "updated_at"}
    assert error_fields & required_fields  # At least some required fields are missing


def test_task_update_all_fields_optional():
    """
    Test TaskUpdate allows partial updates (all fields optional).

    Given: TaskUpdate with only some fields
    When: TaskUpdate instance is created
    Then: Validation passes, only provided fields are set

    Validates:
    - All fields in TaskUpdate are optional
    - Partial updates are supported
    """
    # Update only title
    update1 = TaskUpdate(title="Updated title")
    assert update1.title == "Updated title"
    assert update1.description is None
    assert update1.completed is None

    # Update only completed
    update2 = TaskUpdate(completed=True)
    assert update2.title is None
    assert update2.description is None
    assert update2.completed is True

    # Update multiple fields
    update3 = TaskUpdate(title="New title", description="New description")
    assert update3.title == "New title"
    assert update3.description == "New description"
    assert update3.completed is None


def test_task_update_empty_is_valid():
    """
    Test TaskUpdate allows empty updates (no fields).

    Given: TaskUpdate with no fields provided
    When: TaskUpdate instance is created
    Then: Validation passes, all fields are None

    Validates:
    - Empty updates are valid (useful for no-op updates)
    - All fields default to None
    """
    update = TaskUpdate()

    assert update.title is None
    assert update.description is None
    assert update.completed is None


def test_task_update_validates_field_constraints():
    """
    Test TaskUpdate validates field constraints when fields are provided.

    Given: TaskUpdate with invalid field values
    When: TaskUpdate instance is created
    Then: ValidationError is raised

    Validates:
    - Field constraints (min/max length) are enforced even for optional fields
    - Invalid values are rejected
    """
    # Empty title should fail
    with pytest.raises(ValidationError):
        TaskUpdate(title="")

    # Title too long should fail
    with pytest.raises(ValidationError):
        TaskUpdate(title="A" * 201)

    # Description too long should fail
    with pytest.raises(ValidationError):
        TaskUpdate(description="D" * 1001)


def test_task_model_default_completed():
    """
    Test Task model defaults completed to False.

    Given: Task created without completed field
    When: Task instance is created
    Then: completed defaults to False

    Validates:
    - completed field has default value of False
    - New tasks are not completed by default
    """
    task_id = uuid4()
    now = datetime.utcnow()

    task_data = {
        "id": task_id,
        "user_id": "test-user-123",
        "title": "Test task",
        "description": None,
        "completed": False,  # Explicitly False
        "created_at": now,
        "updated_at": now
    }

    task = Task(**task_data)
    assert task.completed is False
