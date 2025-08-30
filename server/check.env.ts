import dotenv from 'dotenv';
dotenv.config();

console.log('--- ENV CHECK ---');

if (process.env.DATABASE_URL) {
  console.log('DATABASE_URL: ✅');
  console.log('Value:', process.env.DATABASE_URL.substring(0, 60) + '...');
} else {
  console.log('DATABASE_URL: ❌ NOT SET');
}

// Removed SUPABASE_URL check as project uses SQLite

if (process.env.SUPABASE_ANON_KEY) {
  console.log('SUPABASE_ANON_KEY: ✅');
  console.log('Value:', process.env.SUPABASE_ANON_KEY.substring(0, 30) + '...');
} else {
  console.log('SUPABASE_ANON_KEY: ❌ NOT SET');
}
