#!/usr/bin/env python
"""Test script to debug TodoAgent MCP connection."""
import asyncio
import sys

async def test_connection():
    sys.path.insert(0, '/mnt/d/hackathon-todo/phase-3-todo-ai-chatbot/backend')
    sys.path.insert(0, '/mnt/d/hackathon-todo/phase-3-todo-ai-chatbot/backend/src')

    print("Creating TodoAgent...")
    from src.agent_config.todo_agent import TodoAgent

    agent = TodoAgent()
    print(f"Agent created: {agent.agent}")
    print(f"MCP server: {agent.mcp_server}")

    print("\nConnecting to MCP server...")
    try:
        async with agent.mcp_server as mcp_context:
            print("Connected to MCP server!")
            # Get the session
            session = await mcp_context.__aenter__()
            print(f"Session: {session}")

            # Try to list tools
            tools = await session.list_tools()
            print(f"Available tools: {[t.name for t in tools.tools]}")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_connection())
