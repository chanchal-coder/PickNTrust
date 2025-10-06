/**
 * Social Media Poster Service
 * Handles actual posting to social media platforms using API credentials
 */

import { Database } from 'better-sqlite3';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
// Use robust two-pass generator for motion + audio stability
import { generateShortVideo } from './video-generator-2pass.js';

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
  // Simple in-memory locks to avoid races on identical captions
  private telegramPostLocks: Map<string, number> = new Map();

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
      
      // Try creating a feed post first (correct endpoint for text/link posts)
      const feedPayload: any = {
        message: fullMessage,
        access_token: accessToken
      };
      if (content.imageUrl) {
        // Attach link preview if available; some pages require domain whitelisting
        feedPayload.link = content.imageUrl;
      }

      const feedRes = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedPayload)
      });

      if (feedRes.ok) {
        const feedData = await feedRes.json() as any;
        return { success: true, postId: feedData.id };
      }

      // If feed post fails (permissions or unsupported), fall back to photo upload
      const feedErr = await feedRes.json().catch(() => ({} as any));
      const photoPayload: any = {
        caption: fullMessage,
        access_token: accessToken
      };
      if (content.imageUrl) {
        photoPayload.url = content.imageUrl;
      }

      const photoRes = await fetch(`https://graph.facebook.com/v18.0/${pageId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(photoPayload)
      });

      if (photoRes.ok) {
        const photoData = await photoRes.json() as any;
        return { success: true, postId: photoData.id };
      }

      const photoErr = await photoRes.json().catch(() => ({} as any));
      return {
        success: false,
        error: `Facebook posting failed: feed=${feedErr?.error?.message || 'unknown'}; photo=${photoErr?.error?.message || 'unknown'}`
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
      // Time-based duplicate safety guard
      const duplicateGuard = await this.shouldSkipTelegram(content);
      if (duplicateGuard.skip) {
        return {
          success: false,
          error: duplicateGuard.reason || 'Duplicate detected in dedupe window; skipping Telegram'
        };
      }

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
   * Decide whether to skip Telegram post based on recent history (time-based safety)
   * - Checks recent channel_posts (bot activity) and recently 'posted' canva_posts (site activity)
   * - Uses caption-based fingerprinting without schema changes
   */
  private async shouldSkipTelegram(content: PostContent): Promise<{ skip: boolean; reason?: string }> {
    try {
      const windowHours = parseInt(process.env.TELEGRAM_DEDUP_WINDOW_HOURS || '24', 10);
      const nowMs = Date.now();
      const windowMs = Math.max(1, windowHours) * 60 * 60 * 1000;
      const cutoffMs = nowMs - windowMs;
      const cutoffIso = new Date(cutoffMs).toISOString();
      const cutoffSeconds = Math.floor(cutoffMs / 1000); // channel_posts often stores epoch seconds

      const captionNorm = this.normalizeCaption(content.caption);
      const urlsInCaption = this.extractUrls(content.caption);

      // In-process short lock to avoid races if multiple items share identical captions
      const existingLock = this.telegramPostLocks.get(captionNorm);
      if (existingLock && existingLock > nowMs - 60_000) { // 60s lock
        return { skip: true, reason: 'Duplicate caption lock (race safety) - skipping' };
      }
      // Set lock preemptively; will be naturally overwritten on next calls
      this.telegramPostLocks.set(captionNorm, nowMs);

      // 1) Check recent channel_posts (bot publishes subset)
      let recentChannelPosts: Array<{ original_text?: string; processed_text?: string }> = [];
      try {
        const stmt = this.db.prepare(`
          SELECT original_text, processed_text
          FROM channel_posts
          WHERE created_at > ?
          ORDER BY created_at DESC
          LIMIT 200
        `);
        recentChannelPosts = stmt.all(cutoffSeconds) as Array<{ original_text?: string; processed_text?: string }>;
      } catch (e) {
        // Table might not exist in some environments; ignore gracefully
        recentChannelPosts = [];
      }

      const seenInBot = recentChannelPosts.some(row => {
        const texts = [row.original_text, row.processed_text].filter(Boolean) as string[];
        // URL match (preferred) or caption fingerprint match
        const textContainsUrl = urlsInCaption.length > 0 && texts.some(t => urlsInCaption.some(u => (t || '').includes(u)));
        const textCaptionMatch = texts.some(t => this.normalizeCaption(t) === captionNorm);
        return textContainsUrl || textCaptionMatch;
      });
      if (seenInBot) {
        return { skip: true, reason: `Duplicate caption found in Telegram bot history (≤ ${windowHours}h)` };
      }

      // 2) Check recently posted canva_posts for Telegram (site auto-share)
      let recentSitePosts: Array<{ caption: string }> = [];
      try {
        const stmt2 = this.db.prepare(`
          SELECT caption
          FROM canva_posts
          WHERE platform = 'telegram'
            AND status = 'posted'
            AND posted_at IS NOT NULL
            AND posted_at > ?
          ORDER BY posted_at DESC
          LIMIT 200
        `);
        recentSitePosts = stmt2.all(cutoffIso) as Array<{ caption: string }>;
      } catch (e) {
        recentSitePosts = [];
      }

      const seenOnSite = recentSitePosts.some(row => {
        const cap = row.caption || '';
        const urlHit = urlsInCaption.length > 0 && urlsInCaption.some(u => cap.includes(u));
        const captionHit = this.normalizeCaption(cap) === captionNorm;
        return urlHit || captionHit;
      });
      if (seenOnSite) {
        return { skip: true, reason: `Duplicate caption already posted on Telegram by site (≤ ${windowHours}h)` };
      }

      // No duplicates detected in window
      return { skip: false };
    } catch (error) {
      // On any error in dedupe logic, do not block posting
      return { skip: false };
    }
  }

  /** Normalize caption for fingerprinting */
  private normalizeCaption(text: string): string {
    return (text || '')
      .toLowerCase()
      .replace(/https?:\/\/\S+/g, '') // drop URLs for robust matching (URL handled separately)
      .replace(/#[\w_-]+/g, '') // drop hashtags
      .replace(/[^\p{L}\p{N}\s]/gu, ' ') // remove punctuation/symbols
      .replace(/\s+/g, ' ') // collapse whitespace
      .trim();
  }

  /** Extract URLs from text */
  private extractUrls(text: string): string[] {
    if (!text) return [];
    const matches = text.match(/https?:\/\/\S+/g) || [];
    // Normalize trivial trailing punctuation
    return matches.map(m => m.replace(/[\.,;:!\)]*$/, ''));
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
      const { clientId, clientSecret, refreshToken, defaultPrivacy } = this.credentials.youtube;
      if (!clientId || !clientSecret || !refreshToken) {
        return { success: false, error: 'YouTube OAuth credentials incomplete' };
      }

      // 1) Generate a short vertical video from the image
      if (!content.imageUrl) {
        return { success: false, error: 'Missing image for YouTube video generation' };
      }

      const videoPath = await generateShortVideo({
        imageUrl: content.imageUrl,
        durationSec: 15,
        seed: String(content.contentId || ''),
        withAudio: true
      });

      // 2) Prepare OAuth2 client
      const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
      oauth2.setCredentials({ refresh_token: refreshToken });
      const youtube = google.youtube('v3');

      // 3) Compose metadata
      const baseUrl = process.env.WEBSITE_URL || 'https://pickntrust.com';
      const redirectUrl = `${baseUrl}/redirect/${content.contentType}/${content.contentId}`;
      const title = (content.caption || 'PickNTrust Deal').substring(0, 90);
      const description = `${content.caption || ''}\n\n${content.hashtags || ''}\n\nGet this deal: ${redirectUrl}`.trim();

      // 4) Upload video
      const res = await youtube.videos.insert({
        auth: oauth2,
        part: ['snippet', 'status'],
        requestBody: {
          snippet: { title, description },
          status: { privacyStatus: defaultPrivacy || 'unlisted' }
        },
        media: {
          body: fs.createReadStream(videoPath)
        }
      } as any);

      // Cleanup temporary file
      try { fs.unlinkSync(videoPath); } catch {}

      const videoId = res?.data?.id as string | undefined;
      if (!videoId) {
        return { success: false, error: 'YouTube upload failed: no video ID returned' };
      }

      return { success: true, postId: videoId };

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