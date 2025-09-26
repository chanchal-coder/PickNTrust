import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './shared/sqlite-schema.ts',
  out: './sqlite-migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './sqlite.db'
  }
});
