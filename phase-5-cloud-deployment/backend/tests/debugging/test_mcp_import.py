#!/usr/bin/env python
"""Test script to debug MCP import issues."""
import sys
print("Python:", sys.executable)

# First, set up path
sys.path.insert(0, '.')

# Import in order
print("1. Importing os...")
import os
print("   OK")

print("2. Importing pathlib...")
from pathlib import Path
print("   OK")

print("3. Importing dotenv...")
from dotenv import load_dotenv
env_path = Path('.env')
if env_path.exists():
    load_dotenv(env_path, override=True)
print("   OK")

print("4. Importing re...")
import re
print("   OK")

print("5. Importing uuid...")
import uuid
print("   OK")

print("6. Importing datetime...")
from datetime import datetime
print("   OK")

print("7. Importing typing...")
from typing import Literal, Optional
print("   OK")

print("8. Importing asyncpg...")
import asyncpg
print("   OK")

print("9. Importing mcp.server.fastmcp...")
from mcp.server.fastmcp import FastMCP
print("   OK")

print("10. Creating MCP instance...")
mcp = FastMCP(
    name="todo-task-server"
)
print("   OK")
print("MCP name:", mcp.name)

print("\nAll imports successful!")
