"""
Base model with common fields for all SQLModel entities.
Provides created_at and updated_at timestamp fields that are automatically managed.
"""

from sqlmodel import SQLModel, Field
from sqlalchemy import Column, DateTime
from datetime import datetime


class TimestampMixin(SQLModel):
    """
    Mixin that adds created_at and updated_at timestamp fields.
    Automatically manages these timestamps when models are created or updated.
    """
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, index=True),
        description="Timestamp when the record was created (UTC)"
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(
            DateTime(timezone=True),
            nullable=False,
            onupdate=datetime.utcnow
        ),
        description="Timestamp when the record was last updated (UTC)"
    )


class Base(TimestampMixin, SQLModel):
    """
    Base class that combines SQLModel with timestamp functionality.
    All models should inherit from this class to get timestamp fields.
    """
    pass