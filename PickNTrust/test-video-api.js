const fetch = require('node-fetch');

async function testVideoAPI() {
  try {
    console.log('Testing video content API...');
    
    // Test GET endpoint first
    console.log('\n1. Testing GET /api/video-content');
    const getResponse = await fetch('http://localhost:5000/api/video-content');
    const getData = await getResponse.text();
    console.log('GET Response Status:', getResponse.status);
    console.log('GET Response:', getData);
    
    // Test POST endpoint
    console.log('\n2. Testing POST /api/admin/video-content');
    const postData = {
      password: 'pickntrust2025',
      title: 'Test Video',
      description: 'Test Description',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      platform: 'YouTube',
      category: 'Test',
      tags: ['test'],
      duration: '3:32'
    };
    
    const postResponse = await fetch('http://localhost:5000/api/admin/video-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData)
    });
    
    const postResponseData = await postResponse.text();
    console.log('POST Response Status:', postResponse.status);
    console.log('POST Response:', postResponseData);
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testVideoAPI();
