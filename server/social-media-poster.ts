/**
 * Social Media Poster Service
 * Handles actual posting to social media platforms using API credentials
 */

import { Database } from 'better-sqlite3';
import fetch from 'node-fetch';

interface SocialMediaCredentials {
  instagram?: {
    accessToken: string;
    businessAccountId: string;
  };
  facebook?: {
    accessToken: string;
    pageId: string;
  };
  twitter?: {
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    accessTokenSecret: string;
  };
  linkedin?: {
    accessToken: string;
    organizationId: string;
  };
  telegram?: {
    botToken: string;
    channelId: string;
  };
  youtube?: {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    defaultPrivacy: string;
    timezone: string;
  };
}

interface PostContent {
  platform: string;
  caption: string;
  hashtags: string;
  imageUrl?: string;
  contentId: number;
  contentType: string;
}

export class SocialMediaPoster {
  private credentials: SocialMediaCredentials;
  private db: Database;

  constructor(db: Database, credentials: SocialMediaCredentials) {
    this.db = db;
    this.credentials = credentials;
  }

  /**
   * Post content to all configured social media platforms
   */
  async postToAllPlatforms(postContent: PostContent[]): Promise<{
    success: boolean;
    results: Array<{
      platform: string;
      success: boolean;
      postId?: string;
      error?: string;
    }>;
  }> {
    const results = [];
    
    for (const content of postContent) {
      try {
        let result;
        
        switch (content.platform.toLowerCase()) {
          case 'instagram':
            result = await this.postToInstagram(content);
            break;
          case 'facebook':
            result = await this.postToFacebook(content);
            break;
          case 'twitter':
            result = await this.postToTwitter(content);
            break;
          case 'linkedin':
            result = await this.postToLinkedIn(content);
            break;
          case 'telegram':
            result = await this.postToTelegram(content);
            break;
          case 'youtube':
            result = await this.postToYouTube(content);
            break;
          default:
            result = {
              success: false,
              error: `Unsupported platform: ${content.platform}`
            };
        }
        
        results.push({
          platform: content.platform,
          ...result
        });
        
        // Update database with posting result
        await this.updatePostStatus(content, result.success, result.postId, result.error);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          platform: content.platform,
          success: false,
          error: errorMessage
        });
        
        await this.updatePostStatus(content, false, undefined, errorMessage);
      }
    }
    
    const overallSuccess = results.every(r => r.success);
    
    return {
      success: overallSuccess,
      results
    };
  }

  /**
   * Post to Instagram using Instagram Basic Display API
   */
  private async postToInstagram(content: PostContent): Promise<{
    success: boolean;
    postId?: string;
    error?: string;
  }> {
    if (!this.credentials.instagram) {
      return { success: false, error: 'Instagram credentials not configured' };
    }

    try {
      const { accessToken, businessAccountId } = this.credentials.instagram;
      const fullCaption = `${content.caption}\n\n${content.hashtags}`;
      
      // Step 1: Create media container
      const mediaResponse = await fetch(
        `https://graph.facebook.com/v18.0/${businessAccountId}/media`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image_url: content.imageUrl,
            caption: fullCaption,
            access_token: accessToken
          })
        }
      );
      
      const mediaData = await mediaResponse.json() as any;
      
      if (!mediaResponse.ok) {
        return {
          success: false,
          error: `Instagram media creation failed: ${mediaData.error?.message || 'Unknown error'}`
        };
      }
      
      // Step 2: Publish the media
      const publishResponse = await fetch(
        `https://graph.facebook.com/v18.0/${businessAccountId}/media_publish`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            creation_id: mediaData.id,
            access_token: accessToken
          })
        }
      );
      
      const publishData = await publishResponse.json() as any;
      
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
        error: `Instagram posting error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Post to Facebook using Facebook Graph API
   */
  private async postToFacebook(content: PostContent): Promise<{
    success: boolean;
    postId?: string;
    error?: string;
  }> {
    if (!this.credentials.facebook) {
      return { success: false, error: 'Facebook credentials not configured' };
    }

    try {
      const { accessToken, pageId } = this.credentials.facebook;
      const fullMessage = `${content.caption}\n\n${content.hashtags}`;
      
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}/posts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: fullMessage,
            link: content.imageUrl,
            access_token: accessToken
          })
        }
      );
      
      const data = await response.json() as any;
      
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
        error: `Facebook posting error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Post to Twitter using Twitter API v2
   */
  private async postToTwitter(content: PostContent): Promise<{
    success: boolean;
    postId?: string;
    error?: string;
  }> {
    if (!this.credentials.twitter) {
      return { success: false, error: 'Twitter credentials not configured' };
    }

    try {
      // Note: Twitter API v2 requires OAuth 1.0a authentication
      // This is a simplified example - you'd need proper OAuth signing
      const fullText = `${content.caption}\n\n${content.hashtags}`;
      
      // Truncate to Twitter's character limit
      const tweetText = fullText.length > 280 ? fullText.substring(0, 277) + '...' : fullText;
      
      const response = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.credentials.twitter.accessToken}`,
        },
        body: JSON.stringify({
          text: tweetText
        })
      });
      
      const data = await response.json() as any;
      
      if (!response.ok) {
        return {
          success: false,
          error: `Twitter posting failed: ${data.detail || data.title || 'Unknown error'}`
        };
      }
      
      return {
        success: true,
        postId: data.data?.id
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Twitter posting error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Post to LinkedIn using LinkedIn API
   */
  private async postToLinkedIn(content: PostContent): Promise<{
    success: boolean;
    postId?: string;
    error?: string;
  }> {
    if (!this.credentials.linkedin) {
      return { success: false, error: 'LinkedIn credentials not configured' };
    }

    try {
      const { accessToken, organizationId } = this.credentials.linkedin;
      const fullText = `${content.caption}\n\n${content.hashtags}`;
      
      const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify({
          author: `urn:li:organization:${organizationId}`,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: fullText
              },
              shareMediaCategory: 'NONE'
            }
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
          }
        })
      });
      
      const data = await response.json() as any;
      
      if (!response.ok) {
        return {
          success: false,
          error: `LinkedIn posting failed: ${data.message || 'Unknown error'}`
        };
      }
      
      return {
        success: true,
        postId: data.id
      };
      
    } catch (error) {
      return {
        success: false,
        error: `LinkedIn posting error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Post to Telegram using Telegram Bot API
   */
  private async postToTelegram(content: PostContent): Promise<{
    success: boolean;
    postId?: string;
    error?: string;
  }> {
    if (!this.credentials.telegram) {
      return { success: false, error: 'Telegram credentials not configured' };
    }

    try {
      const { botToken, channelId } = this.credentials.telegram;
      const fullText = `${content.caption}\n\n${content.hashtags}`;
      
      // Send photo with caption to Telegram channel
      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/sendPhoto`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: channelId,
            photo: content.imageUrl,
            caption: fullText,
            parse_mode: 'HTML'
          })
        }
      );
      
      const data = await response.json() as any;
       
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
        error: `Telegram posting error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Post to YouTube using YouTube Data API v3
   */
  private async postToYouTube(content: PostContent): Promise<{
    success: boolean;
    postId?: string;
    error?: string;
  }> {
    if (!this.credentials.youtube) {
      return { success: false, error: 'YouTube credentials not configured' };
    }

    try {
      // Note: YouTube requires video uploads, not just images
      // This is a placeholder for YouTube Shorts or Community posts
      // For actual video uploads, you'd need to implement video creation from image + text
      
      return {
        success: false,
        error: 'YouTube posting requires video content - image posts not supported'
      };
      
    } catch (error) {
      return {
        success: false,
        error: `YouTube posting error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Update post status in database
   */
  private async updatePostStatus(
    content: PostContent,
    success: boolean,
    postId?: string,
    error?: string
  ): Promise<void> {
    try {
      const updateStmt = this.db.prepare(`
        UPDATE canva_posts 
        SET 
          status = ?,
          social_media_post_id = ?,
          error_message = ?,
          posted_at = ?
        WHERE 
          content_id = ? AND 
          content_type = ? AND 
          platform = ?
      `);
      
      updateStmt.run(
        success ? 'posted' : 'failed',
        postId || null,
        error || null,
        success ? new Date().toISOString() : null,
        content.contentId,
        content.contentType,
        content.platform
      );
      
    } catch (dbError) {
      console.error('Failed to update post status in database:', dbError);
    }
  }

  /**
   * Get pending posts from database
   */
  async getPendingPosts(): Promise<PostContent[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT 
          platform,
          caption,
          hashtags,
          image_url as imageUrl,
          content_id as contentId,
          content_type as contentType
        FROM canva_posts 
        WHERE status = 'pending'
        ORDER BY created_at ASC
      `);
      
      return stmt.all() as PostContent[];
      
    } catch (error) {
      console.error('Failed to get pending posts:', error);
      return [];
    }
  }

  /**
   * Process all pending posts
   */
  async processPendingPosts(): Promise<{
    success: boolean;
    processed: number;
    successful: number;
    failed: number;
  }> {
    const pendingPosts = await this.getPendingPosts();
    
    if (pendingPosts.length === 0) {
      return {
        success: true,
        processed: 0,
        successful: 0,
        failed: 0
      };
    }
    
    const result = await this.postToAllPlatforms(pendingPosts);
    const successful = result.results.filter(r => r.success).length;
    const failed = result.results.filter(r => !r.success).length;
    
    return {
      success: result.success,
      processed: pendingPosts.length,
      successful,
      failed
    };
  }
}

/**
 * Factory function to create SocialMediaPoster with credentials from environment
 */
export function createSocialMediaPoster(db: Database): SocialMediaPoster {
  const credentials: SocialMediaCredentials = {
    instagram: process.env.INSTAGRAM_ACCESS_TOKEN ? {
      accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
      businessAccountId: process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || ''
    } : undefined,
    
    facebook: process.env.FACEBOOK_ACCESS_TOKEN ? {
      accessToken: process.env.FACEBOOK_ACCESS_TOKEN,
      pageId: process.env.FACEBOOK_PAGE_ID || ''
    } : undefined,
    
    twitter: process.env.TWITTER_BEARER_TOKEN ? {
      apiKey: process.env.TWITTER_API_KEY || '',
      apiSecret: process.env.TWITTER_API_SECRET || '',
      accessToken: process.env.TWITTER_BEARER_TOKEN,
      accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET || ''
    } : undefined,
    
    linkedin: process.env.LINKEDIN_ACCESS_TOKEN ? {
      accessToken: process.env.LINKEDIN_ACCESS_TOKEN,
      organizationId: process.env.LINKEDIN_ORGANIZATION_ID || ''
    } : undefined,
    
    telegram: process.env.TELEGRAM_BOT_TOKEN ? {
      botToken: process.env.TELEGRAM_BOT_TOKEN,
      channelId: process.env.TELEGRAM_CHANNEL || ''
    } : undefined,
    
    youtube: process.env.YOUTUBE_CLIENT_ID ? {
      clientId: process.env.YOUTUBE_CLIENT_ID,
      clientSecret: process.env.YOUTUBE_CLIENT_SECRET || '',
      refreshToken: process.env.YOUTUBE_REFRESH_TOKEN || '',
      defaultPrivacy: process.env.YOUTUBE_DEFAULT_PRIVACY || 'private',
      timezone: process.env.YOUTUBE_PUBLISH_TIMEZONE || 'UTC'
    } : undefined
  };
  
  return new SocialMediaPoster(db, credentials);
}