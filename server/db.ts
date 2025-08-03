import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

if (!process.env.DATABASE_URL || !process.env.SUPABASE_ANON_KEY || !process.env.SUPABASE_URL) {
  throw new Error(
    "DATABASE_URL, SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env",
  );
}

// Initialize Supabase client
export const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Initialize Postgres client for Drizzle ORM
const sql = postgres(process.env.DATABASE_URL, {
  ssl: { rejectUnauthorized: false }
});

export const db = drizzle(sql, { schema });
