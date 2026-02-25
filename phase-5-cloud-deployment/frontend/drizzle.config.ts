import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    ssl: true,
  },
  // Only manage auth tables - backend (Alembic) manages task/chat/alert tables
  tablesFilter: ['user', 'session', 'account'],
  // Ignore other schemas/types that backend creates
  schemaFilter: ['public'],
  // Don't drop types that backend created (like deliverystatus enum)
  strict: false,
})
