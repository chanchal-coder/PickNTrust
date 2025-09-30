const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

console.log('🔍 Debugging server database path...');

// Simulate server's path resolution exactly
const serverDir = path.dirname(path.join(process.cwd(), 'server', 'routes.ts'));
const serverDbPath = path.join(serverDir, '../database.sqlite');

console.log('Current working directory:', process.cwd());
console.log('Server directory (simulated):', serverDir);
console.log('Server database path:', serverDbPath);
console.log('Resolved server path:', path.resolve(serverDbPath));

// Check our working database
const workingDbPath = path.join(process.cwd(), 'database.sqlite');
console.log('Working database path:', workingDbPath);
console.log('Resolved working path:', path.resolve(workingDbPath));

console.log('\nFile existence check:');
console.log('Server DB exists:', fs.existsSync(serverDbPath));
console.log('Working DB exists:', fs.existsSync(workingDbPath));

console.log('\nPaths are same:', path.resolve(serverDbPath) === path.resolve(workingDbPath));

// Test both databases
try {
  console.log('\n--- Testing Server Database Path ---');
  const serverDb = new Database(serverDbPath);
  const serverTables = serverDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tables in server DB:', serverTables.map(t => t.name));
  
  const hasUnifiedContent = serverTables.some(t => t.name === 'unified_content');
  console.log('Has unified_content:', hasUnifiedContent);
  
  if (hasUnifiedContent) {
    const count = serverDb.prepare("SELECT COUNT(*) as count FROM unified_content").get();
    console.log('Rows in unified_content:', count.count);
  }
  
  serverDb.close();
  
} catch (error) {
  console.error('❌ Error with server database:', error.message);
}

try {
  console.log('\n--- Testing Working Database Path ---');
  const workingDb = new Database(workingDbPath);
  const workingTables = workingDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tables in working DB:', workingTables.map(t => t.name));
  
  const hasUnifiedContent = workingTables.some(t => t.name === 'unified_content');
  console.log('Has unified_content:', hasUnifiedContent);
  
  if (hasUnifiedContent) {
    const count = workingDb.prepare("SELECT COUNT(*) as count FROM unified_content").get();
    console.log('Rows in unified_content:', count.count);
  }
  
  workingDb.close();
  
} catch (error) {
  console.error('❌ Error with working database:', error.message);
}