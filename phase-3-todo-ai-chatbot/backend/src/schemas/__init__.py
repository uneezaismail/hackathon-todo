"""
Pydantic schemas package.

Exports common schemas used across multiple endpoints.
"""

from .common import ErrorResponse, PaginationParams

__all__ = ["ErrorResponse", "PaginationParams"]
