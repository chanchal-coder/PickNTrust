const Database = require('better-sqlite3');
const fs = require('fs');

console.log('🧹 Starting final bot-related database cleanup...');

try {
  // Open database connection
  const db = new Database('database.sqlite');
  
  // Read the final SQL script
  const sqlScript = fs.readFileSync('final-bot-cleanup.sql', 'utf8');
  
  // Split into individual statements and execute
  const statements = sqlScript
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
  
  console.log(`📋 Executing ${statements.length} final cleanup statements...`);
  
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
      
      const result = db.exec(statement);
      successCount++;
    } catch (error) {
      if (!error.message.includes('no such table') && !error.message.includes('no such column')) {
        console.log(`⚠️  Warning on statement ${index + 1}: ${error.message}`);
        errorCount++;
      }
    }
  });
  
  console.log(`\n✅ Final cleanup completed!`);
  console.log(`   - Successful operations: ${successCount}`);
  console.log(`   - Warnings/Errors: ${errorCount}`);
  
  // Final verification - check for any remaining bot-related tables
  console.log('\n📊 Final verification - checking for bot-related tables...');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  
  const botRelatedTables = tables.filter(t => 
    t.name.includes('bot') || 
    t.name.includes('telegram') || 
    t.name.includes('channel') ||
    t.name.includes('picks_products') ||
    t.name.includes('prime_picks') ||
    t.name.includes('cue_picks') ||
    t.name.includes('value_picks') ||
    t.name.includes('click_picks') ||
    t.name.includes('loot_box')
  );
  
  if (botRelatedTables.length === 0) {
    console.log('✅ SUCCESS: No bot-related tables found - complete cleanup achieved!');
  } else {
    console.log('⚠️  Still remaining bot-related tables:');
    botRelatedTables.forEach(t => console.log(`   - ${t.name}`));
  }
  
  console.log(`\n📋 Total remaining tables: ${tables.length}`);
  
  db.close();
  console.log('\n🎉 Final database cleanup completed!');
  
} catch (error) {
  console.error('❌ Final cleanup failed:', error.message);
  process.exit(1);
}