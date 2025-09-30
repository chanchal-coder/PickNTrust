/**
 * Canva Automation Service
 * Handles automated content creation when products, services, blogs, or videos are added
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { createSocialMediaPoster, SocialMediaPoster } from './social-media-poster.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CanvaSettings {
  id: number;
  is_enabled: boolean;
  api_key?: string;
  api_secret?: string;
  auto_generate_captions: boolean;
  auto_generate_hashtags: boolean;
  default_caption?: string;
  default_hashtags?: string;
  platforms: string;
  schedule_type: string;
  schedule_delay_minutes: number;
  enable_blog_posts: boolean;
  enable_videos: boolean;
}

interface PlatformTemplate {
  id: number;
  platform: string;
  template_id: string;
  is_default: boolean;
}

interface ExtraTemplate {
  id: number;
  template_id: string;
  name?: string;
  description?: string;
  is_default: boolean;
}

interface ContentItem {
  id: number;
  type: 'product' | 'service' | 'blog' | 'video';
  title: string;
  description: string;
  image_url?: string;
  price?: number;
  category?: string;
}

class CanvaAutomationService {
  private db: Database.Database;
  private socialMediaPoster: SocialMediaPoster;

  constructor() {
    const dbPath = path.join(__dirname, '..', '..', '..', 'database.sqlite');
    this.db = new Database(dbPath);
    this.socialMediaPoster = createSocialMediaPoster(this.db);
  }

  /**
   * Main trigger function called when content is added
   */
  async triggerContentCreation(contentItem: ContentItem): Promise<void> {
    try {
      console.log(`🎨 Canva automation triggered for ${contentItem.type}: ${contentItem.title}`);

      // Check if Canva automation is enabled
      const settings = this.getCanvaSettings();
      if (!settings || !settings.is_enabled) {
        console.log('⏸️ Canva automation is disabled, skipping...');
        return;
      }

      // Check if this content type is enabled
      if (!this.isContentTypeEnabled(contentItem.type, settings)) {
        console.log(`⏸️ ${contentItem.type} automation is disabled, skipping...`);
        return;
      }

      // Get enabled platforms
      const platforms = this.getEnabledPlatforms(settings);
      if (platforms.length === 0) {
        console.log('Warning No platforms enabled for automation');
        return;
      }

      console.log(`Mobile Creating content for platforms: ${platforms.join(', ')}`);

      // Create content for each platform
      for (const platform of platforms) {
        await this.createPlatformContent(contentItem, platform, settings);
      }

      console.log('Success Canva automation completed successfully');
    } catch (error) {
      console.error('Error Canva automation failed:', error);
      throw error;
    }
  }

  /**
   * Get Canva settings from database
   */
  private getCanvaSettings(): CanvaSettings | null {
    try {
      const settings = this.db.prepare('SELECT * FROM canva_settings LIMIT 1').get() as CanvaSettings;
      return settings || null;
    } catch (error) {
      console.error('Error fetching Canva settings:', error);
      return null;
    }
  }

  /**
   * Check if content type is enabled for automation
   */
  private isContentTypeEnabled(contentType: string, settings: CanvaSettings): boolean {
    switch (contentType) {
      case 'blog':
        return settings.enable_blog_posts;
      case 'video':
        return settings.enable_videos;
      case 'product':
      case 'service':
        return true; // Products and services are always enabled
      default:
        return false;
    }
  }

  /**
   * Get enabled platforms from settings
   */
  private getEnabledPlatforms(settings: CanvaSettings): string[] {
    try {
      const platforms = JSON.parse(settings.platforms || '[]');
      return Array.isArray(platforms) ? platforms : [];
    } catch (error) {
      console.error('Error parsing platforms:', error);
      return [];
    }
  }

  /**
   * Create content for a specific platform
   */
  private async createPlatformContent(
    contentItem: ContentItem,
    platform: string,
    settings: CanvaSettings
  ): Promise<void> {
    try {
      console.log(`Target Creating content for ${platform}...`);

      // Select template for this platform
      const templateId = this.selectTemplate(platform);
      if (!templateId) {
        console.log(`Warning No template available for ${platform}, skipping...`);
        return;
      }

      console.log(`📋 Using template: ${templateId} for ${platform}`);

      // Generate caption and hashtags
      const caption = this.generateCaption(contentItem, settings);
      const hashtags = this.generateHashtags(contentItem, settings);

      // Create Canva design (placeholder for now)
      const designId = await this.createCanvaDesign(templateId, contentItem);

      // Save to database
      this.saveCanvaPost({
        content_type: contentItem.type,
        content_id: contentItem.id,
        template_id: templateId,
        caption,
        hashtags,
        platform,
        canva_design_id: designId,
        status: 'pending'
      });

      // Attempt to post to social media immediately
      try {
        const postContent = [{
          platform,
          caption,
          hashtags,
          imageUrl: contentItem.image_url,
          contentId: contentItem.id,
          contentType: contentItem.type
        }];
        
        const postResult = await this.socialMediaPoster.postToAllPlatforms(postContent);
        
        if (postResult.success) {
          console.log(`Success Successfully posted to ${platform} for ${contentItem.type} ${contentItem.id}`);
        } else {
          console.log(`Warning Failed to post to ${platform} for ${contentItem.type} ${contentItem.id}:`, 
                     postResult.results[0]?.error || 'Unknown error');
        }
      } catch (postError) {
        console.log(`Warning Social media posting error for ${platform}:`, postError);
        // Don't fail the entire automation if posting fails
      }

      console.log(`Success Content created for ${platform}`);
    } catch (error) {
      console.error(`Error Failed to create content for ${platform}:`, error);
    }
  }

  /**
   * Select template for platform (default or random rotation)
   */
  private selectTemplate(platform: string): string | null {
    try {
      // First, try to get default template for this platform
      const defaultTemplate = this.db.prepare(`
        SELECT template_id FROM canva_platform_templates 
        WHERE platform = ? AND is_default = 1 
        LIMIT 1
      `).get(platform) as { template_id: string } | undefined;

      if (defaultTemplate) {
        console.log(`Target Using default template for ${platform}`);
        return defaultTemplate.template_id;
      }

      // If no default, get all templates for this platform
      const platformTemplates = this.db.prepare(`
        SELECT template_id FROM canva_platform_templates 
        WHERE platform = ?
      `).all(platform) as { template_id: string }[];

      if (platformTemplates.length > 0) {
        // Random selection from platform templates
        const randomIndex = Math.floor(Math.random() * platformTemplates.length);
        const selectedTemplate = platformTemplates[randomIndex].template_id;
        console.log(`🎲 Using random platform template for ${platform}`);
        return selectedTemplate;
      }

      // If no platform-specific templates, try extra templates
      const extraTemplates = this.db.prepare(`
        SELECT template_id FROM canva_extra_templates
      `).all() as { template_id: string }[];

      if (extraTemplates.length > 0) {
        // Random selection from extra templates
        const randomIndex = Math.floor(Math.random() * extraTemplates.length);
        const selectedTemplate = extraTemplates[randomIndex].template_id;
        console.log(`🎲 Using random extra template for ${platform}`);
        return selectedTemplate;
      }

      console.log(`Warning No templates available for ${platform}`);
      return null;
    } catch (error) {
      console.error('Error selecting template:', error);
      return null;
    }
  }

  /**
   * Generate caption for content
   */
  private generateCaption(contentItem: ContentItem, settings: CanvaSettings): string {
    if (!settings.auto_generate_captions) {
      return settings.default_caption || 'Check out this amazing find! Hot';
    }

    // Auto-generate based on content type
    switch (contentItem.type) {
      case 'product':
        return `Deal Discover ${contentItem.title}! ${contentItem.description.substring(0, 100)}... ${contentItem.price ? `Only $${contentItem.price}!` : ''} #ShopNow`;
      case 'service':
        return `⭐ ${contentItem.title} - ${contentItem.description.substring(0, 120)}... Get started today! #Services`;
      case 'blog':
        return `📖 New Blog Post: ${contentItem.title}! ${contentItem.description.substring(0, 100)}... Read more! #Blog`;
      case 'video':
        return `Video Watch: ${contentItem.title}! ${contentItem.description.substring(0, 100)}... Don't miss it! #Video`;
      default:
        return settings.default_caption || 'Check out this amazing content! Hot';
    }
  }

  /**
   * Generate hashtags for content
   */
  private generateHashtags(contentItem: ContentItem, settings: CanvaSettings): string {
    if (!settings.auto_generate_hashtags) {
      return settings.default_hashtags || '#amazing #deals #shopping';
    }

    // Base hashtags
    let hashtags = ['#PickNTrust'];

    // Content type specific hashtags
    switch (contentItem.type) {
      case 'product':
        hashtags.push('#shopping', '#deals', '#products');
        if (contentItem.category) {
          hashtags.push(`#${contentItem.category.toLowerCase().replace(/\s+/g, '')}`);
        }
        break;
      case 'service':
        hashtags.push('#services', '#business', '#professional');
        break;
      case 'blog':
        hashtags.push('#blog', '#article', '#reading');
        break;
      case 'video':
        hashtags.push('#video', '#watch', '#content');
        break;
    }

    // Add category-specific hashtags if available
    if (contentItem.category) {
      hashtags.push(`#${contentItem.category.toLowerCase().replace(/\s+/g, '')}`);
    }

    return hashtags.join(' ');
  }

  /**
   * Create Canva design (placeholder implementation)
   */
  private async createCanvaDesign(templateId: string, contentItem: ContentItem): Promise<string> {
    // TODO: Implement actual Canva API integration
    console.log(`🎨 Creating Canva design with template ${templateId}`);
    
    // For now, return a mock design ID
    const mockDesignId = `design_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return mockDesignId;
  }

  /**
   * Save Canva post to database
   */
  private saveCanvaPost(postData: {
    content_type: string;
    content_id: number;
    template_id: string;
    caption: string;
    hashtags: string;
    platform: string;
    canva_design_id: string;
    status: string;
  }): void {
    try {
      const insertPost = this.db.prepare(`
        INSERT INTO canva_posts (
          content_type, content_id, template_id, caption, hashtags,
          platforms, canva_design_id, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const now = Math.floor(Date.now() / 1000);
      insertPost.run(
        postData.content_type,
        postData.content_id,
        postData.template_id,
        postData.caption,
        postData.hashtags,
        JSON.stringify([postData.platform]),
        postData.canva_design_id,
        postData.status,
        now,
        now
      );

      console.log('Save Canva post saved to database');
    } catch (error) {
      console.error('Error saving Canva post:', error);
    }
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}

// Export singleton instance
export const canvaAutomation = new CanvaAutomationService();
export default CanvaAutomationService;