"""Rich table rendering for tasks."""

from rich.console import Console
from rich.table import Table

from src.models.enums import TaskStatus
from src.models.task import Task


class TaskRenderer:
    """Renders tasks using Rich library for formatted table output."""

    def render_tasks(self, tasks: list[Task], console: Console | None = None) -> None:
        """Render tasks in a formatted Rich table.

        Args:
            tasks: List of tasks to render (will be sorted by ID)
            console: Optional Rich Console instance (creates new one if None)
        """
        if console is None:
            console = Console()

        # Create table
        table = Table(title="Tasks")
        table.add_column("ID", style="cyan", justify="right")
        table.add_column("Title", style="white")
        table.add_column("Description", style="dim")
        table.add_column("Status", justify="center")

        # Sort tasks by ID and add rows
        sorted_tasks = sorted(tasks, key=lambda t: t.id)

        for task in sorted_tasks:
            # Format status with green checkmark for completed
            if task.status == TaskStatus.COMPLETED:
                status = "[green]✓[/green]"
            else:
                status = "-"

            # Handle None description
            description = task.description if task.description is not None else ""

            table.add_row(
                str(task.id),
                task.title,
                description,
                status,
            )

        # Display table
        console.print(table)

        # Show message if empty
        if not tasks:
            console.print("\n[dim]No tasks found. Add your first task with:[/dim] [cyan]todo add \"<title>\"[/cyan]")
