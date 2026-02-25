---
title: Todo AI Backend
emoji: 🤖
colorFrom: purple
colorTo: violet
sdk: docker
pinned: false
---

# Todo AI Backend - Phase 3

FastAPI backend for the AI-powered Todo application with natural language task management via ChatKit, JWT authentication using Better Auth shared secret, and Neon Serverless PostgreSQL.

## Features

- **AI-Powered Chatbot** - Natural language task management via OpenAI ChatKit protocol
- **Multi-Provider LLM Support** - OpenAI, Gemini, Groq, or OpenRouter
- **RESTful API** - Complete task management endpoints
- **JWT Authentication** - Shared secret between Next.js and FastAPI
- **User Isolation** - Each user can only access their own data
- **Recurring Tasks** - Daily, weekly, monthly, yearly recurrence with smart scheduling
- **Task Analytics** - Completion heatmaps and productivity metrics
- **Neon Serverless PostgreSQL** - Scalable cloud database
- **MCP Tools** - Model Context Protocol for AI agent tool orchestration
- **Docker Ready** - Multi-stage optimized Dockerfile for production

## Deployment on Hugging Face Spaces

### Quick Deploy

1. **Create a new Space:**
   - Go to [huggingface.co/new-space](https://huggingface.co/new-space)
   - Select **Docker** as the Space SDK
   - Connect your GitHub repository

2. **Add Environment Variables** (in Space settings → Variables):
   ```
   DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
   BETTER_AUTH_SECRET=your-shared-secret-key
   CORS_ORIGINS=https://your-frontend-url.com
   LLM_PROVIDER=openai
   OPENAI_API_KEY=sk-your-api-key
   ```

3. **Space will automatically:**
   - Build the Docker image
   - Run migrations: `alembic upgrade head`
   - Start FastAPI server on port 8000

### Environment Variables

**Required:**
- `DATABASE_URL` - Neon PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Must match frontend (generate with: `openssl rand -base64 32`)
- `CORS_ORIGINS` - Frontend URL (comma-separated for multiple)

**LLM Provider (choose one):**
- `LLM_PROVIDER=openai` → Add `OPENAI_API_KEY=sk-...`
- `LLM_PROVIDER=gemini` → Add `GEMINI_API_KEY=AIza...`
- `LLM_PROVIDER=groq` → Add `GROQ_API_KEY=gsk_...`
- `LLM_PROVIDER=openrouter` → Add `OPENROUTER_API_KEY=sk-or-v1-...`

## Local Development

### Prerequisites

- **Python 3.13+** installed
- **uv package manager** (`curl -LsSf https://astral.sh/uv/install.sh | sh`)
- **Neon PostgreSQL database** (get DATABASE_URL from [Neon console](https://console.neon.tech))
- **BETTER_AUTH_SECRET** (shared with frontend)
- **LLM API Key** (OpenAI, Gemini, Groq, or OpenRouter)

### Setup

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL, BETTER_AUTH_SECRET, and LLM credentials

# 2. Install dependencies
uv sync

# 3. Apply database migrations
uv run alembic upgrade head

# 4. Start development server
uv run uvicorn src.main:app --reload --port 8000
```

Server will be available at `http://localhost:8000`

## API Endpoints

### Task Management
- `POST /api/{user_id}/tasks` - Create task
- `GET /api/{user_id}/tasks` - List tasks (with filtering, search, sorting)
- `GET /api/{user_id}/tasks/{task_id}` - Get single task
- `PATCH /api/{user_id}/tasks/{task_id}` - Update task
- `DELETE /api/{user_id}/tasks/{task_id}` - Delete task

### Recurring Tasks (Phase 4)
- `GET /api/{user_id}/tasks/recurring` - List recurring task patterns
- `POST /api/{user_id}/tasks/{task_id}/complete` - Complete and generate next
- `POST /api/{user_id}/tasks/{task_id}/skip` - Skip occurrence
- `POST /api/{user_id}/tasks/{task_id}/stop-recurrence` - Stop recurrence

### Analytics (Phase 4)
- `GET /api/{user_id}/tasks/analytics` - Completion stats and heatmap

### AI Chatbot
- `POST /api/chatkit` - ChatKit protocol endpoint (natural language task management)

### Other
- `GET /api/health` - Health check (no auth required)

## Example Requests

### Create Task
```bash
curl -X POST http://localhost:8000/api/user123/tasks \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "priority": "High",
    "due_date": "2025-01-05",
    "tags": ["shopping"]
  }'
```

### List Tasks with Filters
```bash
curl "http://localhost:8000/api/user123/tasks?status=pending&priority=High&sort_by=due_date&sort_direction=asc" \
  -H "Authorization: Bearer <jwt_token>"
```

### ChatKit Natural Language
```bash
curl -X POST http://localhost:8000/api/chatkit \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "thread_id": "thread_123",
    "messages": [{"role": "user", "content": "Add a task to call mom tomorrow"}]
  }'
```

## Architecture

### Stack
- **Framework:** FastAPI (async)
- **Database:** SQLModel + Neon PostgreSQL
- **ORM:** SQLAlchemy
- **Auth:** JWT with shared secret
- **AI:** OpenAI Agents SDK + ChatKit protocol
- **Tools:** MCP (Model Context Protocol)
- **Migrations:** Alembic
- **Package Manager:** UV (fast)

### Key Files
```
src/
├── main.py              # FastAPI app setup and routes
├── auth/                # JWT validation
├── api/                 # REST endpoints
├── services/            # Business logic
├── models/              # SQLModel entities
├── schemas/             # Pydantic validation
├── db/                  # Database connection
└── agent_config/        # ChatKit agent setup

mcp_server/             # MCP tools for AI agent
alembic/                # Database migrations
```

## Authentication

All endpoints (except `/api/health`) require JWT in Authorization header:

```bash
Authorization: Bearer <jwt_token>
```

Backend validates JWT signature using `BETTER_AUTH_SECRET` and enforces user isolation.

## Docker

### Build Locally
```bash
docker build -t todo-backend .
docker run -p 8000:8000 \
  -e DATABASE_URL="postgresql://..." \
  -e BETTER_AUTH_SECRET="..." \
  -e LLM_PROVIDER="openai" \
  -e OPENAI_API_KEY="sk-..." \
  todo-backend
```

### Features
- Multi-stage build (optimized size)
- Non-root user (security)
- Health check endpoint
- Auto migrations on startup
- Minimal production image (~500MB)

## Testing

```bash
# Run all tests
uv run pytest

# Run specific test file
uv run pytest tests/test_auth.py -v

# Run with coverage
uv run pytest --cov=src
```

## Database Migrations

```bash
# Create new migration
uv run alembic revision --autogenerate -m "add new column"

# Apply migrations
uv run alembic upgrade head

# Rollback one migration
uv run alembic downgrade -1

# View migration history
uv run alembic history
```

## Security

- **User Isolation:** Every endpoint validates `url_user_id == jwt_user_id`
- **JWT Validation:** All requests checked with shared secret
- **CORS:** Restricted to configured frontend origins
- **Non-root Container:** Runs as unprivileged appuser
- **Environment Secrets:** Never committed to git

## Troubleshooting

### Database Connection Error
- Check `DATABASE_URL` format: `postgresql://user:pass@host/db?sslmode=require`
- Verify Neon database is running
- Check firewall allows connection

### JWT Validation Failed
- Ensure `BETTER_AUTH_SECRET` matches frontend exactly
- Check token hasn't expired
- Verify Authorization header format: `Bearer <token>`

### Health Check Fails
- Wait 30-60s after startup (migrations may be running)
- Check logs: `docker logs <container_id>`
- Verify database connection successful

## Performance

- **Cold Start:** ~30-60s on Hugging Face Spaces (migrations run on startup)
- **Response Time:** <100ms for most endpoints
- **Concurrent Connections:** Supports hundreds via connection pooling

## Support

For issues, check:
1. Environment variables are set correctly
2. Database is accessible
3. LLM API key is valid
4. Frontend CORS_ORIGINS matches deployment URL

## License

MIT

---

**Deploy now:** [Create Space on Hugging Face](https://huggingface.co/new-space)
