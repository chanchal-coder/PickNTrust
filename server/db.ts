// server/db.ts
import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema.js';
import dotenv from 'dotenv';

dotenv.config();

if (
  !process.env.DATABASE_URL ||
  !process.env.SUPABASE_URL ||
  !process.env.SUPABASE_ANON_KEY
) {
  throw new Error(
    'DATABASE_URL, SUPABASE_URL, and SUPABASE_ANON_KEY must be set in the .env file'
  );
}

// Supabase client for file storage or auth (if needed)
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Drizzle ORM Postgres client
const sql = postgres(process.env.DATABASE_URL, {
  ssl: { rejectUnauthorized: false },
});

export const db = drizzle(sql, { schema });

// Optional compatibility exports
export { supabase as default, db as dbInstance };
