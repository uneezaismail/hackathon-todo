#!/usr/bin/env python
"""Minimal test for MCP import."""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env first
env_path = Path('/mnt/d/hackathon-todo/phase-3-todo-ai-chatbot/backend/.env')
if env_path.exists():
    load_dotenv(env_path, override=True)

print("Environment loaded")

# Test asyncpg
import asyncpg
print("asyncpg imported")

# Test FastMCP
from mcp.server.fastmcp import FastMCP
print("FastMCP imported")

# Create MCP instance
mcp = FastMCP("test-server")
print(f"MCP created: {mcp.name}")
print(f"Tools: {list(mcp._tools.keys())}")

print("\nAll imports successful!")
