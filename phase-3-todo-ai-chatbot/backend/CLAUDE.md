# Backend Guidelines (FastAPI + AI Chatbot)

## Overview
Python FastAPI service implementing task management and AI-powered chatbot via ChatKit protocol.
Stateless architecture with JWT authentication and MCP tools for AI task operations.

## Tech Stack
- **Framework:** FastAPI
- **Language:** Python 3.13+
- **ORM:** SQLModel (SQLAlchemy + Pydantic)
- **Database:** Neon Serverless PostgreSQL (`asyncpg`)
- **Package Manager:** UV (fast pip replacement)
- **Migrations:** Alembic
- **AI:** OpenAI Agents SDK with multi-provider support (OpenAI, Gemini, Groq, OpenRouter)
- **MCP:** Model Context Protocol for tool orchestration

## Architecture
- **Data Source:** Owns `tasks`, `tags`, `task_tags`, `conversations`, `messages` tables in Neon.
- **Auth:** Stateless. Verifies JWT signature using `BETTER_AUTH_SECRET`.
- **User Isolation:** EVERY endpoint and MCP tool validates user_id to prevent unauthorized access.
- **Task Features:** Priority (High/Medium/Low), due dates, tags, search, filtering, sorting.
- **Chat Features:** Natural language task management, conversation persistence, 2-day retention.

## Key Patterns
### 1. User Isolation (CRITICAL)
```python
def verify_user_access(user_id: str, current_user_id: str):
    if user_id != current_user_id:
        raise HTTPException(403, "Forbidden")
```
**Every endpoint** must call this to prevent users from accessing other users' data.
- `user_id` comes from URL path parameter
- `current_user_id` comes from JWT token
- Both must match exactly

### 2. Database Session
- Use Dependency Injection: `session: Session = Depends(get_session)`.
- Use `select(Task).where(...)` for queries.
- Always filter by `user_id` to enforce data isolation.

### 3. Pydantic Schemas
- `TaskCreate`: Input validation for creating tasks.
- `TaskUpdate`: Input validation for updating tasks (partial updates).
- `TaskResponse`: Output serialization (includes all task fields).
- Common schemas: `PaginationParams`, `ApiResponse`, `TaskStatus`, `SortBy`, `SortOrder`.

### 4. Service Layer
- `TaskService`: Business logic for task operations (CRUD, search, filter, sort).
- `TagService`: Business logic for tag operations.
- Services keep controllers clean and testable.

## Commands
```bash
# Setup
uv sync              # Install dependencies (creates .venv)

# Development
uv run uvicorn src.main:app --reload --port 8000  # Start dev server

# Database Migrations
uv run alembic revision --autogenerate -m "msg"   # Create migration
uv run alembic upgrade head                       # Apply migration
uv run alembic downgrade -1                       # Rollback one migration
uv run alembic history                            # View migration history

# Testing
uv run pytest                    # Run all tests
uv run pytest -v                 # Verbose output
uv run pytest tests/test_auth.py # Run specific test file

# Docker
docker build -t todo-backend .               # Build Docker image
docker run -p 8000:8000 todo-backend         # Run container
```

## Environment Variables

See `.env.example` for complete configuration template.

### Core Configuration (Phase 2 + Phase 3)
- `DATABASE_URL`: Connection string for Neon (`postgresql://user:pass@host/db?sslmode=require`)
- `BETTER_AUTH_SECRET`: **CRITICAL**. Must match Frontend. Generate with: `openssl rand -base64 32`
- `CORS_ORIGINS`: `http://localhost:3000` (comma-separated for multiple origins)

### LLM Provider Configuration (Phase 3 AI Chatbot)

**Select Provider:**
- `LLM_PROVIDER`: Choose provider (`openai` | `gemini` | `groq` | `openrouter`)
  - Default: `openai`
  - Change to switch between providers (requires corresponding API key)

**OpenAI Setup (Default):**
```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...                    # Get from https://platform.openai.com/
OPENAI_DEFAULT_MODEL=gpt-4o-mini         # Options: gpt-4o, gpt-4o-mini, gpt-4-turbo
```

**Gemini Setup (Google):**
```bash
LLM_PROVIDER=gemini
GEMINI_API_KEY=AIza...                   # Get from https://ai.google.dev/
GEMINI_DEFAULT_MODEL=gemini-2.5-flash    # Options: gemini-2.5-flash, gemini-2.5-pro
```

**Groq Setup (Fast Inference):**
```bash
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_...                     # Get from https://console.groq.com/
GROQ_DEFAULT_MODEL=llama-3.3-70b-versatile  # Options: llama-3.3-70b, mixtral-8x7b
```

**OpenRouter Setup (Multi-Model Access + Free Tier):**
```bash
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-...          # Get from https://openrouter.ai/
OPENROUTER_DEFAULT_MODEL=openai/gpt-oss-20b:free  # Free: gpt-oss-20b:free, gemma-2-9b-it:free
```

### MCP Server Configuration (Phase 3)
- `MCP_SERVER_NAME`: Name for MCP tool server (default: `todo-task-server`)

### Provider Selection Guide

**For Development:**
- **Free Tier:** Use `openrouter` with `openai/gpt-oss-20b:free` model (no cost)
- **Quality:** Use `openai` with `gpt-4o-mini` (cheap, high quality)
- **Speed:** Use `groq` with `llama-3.3-70b-versatile` (fastest inference)

