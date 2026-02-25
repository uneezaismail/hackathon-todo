"""
Base model with common fields for all SQLModel entities.
Provides created_at and updated_at timestamp fields that are automatically managed.
"""

from sqlmodel import SQLModel, Field
from sqlalchemy import Column, DateTime
from datetime import datetime


class TimestampMixin(SQLModel):
    """
    Mixin class that represents a table with timestamp fields.

    Models should NOT inherit from this for field definitions.
    Instead, use this as a marker base class and define created_at/updated_at
    directly in your table models to avoid Column object reuse issues.
    """
    pass


class Base(TimestampMixin, SQLModel):
    """
    Base class that combines SQLModel with timestamp functionality.
    All models should inherit from this class to get timestamp fields.
    """
    pass