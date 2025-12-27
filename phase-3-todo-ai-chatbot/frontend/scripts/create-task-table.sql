-- Create task table for FastAPI backend
-- This table stores user tasks with TEXT user_id matching Better Auth

CREATE TABLE IF NOT EXISTS task (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on user_id for fast task lookups by user
CREATE INDEX IF NOT EXISTS idx_task_user_id ON task(user_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_task_created_at ON task(created_at DESC);

-- Display table structure
SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'task'
ORDER BY ordinal_position;
