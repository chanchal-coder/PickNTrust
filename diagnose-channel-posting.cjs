const Database = require('better-sqlite3');
const path = require('path');

async function diagnoseChannelPosting() {
  console.log('🔍 DIAGNOSING CHANNEL POSTING ISSUES');
  console.log('=' .repeat(50));
  
  try {
    const dbPath = path.join(__dirname, 'database.sqlite');
    const db = new Database(dbPath);
    
    console.log('\n1️⃣ Checking Recent Channel Posts...');
    const recentPosts = db.prepare(`
      SELECT 
        id, message_id, channel_id, 
        substr(original_text, 1, 100) as text_preview,
        created_at, is_processed
      FROM channel_posts 
      WHERE created_at > ?
      ORDER BY created_at DESC 
      LIMIT 10
    `).all(Date.now() - (24 * 60 * 60 * 1000)); // Last 24 hours
    
    console.log(`   📊 Recent posts (24h): ${recentPosts.length}`);
    recentPosts.forEach(post => {
      console.log(`   📝 ID: ${post.id}, Channel: ${post.channel_id}, Processed: ${post.is_processed}`);
      console.log(`      Text: ${post.text_preview}...`);
    });
    
    console.log('\n2️⃣ Checking Unified Content...');
    const unifiedContent = db.prepare(`
      SELECT 
        id, title, 
        substr(description, 1, 100) as desc_preview,
        display_pages, created_at
      FROM unified_content 
      WHERE created_at > ?
      ORDER BY created_at DESC 
      LIMIT 10
    `).all(Date.now() - (24 * 60 * 60 * 1000));
    
    console.log(`   📊 Recent unified content (24h): ${unifiedContent.length}`);
    unifiedContent.forEach(content => {
      console.log(`   📄 ID: ${content.id}, Pages: "${content.display_pages}"`);
      console.log(`      Title: ${content.title}`);
    });
    
    console.log('\n3️⃣ Checking Display Pages Format...');
    const displayPagesVariations = db.prepare(`
      SELECT DISTINCT display_pages, COUNT(*) as count
      FROM unified_content 
      WHERE display_pages IS NOT NULL
      GROUP BY display_pages
      ORDER BY count DESC
      LIMIT 20
    `).all();
    
    console.log('   📋 Display pages variations:');
    displayPagesVariations.forEach(variation => {
      console.log(`      "${variation.display_pages}" (${variation.count} items)`);
    });
    
    console.log('\n4️⃣ Testing Specific Page Queries...');
    const testPages = ['cue-picks', 'prime-picks', 'value-picks', 'click-picks'];
    
    for (const page of testPages) {
      console.log(`\n   🔍 Testing "${page}":`);
      
      // Test exact match
      const exactMatch = db.prepare(`
        SELECT COUNT(*) as count FROM unified_content 
        WHERE display_pages = ?
      `).get(page);
      console.log(`      Exact match: ${exactMatch.count}`);
      
      // Test LIKE match
      const likeMatch = db.prepare(`
        SELECT COUNT(*) as count FROM unified_content 
        WHERE display_pages LIKE '%' || ? || '%'
      `).get(page);
      console.log(`      LIKE match: ${likeMatch.count}`);
      
      // Test case variations
      const caseVariations = [page.toLowerCase(), page.toUpperCase(), 
                             page.charAt(0).toUpperCase() + page.slice(1)];
      
      for (const variation of caseVariations) {
        const caseMatch = db.prepare(`
          SELECT COUNT(*) as count FROM unified_content 
          WHERE display_pages = ?
        `).get(variation);
        if (caseMatch.count > 0) {
          console.log(`      Case "${variation}": ${caseMatch.count}`);
        }
      }
    }
    
    console.log('\n5️⃣ Checking Schema Consistency...');
    
    // Check channel_posts schema
    const channelPostsSchema = db.prepare(`
      PRAGMA table_info(channel_posts)
    `).all();
    console.log('   📋 channel_posts schema:');
    channelPostsSchema.forEach(col => {
      console.log(`      ${col.name}: ${col.type} (nullable: ${!col.notnull})`);
    });
    
    // Check unified_content schema
    const unifiedContentSchema = db.prepare(`
      PRAGMA table_info(unified_content)
    `).all();
    console.log('\n   📋 unified_content schema:');
    unifiedContentSchema.forEach(col => {
      console.log(`      ${col.name}: ${col.type} (nullable: ${!col.notnull})`);
    });
    
    console.log('\n6️⃣ Checking Processing Pipeline...');
    
    // Check unprocessed posts
    const unprocessedPosts = db.prepare(`
      SELECT COUNT(*) as count FROM channel_posts 
      WHERE is_processed = 0
    `).get();
    console.log(`   ⏳ Unprocessed posts: ${unprocessedPosts.count}`);
    
    // Check recent processing activity
    const recentProcessing = db.prepare(`
      SELECT COUNT(*) as count FROM channel_posts 
      WHERE is_processed = 1 AND updated_at > ?
    `).get(Date.now() - (60 * 60 * 1000)); // Last hour
    console.log(`   ✅ Recently processed (1h): ${recentProcessing.count}`);
    
    console.log('\n7️⃣ Sample Data Analysis...');
    
    // Get sample unified content with display_pages
    const sampleContent = db.prepare(`
      SELECT id, title, display_pages, created_at
      FROM unified_content 
      WHERE display_pages IS NOT NULL
      ORDER BY created_at DESC 
      LIMIT 5
    `).all();
    
    console.log('   📄 Sample unified content:');
    sampleContent.forEach(content => {
      const date = new Date(content.created_at).toLocaleString();
      console.log(`      ID: ${content.id}`);
      console.log(`      Title: ${content.title}`);
      console.log(`      Pages: "${content.display_pages}"`);
      console.log(`      Created: ${date}`);
      console.log('      ---');
    });
    
    db.close();
    
    console.log('\n📋 DIAGNOSIS SUMMARY:');
    console.log('=' .repeat(30));
    
    if (recentPosts.length === 0) {
      console.log('❌ ISSUE: No recent channel posts found');
      console.log('   💡 Bot might not be receiving messages from channels');
    }
    
    if (unifiedContent.length === 0) {
      console.log('❌ ISSUE: No recent unified content found');
      console.log('   💡 Message processing pipeline might be broken');
    }
    
    if (unprocessedPosts.count > 0) {
      console.log(`⚠️ WARNING: ${unprocessedPosts.count} unprocessed posts found`);
      console.log('   💡 Processing pipeline might be stuck');
    }
    
    console.log('\n🔧 RECOMMENDATIONS:');
    console.log('1. Check if Telegram bot is receiving messages');
    console.log('2. Verify message processing logic');
    console.log('3. Check display_pages field formatting');
    console.log('4. Test API endpoints with actual data');
    
  } catch (error) {
    console.error('❌ Error diagnosing channel posting:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the diagnosis
diagnoseChannelPosting();