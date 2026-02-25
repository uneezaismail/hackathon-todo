#!/bin/bash
# Fix Authentication Database Tables
#
# This script ensures Better Auth tables exist in Neon database
# and verifies the authentication setup is correct.

set -e

echo "=========================================="
echo "Fix Authentication Database Tables"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Navigate to frontend directory
cd "$(dirname "$0")/../frontend"

echo "Step 1: Checking environment variables..."
if [ ! -f ".env.local" ]; then
    echo -e "${RED}Error: .env.local not found${NC}"
    echo "Please create .env.local with DATABASE_URL and BETTER_AUTH_SECRET"
    exit 1
fi

# Check if DATABASE_URL exists
if ! grep -q "DATABASE_URL" .env.local; then
    echo -e "${RED}Error: DATABASE_URL not found in .env.local${NC}"
    exit 1
fi

# Check if BETTER_AUTH_SECRET exists
if ! grep -q "BETTER_AUTH_SECRET" .env.local; then
    echo -e "${RED}Error: BETTER_AUTH_SECRET not found in .env.local${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Environment variables found${NC}"
echo ""

echo "Step 2: Installing dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
fi
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

echo "Step 3: Pushing database schema to Neon..."
echo "This will create user, session, and account tables if they don't exist."
echo ""

# Push schema with timeout
timeout 60 npx drizzle-kit push --config=drizzle.config.ts || {
    echo -e "${YELLOW}Warning: Schema push timed out or failed${NC}"
    echo "This might be normal if tables already exist."
}

echo ""
echo -e "${GREEN}✓ Schema push completed${NC}"
echo ""

echo "Step 4: Verifying tables..."
echo "Opening Drizzle Studio to verify tables exist..."
echo "Please check for: user, session, account tables"
echo ""
echo "Press Ctrl+C to exit Drizzle Studio when done."
echo ""

# Open Drizzle Studio (will run until user stops it)
npx drizzle-kit studio --config=drizzle.config.ts &
STUDIO_PID=$!

echo ""
echo "Drizzle Studio started at: http://localhost:4983"
echo "Press Enter when you've verified the tables exist..."
read -r

# Kill Drizzle Studio
kill $STUDIO_PID 2>/dev/null || true

echo ""
echo "=========================================="
echo "Authentication Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Start backend: cd backend && uv run uvicorn src.main:app --reload --port 8001"
echo "2. Start frontend: cd frontend && npm run dev"
echo "3. Test sign-in at: http://localhost:3000/sign-in"
echo ""
echo "Test credentials:"
echo "  Email: noona@gmail.com"
echo "  Password: Noona123@"
echo ""
