import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/sqlite-schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: "sqlite.db",
  },
});
