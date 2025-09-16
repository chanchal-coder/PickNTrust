#!/usr/bin/env node
// Debug Drizzle ORM SQLITE_ERROR

const Database = require('better-sqlite3');

console.log('🔍 Debugging Drizzle ORM SQLITE_ERROR...');

// Test 1: Direct SQLite query
console.log('\n=== Test 1: Direct SQLite Query ===');
try {
  const db = new Database('sqlite.db');
  const result = db.prepare('SELECT id, name, price FROM products LIMIT 2').all();
  console.log('✅ Direct SQLite query successful:', result);
  db.close();
} catch (error) {
  console.error('❌ Direct SQLite query failed:', error);
}

// Test 2: Import and test Drizzle setup
console.log('\n=== Test 2: Drizzle ORM Import Test ===');
try {
  // Dynamic import for ES modules
  import('./dist/server/db.js').then(async ({ db }) => {
    console.log('✅ Drizzle db imported successfully');
    
    // Test 3: Simple Drizzle query
    console.log('\n=== Test 3: Simple Drizzle Query ===');
    try {
      // Import products schema
      const { products } = await import('./shared/sqlite-schema.js');
      console.log('✅ Products schema imported');
      
      // Try a simple select
      console.log('Attempting simple Drizzle query...');
      const result = await db.select({
        id: products.id,
        name: products.name,
        price: products.price
      }).from(products).limit(2);
      
      console.log('✅ Drizzle query successful:', result);
    } catch (drizzleError) {
      console.error('❌ Drizzle query failed:', drizzleError);
      console.error('Error details:', {
        message: drizzleError.message,
        code: drizzleError.code,
        stack: drizzleError.stack?.split('\n').slice(0, 5).join('\n')
      });
    }
  }).catch(importError => {
    console.error('❌ Failed to import Drizzle db:', importError);
  });
} catch (error) {
  console.error('❌ Failed to setup Drizzle test:', error);
}

console.log('\n🔧 Debug script completed.');