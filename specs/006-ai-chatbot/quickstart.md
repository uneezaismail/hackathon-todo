# Quickstart Guide: AI-Powered Todo Chatbot

**Feature**: Phase III AI Chatbot
**Version**: 1.0.0
**Last Updated**: 2025-12-22

## Overview

This guide provides step-by-step instructions for setting up, running, and testing the AI-powered todo chatbot locally.

## Prerequisites

### System Requirements
- **OS**: Linux, macOS, or Windows with WSL2
- **Python**: 3.13+ (backend)
- **Node.js**: 20+ (frontend)
- **PostgreSQL**: Neon Serverless PostgreSQL account

### Development Tools
- **uv**: Python package manager (`curl -LsSf https://astral.sh/uv/install.sh | sh`)
- **npm/pnpm/yarn**: Node package manager
- **Git**: Version control
- **Docker** (optional): For running PostgreSQL locally instead of Neon

### API Keys & Services
- **OpenAI API Key**: Required for AI agent functionality (get from https://platform.openai.com/api-keys)
- **Neon Database**: Free serverless PostgreSQL (sign up at https://neon.tech)
- **Better Auth**: Already configured from Phase 2

---

## Phase 1: Environment Setup

### 1.1 Clone Repository

```bash
# If not already cloned
git clone https://github.com/uneezaismail/hackathon-todo.git
cd hackathon-todo

# Check out Phase 3 branch
git checkout 006-ai-chatbot
```

### 1.2 Backend Environment Variables

Create `.env` file in `phase-3-todo-ai-chatbot/backend/`:

```bash
cd phase-3-todo-ai-chatbot/backend

# Create .env file
cat > .env << 'EOF'
# Database Configuration (Neon Serverless PostgreSQL)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# LLM Provider Configuration
LLM_PROVIDER=openai  # openai | gemini | groq | openrouter

# OpenAI (default)
OPENAI_API_KEY=sk-proj-...

# Gemini (alternative)
# GEMINI_API_KEY=AIza...

# Groq (alternative)
# GROQ_API_KEY=gsk_...

# OpenRouter (alternative with free tier)
# OPENROUTER_API_KEY=sk-or-v1-...

# Better Auth Configuration (from Phase 2)
BETTER_AUTH_SECRET=your-secret-from-phase-2
BETTER_AUTH_URL=http://localhost:3000/api/auth

# Server Configuration
ENVIRONMENT=development
LOG_LEVEL=info

# CORS Configuration
CORS_ORIGINS=http://localhost:3000

# ChatKit Configuration
NEXT_PUBLIC_OPENAI_DOMAIN_KEY=local-dev  # Required for ChatKit widget

# MCP Configuration
MCP_SERVER_NAME=todo-task-server
MCP_SERVER_VERSION=1.0.0

# Retention Policy
MESSAGE_RETENTION_DAYS=2
EOF

chmod 600 .env
```

**Get Neon Database URL**:
1. Sign up at https://neon.tech
2. Create a new project
3. Copy connection string from project dashboard
4. Replace `DATABASE_URL` in `.env` with your Neon connection string

### 1.3 Frontend Environment Variables

Create `.env.local` file in `phase-3-todo-ai-chatbot/frontend/`:

```bash
cd ../frontend

# Create .env.local file
cat > .env.local << 'EOF'
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Chat API Endpoint
NEXT_PUBLIC_CHAT_API_URL=http://localhost:8000/api/v1/chat

# Better Auth (from Phase 2)
BETTER_AUTH_SECRET=your-secret-from-phase-2  # Same as backend
BETTER_AUTH_URL=http://localhost:3000/api/auth

# Database (Neon - for Better Auth local DB)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# ChatKit Configuration
NEXT_PUBLIC_CHATKIT_ENABLED=true
EOF

# Secure the .env.local file
chmod 600 .env.local
```

---

## Phase 2: Backend Setup

### 2.1 Install Dependencies

```bash
cd phase-3-todo-ai-chatbot/backend

# Install Python dependencies with uv
uv sync

# Activate virtual environment
source .venv/bin/activate  # Linux/macOS
# or
.venv\Scripts\activate  # Windows
```

### 2.2 Run Database Migrations

```bash
# Run Alembic migrations to create conversations and messages tables
alembic upgrade head

# Verify tables created
psql $DATABASE_URL -c "\dt"
# Should show: conversations, messages, tasks, users, etc.
```

**Expected Output**:
```
            List of relations
 Schema |      Name       | Type  |   Owner
--------+-----------------+-------+-----------
 public | conversations   | table | neondb_owner
 public | messages        | table | neondb_owner
 public | tasks           | table | neondb_owner
 public | users           | table | neondb_owner
```

### 2.3 Start Backend Server

```bash
# Start FastAPI development server
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Server should start successfully:
# INFO:     Uvicorn running on http://0.0.0.0:8000
# INFO:     MCP Server 'todo-task-server' initialized with 5 tools
# INFO:     OpenAI Agents SDK initialized with model gpt-4o
```

**Verify Backend**:
```bash
# Health check
curl http://localhost:8000/health
# Expected: {"status":"healthy","timestamp":"2025-12-22T..."}

# OpenAPI docs
open http://localhost:8000/docs  # View API documentation
```

---

## Phase 3: Frontend Setup

### 3.1 Install Dependencies

```bash
cd ../frontend

# Install Node dependencies
npm install
# or
pnpm install
```

### 3.2 Start Frontend Server

```bash
# Start Next.js development server
npm run dev
# or
pnpm dev

# Server should start:
# ▲ Next.js 16.0.0
# - Local: http://localhost:3000
# - Ready in 2.1s
```

**Verify Frontend**:
```bash
# Open browser
open http://localhost:3000

# Should see Todo application homepage from Phase 2
```

---

## Phase 4: Testing the Chatbot

### 4.1 Sign In

1. Navigate to http://localhost:3000
2. Click "Sign In" (Better Auth from Phase 2)
3. Create account or sign in with existing credentials

### 4.2 Access Chat Interface

1. Navigate to http://localhost:3000/chat
2. You should see the ChatKit widget interface

### 4.3 Test Natural Language Task Creation

**Test 1: Basic Task Creation**
```
You: add task to buy groceries
AI: I've created the task 'Buy groceries' with medium priority. Anything else?
```

**Test 2: Urgent Task (Priority Detection)**
```
You: add urgent task to fix the payment bug
AI: I've created the task 'Fix the payment bug' with high priority. Would you like to add more details?
```

**Test 3: Low Priority Task**
```
You: add task to organize files when you have time
AI: I've created the task 'Organize files' with low priority.
```

### 4.4 Test Task Listing

```
You: show me all my tasks
AI: You have 3 tasks:
1. Buy groceries (pending, medium priority)
2. Fix the payment bug (pending, high priority)
3. Organize files (pending, low priority)
```

### 4.5 Test Task Completion

```
You: mark the groceries task as complete
AI: I've marked 'Buy groceries' as completed. Great work!
```

### 4.6 Test Streaming Response

Observe the AI response appearing progressively (word-by-word or chunk-by-chunk) rather than all at once.

### 4.7 Test Conversation Persistence

1. Close browser window
2. Reopen http://localhost:3000/chat
3. Verify previous messages are still visible
4. Continue conversation from where you left off

---

## Phase 5: Running Tests

### 5.1 Backend Tests

```bash
cd phase-3-todo-ai-chatbot/backend

# Run all tests
pytest

# Run specific test categories
pytest tests/unit/test_mcp_tools.py  # MCP tool unit tests
pytest tests/integration/test_chat_endpoint.py  # Chat API integration tests
pytest tests/integration/test_agent_behavior.py  # Agent integration tests

# Run with coverage
pytest --cov=src --cov-report=html
open htmlcov/index.html  # View coverage report
```

**Expected Output**:
```
============================= test session starts ==============================
collected 35 items

tests/unit/test_mcp_tools.py::test_add_task_success PASSED                [ 2%]
tests/unit/test_mcp_tools.py::test_add_task_permission_denied PASSED      [ 5%]
tests/unit/test_mcp_tools.py::test_list_tasks_filtering PASSED            [ 8%]
...
tests/integration/test_chat_endpoint.py::test_streaming_response PASSED   [94%]
tests/integration/test_agent_behavior.py::test_priority_detection PASSED  [97%]

============================== 35 passed in 12.34s ==============================
```

### 5.2 Frontend Tests

```bash
cd ../frontend

# Run unit/component tests
npm test
# or
pnpm test

# Run E2E tests (requires backend running)
npm run test:e2e
# or
pnpm test:e2e
```

**E2E Tests**:
```bash
# Test chat task creation
npx playwright test tests/e2e/chat-task-creation.spec.ts

# Test streaming responses
npx playwright test tests/e2e/chat-streaming.spec.ts
```

---

## Phase 6: Common Development Tasks

### 6.1 Reset Database

```bash
cd phase-3-todo-ai-chatbot/backend

# Drop all tables
alembic downgrade base

# Recreate tables
alembic upgrade head
```

### 6.2 View Logs

**Backend Logs**:
```bash
# Logs are printed to console by default
# For production, configure logging to file in src/config.py
```

**Frontend Logs**:
```bash
# Browser console (F12 Developer Tools)
# Server logs in terminal running `npm run dev`
```

### 6.3 Manual Database Inspection

```bash
# Connect to Neon database
psql $DATABASE_URL

# View conversations
SELECT id, user_id, created_at FROM conversations LIMIT 10;

# View messages
SELECT id, conversation_id, role, LEFT(content, 50), created_at
FROM messages
ORDER BY created_at DESC
LIMIT 10;

# View tasks
SELECT id, user_id, title, priority, completed FROM tasks LIMIT 10;
```

### 6.4 Test MCP Tools Directly (Without Agent)

```bash
cd phase-3-todo-ai-chatbot/backend

# Start Python REPL
python

>>> from src.mcp.tools.add_task import add_task_tool
>>> from src.mcp.schemas import AddTaskInput
>>>
>>> # Test add_task tool
>>> result = await add_task_tool(
...     input=AddTaskInput(
...         user_id="test-user-123",
...         title="Test task",
...         priority="high"
...     ),
...     context={"user_id": "test-user-123"}
... )
>>> print(result)
# AddTaskOutput(task_id='...', status='success', message='...')
```

### 6.5 Monitor Retention Cleanup

```bash
# Check messages older than 2 days
psql $DATABASE_URL -c "
SELECT COUNT(*)
FROM messages
WHERE created_at < NOW() - INTERVAL '2 days';
"

# Manually trigger cleanup (normally runs automatically)
cd phase-3-todo-ai-chatbot/backend
python -c "
from src.services.retention_service import cleanup_expired_messages
import asyncio
asyncio.run(cleanup_expired_messages())
"
```

---

## Phase 7: Troubleshooting

### 7.1 Backend Won't Start

**Issue**: `ModuleNotFoundError: No module named 'openai_agents'`

**Solution**:
```bash
cd phase-3-todo-ai-chatbot/backend
uv sync  # Reinstall dependencies
source .venv/bin/activate
```

---

**Issue**: `DatabaseError: relation "conversations" does not exist`

**Solution**:
```bash
# Run migrations
alembic upgrade head
```

---

**Issue**: `AuthenticationError: No API key provided`

**Solution**:
```bash
# Verify .env file has OPENAI_API_KEY
cat .env | grep OPENAI_API_KEY

# If missing, add it
echo "OPENAI_API_KEY=sk-proj-..." >> .env
```

### 7.2 Frontend Won't Connect to Backend

**Issue**: CORS error in browser console

**Solution**:
```bash
# Verify CORS_ORIGINS in backend .env includes frontend URL
echo "CORS_ORIGINS=http://localhost:3000" >> backend/.env

# Restart backend server
```

---

**Issue**: ChatKit widget shows blank screen

**Solution**:
1. Check browser console for errors
2. Verify `NEXT_PUBLIC_CHAT_API_URL` in frontend `.env.local`
3. Verify backend is running on correct port
4. Check network tab for failed API requests

### 7.3 AI Responses Timing Out

**Issue**: Responses consistently timeout after 30 seconds

**Solution**:
1. Verify OpenAI API key is valid: `curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"`
2. Check OpenAI API status: https://status.openai.com
3. Simplify prompts to reduce processing time
4. Verify network connectivity to OpenAI API

### 7.4 Conversation History Not Loading

**Issue**: New messages appear but old messages don't load

**Solution**:
```bash
# Check database for messages
psql $DATABASE_URL -c "
SELECT COUNT(*) FROM messages WHERE conversation_id = 'your-conversation-id';
"

# If count is 0, messages may have been cleaned up (2-day retention)
# If count > 0, check backend logs for query errors
```

---

## Phase 8: Performance Optimization

### 8.1 Database Indexing

Verify indexes exist for optimal query performance:

```sql
-- Check existing indexes
\di conversations*
\di messages*

-- Should show:
-- idx_conversations_user_id
-- idx_conversations_created_at
-- idx_conversations_user_created
-- idx_messages_conversation_id
-- idx_messages_created_at
-- idx_messages_conversation_created
```

### 8.2 Enable Database Query Logging (Development)

```python
# backend/src/db/engine.py
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True,  # Enable SQL query logging
    pool_size=10,
    max_overflow=20
)
```

### 8.3 Monitor Response Times

```bash
# Add timing to chat endpoint
# backend/src/api/v1/chat.py

import time

@router.post("/chat")
async def chat_endpoint(...):
    start_time = time.time()

    # ... endpoint logic ...

    elapsed = time.time() - start_time
    logger.info(f"Chat request completed in {elapsed:.2f}s")
```

---

## Phase 9: Example Conversations

### Example 1: Task Creation Workflow

```
You: hello
AI: Hi! I'm here to help you manage your tasks. What would you like to do?

You: add task to prepare presentation for Monday
AI: I've created the task 'Prepare presentation for Monday' with medium priority. Would you like to set a due date?

You: yes, make it for Monday
AI: I've added Monday as the due date for 'Prepare presentation for Monday'.

You: also make it high priority
AI: I've updated 'Prepare presentation for Monday' to high priority.

You: perfect, show me all my tasks
AI: You have 1 task:
1. Prepare presentation for Monday (pending, high priority, due: Monday)

You: thanks!
AI: You're welcome! Let me know if you need anything else.
```

### Example 2: Bulk Task Management

```
You: show me my pending tasks
AI: You have 3 pending tasks:
1. Buy groceries (medium priority)
2. Fix urgent bug (high priority)
3. Organize files (low priority)

You: mark the bug fix as complete
AI: I've marked 'Fix urgent bug' as completed. Great work!

You: delete the organize files task
AI: I've deleted 'Organize files'.

You: what's left?
AI: You have 1 pending task remaining:
1. Buy groceries (medium priority)
```

### Example 3: Priority Detection

```
You: add critical task to backup database immediately
AI: I've created the task 'Backup database' with high priority. This looks important!

You: add task to clean desk when you have time
AI: I've created the task 'Clean desk' with low priority.

You: add task to review document
AI: I've created the task 'Review document' with medium priority.
```

---

## Phase 10: Next Steps

### After Local Development

1. **Run Full Test Suite**: Ensure all tests pass before deployment
2. **Performance Testing**: Test with 100 concurrent conversations
3. **Load Conversation History**: Test with 500 messages per conversation
4. **Retention Cleanup**: Verify messages older than 2 days are deleted
5. **Security Audit**: Verify user isolation works correctly

### Deployment Preparation

1. **Environment Variables**: Set production values for all env vars
2. **Database Migration**: Run migrations on production Neon database
3. **API Keys**: Use production OpenAI API key
4. **CORS**: Update CORS_ORIGINS for production frontend URL
5. **Logging**: Configure structured logging for production monitoring

### Monitoring Setup

1. **Application Metrics**: Track chat request volume, response times
2. **Database Metrics**: Monitor query performance, connection pool usage
3. **Error Tracking**: Set up Sentry or similar for error reporting
4. **OpenAI Usage**: Monitor API usage and costs via OpenAI dashboard

---

## Resources

### Documentation
- **OpenAI Agents SDK**: https://github.com/openai/openai-agents-sdk
- **Official MCP Python SDK**: https://github.com/modelcontextprotocol/python-sdk
- **OpenAI ChatKit**: https://github.com/openai/chatkit
- **Better Auth**: https://www.better-auth.com/docs
- **Neon Database**: https://neon.tech/docs

### Support
- **Project Issues**: https://github.com/uneezaismail/hackathon-todo/issues
- **OpenAI API Status**: https://status.openai.com
- **Neon Status**: https://status.neon.tech

---

## Summary Checklist

Before starting development, ensure you have:

- [ ] Python 3.13+ installed
- [ ] Node.js 20+ installed
- [ ] uv package manager installed
- [ ] OpenAI API key obtained
- [ ] Neon database created and connection string copied
- [ ] Better Auth configured from Phase 2
- [ ] Backend .env file created with all required variables
- [ ] Frontend .env.local file created with all required variables
- [ ] Database migrations run successfully
- [ ] Backend server starts without errors
- [ ] Frontend server starts without errors
- [ ] Chat interface loads at http://localhost:3000/chat
- [ ] Test conversation works end-to-end

**Ready to build!** 🚀
