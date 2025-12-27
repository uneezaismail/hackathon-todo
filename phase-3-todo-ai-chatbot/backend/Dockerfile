# Multi-stage build for optimized FastAPI backend image
# Stage 1: Builder - Install dependencies
FROM python:3.13-slim AS builder

# Set working directory
WORKDIR /app

# Install uv for faster package installation
RUN pip install --no-cache-dir uv

# Copy dependency files
COPY pyproject.toml uv.lock README.md ./

# Install dependencies using uv (much faster than pip)
# Create virtual environment in /app/.venv
RUN uv sync --frozen --no-dev

# Stage 2: Runtime - Minimal production image
FROM python:3.13-slim

# Set working directory
WORKDIR /app

# Install runtime dependencies (only what's needed)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from builder
COPY --from=builder /app/.venv /app/.venv

# Copy application source code
COPY src/ ./src/
COPY mcp_server/ ./mcp_server/
COPY alembic/ ./alembic/
COPY alembic.ini ./

# Create non-root user for security
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Add .venv to PATH so we can run uvicorn directly
ENV PATH="/app/.venv/bin:$PATH"

# Expose port 8000 for FastAPI
EXPOSE 8000

# Health check to verify application is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')" || exit 1

# Run database migrations and start server
# Note: In production, run migrations separately before deploying
CMD ["sh", "-c", "alembic upgrade head && uvicorn src.main:app --host 0.0.0.0 --port 8000"]
