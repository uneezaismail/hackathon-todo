# -------------------------------------------------------------------
# STEP 1: BASE IMAGE (FOUNDATION)
# Using specific version for stability
# 'slim' is best balance of size and compatibility
# -------------------------------------------------------------------
FROM python:3.13-slim

# -------------------------------------------------------------------
# STEP 2: SETUP TOOLS (THE MANAGER)
# Copy UV binary from official image
# -------------------------------------------------------------------
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# -------------------------------------------------------------------
# STEP 3: INSTALL SYSTEM DEPENDENCIES
# Install PostgreSQL client library and curl for health checks
# -------------------------------------------------------------------
RUN apt-get update -o Acquire::Check-Valid-Until=false && \
    apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# -------------------------------------------------------------------
# STEP 4: WORK DIRECTORY (THE HOUSE)
# All commands will run inside this folder
# -------------------------------------------------------------------
WORKDIR /app

# -------------------------------------------------------------------
# STEP 5: DEPENDENCIES (THE INGREDIENTS)
# Copy only dependency files first for better Docker layer caching
# -------------------------------------------------------------------
COPY pyproject.toml uv.lock README.md ./

# -------------------------------------------------------------------
# STEP 6: INSTALLATION (THE COOKING)
# Install packages directly to system Python (no venv)
# --system: Install to system Python instead of venv
# --no-cache: Don't cache downloads
# -------------------------------------------------------------------
RUN uv pip install --system --no-cache .

# -------------------------------------------------------------------
# STEP 7: SOURCE CODE (THE MIXING)
# Copy all application code
# -------------------------------------------------------------------
COPY src/ ./src/
COPY mcp_server/ ./mcp_server/
COPY alembic/ ./alembic/
COPY alembic.ini ./

# -------------------------------------------------------------------
# STEP 8: EXPOSE PORT
# Backend will run on port 8001 (8000 is used by another app)
# -------------------------------------------------------------------
EXPOSE 8001

# -------------------------------------------------------------------
# STEP 9: HEALTH CHECK
# Docker will check if the app is healthy
# -------------------------------------------------------------------
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8001/api/health || exit 1

# -------------------------------------------------------------------
# STEP 10: STARTUP (SERVING)
# Run database migrations and start the server on port 8001
# -------------------------------------------------------------------
CMD ["sh", "-c", "alembic upgrade head && uvicorn src.main:app --host 0.0.0.0 --port 8001"]
