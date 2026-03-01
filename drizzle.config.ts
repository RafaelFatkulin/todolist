import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/modules/**/*.schema.ts',
  out: './src/infrastructure/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
