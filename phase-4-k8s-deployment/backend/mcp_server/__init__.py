"""
MCP (Model Context Protocol) server for task management tools.

Exposes 5 task operations as MCP tools for OpenAI Agents SDK integration:
- add_task: Create new task with priority
- list_tasks: List user's tasks with filtering
- complete_task: Mark task as completed
- delete_task: Delete task
- update_task: Update task title/description

Reference: openai-agents-mcp-integration skill section 3.4
"""

__all__ = ["mcp"]
