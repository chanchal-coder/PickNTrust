async function testVideoPost() {
  console.log('🔍 Testing Video Content POST...');
  
  const testData = {
    password: 'pickntrust2025',
    title: 'Test Video Content',
    description: 'This is a test video',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    platform: 'youtube',
    category: 'Entertainment',
    tags: ['test', 'debug'],
    duration: '3:32',
    thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    hasTimer: false,
    timerDuration: null
  };

  try {
    const response = await fetch('http://localhost:5000/api/admin/video-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📊 Raw Response:', responseText);

    if (response.ok) {
      try {
        const result = JSON.parse(responseText);
        console.log('✅ Success! Video created:', result);
      } catch (e) {
        console.log('⚠️ Response not JSON:', responseText);
      }
    } else {
      console.log('❌ Failed with status:', response.status);
      try {
        const error = JSON.parse(responseText);
        console.log('📊 Error details:', error);
      } catch (e) {
        console.log('📊 Error response (not JSON):', responseText);
      }
    }
  } catch (error) {
    console.error('💥 Network error:', error.message);
  }
}

// Wait for server to be ready
setTimeout(testVideoPost, 2000);
