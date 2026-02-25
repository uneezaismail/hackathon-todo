#!/bin/bash
# Test Notification System
#
# This script tests the complete notification flow

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================="
echo "Testing Notification System"
echo -e "==========================================${NC}"
echo ""

# Check infrastructure
echo "Step 1: Checking infrastructure services..."

# Check Kafka
if curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Kafka UI is running (port 8080)${NC}"
else
    echo -e "${RED}✗ Kafka UI is not running${NC}"
    echo "  Start infrastructure: docker-compose -f docker-compose.infrastructure.yml up -d"
fi

# Check Redis
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Redis is running (port 6379)${NC}"
else
    echo -e "${RED}✗ Redis is not running${NC}"
    echo "  Start infrastructure: docker-compose -f docker-compose.infrastructure.yml up -d"
fi
echo ""

# Check application services
echo "Step 2: Checking application services..."

# Check Backend
if curl -s http://localhost:8001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running (port 8001)${NC}"
else
    echo -e "${RED}✗ Backend is not running${NC}"
    echo "  Start backend: cd backend && uv run uvicorn src.main:app --reload --port 8001"
fi

# Check Frontend
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is running (port 3000)${NC}"
else
    echo -e "${RED}✗ Frontend is not running${NC}"
    echo "  Start frontend: cd frontend && npm run dev"
fi

# Check WebSocket Service
if curl -s http://localhost:8005/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ WebSocket Service is running (port 8005)${NC}"
else
    echo -e "${RED}✗ WebSocket Service is not running${NC}"
    echo "  Start service: cd services/websocket-service && uv run uvicorn src.main:app --reload --port 8005"
fi

# Check Notification Service
if curl -s http://localhost:8003/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Notification Service is running (port 8003)${NC}"
else
    echo -e "${RED}✗ Notification Service is not running${NC}"
    echo "  Start service: cd services/notification-service && uv run uvicorn src.main:app --reload --port 8003"
fi
echo ""

# Check SMTP configuration
echo "Step 3: Checking SMTP configuration..."
cd "$(dirname "$0")/../services/notification-service"

if [ -f ".env" ]; then
    if grep -q "SMTP_USER" .env && grep -q "SMTP_PASSWORD" .env; then
        smtp_user=$(grep "SMTP_USER" .env | cut -d'=' -f2)
        if [ ! -z "$smtp_user" ] && [ "$smtp_user" != "" ]; then
            echo -e "${GREEN}✓ SMTP credentials configured${NC}"
        else
            echo -e "${YELLOW}⚠ SMTP_USER is empty${NC}"
            echo "  Email notifications will not work"
            echo "  Configure in: services/notification-service/.env"
        fi
    else
        echo -e "${YELLOW}⚠ SMTP configuration missing${NC}"
        echo "  Email notifications will not work"
        echo "  Configure in: services/notification-service/.env"
    fi
else
    echo -e "${YELLOW}⚠ Notification service .env not found${NC}"
    echo "  Copy from: services/notification-service/.env.example"
fi
echo ""

# Test email sending (if configured)
echo "Step 4: Testing email notification (optional)..."
if [ -f ".env" ] && grep -q "SMTP_USER" .env; then
    smtp_user=$(grep "SMTP_USER" .env | cut -d'=' -f2)
    if [ ! -z "$smtp_user" ] && [ "$smtp_user" != "" ]; then
        echo "Sending test email to: $smtp_user"

        response=$(curl -s -X POST http://localhost:8003/api/test/send-email \
            -H "Content-Type: application/json" \
            -d "{
                \"to\": \"$smtp_user\",
                \"subject\": \"Test Notification\",
                \"message\": \"This is a test email from the notification service.\"
            }")

        if echo "$response" | grep -q "\"success\":true"; then
            echo -e "${GREEN}✓ Test email sent successfully${NC}"
            echo "  Check your inbox: $smtp_user"
        else
            echo -e "${RED}✗ Test email failed${NC}"
            echo "  Response: $response"
            echo ""
            echo "Troubleshooting:"
            echo "  1. Verify SMTP credentials in services/notification-service/.env"
            echo "  2. For Gmail, use App Password (not regular password)"
            echo "  3. Generate App Password: https://myaccount.google.com/apppasswords"
        fi
    else
        echo -e "${YELLOW}⚠ SMTP not configured, skipping email test${NC}"
    fi
else
    echo -e "${YELLOW}⚠ SMTP not configured, skipping email test${NC}"
fi
echo ""

echo -e "${GREEN}=========================================="
echo "Notification System Tests Complete"
echo -e "==========================================${NC}"
echo ""
echo "Manual Test:"
echo "1. Sign in to the application: http://localhost:3000"
echo "2. Create a new task with a due date"
echo "3. Set an alert/reminder for the task"
echo "4. Wait for the alert to fire (or set it to fire soon)"
echo ""
echo "Expected Results:"
echo "  ✓ Notification bell shows 'Connected' (not 'Reconnecting...')"
echo "  ✓ Toast notification appears when alert fires"
echo "  ✓ Notification bell badge shows count"
echo "  ✓ Email notification received (if SMTP configured)"
echo ""
echo "Debugging:"
echo "  - Backend logs: tail -f logs/backend.log"
echo "  - WebSocket logs: tail -f logs/websocket.log"
echo "  - Notification logs: tail -f logs/notification.log"
echo "  - Kafka UI: http://localhost:8080"
echo "  - Redis Commander: http://localhost:8081"
echo ""
