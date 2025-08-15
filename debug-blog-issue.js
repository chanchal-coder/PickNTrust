console.log('🔍 Debugging blog post issue...');

// Simple test to check if the server is running and blog endpoints work
async function testBlogEndpoints() {
  try {
    console.log('\n1. Testing server connection...');
    const healthCheck = await fetch('http://localhost:5000/api/health');
    console.log('Server status:', healthCheck.status);
    
    console.log('\n2. Testing blog posts API...');
    const blogResponse = await fetch('http://localhost:5000/api/blog');
    console.log('Blog API status:', blogResponse.status);
    
    if (blogResponse.ok) {
      const blogData = await blogResponse.json();
      console.log('Blog posts found:', blogData.length);
      
      if (blogData.length > 0) {
        const firstPost = blogData[0];
        console.log('First post slug:', firstPost.slug);
        
        console.log('\n3. Testing individual blog post...');
        const postResponse = await fetch(`http://localhost:5000/api/blog/${firstPost.slug}`);
        console.log('Individual post status:', postResponse.status);
        
        if (postResponse.ok) {
          const postData = await postResponse.json();
          console.log('✅ Blog post retrieved successfully!');
          console.log('Post title:', postData.title);
          console.log('Post has content:', !!postData.content);
          console.log('Post has image:', !!postData.imageUrl);
        } else {
          console.log('❌ Failed to retrieve individual blog post');
        }
      } else {
        console.log('⚠️ No blog posts found in database');
      }
    } else {
      console.log('❌ Failed to fetch blog posts');
    }
    
  } catch (error) {
    console.error('❌ Error testing blog endpoints:', error.message);
    console.log('\n💡 Possible issues:');
    console.log('1. Development server not running (run: npm run dev)');
    console.log('2. Server running on different port');
    console.log('3. Database connection issue');
  }
}

// Check if we're in Node.js environment
if (typeof fetch === 'undefined') {
  // Use node-fetch for Node.js
  const fetch = require('node-fetch');
  global.fetch = fetch;
}

testBlogEndpoints();
