#!/bin/bash
# Stop All Services for Phase 5 Local Development

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo -e "${BLUE}=========================================="
echo "Stopping All Services"
echo -e "==========================================${NC}"
echo ""

# Create logs directory if it doesn't exist
mkdir -p "$PROJECT_ROOT/logs"

# Function to stop service by PID file
stop_service() {
    local name=$1
    local pid_file="$PROJECT_ROOT/logs/${name}.pid"

    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo "Stopping $name (PID: $pid)..."
            kill $pid 2>/dev/null || true
            sleep 2
            # Force kill if still running
            if ps -p $pid > /dev/null 2>&1; then
                kill -9 $pid 2>/dev/null || true
            fi
            echo -e "${GREEN}✓ $name stopped${NC}"
        else
            echo -e "${YELLOW}$name not running${NC}"
        fi
        rm -f "$pid_file"
    else
        echo -e "${YELLOW}$name PID file not found${NC}"
    fi
}

# Stop services in reverse order
echo "Stopping application services..."
stop_service "notification"
stop_service "websocket"
stop_service "frontend"
stop_service "backend"
echo ""

# Stop infrastructure
echo "Stopping infrastructure (Kafka, Redis)..."
cd "$PROJECT_ROOT"
docker-compose -f docker-compose.infrastructure.yml down
echo -e "${GREEN}✓ Infrastructure stopped${NC}"
echo ""

# Clean up any remaining processes on known ports
echo "Cleaning up ports..."
for port in 3000 8001 8003 8005; do
    pid=$(lsof -ti:$port 2>/dev/null || true)
    if [ ! -z "$pid" ]; then
        echo "Killing process on port $port (PID: $pid)"
        kill -9 $pid 2>/dev/null || true
    fi
done
echo ""

echo -e "${GREEN}=========================================="
echo "All Services Stopped"
echo -e "==========================================${NC}"
echo ""
echo "To start services again:"
echo "  $PROJECT_ROOT/scripts/start-all-services.sh"
echo ""
