"""
MCP Server entry point for running as a module.

Usage:
    python -m mcp_server

This starts the FastMCP server with all registered tools.

Reference: openai-agents-mcp-integration skill section 3.4
"""
from .tools import mcp

if __name__ == "__main__":
    # Run the MCP server
    mcp.run()
