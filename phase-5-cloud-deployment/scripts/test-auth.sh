#!/bin/bash
# Test Authentication Flow
#
# This script tests the Better Auth authentication flow

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================="
echo "Testing Authentication Flow"
echo -e "==========================================${NC}"
echo ""

# Check if backend is running
echo "Step 1: Checking if backend is running..."
if curl -s http://localhost:8001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend is not running${NC}"
    echo "Please start backend: cd backend && uv run uvicorn src.main:app --reload --port 8001"
    exit 1
fi
echo ""

# Check if frontend is running
echo "Step 2: Checking if frontend is running..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is running${NC}"
else
    echo -e "${RED}✗ Frontend is not running${NC}"
    echo "Please start frontend: cd frontend && npm run dev"
    exit 1
fi
echo ""

# Test Better Auth API endpoint
echo "Step 3: Testing Better Auth API endpoint..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/auth/sign-in/email)

if [ "$response" = "405" ] || [ "$response" = "200" ]; then
    echo -e "${GREEN}✓ Better Auth API endpoint is accessible${NC}"
    echo "  Response code: $response (405 is expected for GET request)"
else
    echo -e "${RED}✗ Better Auth API endpoint returned: $response${NC}"
    echo "  Expected: 405 (Method Not Allowed) or 200"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check if route file exists: frontend/app/api/auth/[...all]/route.ts"
    echo "  2. Clear Next.js cache: rm -rf frontend/.next && cd frontend && npm run dev"
    echo "  3. Check Better Auth version: cd frontend && npm list better-auth"
fi
echo ""

# Test database connection
echo "Step 4: Testing database connection..."
cd "$(dirname "$0")/../frontend"

if grep -q "DATABASE_URL" .env.local; then
    echo -e "${GREEN}✓ DATABASE_URL configured${NC}"
else
    echo -e "${RED}✗ DATABASE_URL not found in .env.local${NC}"
    exit 1
fi
echo ""

# Test Better Auth secret
echo "Step 5: Checking Better Auth secret..."
if grep -q "BETTER_AUTH_SECRET" .env.local; then
    echo -e "${GREEN}✓ BETTER_AUTH_SECRET configured${NC}"

    # Check if backend has same secret
    cd "$(dirname "$0")/../backend"
    if grep -q "BETTER_AUTH_SECRET" .env; then
        frontend_secret=$(grep "BETTER_AUTH_SECRET" ../frontend/.env.local | cut -d'=' -f2 | tr -d '"' | tr -d ' ')
        backend_secret=$(grep "BETTER_AUTH_SECRET" .env | cut -d'=' -f2 | tr -d '"' | tr -d ' ')

        if [ "$frontend_secret" = "$backend_secret" ]; then
            echo -e "${GREEN}✓ Frontend and Backend secrets match${NC}"
        else
            echo -e "${RED}✗ Frontend and Backend secrets DO NOT match${NC}"
            echo "  This will cause authentication to fail!"
            echo "  Please ensure BETTER_AUTH_SECRET is identical in both .env files"
        fi
    else
        echo -e "${YELLOW}⚠ Backend .env not found or missing BETTER_AUTH_SECRET${NC}"
    fi
else
    echo -e "${RED}✗ BETTER_AUTH_SECRET not found in frontend/.env.local${NC}"
    exit 1
fi
echo ""

echo -e "${GREEN}=========================================="
echo "Authentication Tests Complete"
echo -e "==========================================${NC}"
echo ""
echo "Manual Test:"
echo "1. Open browser: http://localhost:3000"
echo "2. Click 'Sign In'"
echo "3. Enter credentials:"
echo "   Email: noona@gmail.com"
echo "   Password: Noona123@"
echo "4. Click 'Sign In'"
echo ""
echo "Expected Result:"
echo "  - Should redirect to /dashboard"
echo "  - Should see user name in top-right corner"
echo "  - Should be able to create tasks"
echo ""
echo "If sign-in fails:"
echo "  1. Check browser console for errors"
echo "  2. Check backend logs for JWT validation errors"
echo "  3. Run: ./scripts/fix-auth-tables.sh"
echo ""
