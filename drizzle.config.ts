import { env } from '@/infra/env';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './src/infra/db/migrations',
  schema: './src/infra/db/schemas.ts',
  dialect: 'postgresql',
  schemaFilter: ["public"],
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
