import dotenv from 'dotenv';
dotenv.config();

console.log('--- ENV CHECK ---');

if (process.env.DATABASE_URL) {
  console.log('DATABASE_URL: Success');
  console.log('Value:', process.env.DATABASE_URL.substring(0, 60) + '...');
} else {
  console.log('DATABASE_URL: Error NOT SET');
}

if (process.env.SUPABASE_URL) {
  console.log('SUPABASE_URL: Success');
  console.log('Value:', process.env.SUPABASE_URL);
} else {
  console.log('SUPABASE_URL: Error NOT SET');
}

if (process.env.SUPABASE_ANON_KEY) {
  console.log('SUPABASE_ANON_KEY: Success');
  console.log('Value:', process.env.SUPABASE_ANON_KEY.substring(0, 30) + '...');
} else {
  console.log('SUPABASE_ANON_KEY: Error NOT SET');
}
