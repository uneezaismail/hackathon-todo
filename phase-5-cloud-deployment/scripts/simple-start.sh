#!/bin/bash
# Simple Start - Just Backend + Frontend (No Kafka/Redis)

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}=========================================="
echo "Phase 5 - Simple Start"
echo "==========================================${NC}"
echo ""
echo "Starting: Backend + Frontend only"
echo "Features: Recurring tasks, Alerts, AI Chat"
echo ""

# Step 1: Run migrations
echo -e "${BLUE}Step 1: Running database migrations...${NC}"
cd backend
source .env 2>/dev/null || true
uv run alembic upgrade head || {
    echo -e "${RED}Failed to run migrations${NC}"
    exit 1
}
cd ..
echo -e "${GREEN}✓ Migrations complete${NC}"

# Step 2: Stop any existing containers
echo ""
echo -e "${BLUE}Step 2: Cleaning up old containers...${NC}"
docker-compose down 2>/dev/null || true
echo -e "${GREEN}✓ Cleanup complete${NC}"

# Step 3: Start services
echo ""
echo -e "${BLUE}Step 3: Starting Backend + Frontend...${NC}"
docker-compose up -d --build

# Wait for services
echo ""
echo "Waiting 20 seconds for services to start..."
sleep 20

# Step 4: Check health
echo ""
echo -e "${BLUE}Step 4: Checking service health...${NC}"
if curl -s http://localhost:8001/api/health > /dev/null; then
    echo -e "${GREEN}✓ Backend healthy (http://localhost:8001)${NC}"
else
    echo -e "${YELLOW}⚠ Backend not responding yet${NC}"
fi

if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✓ Frontend healthy (http://localhost:3000)${NC}"
else
    echo -e "${YELLOW}⚠ Frontend not responding yet${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}=========================================="
echo "Phase 5 Running!"
echo -e "==========================================${NC}"
echo ""
echo "🌐 Access URLs:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:8001"
echo "   API Docs:  http://localhost:8001/docs"
echo ""
echo "✅ Test Phase 5 Features:"
echo "   1. Sign up at http://localhost:3000"
echo "   2. Create recurring task (daily/weekly)"
echo "   3. Complete task → verify next instance created"
echo "   4. Create task with due date + alert"
echo "   5. Use AI chat to manage tasks"
echo ""
echo "📋 View Logs:"
echo "   docker-compose logs -f backend"
echo "   docker-compose logs -f frontend"
echo ""
echo "🛑 Stop Services:"
echo "   docker-compose down"
echo ""
