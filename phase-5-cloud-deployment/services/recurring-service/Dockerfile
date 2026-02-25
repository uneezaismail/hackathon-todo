# Dockerfile for Recurring Service - Phase V Microservice
FROM python:3.13-slim

# Install system dependencies
RUN apt-get update -o Acquire::Check-Valid-Until=false && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Copy UV binary from official image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Copy dependency files
COPY pyproject.toml ./
COPY requirements.txt ./

# Install dependencies directly to system Python
RUN uv pip install --system --no-cache -r requirements.txt

# Copy application code (main.py at root, not in src/)
COPY main.py ./
COPY dapr/ ./dapr/

EXPOSE 8006

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8006/health || exit 1

CMD ["python", "main.py"]
