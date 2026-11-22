import { defineConfig } from 'drizzle-kit'

// Миграции идут по прямому (не пул) подключению, если оно есть.
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || '',
  },
})
