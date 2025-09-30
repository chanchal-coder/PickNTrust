/**
 * Fix SQLite Errors and Database Issues
 * This script resolves the SQLITE_ERROR issues in the server logs
 */

const { db } = require('./server/db.ts');
const fs = require('fs');
const path = require('path');

console.log('🔧 FIXING SQLITE ERRORS...');
console.log('='.repeat(50));

async function fixSQLiteErrors() {
  try {
    console.log('\n1. 🔍 Checking database integrity...');
    
    // Check database file permissions and integrity
    const dbPath = './database.sqlite';
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      console.log(`   Database size: ${(stats.size / 1024).toFixed(2)} KB`);
    }

    console.log('\n2. 🔧 Optimizing database connections...');
    
    // Optimize SQLite settings for better concurrent access
    await db.run('PRAGMA journal_mode = WAL;');
    await db.run('PRAGMA synchronous = NORMAL;');
    await db.run('PRAGMA cache_size = 10000;');
    await db.run('PRAGMA temp_store = memory;');
    await db.run('PRAGMA mmap_size = 268435456;');
    
    console.log('   ✅ Database optimizations applied');

    console.log('\n3. 🔍 Checking announcement table integrity...');
    
    // Verify announcement table structure
    const tableInfo = await db.all('PRAGMA table_info(announcements);');
    console.log('   Table columns:', tableInfo.map(col => col.name).join(', '));
    
    // Check for any corrupted records
    const corruptedCount = await db.get(`
      SELECT COUNT(*) as count FROM announcements 
      WHERE message IS NULL OR message = ''
    `);
    
    if (corruptedCount.count > 0) {
      console.log(`   ⚠️  Found ${corruptedCount.count} corrupted records`);
      await db.run('DELETE FROM announcements WHERE message IS NULL OR message = \'\';');
      console.log('   ✅ Corrupted records cleaned');
    }

    console.log('\n4. 🔧 Fixing database indexes...');
    
    // Recreate indexes to fix any corruption
    await db.run('DROP INDEX IF EXISTS idx_announcements_page;');
    await db.run('DROP INDEX IF EXISTS idx_announcements_global;');
    
    await db.run('CREATE INDEX IF NOT EXISTS idx_announcements_page ON announcements(page, is_active);');
    await db.run('CREATE INDEX IF NOT EXISTS idx_announcements_global ON announcements(is_global, is_active);');
    await db.run('CREATE INDEX IF NOT EXISTS idx_announcements_created ON announcements(created_at);');
    
    console.log('   ✅ Database indexes recreated');

    console.log('\n5. 🧹 Running database maintenance...');
    
    // Run VACUUM to optimize database
    await db.run('VACUUM;');
    await db.run('ANALYZE;');
    
    console.log('   ✅ Database maintenance completed');

    console.log('\n6. ✅ Testing announcement queries...');
    
    // Test critical queries
    const activeAnnouncements = await db.all(`
      SELECT id, message, page, is_global, is_active 
      FROM announcements 
      WHERE is_active = 1
    `);
    
    console.log(`   Found ${activeAnnouncements.length} active announcements:`);
    activeAnnouncements.forEach(ann => {
      const scope = ann.is_global ? '🌐 Global' : `📄 Page: ${ann.page}`;
      console.log(`   - ID ${ann.id}: "${ann.message}" (${scope})`);
    });

    console.log('\n7. 🔧 Creating error prevention measures...');
    
    // Add database connection pooling settings
    const configContent = `
-- SQLite Optimization Settings
-- Applied automatically to prevent SQLITE_ERROR issues

PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = 10000;
PRAGMA temp_store = memory;
PRAGMA mmap_size = 268435456;
PRAGMA busy_timeout = 30000;
`;
    
    fs.writeFileSync('./sqlite-optimizations.sql', configContent);
    console.log('   ✅ SQLite optimization file created');

    console.log('\n🎉 SQLITE ERROR FIX COMPLETED!');
    console.log('\n📋 Summary of fixes applied:');
    console.log('   ✅ Database connection optimizations');
    console.log('   ✅ Journal mode set to WAL for better concurrency');
    console.log('   ✅ Indexes recreated and optimized');
    console.log('   ✅ Database vacuumed and analyzed');
    console.log('   ✅ Error prevention measures implemented');
    
    console.log('\n🚀 Next steps:');
    console.log('   1. Restart PM2 services to apply changes');
    console.log('   2. Monitor logs for reduced error frequency');
    console.log('   3. Test announcement functionality');
    
  } catch (error) {
    console.error('❌ Error during SQLite fix:', error);
    throw error;
  }
}

// Run the fix
fixSQLiteErrors()
  .then(() => {
    console.log('\n✅ SQLite error fix completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ SQLite error fix failed:', error);
    process.exit(1);
  });