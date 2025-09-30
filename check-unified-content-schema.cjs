const Database = require('better-sqlite3');
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'server', 'database.sqlite');
const db = new Database(dbPath);

console.log('🔍 Checking unified_content table schema...\n');

// Get table schema
const schema = db.prepare("PRAGMA table_info(unified_content)").all();
console.log('unified_content table schema:');
console.table(schema);

// Get sample data
console.log('\n📊 Sample data from unified_content:');
const sampleData = db.prepare("SELECT * FROM unified_content LIMIT 5").all();
console.log(sampleData);

// Check if there are any records
const count = db.prepare("SELECT COUNT(*) as count FROM unified_content").get();
console.log(`\n📈 Total records in unified_content: ${count.count}`);

db.close();