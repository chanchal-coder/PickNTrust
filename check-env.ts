import dotenv from 'dotenv';
dotenv.config();

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');

if (process.env.DATABASE_URL) {
  console.log('DATABASE_URL value:', process.env.DATABASE_URL.substring(0, 50) + '...');
}

if (process.env.SUPABASE_URL) {
  console.log('SUPABASE_URL value:', process.env.SUPABASE_URL);
}

if (process.env.SUPABASE_ANON_KEY) {
  console.log('SUPABASE_ANON_KEY value:', process.env.SUPABASE_ANON_KEY.substring(0, 20) + '...');
}
