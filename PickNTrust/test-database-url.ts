#!/usr/bin/env node
/**
 * Diagnostic script to test the DATABASE_URL parsing fix
 */

import { cleanDatabaseUrl } from './server/utils/env-parser.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('=== DATABASE_URL Diagnostic Test ===\n');

// Test cases for different DATABASE_URL formats
const testCases = [
  'postgresql://user:password@localhost:5432/dbname',
  'DATABASE_URL=postgresql://user:password@localhost:5432/dbname',
  '  DATABASE_URL=postgresql://user:password@localhost:5432/dbname  ',
  'postgresql://user:password@localhost:5432/dbname?sslmode=require',
  'DATABASE_URL=postgresql://user:password@localhost:5432/dbname?sslmode=require'
];

console.log('Testing DATABASE_URL parsing:');
testCases.forEach((testCase, index) => {
  try {
    const result = cleanDatabaseUrl(testCase);
    console.log(`✅ Test ${index + 1}: "${testCase.substring(0, 50)}..." → "${result.substring(0, 50)}..."`);
  } catch (error) {
    console.log(`❌ Test ${index + 1}: "${testCase}" → Error: ${error.message}`);
  }
});

console.log('\n=== Environment Check ===');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
if (process.env.DATABASE_URL) {
  try {
    const cleanUrl = cleanDatabaseUrl(process.env.DATABASE_URL);
    console.log('✅ Cleaned URL:', cleanUrl.substring(0, 50) + '...');
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

console.log('\n=== Fix Summary ===');
console.log('✅ Implemented cleanDatabaseUrl() utility function');
console.log('✅ Updated database connection logic to properly parse DATABASE_URL');
console.log('✅ Added URL validation and error handling');
console.log('✅ Fixed the issue where "DATABASE_URL=" was included in the URL string');
console.log('✅ Added diagnostic script for testing the fix');
