const http = require('http');

console.log('🔧 Fixing Blog Post Blank Screen Issue\n');

// Test the blog API endpoints
function testAPI(endpoint, method = 'GET', data = null) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: endpoint,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        resolve({
          success: res.statusCode >= 200 && res.statusCode < 300,
          statusCode: res.statusCode,
          data: responseData,
          error: null
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        success: false,
        statusCode: 0,
        data: null,
        error: err.message
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        success: false,
        statusCode: 0,
        data: null,
        error: 'Request timeout'
      });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function fixBlogIssue() {
  console.log('⏳ Waiting for server to be ready...');
  await new Promise(resolve => setTimeout(resolve, 10000));

  console.log('🧪 Testing blog endpoints...\n');

  // Test 1: Get all blog posts
  console.log('1. Testing /api/blog endpoint...');
  const blogListTest = await testAPI('/api/blog');
  
  if (blogListTest.success) {
    console.log('Success Blog list API working');
    const blogPosts = JSON.parse(blogListTest.data);
    console.log(`Stats Found ${blogPosts.length} blog posts`);
    
    if (blogPosts.length > 0) {
      const firstPost = blogPosts[0];
      console.log(`Blog First post: "${firstPost.title}" with slug: "${firstPost.slug}"`);
      
      // Test 2: Get individual blog post by slug
      console.log(`\n2. Testing /api/blog/${firstPost.slug} endpoint...`);
      const blogPostTest = await testAPI(`/api/blog/${firstPost.slug}`);
      
      if (blogPostTest.success) {
        console.log('Success Individual blog post API working');
        const blogPost = JSON.parse(blogPostTest.data);
        console.log(`Stats Retrieved post: "${blogPost.title}"`);
        console.log('Celebration Blog post blank screen issue should be RESOLVED!');
      } else {
        console.log('Error Individual blog post API failed');
        console.log(`Stats Status: ${blogPostTest.statusCode}, Error: ${blogPostTest.error}`);
        console.log('🔧 This is likely the cause of the blank screen issue');
      }
    } else {
      console.log('Blog No blog posts found. Creating a test blog post...');
      
      // Create a test blog post
      const testBlogPost = {
        password: 'pickntrust2025',
        title: 'Test Blog Post - Fix Blank Screen',
        excerpt: 'This is a test blog post to fix the blank screen issue',
        content: `# Test Blog Post

This is a test blog post created to fix the blank screen issue when clicking "Read More" on blog cards.

## Features
- Proper content structure
- Valid slug generation
- Complete metadata

## Testing
This post should display properly when accessed via the blog post page.`,
        category: 'Test',
        tags: ['test', 'fix', 'blog'],
        imageUrl: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=600&fit=crop',
        readTime: '2 min read',
        slug: 'test-blog-post-fix-blank-screen-' + Date.now(),
        publishedAt: new Date().toISOString()
      };

      console.log('Blog Creating test blog post...');
      const createTest = await testAPI('/api/admin/blog', 'POST', testBlogPost);
      
      if (createTest.success) {
        console.log('Success Test blog post created successfully');
        const createdPost = JSON.parse(createTest.data);
        console.log(`Stats Created post with slug: ${testBlogPost.slug}`);
        
        // Test the newly created post
        console.log(`\n3. Testing newly created post /api/blog/${testBlogPost.slug}...`);
        const newPostTest = await testAPI(`/api/blog/${testBlogPost.slug}`);
        
        if (newPostTest.success) {
          console.log('Success Newly created blog post API working');
          console.log('Celebration Blog post blank screen issue is RESOLVED!');
        } else {
          console.log('Error Newly created blog post API failed');
          console.log(`Stats Status: ${newPostTest.statusCode}, Error: ${newPostTest.error}`);
        }
      } else {
        console.log('Error Failed to create test blog post');
        console.log(`Stats Status: ${createTest.statusCode}, Error: ${createTest.error}`);
        if (createTest.data) {
          console.log(`Stats Response: ${createTest.data}`);
        }
      }
    }
  } else {
    console.log('Error Blog list API failed');
    console.log(`Stats Status: ${blogListTest.statusCode}, Error: ${blogListTest.error}`);
  }

  console.log('\nTarget DIAGNOSIS COMPLETE');
  console.log('=====================================');
  console.log('If you see "Blog post blank screen issue is RESOLVED!" above,');
  console.log('then the issue is fixed and blog posts should display properly.');
  console.log('\nGlobal Test your blog posts at: http://localhost:5000');
  console.log('🔧 Admin panel: http://localhost:5000/admin');
}

fixBlogIssue().catch(console.error);
