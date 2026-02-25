#!/bin/bash
# Run Phase 5 locally without Docker

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}=========================================="
echo "Phase 5 - Local Run (No Docker)"
echo "==========================================${NC}"

# Step 1: Start backend
echo -e "${BLUE}Step 1: Starting backend...${NC}"
cd backend
source .env 2>/dev/null || true
uv run uvicorn src.main:app --host 0.0.0.0 --port 8002 > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
cd ..

# Step 2: Start frontend
echo -e "${BLUE}Step 2: Starting frontend...${NC}"
cd frontend
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"
cd ..

# Wait for services
echo ""
echo "Waiting 15 seconds for services to start..."
sleep 15

# Check health
echo ""
echo -e "${BLUE}Step 3: Checking service health...${NC}"
if curl -s http://localhost:8002/api/health > /dev/null; then
    echo -e "${GREEN}✓ Backend healthy${NC}"
else
    echo -e "${YELLOW}⚠ Backend not responding yet${NC}"
fi

if curl -s http://localhost:3001 > /dev/null; then
    echo -e "${GREEN}✓ Frontend healthy${NC}"
else
    echo -e "${YELLOW}⚠ Frontend not responding yet${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}=========================================="
echo "Phase 5 Running!"
echo "==========================================${NC}"
echo ""
echo "🌐 Access URLs:"
echo "   Frontend:  http://localhost:3001"
echo "   Backend:   http://localhost:8002"
echo "   API Docs:  http://localhost:8002/docs"
echo ""
echo "✅ Test Phase 5 Features:"
echo "   1. Sign up at http://localhost:3001"
echo "   2. Create recurring task (daily/weekly)"
echo "   3. Complete task → verify next instance created"
echo "   4. Create task with due date + alert"
echo "   5. Use AI chat to manage tasks"
echo ""
echo "📋 View Logs:"
echo "   tail -f /tmp/backend.log"
echo "   tail -f /tmp/frontend.log"
echo ""
echo "🛑 Stop Services:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "Process IDs saved to /tmp/phase5-pids.txt"
echo "$BACKEND_PID" > /tmp/phase5-pids.txt
echo "$FRONTEND_PID" >> /tmp/phase5-pids.txt
