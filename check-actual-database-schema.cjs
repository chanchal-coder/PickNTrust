const Database = require('better-sqlite3');
const path = require('path');

console.log('🔍 Checking Actual Database Schema...\n');

const dbPath = path.join(__dirname, 'database.db');
const db = new Database(dbPath);

try {
  console.log('📋 DATABASE TABLES:');
  console.log('='.repeat(40));
  
  // Get all tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Available tables:', tables.map(t => t.name).join(', '));
  
  // Check channel_posts table schema
  console.log('\n📊 CHANNEL_POSTS TABLE SCHEMA:');
  console.log('-'.repeat(30));
  
  try {
    const channelPostsSchema = db.prepare("PRAGMA table_info(channel_posts)").all();
    if (channelPostsSchema.length > 0) {
      console.log('channel_posts table columns:');
      channelPostsSchema.forEach(col => {
        console.log(`- ${col.name} (${col.type})`);
      });
    } else {
      console.log('❌ channel_posts table not found or empty');
    }
  } catch (error) {
    console.log('❌ Error checking channel_posts schema:', error.message);
  }
  
  // Check unified_content table schema
  console.log('\n📊 UNIFIED_CONTENT TABLE SCHEMA:');
  console.log('-'.repeat(30));
  
  try {
    const unifiedContentSchema = db.prepare("PRAGMA table_info(unified_content)").all();
    if (unifiedContentSchema.length > 0) {
      console.log('unified_content table columns:');
      unifiedContentSchema.forEach(col => {
        console.log(`- ${col.name} (${col.type})`);
      });
    } else {
      console.log('❌ unified_content table not found or empty');
    }
  } catch (error) {
    console.log('❌ Error checking unified_content schema:', error.message);
  }
  
  // Check recent data in both tables
  console.log('\n📈 RECENT DATA CHECK:');
  console.log('-'.repeat(30));
  
  try {
    const recentChannelPosts = db.prepare("SELECT COUNT(*) as count FROM channel_posts WHERE created_at > ?").get(Date.now() - 24 * 60 * 60 * 1000);
    console.log(`Recent channel_posts (24h): ${recentChannelPosts.count}`);
  } catch (error) {
    console.log('❌ Error checking recent channel_posts:', error.message);
  }
  
  try {
    const recentUnifiedContent = db.prepare("SELECT COUNT(*) as count FROM unified_content WHERE created_at > datetime('now', '-24 hours')").get();
    console.log(`Recent unified_content (24h): ${recentUnifiedContent.count}`);
  } catch (error) {
    console.log('❌ Error checking recent unified_content:', error.message);
  }
  
  // Sample recent entries
  console.log('\n📋 SAMPLE RECENT ENTRIES:');
  console.log('-'.repeat(30));
  
  try {
    const sampleChannelPosts = db.prepare("SELECT * FROM channel_posts ORDER BY created_at DESC LIMIT 3").all();
    console.log('Recent channel_posts:');
    sampleChannelPosts.forEach((post, i) => {
      console.log(`  ${i+1}. ID: ${post.id}, Created: ${new Date(post.created_at * 1000).toISOString()}`);
      console.log(`     Text: ${(post.original_text || post.processed_text || 'No text').substring(0, 100)}...`);
    });
  } catch (error) {
    console.log('❌ Error getting sample channel_posts:', error.message);
  }
  
  try {
    const sampleUnifiedContent = db.prepare("SELECT * FROM unified_content ORDER BY created_at DESC LIMIT 3").all();
    console.log('\nRecent unified_content:');
    sampleUnifiedContent.forEach((content, i) => {
      console.log(`  ${i+1}. ID: ${content.id}, Title: ${content.title || 'No title'}`);
      console.log(`     Created: ${content.created_at}, Pages: ${content.display_pages}`);
    });
  } catch (error) {
    console.log('❌ Error getting sample unified_content:', error.message);
  }

} catch (error) {
  console.error('❌ Database error:', error);
} finally {
  db.close();
}