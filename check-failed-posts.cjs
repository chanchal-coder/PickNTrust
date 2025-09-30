const Database = require('better-sqlite3');

const db = new Database('database.sqlite');

try {
  // Get posts that still have generic titles or processing errors
  const failedPosts = db.prepare(`
    SELECT id, original_text, processed_text, extracted_title, extracted_price, 
           processing_error, image_url, created_at
    FROM channel_posts 
    WHERE processing_error IS NOT NULL 
       OR extracted_title LIKE '%Generic%' 
       OR extracted_title IS NULL
       OR extracted_title = ''
       OR extracted_title LIKE '%DEAL ALERT%'
    ORDER BY id DESC
    LIMIT 10
  `).all();

  console.log('🔍 ANALYZING FAILED POSTS');
  console.log('='.repeat(50));
  console.log(`Found ${failedPosts.length} posts with issues\n`);

  failedPosts.forEach((post, index) => {
    console.log(`${index + 1}. POST ID: ${post.id}`);
    console.log(`   Title: ${post.extracted_title || 'NULL'}`);
    console.log(`   Price: ${post.extracted_price || 'NULL'}`);
    console.log(`   Error: ${post.processing_error || 'None'}`);
    console.log(`   Original Text (first 200 chars):`);
    console.log(`   "${(post.original_text || '').substring(0, 200)}..."`);
    console.log(`   Image URL: ${post.image_url || 'NULL'}`);
    console.log('   ' + '-'.repeat(40));
  });

  // Check for common patterns in failed posts
  console.log('\n📊 FAILURE ANALYSIS:');
  console.log('='.repeat(50));
  
  const emptyText = failedPosts.filter(p => !p.original_text || p.original_text.trim() === '').length;
  const shortText = failedPosts.filter(p => p.original_text && p.original_text.length < 50).length;
  const noUrls = failedPosts.filter(p => !p.original_text || !p.original_text.includes('http')).length;
  const hasErrors = failedPosts.filter(p => p.processing_error).length;

  console.log(`Posts with empty text: ${emptyText}`);
  console.log(`Posts with short text (<50 chars): ${shortText}`);
  console.log(`Posts without URLs: ${noUrls}`);
  console.log(`Posts with processing errors: ${hasErrors}`);

} catch (error) {
  console.error('Error:', error);
} finally {
  db.close();
}