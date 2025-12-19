-- Fix Schema Conflict Between Backend and Frontend
--
-- Problem: Backend created user/task tables with INTEGER ids
--          Frontend (Better Auth) needs user table with TEXT ids
--
-- Solution: Drop backend tables and let Better Auth create its own schema
--
-- IMPORTANT: Run this ONLY if you haven't stored important data yet!
-- If you have data, you need to migrate it first.

-- Step 1: Drop conflicting tables from backend
DROP TABLE IF EXISTS task CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS user CASCADE;
DROP TABLE IF EXISTS alembic_version;

-- Step 2: After running this, run: npx drizzle-kit push
-- This will create the Better Auth schema with TEXT ids

-- Verification queries (run after drizzle-kit push):
-- \dt  -- List all tables
-- \d user  -- Describe user table structure
