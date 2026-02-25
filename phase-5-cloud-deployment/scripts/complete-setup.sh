#!/bin/bash
# Complete Setup - Run this to fix everything at once
#
# This script runs all setup steps in sequence:
# 1. Fix authentication database tables
# 2. Start all services
# 3. Test authentication
# 4. Test notifications

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo -e "${BLUE}=========================================="
echo "Phase 5 - Complete Setup"
echo -e "==========================================${NC}"
echo ""
echo "This script will:"
echo "  1. Fix authentication database tables"
echo "  2. Start all services (infrastructure + apps)"
echo "  3. Test authentication"
echo "  4. Test notifications"
echo ""
echo "Press Enter to continue or Ctrl+C to cancel..."
read -r

# Step 1: Fix authentication
echo ""
echo -e "${BLUE}Step 1: Fixing authentication database tables...${NC}"
cd "$PROJECT_ROOT"
./scripts/fix-auth-tables.sh || {
    echo -e "${RED}Failed to fix authentication tables${NC}"
    exit 1
}

# Step 2: Start all services
echo ""
echo -e "${BLUE}Step 2: Starting all services...${NC}"
./scripts/start-all-services.sh || {
    echo -e "${RED}Failed to start services${NC}"
    exit 1
}

# Wait a bit for services to fully start
echo ""
echo "Waiting 10 seconds for services to fully initialize..."
sleep 10

# Step 3: Test authentication
echo ""
echo -e "${BLUE}Step 3: Testing authentication...${NC}"
./scripts/test-auth.sh || {
    echo -e "${YELLOW}Authentication test had warnings${NC}"
}

# Step 4: Test notifications
echo ""
echo -e "${BLUE}Step 4: Testing notifications...${NC}"
./scripts/test-notifications.sh || {
    echo -e "${YELLOW}Notification test had warnings${NC}"
}

# Summary
echo ""
echo -e "${GREEN}=========================================="
echo "Setup Complete!"
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
echo "Next Steps:"
echo "  1. Open browser: http://localhost:3000"
echo "  2. Sign in with: noona@gmail.com / Noona123@"
echo "  3. Create a task with alert to test notifications"
echo ""
echo "Optional: Configure email notifications"
echo "  cd services/notification-service"
echo "  cp .env.example .env"
echo "  nano .env  # Update SMTP settings"
echo "  cd $PROJECT_ROOT"
echo "  ./scripts/stop-all-services.sh"
echo "  ./scripts/start-all-services.sh"
echo ""
echo "To stop all services:"
echo "  ./scripts/stop-all-services.sh"
echo ""
