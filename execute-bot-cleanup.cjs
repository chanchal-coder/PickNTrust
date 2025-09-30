const Database = require('better-sqlite3');
const fs = require('fs');

console.log('🧹 Starting bot-related database cleanup...');

try {
  // Open database connection
  const db = new Database('database.sqlite');
  
  // Read the SQL script
  const sqlScript = fs.readFileSync('drop-bot-tables.sql', 'utf8');
  
  // Split into individual statements and execute
  const statements = sqlScript
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
  
  console.log(`📋 Executing ${statements.length} SQL statements...`);
  
  let successCount = 0;
  let errorCount = 0;
  
  statements.forEach((statement, index) => {
    try {
      if (statement.toUpperCase().startsWith('DROP TABLE')) {
        const tableName = statement.match(/DROP TABLE IF EXISTS (\w+)/i)?.[1];
        console.log(`🗑️  Dropping table: ${tableName}`);
      } else if (statement.toUpperCase().startsWith('DELETE FROM')) {
        const tableName = statement.match(/DELETE FROM (\w+)/i)?.[1];
        console.log(`🧽 Cleaning data from: ${tableName}`);
      }
      
      db.exec(statement);
      successCount++;
    } catch (error) {
      if (!error.message.includes('no such table')) {
        console.log(`⚠️  Warning on statement ${index + 1}: ${error.message}`);
        errorCount++;
      }
    }
  });
  
  console.log(`\n✅ Cleanup completed!`);
  console.log(`   - Successful operations: ${successCount}`);
  console.log(`   - Warnings/Errors: ${errorCount}`);
  
  // Verify cleanup by checking remaining tables
  console.log('\n📊 Checking remaining tables...');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  
  const botRelatedTables = tables.filter(t => 
    t.name.includes('bot') || 
    t.name.includes('telegram') || 
    t.name.includes('channel') ||
    t.name.includes('picks_products')
  );
  
  if (botRelatedTables.length === 0) {
    console.log('✅ No bot-related tables found - cleanup successful!');
  } else {
    console.log('⚠️  Remaining bot-related tables:');
    botRelatedTables.forEach(t => console.log(`   - ${t.name}`));
  }
  
  console.log(`\n📋 Total remaining tables: ${tables.length}`);
  console.log('   Main tables:', tables.map(t => t.name).join(', '));
  
  db.close();
  console.log('\n🎉 Database cleanup completed successfully!');
  
} catch (error) {
  console.error('❌ Database cleanup failed:', error.message);
  process.exit(1);
}