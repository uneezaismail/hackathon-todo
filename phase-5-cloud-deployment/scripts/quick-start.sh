#!/bin/bash
# Quick Start - Simplified setup without schema conflicts

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo -e "${BLUE}=========================================="
echo "Phase 5 - Quick Start"
echo -e "==========================================${NC}"

# Step 1: Run backend migrations (proper way)
echo ""
echo -e "${BLUE}Step 1: Running backend database migrations...${NC}"
cd "$PROJECT_ROOT/backend"
if [ -f ".env" ]; then
    source .env
fi
uv run alembic upgrade head || {
    echo -e "${RED}Failed to run migrations${NC}"
    echo "Make sure DATABASE_URL is set in backend/.env"
    exit 1
}
echo -e "${GREEN}✓ Database migrations complete${NC}"

# Step 2: Start infrastructure (Kafka, Redis)
echo ""
echo -e "${BLUE}Step 2: Starting infrastructure services...${NC}"
cd "$PROJECT_ROOT"
docker-compose -f docker-compose.infrastructure.yml up -d || {
    echo -e "${RED}Failed to start infrastructure${NC}"
    exit 1
}
echo -e "${GREEN}✓ Infrastructure started${NC}"

# Wait for services
echo "Waiting 10 seconds for Kafka and Redis to initialize..."
sleep 10

# Step 3: Start application services
echo ""
echo -e "${BLUE}Step 3: Starting application services...${NC}"
docker-compose -f docker-compose.full.yml up -d || {
    echo -e "${RED}Failed to start application services${NC}"
    exit 1
}
echo -e "${GREEN}✓ Application services started${NC}"

# Wait for services
echo "Waiting 15 seconds for services to fully start..."
sleep 15

# Step 4: Check service health
echo ""
echo -e "${BLUE}Step 4: Checking service health...${NC}"
curl -s http://localhost:8001/api/health > /dev/null && echo -e "${GREEN}✓ Backend healthy${NC}" || echo -e "${RED}✗ Backend not responding${NC}"
curl -s http://localhost:3000 > /dev/null && echo -e "${GREEN}✓ Frontend healthy${NC}" || echo -e "${RED}✗ Frontend not responding${NC}"

# Summary
echo ""
echo -e "${GREEN}=========================================="
echo "Setup Complete!"
echo -e "==========================================${NC}"
echo ""
echo "Service URLs:"
echo "  Frontend:              http://localhost:3000"
echo "  Backend API:           http://localhost:8001"
echo "  Backend Docs:          http://localhost:8001/docs"
echo "  Kafka UI:              http://localhost:8080"
echo "  Redis Commander:       http://localhost:8081"
echo ""
echo "Next Steps:"
echo "  1. Open browser: http://localhost:3000"
echo "  2. Sign up for a new account"
echo "  3. Create a recurring task (daily/weekly)"
echo "  4. Complete the task and verify next instance is created"
echo "  5. Create a task with alert to test notifications"
echo ""
echo "To view logs:"
echo "  docker-compose -f docker-compose.full.yml logs -f"
echo ""
echo "To stop all services:"
echo "  docker-compose -f docker-compose.full.yml down"
echo "  docker-compose -f docker-compose.infrastructure.yml down"
echo ""