**For Production:**
- **Reliability:** Use `openai` with `gpt-4o` or `gpt-4o-mini` (most stable)
- **Cost Optimization:** Use `gemini` with `gemini-2.5-flash` (lower cost)
- **Multi-Model:** Use `openrouter` for flexibility

**Provider-Specific Notes:**
- **OpenAI**: Most reliable, best documentation, paid API
- **Gemini**: Google's LLM, competitive pricing, good for multi-modal tasks
- **Groq**: Extremely fast inference, free tier available, limited models
- **OpenRouter**: Proxy to multiple providers, some free models, unified API

### Docker/Production
- Same variables as development
- Ensure `DATABASE_URL` uses cloud Neon URL (not localhost)
- For docker-compose, backend should accept requests from frontend service name
- Set `LLM_PROVIDER` and corresponding API key for chosen provider

## Docker Setup
The backend uses a multi-stage Dockerfile optimized for UV:
1. **builder stage**: Installs dependencies using UV (fast)
2. **runtime stage**: Minimal production image with only runtime dependencies

**Important:**
- The `.dockerignore` excludes .venv, tests, and other unnecessary files
- `README.md` is included (required for `uv sync`)
- Migrations run automatically on container start: `alembic upgrade head && uvicorn ...`

## API Endpoints
All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

### Task Endpoints
**Format:** `/api/{user_id}/tasks`

- `POST /api/{user_id}/tasks` - Create new task
  - Body: `{ "title": "string", "description": "string", "priority": "High|Medium|Low", "due_date": "YYYY-MM-DD", "tags": ["tag1"] }`

- `GET /api/{user_id}/tasks` - List user's tasks with filtering, search, and sorting
  - Query params:
    - `search` (string): Search in title/description
    - `status` (string): `all`, `pending`, `completed`
    - `priority` (string): `all`, `High`, `Medium`, `Low`
    - `tags` (array): Filter by tags
    - `sort_by` (string): `created_at`, `updated_at`, `title`, `due_date`, `priority`
    - `sort_direction` (string): `asc`, `desc`
    - `limit` (int): Pagination limit (default: 50)
    - `offset` (int): Pagination offset (default: 0)

- `GET /api/{user_id}/tasks/{task_id}` - Get single task by ID

- `PATCH /api/{user_id}/tasks/{task_id}` - Update task (partial update)
  - Body: Any combination of task fields to update

- `DELETE /api/{user_id}/tasks/{task_id}` - Delete task

### Tag Endpoints
- `GET /api/{user_id}/tags` - Get all unique tags with usage count for the user

### Phase 3: AI Chatbot Endpoints

**IMPORTANT:** Phase 3 uses the **official ChatKit protocol endpoint only**.

#### Active Endpoint: ChatKit Protocol
- `POST /api/chatkit` - Official ChatKit protocol endpoint for AI-powered task management
  - **Authentication:** Requires JWT via `Authorization: Bearer <token>` header
  - **Protocol:** ChatKit protocol (handles threads, messages, widgets)
  - **Features:**
    - Natural language task management via AI agent
    - Automatic conversation memory (SQLiteSession)
    - Tool execution via MCP protocol (7 tools: add_task, list_tasks, complete_task, delete_task, update_task, set_priority, get_task)
    - User isolation enforced (user_id from JWT passed to all tools)
    - Multi-provider LLM support (OpenAI, Gemini, Groq, OpenRouter)
  - **Request:** ChatKit protocol payload with thread_id and messages
  - **Response:** Streaming SSE or JSON response per ChatKit protocol

#### Disabled Endpoint: Custom Chat (Reference Only)
- ~~`POST /api/v1/chat` - Custom SSE streaming endpoint~~ **COMMENTED OUT**
  - **Status:** Disabled per user requirement ("use official ChatKit only")
  - **Reason:** Official ChatKit endpoint provides superior integration with ChatKit frontend components
  - **Note:** Code remains in repository at `src/api/v1/chat.py` for reference but is not registered in `main.py`
  - **Migration:** All AI chatbot functionality now uses `/api/chatkit` endpoint

#### Why ChatKit Protocol?
1. **Standard Compliance:** Follows official ChatKit protocol specification
2. **Widget Support:** Built-in support for structured UI widgets
3. **Memory Management:** Automatic conversation persistence via SQLiteSession
4. **Frontend Integration:** Seamless integration with ChatKit React components
5. **Tool Orchestration:** MCP protocol for clean agent-tool separation

### Health Check
- `GET /api/health` - Health check endpoint (no auth required)

## Authentication Flow
1. Frontend sends JWT in `Authorization: Bearer <token>` header
2. Backend extracts JWT and validates signature using `BETTER_AUTH_SECRET`
3. Backend extracts `user_id` from JWT payload
4. Backend compares JWT `user_id` with URL path `{user_id}` parameter
5. If they don't match → 403 Forbidden
6. If they match → proceed with request and filter data by `user_id`

## Security
- **User Isolation:** Every endpoint must validate `url_user_id == jwt_user_id`
- **JWT Validation:** All endpoints (except `/api/health`) require valid JWT
- **Data Filtering:** All database queries filter by authenticated user's ID
- **CORS:** Only allows requests from configured frontend origins
