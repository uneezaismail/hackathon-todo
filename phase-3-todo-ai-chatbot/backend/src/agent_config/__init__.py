"""
Agent configuration module.

This module provides agent factory and configuration classes for the AI chatbot.
"""

from .factory import create_model
from .todo_agent import TodoAgent, create_todo_agent

__all__ = [
    "create_model",
    "TodoAgent",
    "create_todo_agent",
]
