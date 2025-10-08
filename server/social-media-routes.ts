/**
 * Social Media Routes
 * API endpoints for managing social media posting
 */

import { Request, Response, Express } from 'express';
import { createSocialMediaPoster } from './social-media-poster.js';
import { sqliteDb as db } from './db.js';

// Use shared database connection to ensure consistent path resolution

// Admin password verification (same as in routes.ts)
async function verifyAdminPassword(password: string): Promise<boolean> {
  return password === 'pickntrust2025';
}

export function setupSocialMediaRoutes(app: Express) {
  const socialMediaPoster = createSocialMediaPoster(db);

  /**
   * Get social media posting status
   */
  app.get('/api/admin/social-media/status', async (req, res) => {
    try {
      const { password } = req.query;
      
      if (!await verifyAdminPassword(password as string)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Get posting statistics
      const stats = db.prepare(`
        SELECT 
          platforms,
          status,
          COUNT(*) as count
        FROM canva_posts 
        GROUP BY platforms, status
        ORDER BY platforms, status
      `).all();

      // Get recent posts
      const recentPosts = db.prepare(`
        SELECT 
          id,
          content_type,
          content_id,
          platforms,
          caption,
          hashtags,
          status,
          social_media_post_id,
          error_message,
          created_at,
          posted_at
        FROM canva_posts 
        ORDER BY created_at DESC 
        LIMIT 20
      `).all();

      // Check API credentials status
      const credentialsStatus = {
        instagram: !!(process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID),
        facebook: !!(process.env.FACEBOOK_ACCESS_TOKEN && process.env.FACEBOOK_PAGE_ID),
        twitter: !!(process.env.TWITTER_API_KEY && process.env.TWITTER_ACCESS_TOKEN),
        linkedin: !!(process.env.LINKEDIN_ACCESS_TOKEN && process.env.LINKEDIN_ORGANIZATION_ID),
        telegram: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHANNEL),
        youtube: !!(process.env.YOUTUBE_CLIENT_ID && process.env.YOUTUBE_CLIENT_SECRET && process.env.YOUTUBE_REFRESH_TOKEN)
      };

      res.json({
        success: true,
        data: {
          statistics: stats,
          recentPosts,
          credentialsConfigured: credentialsStatus,
          totalConfiguredPlatforms: Object.values(credentialsStatus).filter(Boolean).length
        }
      });

    } catch (error) {
      console.error('Social media status error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get social media status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Manually trigger posting for pending posts
   */
  app.post('/api/admin/social-media/post-pending', async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      console.log('Launch Manual trigger: Processing pending social media posts...');
      
      const result = await socialMediaPoster.processPendingPosts();
      
      console.log(`Stats Posting results: ${result.successful} successful, ${result.failed} failed out of ${result.processed} total`);
      
      res.json({
        success: true,
        message: `Processed ${result.processed} posts: ${result.successful} successful, ${result.failed} failed`,
        data: result
      });

    } catch (error) {
      console.error('Manual posting error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to process pending posts',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Retry failed posts
   */
  app.post('/api/admin/social-media/retry-failed', async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Get failed posts
      const failedPosts = db.prepare(`
        SELECT 
          platforms as platform,
          caption,
          hashtags,
          image_url as imageUrl,
          content_id as contentId,
          content_type as contentType
        FROM canva_posts 
        WHERE status = 'failed'
        ORDER BY created_at DESC
      `).all() as Array<{
        platform: string;
        caption: string;
        hashtags: string;
        imageUrl: string;
        contentId: number;
        contentType: string;
      }>;

      if (failedPosts.length === 0) {
        return res.json({
          success: true,
          message: 'No failed posts to retry',
          data: { processed: 0, successful: 0, failed: 0 }
        });
      }

      console.log(`Refresh Retrying ${failedPosts.length} failed posts...`);
      
      // Reset status to pending before retrying
      const resetStmt = db.prepare(`
        UPDATE canva_posts 
        SET status = 'pending', error_message = NULL 
        WHERE status = 'failed'
      `);
      resetStmt.run();
      
      const result = await socialMediaPoster.postToAllPlatforms(failedPosts);
      const successful = result.results.filter(r => r.success).length;
      const failed = result.results.filter(r => !r.success).length;
      
      console.log(`Stats Retry results: ${successful} successful, ${failed} failed`);
      
      res.json({
        success: true,
        message: `Retried ${failedPosts.length} posts: ${successful} successful, ${failed} still failed`,
        data: {
          processed: failedPosts.length,
          successful,
          failed
        }
      });

    } catch (error) {
      console.error('Retry failed posts error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to retry failed posts',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Test social media credentials
   */
  app.post('/api/admin/social-media/test-credentials', async (req, res) => {
    try {
      const { password, platform } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      if (!platform) {
        return res.status(400).json({ message: 'Platform is required' });
      }

      // Create a test post
      const testContent = [{
        platform: platform.toLowerCase(),
        caption: '🧪 Test post from PickNTrust automation system',
        hashtags: '#PickNTrust #TestPost #Automation',
        imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500',
        contentId: 0,
        contentType: 'test'
      }];

      console.log(`🧪 Testing ${platform} credentials...`);
      
      const result = await socialMediaPoster.postToAllPlatforms(testContent);
      
      if (result.success) {
        console.log(`Success ${platform} credentials test successful`);
        res.json({
          success: true,
          message: `${platform} credentials are working correctly`,
          data: result.results[0]
        });
      } else {
        console.log(`Error ${platform} credentials test failed:`, result.results[0]?.error);
        res.json({
          success: false,
          message: `${platform} credentials test failed`,
          error: result.results[0]?.error || 'Unknown error'
        });
      }

    } catch (error) {
      console.error('Credentials test error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to test credentials',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Get posting analytics
   */
  app.get('/api/admin/social-media/analytics', async (req, res) => {
    try {
      const { password } = req.query;
      
      if (!await verifyAdminPassword(password as string)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Get posting analytics for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const analytics = db.prepare(`
        SELECT 
          DATE(created_at) as date,
          platforms,
          status,
          COUNT(*) as count
        FROM canva_posts 
        WHERE created_at >= ?
        GROUP BY DATE(created_at), platforms, status
        ORDER BY date DESC, platforms
      `).all(thirtyDaysAgo.toISOString());

      // Get success rates by platform
      const successRates = db.prepare(`
        SELECT 
          platforms,
          COUNT(*) as total,
          SUM(CASE WHEN status = 'posted' THEN 1 ELSE 0 END) as successful,
          ROUND(
            (SUM(CASE WHEN status = 'posted' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2
          ) as success_rate
        FROM canva_posts 
        WHERE created_at >= ?
        GROUP BY platforms
        ORDER BY success_rate DESC
      `).all(thirtyDaysAgo.toISOString());

      res.json({
        success: true,
        data: {
          dailyAnalytics: analytics,
          successRates,
          period: '30 days'
        }
      });

    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get analytics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}