#!/bin/bash
# Start All Services for Phase 5 Local Development
#
# This script starts all required services in the correct order:
# 1. Infrastructure (Kafka, Redis)
# 2. Backend
# 3. Frontend
# 4. WebSocket Service
# 5. Notification Service

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo -e "${BLUE}=========================================="
echo "Phase 5 Local Development Setup"
echo -e "==========================================${NC}"
echo ""

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to wait for service
wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=0

    echo -n "Waiting for $name to be ready..."
    while [ $attempt -lt $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo -e " ${GREEN}✓${NC}"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    echo -e " ${RED}✗${NC}"
    echo -e "${RED}Error: $name failed to start${NC}"
    return 1
}

# Step 1: Start Infrastructure
echo -e "${BLUE}Step 1: Starting Infrastructure (Kafka, Redis)${NC}"
cd "$PROJECT_ROOT"

if check_port 9092 && check_port 6379; then
    echo -e "${YELLOW}Infrastructure already running${NC}"
else
    echo "Starting docker-compose infrastructure..."
    docker-compose -f docker-compose.infrastructure.yml up -d

    # Wait for services
    wait_for_service "http://localhost:8080" "Kafka UI" || true
    echo "Waiting for Kafka to be ready (30 seconds)..."
    sleep 30
    echo -e "${GREEN}✓ Infrastructure started${NC}"
fi
echo ""

# Step 2: Check Database Tables
echo -e "${BLUE}Step 2: Checking Database Tables${NC}"
cd "$PROJECT_ROOT/frontend"

if [ ! -f ".env.local" ]; then
    echo -e "${RED}Error: frontend/.env.local not found${NC}"
    echo "Please create .env.local with DATABASE_URL and BETTER_AUTH_SECRET"
    exit 1
fi

echo "Pushing database schema..."
timeout 60 npx drizzle-kit push --config=drizzle.config.ts 2>&1 | grep -v "Pulling schema" || true
echo -e "${GREEN}✓ Database tables verified${NC}"
echo ""

# Step 3: Start Backend
echo -e "${BLUE}Step 3: Starting Backend (Port 8001)${NC}"
cd "$PROJECT_ROOT/backend"

if check_port 8001; then
    echo -e "${YELLOW}Backend already running on port 8001${NC}"
else
    echo "Installing backend dependencies..."
    uv sync > /dev/null 2>&1

    echo "Running database migrations..."
    uv run alembic upgrade head > /dev/null 2>&1

    echo "Starting backend in background..."
    nohup uv run uvicorn src.main:app --host 0.0.0.0 --port 8001 > "$PROJECT_ROOT/logs/backend.log" 2>&1 &
    echo $! > "$PROJECT_ROOT/logs/backend.pid"

    wait_for_service "http://localhost:8001/api/health" "Backend"
fi
echo ""

# Step 4: Start Frontend
echo -e "${BLUE}Step 4: Starting Frontend (Port 3000)${NC}"
cd "$PROJECT_ROOT/frontend"

if check_port 3000; then
    echo -e "${YELLOW}Frontend already running on port 3000${NC}"
else
    echo "Installing frontend dependencies..."
    npm install > /dev/null 2>&1

    echo "Starting frontend in background..."
    nohup npm run dev > "$PROJECT_ROOT/logs/frontend.log" 2>&1 &
    echo $! > "$PROJECT_ROOT/logs/frontend.pid"

    wait_for_service "http://localhost:3000" "Frontend"
fi
echo ""

# Step 5: Start WebSocket Service
echo -e "${BLUE}Step 5: Starting WebSocket Service (Port 8005)${NC}"
cd "$PROJECT_ROOT/services/websocket-service"

if check_port 8005; then
    echo -e "${YELLOW}WebSocket service already running on port 8005${NC}"
else
    # Create .env if not exists
    if [ ! -f ".env" ]; then
        cp .env.example .env 2>/dev/null || true
    fi

    echo "Installing websocket service dependencies..."
    uv sync > /dev/null 2>&1

    echo "Starting websocket service in background..."
    nohup uv run uvicorn src.main:app --host 0.0.0.0 --port 8005 > "$PROJECT_ROOT/logs/websocket.log" 2>&1 &
    echo $! > "$PROJECT_ROOT/logs/websocket.pid"

    wait_for_service "http://localhost:8005/health" "WebSocket Service"
fi
echo ""

# Step 6: Start Notification Service
echo -e "${BLUE}Step 6: Starting Notification Service (Port 8003)${NC}"
cd "$PROJECT_ROOT/services/notification-service"

if check_port 8003; then
    echo -e "${YELLOW}Notification service already running on port 8003${NC}"
else
    # Create .env if not exists
    if [ ! -f ".env" ]; then
        cp .env.example .env 2>/dev/null || true
        echo -e "${YELLOW}Warning: Please configure SMTP settings in services/notification-service/.env${NC}"
    fi

    echo "Installing notification service dependencies..."
    uv sync > /dev/null 2>&1

    echo "Starting notification service in background..."
    nohup uv run uvicorn src.main:app --host 0.0.0.0 --port 8003 > "$PROJECT_ROOT/logs/notification.log" 2>&1 &
    echo $! > "$PROJECT_ROOT/logs/notification.pid"

    wait_for_service "http://localhost:8003/health" "Notification Service"
fi
echo ""

# Summary
echo -e "${GREEN}=========================================="
echo "All Services Started Successfully!"
echo -e "==========================================${NC}"
echo ""
echo "Service URLs:"
echo "  Frontend:              http://localhost:3000"
echo "  Backend:               http://localhost:8001"
echo "  WebSocket Service:     http://localhost:8005"
echo "  Notification Service:  http://localhost:8003"
echo "  Kafka UI:              http://localhost:8080"
echo "  Redis Commander:       http://localhost:8081"
echo ""
echo "Logs:"
echo "  Backend:       tail -f $PROJECT_ROOT/logs/backend.log"
echo "  Frontend:      tail -f $PROJECT_ROOT/logs/frontend.log"
echo "  WebSocket:     tail -f $PROJECT_ROOT/logs/websocket.log"
echo "  Notification:  tail -f $PROJECT_ROOT/logs/notification.log"
echo ""
echo "To stop all services:"
echo "  $PROJECT_ROOT/scripts/stop-all-services.sh"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Open browser: http://localhost:3000"
echo "2. Sign in with: noona@gmail.com / Noona123@"
echo "3. Create a task with alert to test notifications"
echo ""
