console.log('Testing Video Content adding after table creation...');

const videoData = {
  password: 'pickntrust2025',
  title: 'Best Credit Cards 2024 Review',
  description: 'Comprehensive review of top credit cards',
  videoUrl: 'https://www.youtube.com/watch?v=example123',
  thumbnailUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400',
  platform: 'YouTube',
  category: 'Finance',
  tags: ['credit cards', 'finance', 'review'],
  duration: '10:30',
  hasTimer: false,
  timerDuration: null
};

async function testVideoAdding() {
  try {
    console.log('Sending video data:', JSON.stringify(videoData, null, 2));
    
    const response = await fetch('http://localhost:5000/api/admin/video-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(videoData)
    });
    
    console.log('Video Response status:', response.status);
    const result = await response.json();
    console.log('Video Response:', JSON.stringify(result, null, 2));
    
    if (response.status === 200) {
      console.log('🎉 VIDEO CONTENT ADDING: PASSED ✅');
    } else {
      console.log('❌ VIDEO CONTENT ADDING: FAILED');
    }
    
  } catch (error) {
    console.error('Video Error:', error.message);
    console.log('❌ VIDEO CONTENT ADDING: FAILED');
  }
}

testVideoAdding();
