"""Interactive menu-driven console interface for Todo app."""

from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt, Confirm

from src.models.enums import TaskStatus
from src.services.exceptions import InvalidTaskDataError, TaskNotFoundError
from src.services.task_service import TaskService
from src.storage.in_memory import InMemoryTaskRepository
from src.ui.renderer import TaskRenderer


class InteractiveTodoApp:
    """Interactive menu-driven Todo application."""

    def __init__(self) -> None:
        """Initialize the interactive app."""
        self._repository = InMemoryTaskRepository()
        self._service = TaskService(self._repository)
        self._renderer = TaskRenderer()
        self._console = Console()

    def show_menu(self) -> None:
        """Display the main menu."""
        self._console.print("\n")
        menu = Panel(
            "[cyan]1.[/cyan] Add Task\n"
            "[cyan]2.[/cyan] List All Tasks\n"
            "[cyan]3.[/cyan] Toggle Task Completion\n"
            "[cyan]4.[/cyan] Update Task\n"
            "[cyan]5.[/cyan] Delete Task\n"
            "[cyan]6.[/cyan] Exit",
            title="[bold green]📝 Todo App - Main Menu[/bold green]",
            border_style="green",
        )
        self._console.print(menu)

    def add_task(self) -> None:
        """Add a new task interactively."""
        self._console.print("\n[bold cyan]➕ Add New Task[/bold cyan]")

        title = Prompt.ask("Enter task title")
        description = Prompt.ask("Enter description (optional, press Enter to skip)", default="")

        try:
            task = self._service.add_task(
                title=title,
                description=description if description else None
            )

            self._console.print(f"\n[green]✓ Task created successfully![/green]")
            self._console.print(f"  ID: [cyan]{task.id}[/cyan]")
            self._console.print(f"  Title: {task.title}")
            if task.description:
                self._console.print(f"  Description: {task.description}")
            self._console.print(f"  Status: {task.status.value.upper()}")

        except InvalidTaskDataError as e:
            self._console.print(f"[red]❌ Error:[/red] {e}")

    def list_tasks(self) -> None:
        """List all tasks in a formatted table."""
        self._console.print("\n[bold cyan]📋 All Tasks[/bold cyan]\n")
        tasks = self._service.get_all_tasks()
        self._renderer.render_tasks(tasks, console=self._console)

    def toggle_task(self) -> None:
        """Toggle task completion status."""
        self._console.print("\n[bold cyan]✓ Toggle Task Completion[/bold cyan]")

        # Show current tasks first
        tasks = self._service.get_all_tasks()
        if not tasks:
            self._console.print("[yellow]No tasks found. Add a task first.[/yellow]")
            return

        self._renderer.render_tasks(tasks, console=self._console)

        task_id_str = Prompt.ask("\nEnter task ID to toggle")

        try:
            task_id = int(task_id_str)
            task = self._service.toggle_task_completion(task_id)

            status_display = "[green]✓ COMPLETED[/green]" if task.status == TaskStatus.COMPLETED else "PENDING"
            self._console.print(f"\n[green]✓ Task #{task.id} toggled successfully![/green]")
            self._console.print(f"  Title: {task.title}")
            self._console.print(f"  Status: {status_display}")

        except ValueError:
            self._console.print("[red]❌ Error:[/red] Please enter a valid number")
        except TaskNotFoundError as e:
            self._console.print(f"[red]❌ Error:[/red] {e}")

    def update_task(self) -> None:
        """Update task details."""
        self._console.print("\n[bold cyan]✏️ Update Task[/bold cyan]")

        # Show current tasks first
        tasks = self._service.get_all_tasks()
        if not tasks:
            self._console.print("[yellow]No tasks found. Add a task first.[/yellow]")
            return

        self._renderer.render_tasks(tasks, console=self._console)

        task_id_str = Prompt.ask("\nEnter task ID to update")

        try:
            task_id = int(task_id_str)

            # Get current task to show existing values
            all_tasks = self._service.get_all_tasks()
            current_task = None
            for t in all_tasks:
                if t.id == task_id:
                    current_task = t
                    break

            if not current_task:
                raise TaskNotFoundError(task_id)

            self._console.print(f"\nCurrent title: [dim]{current_task.title}[/dim]")
            new_title = Prompt.ask("Enter new title (press Enter to keep current)", default="")

            self._console.print(f"Current description: [dim]{current_task.description or '(none)'}[/dim]")
            new_description = Prompt.ask("Enter new description (press Enter to keep current)", default="")

            if not new_title and not new_description:
                self._console.print("[yellow]No changes made.[/yellow]")
                return

            task = self._service.update_task(
                task_id=task_id,
                title=new_title if new_title else None,
                description=new_description if new_description else None
            )

            self._console.print(f"\n[green]✓ Task #{task.id} updated successfully![/green]")
            self._console.print(f"  Title: {task.title}")
            self._console.print(f"  Description: {task.description or '(none)'}")

        except ValueError:
            self._console.print("[red]❌ Error:[/red] Please enter a valid number")
        except (TaskNotFoundError, InvalidTaskDataError) as e:
            self._console.print(f"[red]❌ Error:[/red] {e}")

    def delete_task(self) -> None:
        """Delete a task."""
        self._console.print("\n[bold cyan]🗑️ Delete Task[/bold cyan]")

        # Show current tasks first
        tasks = self._service.get_all_tasks()
        if not tasks:
            self._console.print("[yellow]No tasks found.[/yellow]")
            return

        self._renderer.render_tasks(tasks, console=self._console)

        task_id_str = Prompt.ask("\nEnter task ID to delete")

        try:
            task_id = int(task_id_str)

            # Get task details for confirmation
            all_tasks = self._service.get_all_tasks()
            task_to_delete = None
            for t in all_tasks:
                if t.id == task_id:
                    task_to_delete = t
                    break

            if not task_to_delete:
                raise TaskNotFoundError(task_id)

            # Show confirmation
            self._console.print(f"\n[yellow]⚠️  About to delete task:[/yellow]")
            self._console.print(f"  ID: {task_to_delete.id}")
            self._console.print(f"  Title: {task_to_delete.title}")
            self._console.print(f"  Description: {task_to_delete.description or '(none)'}")

            confirm = Confirm.ask("\nAre you sure you want to delete this task?", default=False)

            if confirm:
                self._service.delete_task(task_id)
                self._console.print(f"\n[green]✓ Task #{task_id} deleted successfully![/green]")
            else:
                self._console.print("[yellow]Deletion cancelled.[/yellow]")

        except ValueError:
            self._console.print("[red]❌ Error:[/red] Please enter a valid number")
        except TaskNotFoundError as e:
            self._console.print(f"[red]❌ Error:[/red] {e}")

    def run(self) -> None:
        """Run the interactive application loop."""
        self._console.clear()
        self._console.print(Panel(
            "[bold green]Welcome to Todo App![/bold green]\n"
            "Manage your tasks efficiently with an intuitive console interface.",
            border_style="green"
        ))

        while True:
            self.show_menu()

            choice = Prompt.ask(
                "\n[bold]Select an option[/bold]",
                choices=["1", "2", "3", "4", "5", "6"],
                default="2"
            )

            if choice == "1":
                self.add_task()
            elif choice == "2":
                self.list_tasks()
            elif choice == "3":
                self.toggle_task()
            elif choice == "4":
                self.update_task()
            elif choice == "5":
                self.delete_task()
            elif choice == "6":
                self._console.print("\n[green]👋 Thank you for using Todo App! Goodbye![/green]\n")
                break

            # Pause before showing menu again
            if choice != "6":
                Prompt.ask("\n[dim]Press Enter to continue...[/dim]", default="")


def main() -> None:
    """Entry point for interactive mode."""
    app = InteractiveTodoApp()
    app.run()


if __name__ == "__main__":
    main()
