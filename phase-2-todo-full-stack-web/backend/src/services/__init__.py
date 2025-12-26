"""
Service layer package.

Exports custom exceptions for use throughout the application.
"""

from .exceptions import TaskNotFoundError, UnauthorizedError

__all__ = ["TaskNotFoundError", "UnauthorizedError"]
