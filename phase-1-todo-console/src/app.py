"""Typer CLI application entry point."""

from typing_extensions import Annotated

import typer
from rich.console import Console

from src.services.exceptions import InvalidTaskDataError, TaskNotFoundError, TodoAppError
from src.services.task_service import TaskService
from src.storage.in_memory import InMemoryTaskRepository
from src.ui.renderer import TaskRenderer

# Create Typer app
app = typer.Typer(
    name="todo",
    help="Todo In-Memory Console App - Manage your tasks efficiently",
    add_completion=False,
)

# Initialize dependencies (singleton pattern for in-memory storage)
_repository = InMemoryTaskRepository()
_service = TaskService(_repository)
_renderer = TaskRenderer()
_console = Console()


@app.command()
def add(
    title: Annotated[str, typer.Argument(help="Task title (required)")],
    description: Annotated[
        str | None,
        typer.Option("--description", "-d", help="Task description (optional)"),
    ] = None,
) -> None:
    """Add a new task to the todo list."""
    try:
        task = _service.add_task(title, description)

        # Display success message
        _console.print("[green]✓[/green] Task created successfully!")
        _console.print(f"  ID: {task.id}")
        _console.print(f"  Title: {task.title}")
        _console.print(f"  Description: {task.description or ''}")
        _console.print(f"  Status: {task.status.value.upper()}")

    except InvalidTaskDataError as e:
        _console.print(f"[red]❌ Error:[/red] {e}")
        raise typer.Exit(1)
    except TodoAppError as e:
        _console.print(f"[red]❌ Error:[/red] {e}")
        raise typer.Exit(1)


@app.command(name="list")
def list_tasks() -> None:
    """List all tasks in a formatted table."""
    try:
        tasks = _service.get_all_tasks()
        _renderer.render_tasks(tasks, console=_console)

    except TodoAppError as e:
        _console.print(f"[red]❌ Error:[/red] {e}")
        raise typer.Exit(1)


@app.command()
def toggle(
    task_id: Annotated[int, typer.Argument(help="Task ID to toggle completion status")],
) -> None:
    """Toggle task completion status (PENDING ↔ COMPLETED)."""
    try:
        task = _service.toggle_task_completion(task_id)

        # Display success message with new status
        status_display = "[green]✓ COMPLETED[/green]" if task.status.value == "completed" else "PENDING"
        _console.print(f"[green]✓[/green] Task #{task.id} toggled successfully!")
        _console.print(f"  Title: {task.title}")
        _console.print(f"  Status: {status_display}")

    except TaskNotFoundError as e:
        _console.print(f"[red]❌ Error:[/red] {e}")
        raise typer.Exit(1)
    except TodoAppError as e:
        _console.print(f"[red]❌ Error:[/red] {e}")
        raise typer.Exit(1)


@app.command()
def update(
    task_id: Annotated[int, typer.Argument(help="Task ID to update")],
    title: Annotated[
        str | None,
        typer.Option("--title", "-t", help="New task title (optional)"),
    ] = None,
    description: Annotated[
        str | None,
        typer.Option("--description", "-d", help="New task description (optional)"),
    ] = None,
) -> None:
    """Update task title and/or description."""
    # Validation: At least one field must be provided
    if title is None and description is None:
        _console.print("[red]❌ Error:[/red] At least one field (--title or --description) must be provided")
        raise typer.Exit(1)

    try:
        task = _service.update_task(task_id, title=title, description=description)

        # Display success message
        _console.print(f"[green]✓[/green] Task #{task.id} updated successfully!")
        _console.print(f"  Title: {task.title}")
        _console.print(f"  Description: {task.description or ''}")
        _console.print(f"  Status: {task.status.value.upper()}")

    except InvalidTaskDataError as e:
        _console.print(f"[red]❌ Error:[/red] {e}")
        raise typer.Exit(1)
    except TaskNotFoundError as e:
        _console.print(f"[red]❌ Error:[/red] {e}")
        raise typer.Exit(1)
    except TodoAppError as e:
        _console.print(f"[red]❌ Error:[/red] {e}")
        raise typer.Exit(1)


@app.command()
def delete(
    task_id: Annotated[int, typer.Argument(help="Task ID to delete")],
    force: Annotated[
        bool,
        typer.Option("--force", "-f", help="Skip confirmation prompt"),
    ] = False,
) -> None:
    """Permanently delete a task."""
    try:
        # Get task details first (will raise TaskNotFoundError if not found)
        task = _service.get_all_tasks()
        task_to_delete = None
        for t in task:
            if t.id == task_id:
                task_to_delete = t
                break

        if task_to_delete is None:
            raise TaskNotFoundError(task_id)

        # Show confirmation prompt unless --force is used
        if not force:
            _console.print(f"[yellow]⚠️  About to delete task:[/yellow]")
            _console.print(f"  ID: {task_to_delete.id}")
            _console.print(f"  Title: {task_to_delete.title}")
            _console.print(f"  Description: {task_to_delete.description or '(none)'}")

            confirm = typer.confirm("Are you sure you want to delete this task?", default=False)
            if not confirm:
                _console.print("[yellow]Deletion cancelled.[/yellow]")
                raise typer.Abort()

        # Perform deletion
        _service.delete_task(task_id)

        # Display success message
        _console.print(f"[green]✓[/green] Task #{task_id} deleted successfully!")

    except TaskNotFoundError as e:
        _console.print(f"[red]❌ Error:[/red] {e}")
        raise typer.Exit(1)
    except typer.Abort:
        # User cancelled - exit gracefully without error
        raise typer.Exit(0)
    except TodoAppError as e:
        _console.print(f"[red]❌ Error:[/red] {e}")
        raise typer.Exit(1)


if __name__ == "__main__":
    app()
