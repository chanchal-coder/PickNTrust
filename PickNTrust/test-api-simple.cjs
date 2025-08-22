const http = require('http');

function testAPI() {
  console.log('🔍 Testing Video Content API...');
  
  // Test GET request first
  const getOptions = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/video-content',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const getReq = http.request(getOptions, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📊 GET /api/video-content Status:', res.statusCode);
      try {
        const videos = JSON.parse(data);
        console.log('✅ Found', videos.length, 'video(s)');
        console.log('📋 Videos:', videos.map(v => v.title));
        
        // Now test POST request
        testPostAPI();
      } catch (e) {
        console.log('⚠️ Response not JSON:', data);
      }
    });
  });

  getReq.on('error', (err) => {
    console.error('❌ GET request failed:', err.message);
  });

  getReq.end();
}

function testPostAPI() {
  console.log('\n🔍 Testing POST /api/admin/video-content...');
  
  const postData = JSON.stringify({
    password: 'pickntrust2025',
    title: 'API Test Video',
    description: 'Testing video content API',
    videoUrl: 'https://www.youtube.com/watch?v=test123',
    platform: 'youtube',
    category: 'Technology',
    tags: ['api', 'test'],
    duration: '2:30'
  });

  const postOptions = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/video-content',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const postReq = http.request(postOptions, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📊 POST Status:', res.statusCode);
      console.log('📊 Response:', data);
      
      if (res.statusCode === 200) {
        console.log('✅ Video content posted successfully!');
      } else {
        console.log('❌ Failed to post video content');
      }
    });
  });

  postReq.on('error', (err) => {
    console.error('❌ POST request failed:', err.message);
  });

  postReq.write(postData);
  postReq.end();
}

// Wait for server to start, then test
setTimeout(testAPI, 3000);
