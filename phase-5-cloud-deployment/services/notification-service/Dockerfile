# Dockerfile for Notification Service - Phase V Microservice
FROM python:3.13-slim

# Install system dependencies
RUN apt-get update -o Acquire::Check-Valid-Until=false && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Copy UV binary from official image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Install dependencies directly (not as package)
RUN uv pip install --system --no-cache \
    fastapi uvicorn pydantic aiosmtplib jinja2 httpx aiofiles

# Copy application code
COPY src/ ./src/

EXPOSE 8002

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8002/health || exit 1

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8002"]
