/**
 * Manual Social Media Post Trigger
 * Directly processes pending posts and attempts to post them
 */

const Database = require('better-sqlite3');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

async function manualPostTrigger() {
  console.log('Launch Manual Social Media Post Trigger Starting...');
  
  const db = new Database('./database.sqlite');
  
  try {
    // Get all pending posts
    const pendingPosts = db.prepare(`
      SELECT * FROM canva_posts 
      WHERE status = 'pending'
      ORDER BY created_at ASC
    `).all();
    
    console.log(`📋 Found ${pendingPosts.length} pending posts`);
    
    if (pendingPosts.length === 0) {
      console.log('Success No pending posts to process');
      return;
    }
    
    let successCount = 0;
    let failCount = 0;
    
    for (const post of pendingPosts) {
      console.log(`\nMobile Processing post ${post.id} for ${post.platforms}...`);
      
      // Parse the platforms JSON
      let platforms;
      try {
        platforms = JSON.parse(post.platforms);
      } catch (e) {
        console.log(`Error Invalid platforms JSON: ${post.platforms}`);
        continue;
      }
      
      for (const platform of platforms) {
        console.log(`  Target Attempting to post to ${platform}...`);
        
        const result = await postToPlatform({
          platform: platform.toLowerCase(),
          caption: post.caption,
          hashtags: post.hashtags,
          imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500', // Using the product image
          contentId: post.content_id,
          contentType: post.content_type
        });
        
        if (result.success) {
          console.log(`  Success Successfully posted to ${platform}: ${result.postId}`);
          
          // Update database with success
          db.prepare(`
            UPDATE canva_posts 
            SET status = 'posted', 
                social_media_post_id = ?, 
                posted_at = ?,
                updated_at = ?
            WHERE id = ?
          `).run(result.postId, Date.now(), Date.now(), post.id);
          
          successCount++;
        } else {
          console.log(`  Error Failed to post to ${platform}: ${result.error}`);
          
          // Update database with error
          db.prepare(`
            UPDATE canva_posts 
            SET status = 'failed', 
                error_message = ?,
                updated_at = ?
            WHERE id = ?
          `).run(result.error, Date.now(), post.id);
          
          failCount++;
        }
      }
    }
    
    console.log(`\nStats FINAL RESULTS:`);
    console.log(`Success Successful posts: ${successCount}`);
    console.log(`Error Failed posts: ${failCount}`);
    console.log(`📈 Success rate: ${successCount > 0 ? Math.round((successCount / (successCount + failCount)) * 100) : 0}%`);
    
  } catch (error) {
    console.error('Error Error in manual post trigger:', error);
  } finally {
    db.close();
  }
}

async function postToPlatform(content) {
  const platform = content.platform.toLowerCase();
  
  switch (platform) {
    case 'instagram':
      return await postToInstagram(content);
    case 'facebook':
      return await postToFacebook(content);
    case 'twitter':
      return await postToTwitter(content);
    case 'linkedin':
      return await postToLinkedIn(content);
    case 'telegram':
      return await postToTelegram(content);
    case 'youtube':
      return await postToYouTube(content);
    default:
      return {
        success: false,
        error: `Unsupported platform: ${platform}`
      };
  }
}

async function postToInstagram(content) {
  if (!process.env.INSTAGRAM_ACCESS_TOKEN || !process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID) {
    return { success: false, error: 'Instagram credentials not configured' };
  }
  
  try {
    const { accessToken, businessAccountId } = {
      accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
      businessAccountId: process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID
    };
    
    const fullCaption = `${content.caption}\n\n${content.hashtags}`;
    
    // Create media
    const mediaResponse = await fetch(
      `https://graph.facebook.com/v18.0/${businessAccountId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: content.imageUrl,
          caption: fullCaption,
          access_token: accessToken
        })
      }
    );
    
    const mediaData = await mediaResponse.json();
    
    if (!mediaResponse.ok) {
      return {
        success: false,
        error: `Instagram media creation failed: ${mediaData.error?.message || 'Unknown error'}`
      };
    }
    
    // Publish media
    const publishResponse = await fetch(
      `https://graph.facebook.com/v18.0/${businessAccountId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: mediaData.id,
          access_token: accessToken
        })
      }
    );
    
    const publishData = await publishResponse.json();
    
    if (!publishResponse.ok) {
      return {
        success: false,
        error: `Instagram publish failed: ${publishData.error?.message || 'Unknown error'}`
      };
    }
    
    return {
      success: true,
      postId: publishData.id
    };
    
  } catch (error) {
    return {
      success: false,
      error: `Instagram posting error: ${error.message}`
    };
  }
}

async function postToFacebook(content) {
  if (!process.env.FACEBOOK_ACCESS_TOKEN || !process.env.FACEBOOK_PAGE_ID) {
    return { success: false, error: 'Facebook credentials not configured' };
  }
  
  try {
    const { accessToken, pageId } = {
      accessToken: process.env.FACEBOOK_ACCESS_TOKEN,
      pageId: process.env.FACEBOOK_PAGE_ID
    };
    
    const fullMessage = `${content.caption}\n\n${content.hashtags}`;
    
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/photos`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: content.imageUrl,
          message: fullMessage,
          access_token: accessToken
        })
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: `Facebook posting failed: ${data.error?.message || 'Unknown error'}`
      };
    }
    
    return {
      success: true,
      postId: data.id
    };
    
  } catch (error) {
    return {
      success: false,
      error: `Facebook posting error: ${error.message}`
    };
  }
}

async function postToTwitter(content) {
  return {
    success: false,
    error: 'Twitter credentials not configured'
  };
}

async function postToLinkedIn(content) {
  return {
    success: false,
    error: 'LinkedIn credentials not configured'
  };
}

async function postToTelegram(content) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHANNEL) {
    return { success: false, error: 'Telegram credentials not configured' };
  }
  
  try {
    const { botToken, channelId } = {
      botToken: process.env.TELEGRAM_BOT_TOKEN,
      channelId: process.env.TELEGRAM_CHANNEL
    };
    
    const fullText = `${content.caption}\n\n${content.hashtags}`;
    
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendPhoto`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: channelId,
          photo: content.imageUrl,
          caption: fullText,
          parse_mode: 'HTML'
        })
      }
    );
    
    const data = await response.json();
    
    if (!response.ok || !data.ok) {
      return {
        success: false,
        error: `Telegram posting failed: ${data.description || 'Unknown error'}`
      };
    }
    
    return {
      success: true,
      postId: data.result.message_id.toString()
    };
    
  } catch (error) {
    return {
      success: false,
      error: `Telegram posting error: ${error.message}`
    };
  }
}

async function postToYouTube(content) {
  return {
    success: false,
    error: 'YouTube posting requires video content - image posts not supported'
  };
}

// Run if called directly
if (require.main === module) {
  manualPostTrigger().then(() => {
    console.log('\nCelebration Manual post trigger completed!');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Manual post trigger failed:', error);
    process.exit(1);
  });
}

module.exports = { manualPostTrigger };