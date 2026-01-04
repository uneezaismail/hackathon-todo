#!/usr/bin/env python
"""Test script to debug MCP server communication."""
import asyncio
import json
import sys

async def test_mcp():
    # Add backend to path
    sys.path.insert(0, '/mnt/d/hackathon-todo/phase-3-todo-ai-chatbot/backend')

    # Import the stdio server
    from mcp.server.stdio import stdio_server
    from mcp_server.tools import mcp

    print("MCP server tools:", list(mcp._tools.keys()))

    # Test the server by connecting to it
    print("Starting MCP server...")

    # Use stdio_server context manager
    async with stdio_server(mcp) as (read_stream, write_stream):
        print("Server started, waiting for messages...")
        # The server is now running and will handle MCP protocol messages
        # For testing, we can just let it run for a bit
        await asyncio.sleep(2)
        print("Server test complete")

if __name__ == "__main__":
    asyncio.run(test_mcp())
