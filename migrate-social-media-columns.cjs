/**
 * Database Migration: Add Social Media Posting Columns
 * Adds columns to track social media posting status and results
 */

const Database = require('better-sqlite3');
const path = require('path');

function migrateSocialMediaColumns() {
  console.log('🔄 Migrating database for social media posting...');
  
  const dbPath = path.join(__dirname, 'database.sqlite');
  const db = new Database(dbPath);
  
  try {
    // Check current schema of canva_posts table
    console.log('\n1️⃣ Checking current canva_posts table schema...');
    const tableInfo = db.prepare("PRAGMA table_info(canva_posts)").all();
    
    console.log('📋 Current columns:');
    tableInfo.forEach(column => {
      console.log(`   - ${column.name}: ${column.type}`);
    });
    
    // Check if new columns already exist
    const hasPostId = tableInfo.some(col => col.name === 'social_media_post_id');
    const hasErrorMessage = tableInfo.some(col => col.name === 'error_message');
    const hasPostedAt = tableInfo.some(col => col.name === 'posted_at');
    
    console.log('\n2️⃣ Checking for new columns...');
    console.log(`   - social_media_post_id: ${hasPostId ? 'EXISTS' : 'MISSING'}`);
    console.log(`   - error_message: ${hasErrorMessage ? 'EXISTS' : 'MISSING'}`);
    console.log(`   - posted_at: ${hasPostedAt ? 'EXISTS' : 'MISSING'}`);
    
    // Add missing columns
    let columnsAdded = 0;
    
    if (!hasPostId) {
      console.log('\n➕ Adding social_media_post_id column...');
      db.exec('ALTER TABLE canva_posts ADD COLUMN social_media_post_id TEXT');
      columnsAdded++;
    }
    
    if (!hasErrorMessage) {
      console.log('➕ Adding error_message column...');
      db.exec('ALTER TABLE canva_posts ADD COLUMN error_message TEXT');
      columnsAdded++;
    }
    
    if (!hasPostedAt) {
      console.log('➕ Adding posted_at column...');
      db.exec('ALTER TABLE canva_posts ADD COLUMN posted_at TEXT');
      columnsAdded++;
    }
    
    if (columnsAdded === 0) {
      console.log('\n✅ All columns already exist - no migration needed');
    } else {
      console.log(`\n✅ Successfully added ${columnsAdded} new columns`);
    }
    
    // Verify the updated schema
    console.log('\n3️⃣ Verifying updated schema...');
    const updatedTableInfo = db.prepare("PRAGMA table_info(canva_posts)").all();
    
    console.log('📋 Updated columns:');
    updatedTableInfo.forEach(column => {
      const isNew = !tableInfo.some(oldCol => oldCol.name === column.name);
      const marker = isNew ? '🆕' : '  ';
      console.log(`   ${marker} ${column.name}: ${column.type}`);
    });
    
    // Update existing records to have proper status
    console.log('\n4️⃣ Updating existing records...');
    const existingRecords = db.prepare('SELECT COUNT(*) as count FROM canva_posts').get();
    console.log(`   📊 Found ${existingRecords.count} existing records`);
    
    if (existingRecords.count > 0) {
      // Update records that don't have proper status
      const updateStmt = db.prepare(`
        UPDATE canva_posts 
        SET status = 'pending' 
        WHERE status IS NULL OR status = ''
      `);
      
      const result = updateStmt.run();
      console.log(`   ✅ Updated ${result.changes} records to 'pending' status`);
    }
    
    // Create indexes for better performance
    console.log('\n5️⃣ Creating performance indexes...');
    
    try {
      db.exec('CREATE INDEX IF NOT EXISTS idx_canva_posts_status ON canva_posts(status)');
      db.exec('CREATE INDEX IF NOT EXISTS idx_canva_posts_platforms ON canva_posts(platforms)');
      db.exec('CREATE INDEX IF NOT EXISTS idx_canva_posts_content ON canva_posts(content_type, content_id)');
      db.exec('CREATE INDEX IF NOT EXISTS idx_canva_posts_created_at ON canva_posts(created_at)');
      console.log('   ✅ Performance indexes created');
    } catch (indexError) {
      console.log('   ⚠️ Some indexes may already exist:', indexError.message);
    }
    
    // Show sample data
    console.log('\n6️⃣ Sample data preview...');
    const sampleData = db.prepare(`
      SELECT 
        id, content_type, content_id, platforms, status, 
        social_media_post_id, error_message, created_at, posted_at
      FROM canva_posts 
      ORDER BY created_at DESC 
      LIMIT 5
    `).all();
    
    if (sampleData.length > 0) {
      console.log('📋 Recent records:');
      sampleData.forEach((record, index) => {
        console.log(`   ${index + 1}. ${record.content_type} #${record.content_id} → ${record.platforms}`);
        console.log(`      Status: ${record.status || 'NULL'}`);
        console.log(`      Post ID: ${record.social_media_post_id || 'NULL'}`);
        console.log(`      Error: ${record.error_message || 'NULL'}`);
        console.log(`      Posted: ${record.posted_at || 'NULL'}`);
        console.log('');
      });
    } else {
      console.log('   📭 No records found');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SOCIAL MEDIA MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('✅ Database is ready for social media posting');
    console.log('✅ New columns added for tracking post status');
    console.log('✅ Performance indexes created');
    console.log('✅ Existing records updated');
    
    console.log('\n📝 Next Steps:');
    console.log('1. Add your social media API credentials to .env file');
    console.log('2. Restart your server to load the new functionality');
    console.log('3. Test posting by adding a product through admin panel');
    console.log('4. Check /api/admin/social-media/status for posting results');
    
    return true;
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  } finally {
    db.close();
  }
}

// Run migration if called directly
if (require.main === module) {
  const success = migrateSocialMediaColumns();
  process.exit(success ? 0 : 1);
}

module.exports = { migrateSocialMediaColumns };