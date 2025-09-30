import Database from 'better-sqlite3';

console.log('🔧 Creating test blog post...');

try {
  const db = new Database('./database.sqlite');
  
  // Check if blog_posts table exists
  console.log('1. Checking blog_posts table...');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='blog_posts'").all();
  
  if (tables.length === 0) {
    console.log('Creating blog_posts table...');
    db.exec(`
      CREATE TABLE blog_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        excerpt TEXT,
        content TEXT NOT NULL,
        category TEXT,
        tags TEXT,
        image_url TEXT,
        video_url TEXT,
        published_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        read_time TEXT DEFAULT '5 min read',
        slug TEXT UNIQUE NOT NULL,
        has_timer INTEGER DEFAULT 0,
        timer_duration INTEGER,
        timer_start_time INTEGER
      )
    `);
  }
  
  // Check existing blog posts
  console.log('2. Checking existing blog posts...');
  const existingPosts = db.prepare('SELECT * FROM blog_posts').all();
  console.log(`Found ${existingPosts.length} existing blog posts`);
  
  if (existingPosts.length > 0) {
    console.log('Existing posts:');
    existingPosts.forEach(post => {
      console.log(`- ID: ${post.id}, Title: ${post.title}, Slug: ${post.slug}`);
    });
  }
  
  // Create a test blog post if none exist
  if (existingPosts.length === 0) {
    console.log('3. Creating test blog post...');
    const insertStmt = db.prepare(`
      INSERT INTO blog_posts (
        title, excerpt, content, category, tags, image_url, slug, read_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = insertStmt.run(
      'Test Blog Post - Amazing Deals This Week',
      'Discover the best deals and shopping tips for this week. From electronics to fashion, we have got you covered!',
      `<h2>Welcome to Our Test Blog Post</h2>
      <p>This is a test blog post to verify the blog functionality is working correctly.</p>
      <h3>What You'll Find Here</h3>
      <ul>
        <li>Amazing deals on electronics</li>
        <li>Fashion trends and discounts</li>
        <li>Home and kitchen essentials</li>
        <li>Shopping tips and tricks</li>
      </ul>
      <p>Stay tuned for more exciting content and deals!</p>`,
      'Shopping Tips',
      '["deals", "shopping", "tips", "test"]',
      'https://picsum.photos/800/400?random=1',
      'test-blog-post-amazing-deals-this-week',
      '3 min read'
    );
    
    console.log('Test blog post created with ID:', result.lastInsertRowid);
  }
  
  // Verify the blog post can be retrieved by slug
  console.log('4. Testing blog post retrieval by slug...');
  const testSlug = existingPosts.length > 0 ? existingPosts[0].slug : 'test-blog-post-amazing-deals-this-week';
  const blogPost = db.prepare('SELECT * FROM blog_posts WHERE slug = ?').get(testSlug);
  
  if (blogPost) {
    console.log('✅ Blog post retrieved successfully:');
    console.log(`- Title: ${blogPost.title}`);
    console.log(`- Slug: ${blogPost.slug}`);
    console.log(`- Content length: ${blogPost.content.length} characters`);
  } else {
    console.log('❌ Failed to retrieve blog post');
  }
  
  db.close();
  console.log('✅ Blog post setup completed!');
  console.log('\n🎯 Next steps:');
  console.log('1. Start your development server: npm run dev');
  console.log('2. Go to homepage and click "Read More" on a blog post');
  console.log(`3. Or directly visit: http://localhost:5000/blog/${testSlug}`);
  
} catch (error) {
  console.error('❌ Setup failed:', error);
}
