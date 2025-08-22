console.log('🔍 Testing blog API endpoints...');

async function testEndpoints() {
  try {
    // Test blog list endpoint
    console.log('1. Testing /api/blog endpoint...');
    const blogResponse = await fetch('http://localhost:5000/api/blog');
    
    if (!blogResponse.ok) {
      console.log(`❌ Blog list failed: ${blogResponse.status} ${blogResponse.statusText}`);
      return;
    }
    
    const blogPosts = await blogResponse.json();
    console.log(`✅ Blog list successful: Found ${blogPosts.length} posts`);
    
    if (blogPosts.length > 0) {
      const firstPost = blogPosts[0];
      console.log(`First post: ${firstPost.title} (slug: ${firstPost.slug})`);
      
      // Test individual blog post endpoint
      console.log(`2. Testing /api/blog/${firstPost.slug} endpoint...`);
      const postResponse = await fetch(`http://localhost:5000/api/blog/${firstPost.slug}`);
      
      if (!postResponse.ok) {
        console.log(`❌ Individual post failed: ${postResponse.status} ${postResponse.statusText}`);
        return;
      }
      
      const post = await postResponse.json();
      console.log(`✅ Individual post successful: ${post.title}`);
      console.log(`Content length: ${post.content.length} characters`);
    }
    
    console.log('✅ All blog endpoints working correctly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('💡 Make sure the development server is running: npm run dev');
  }
}

testEndpoints();
