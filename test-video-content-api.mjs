import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';

async function testVideoContentAPI() {
  console.log('🔍 Testing Video Content API...');
  
  try {
    // Test 1: Get existing video content
    console.log('\n1. Testing GET /api/video-content...');
    const getResponse = await fetch(`${API_BASE}/api/video-content`);
    
    if (getResponse.ok) {
      const videos = await getResponse.json();
      console.log('✅ GET request successful');
      console.log(`📊 Found ${videos.length} video(s)`);
    } else {
      console.log('❌ GET request failed:', getResponse.status, getResponse.statusText);
    }

    // Test 2: Add new video content
    console.log('\n2. Testing POST /api/admin/video-content...');
    
    const testVideoData = {
      password: 'pickntrust2025',
      title: 'Test Video Content',
      description: 'This is a test video for debugging',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      platform: 'youtube',
      category: 'Entertainment',
      tags: ['test', 'debug', 'youtube'],
      duration: '3:32',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      hasTimer: false,
      timerDuration: null
    };

    console.log('📤 Sending video data:', JSON.stringify(testVideoData, null, 2));

    const postResponse = await fetch(`${API_BASE}/api/admin/video-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testVideoData)
    });

    console.log('📥 Response status:', postResponse.status);
    console.log('📥 Response headers:', Object.fromEntries(postResponse.headers.entries()));

    const responseText = await postResponse.text();
    console.log('📥 Raw response:', responseText);

    if (postResponse.ok) {
      try {
        const result = JSON.parse(responseText);
        console.log('✅ POST request successful');
        console.log('📊 Created video:', result);
      } catch (parseError) {
        console.log('⚠️ Response is not valid JSON:', parseError.message);
      }
    } else {
      console.log('❌ POST request failed');
      try {
        const errorData = JSON.parse(responseText);
        console.log('📊 Error details:', errorData);
      } catch (parseError) {
        console.log('📊 Error response (not JSON):', responseText);
      }
    }

  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Wait a moment for server to start, then run test
setTimeout(testVideoContentAPI, 3000);
