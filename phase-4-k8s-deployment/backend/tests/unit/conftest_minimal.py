"""
Minimal pytest configuration for unit tests that don't need FastAPI app.

This avoids importing src.main which would start MCP server connections.
"""
import pytest

# No fixtures needed for standalone logic tests like priority detection
