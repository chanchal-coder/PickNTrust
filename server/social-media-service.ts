/**
 * Complete Social Media Integration Service
 * 1) Automatically posts when products added via Telegram bots
 * 2) Provides manual share buttons in admin panel
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { backendTemplateEngine } from './backend-template-engine.js';

interface SocialMediaCredentials {
  facebook: {
    accessToken: string;
    pageId: string;
  };
  instagram: {
    accessToken: string;
    igUserId: string;
  };
  youtube: {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    defaultPrivacy: string;
    timezone: string;
    redirectUrl: string;
  };
  telegram: {
    botToken: string;
    channel: string;
  };
}

interface ProductData {
  id: string;
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  imageUrl: string;
  productUrl: string;
  category: string;
  page: string;
  source?: 'telegram' | 'admin' | 'manual';
}

interface SocialMediaResult {
  platform: string;
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
  timestamp: number;
}

class SocialMediaService {
  private credentials: SocialMediaCredentials;
  private enabled: boolean = false;
  private autoPostEnabled: boolean = true;

  constructor() {
    this.loadCredentials();
  }

  private loadCredentials() {
    // Load from environment variables or config file
    this.credentials = {
      facebook: {
        accessToken: process.env.FACEBOOK_ACCESS_TOKEN || 'EAAZAZAk8lOBI8BPD1hreE9x2ZB9i57ceZBZCTrlTQZBUilYaZA7fHEXjcEybYY0ZAfU8gZCYenwdn7kZB2QDGYF6kKkYBNKbErLsN9GEXQOKbf5lFAGUQ5Di7S32aEUtVzpbqmFmyKJUgWib2KIPJraxrmddxssLLVnN2IEedSdZCGzfS3KGWvL1lExkQ1df16JOtL2vQZDZD',
        pageId: process.env.FACEBOOK_PAGE_ID || '777393302113669'
      },
      instagram: {
        accessToken: process.env.INSTAGRAM_ACCESS_TOKEN || 'EAAZAZAk8lOBI8BPD1hreE9x2ZB9i57ceZBZCTrlTQZBUilYaZA7fHEXjcEybYY0ZAfU8gZCYenwdn7kZB2QDGYF6kKkYBNKbErLsN9GEXQOKbf5lFAGUQ5Di7S32aEUtVzpbqmFmyKJUgWib2KIPJraxrmddxssLLVnN2IEedSdZCGzfS3KGWvL1lExkQ1df16JOtL2vQZDZD',
        igUserId: process.env.INSTAGRAM_IG_USER_ID || '17841476091564752'
      },
      youtube: {
        clientId: process.env.YOUTUBE_CLIENT_ID || '',
        clientSecret: process.env.YOUTUBE_CLIENT_SECRET || '',
        refreshToken: process.env.YOUTUBE_REFRESH_TOKEN || '',
        defaultPrivacy: process.env.YOUTUBE_DEFAULT_PRIVACY || 'public',
        timezone: process.env.YOUTUBE_PUBLISH_TIMEZONE || 'Asia/Kolkata',
        redirectUrl: process.env.YOUTUBE_REDIRECT_URL || 'https://pickntrust.com/api/google/callback'
      },
      telegram: {
        botToken: process.env.TELEGRAM_BOT_TOKEN || '8202005407:AAGqFyQ5m3BQtYhqSTJiWriNGN0Eot-VEXc',
        channel: process.env.TELEGRAM_CHANNEL || '@pickntrust'
      }
    };

    this.enabled = !!(this.credentials.facebook.accessToken && this.credentials.instagram.accessToken);
    console.log(`🚀 Social Media Service: ${this.enabled ? 'Enabled' : 'Disabled'}`);
  }

  /**
   * AUTOMATIC POSTING: Called when Telegram bots add products to website
   */
  async autoPostFromTelegramBot(productData: ProductData): Promise<SocialMediaResult[]> {
    if (!this.enabled || !this.autoPostEnabled) {
      console.log('⏭️  Auto-posting disabled');
      return [];
    }

    console.log(`🤖 Auto-posting from Telegram: ${productData.name}`);
    productData.source = 'telegram';
    
    return await this.postToAllPlatforms(productData);
  }

  /**
   * MANUAL POSTING: Called when admin clicks share buttons
   */
  async manualPostFromAdmin(productData: ProductData, platforms?: string[]): Promise<SocialMediaResult[]> {
    if (!this.enabled) {
      throw new Error('Social media service not configured');
    }

    console.log(`👤 Manual posting from admin: ${productData.name}`);
    productData.source = 'manual';
    
    return await this.postToAllPlatforms(productData, platforms);
  }

  /**
   * ADMIN PANEL POSTING: Called when admin adds products manually
   */
  async autoPostFromAdminPanel(productData: ProductData): Promise<SocialMediaResult[]> {
    if (!this.enabled || !this.autoPostEnabled) {
      console.log('⏭️  Auto-posting from admin panel disabled');
      return [];
    }

    console.log(`📝 Auto-posting from admin panel: ${productData.name}`);
    productData.source = 'admin';
    
    return await this.postToAllPlatforms(productData);
  }

  /**
   * Core posting function - posts to all or selected platforms
   */
  private async postToAllPlatforms(productData: ProductData, selectedPlatforms?: string[]): Promise<SocialMediaResult[]> {
    const results: SocialMediaResult[] = [];
    
    try {
      // Generate enhanced content using backend templates
      const enhancedImageUrl = await this.generateEnhancedContent(productData);
      
      // Define available platforms
      const platforms = [
        { name: 'facebook', handler: () => this.postToFacebook(productData, enhancedImageUrl) },
        { name: 'instagram', handler: () => this.postToInstagram(productData, enhancedImageUrl) },
        { name: 'telegram', handler: () => this.postToTelegram(productData, enhancedImageUrl) },
        { name: 'youtube', handler: () => this.postToYouTube(productData, enhancedImageUrl) }
      ];
      
      // Filter platforms if specific ones are selected
      const targetPlatforms = selectedPlatforms ? 
        platforms.filter(p => selectedPlatforms.includes(p.name)) : 
        platforms;
      
      // Post to each platform
      for (const platform of targetPlatforms) {
        try {
          const result = await platform.handler();
          results.push(result);
          
          // Rate limiting delay
          await new Promise(resolve => setTimeout(resolve, 1500));
        } catch (error) {
          console.error(`Platform ${platform.name} error:`, error);
          results.push({
            platform: platform.name,
            success: false,
            error: error.message,
            timestamp: Date.now()
          });
        }
      }
      
      const successful = results.filter(r => r.success).length;
      console.log(`📊 Social Media: ${successful}/${results.length} platforms successful`);
      
    } catch (error) {
      console.error('❌ Social Media Service Error:', error);
    }
    
    return results;
  }

  private async generateEnhancedContent(productData: ProductData): Promise<string> {
    try {
      // Use backend template engine to create enhanced visuals
      const generatedUrl = await backendTemplateEngine.generateContent(productData, 'image');
      console.log('🎨 Enhanced content generated with backend templates');
      return generatedUrl;
    } catch (error) {
      console.log('⚠️  Using original product image as fallback');
      return productData.imageUrl;
    }
  }

  private async postToFacebook(productData: ProductData, imageUrl: string): Promise<SocialMediaResult> {
    try {
      const message = this.formatFacebookMessage(productData);
      
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${this.credentials.facebook.pageId}/photos`,
        {
          url: imageUrl,
          caption: message,
          access_token: this.credentials.facebook.accessToken
        }
      );
      
      if (response.data.id) {
        console.log('✅ Facebook: Posted successfully');
        return {
          platform: 'Facebook',
          success: true,
          postId: response.data.id,
          postUrl: `https://facebook.com/${this.credentials.facebook.pageId}/posts/${response.data.id}`,
          timestamp: Date.now()
        };
      } else {
        throw new Error('No post ID returned');
      }
    } catch (error: any) {
      console.error('❌ Facebook posting failed:', error.message);
      return {
        platform: 'Facebook',
        success: false,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  private async postToInstagram(productData: ProductData, imageUrl: string): Promise<SocialMediaResult> {
    try {
      const caption = this.formatInstagramMessage(productData);
      
      // Step 1: Create media container
      const containerResponse = await axios.post(
        `https://graph.facebook.com/v18.0/${this.credentials.instagram.igUserId}/media`,
        {
          image_url: imageUrl,
          caption: caption,
          access_token: this.credentials.instagram.accessToken
        }
      );
      
      const containerId = containerResponse.data.id;
      
      // Step 2: Publish the media
      const publishResponse = await axios.post(
        `https://graph.facebook.com/v18.0/${this.credentials.instagram.igUserId}/media_publish`,
        {
          creation_id: containerId,
          access_token: this.credentials.instagram.accessToken
        }
      );
      
      if (publishResponse.data.id) {
        console.log('✅ Instagram: Posted successfully');
        return {
          platform: 'Instagram',
          success: true,
          postId: publishResponse.data.id,
          postUrl: `https://instagram.com/p/${publishResponse.data.id}`,
          timestamp: Date.now()
        };
      } else {
        throw new Error('No post ID returned');
      }
    } catch (error: any) {
      console.error('❌ Instagram posting failed:', error.message);
      return {
        platform: 'Instagram',
        success: false,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  private async postToTelegram(productData: ProductData, imageUrl: string): Promise<SocialMediaResult> {
    try {
      const message = this.formatTelegramMessage(productData);
      
      const response = await axios.post(
        `https://api.telegram.org/bot${this.credentials.telegram.botToken}/sendPhoto`,
        {
          chat_id: this.credentials.telegram.channel,
          photo: imageUrl,
          caption: message,
          parse_mode: 'Markdown'
        }
      );
      
      if (response.data.ok) {
        console.log('✅ Telegram: Posted successfully');
        return {
          platform: 'Telegram',
          success: true,
          postId: response.data.result.message_id.toString(),
          postUrl: `https://t.me/${this.credentials.telegram.channel.replace('@', '')}`,
          timestamp: Date.now()
        };
      } else {
        throw new Error(response.data.description || 'Unknown error');
      }
    } catch (error: any) {
      console.error('❌ Telegram posting failed:', error.message);
      return {
        platform: 'Telegram',
        success: false,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  private async postToYouTube(productData: ProductData, imageUrl: string): Promise<SocialMediaResult> {
    try {
      // YouTube requires video content for uploads
      // For now, we'll return a placeholder indicating setup needed
      console.log('⚠️  YouTube: Requires video content for posting');
      
      return {
        platform: 'YouTube',
        success: false,
        error: 'YouTube posting requires video content - image posts not supported',
        timestamp: Date.now()
      };
    } catch (error: any) {
      console.error('❌ YouTube posting failed:', error.message);
      return {
        platform: 'YouTube',
        success: false,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  // Message formatting functions
  private formatFacebookMessage(productData: ProductData): string {
    const discount = this.calculateDiscount(productData);
    
    return `🔥 ${productData.name}\n\n` +
           `💰 Price: ${productData.price}${discount}\n` +
           (productData.originalPrice ? `🏷️ Original: ${productData.originalPrice}\n` : '') +
           `\n📝 ${productData.description}\n\n` +
           `🛒 Shop Now: ${productData.productUrl}\n\n` +
           `#PickNTrust #Deals #${productData.category} #Shopping #BestDeals #Sale`;
  }

  private formatInstagramMessage(productData: ProductData): string {
    const discount = this.calculateDiscount(productData);
    
    return `🔥 ${productData.name}\n\n` +
           `💰 ${productData.price}${discount}\n` +
           (productData.originalPrice ? `🏷️ Was: ${productData.originalPrice}\n` : '') +
           `\n${productData.description}\n\n` +
           `🛒 Link in bio or DM for direct link!\n\n` +
           `#PickNTrust #Deals #${productData.category} #Shopping #BestDeals #Sale #Discount #OnlineShopping #TrustedDeals #${productData.page}`;
  }

  private formatTelegramMessage(productData: ProductData): string {
    const discount = this.calculateDiscount(productData);
    
    return `🔥 **${productData.name}**\n\n` +
           `💰 **Price:** ${productData.price}${discount}\n` +
           (productData.originalPrice ? `🏷️ **Original:** ${productData.originalPrice}\n` : '') +
           `\n📝 **Description:**\n${productData.description}\n\n` +
           `🛒 **Buy Now:** ${productData.productUrl}\n\n` +
           `#PickNTrust #Deals #${productData.category}`;
  }

  private calculateDiscount(productData: ProductData): string {
    if (!productData.originalPrice) return '';
    
    const price = parseFloat(productData.price.replace(/[^0-9.]/g, ''));
    const originalPrice = parseFloat(productData.originalPrice.replace(/[^0-9.]/g, ''));
    
    if (originalPrice > price) {
      const discountPercent = Math.round((1 - price / originalPrice) * 100);
      return ` (${discountPercent}% OFF!)`;
    }
    
    return '';
  }

  /**
   * Configuration and status methods
   */
  enableAutoPosting(enabled: boolean = true) {
    this.autoPostEnabled = enabled;
    console.log(`🔄 Auto-posting ${enabled ? 'enabled' : 'disabled'}`);
  }

  getStatus() {
    return {
      enabled: this.enabled,
      autoPostEnabled: this.autoPostEnabled,
      platforms: {
        facebook: !!this.credentials.facebook.accessToken,
        instagram: !!this.credentials.instagram.accessToken,
        youtube: !!this.credentials.youtube.clientId,
        telegram: !!this.credentials.telegram.botToken
      },
      credentials: {
        facebook: {
          hasToken: !!this.credentials.facebook.accessToken,
          pageId: this.credentials.facebook.pageId
        },
        instagram: {
          hasToken: !!this.credentials.instagram.accessToken,
          userId: this.credentials.instagram.igUserId
        },
        telegram: {
          hasToken: !!this.credentials.telegram.botToken,
          channel: this.credentials.telegram.channel
        }
      }
    };
  }

  /**
   * Test all platforms
   */
  async testAllPlatforms(): Promise<SocialMediaResult[]> {
    const testProduct: ProductData = {
      id: 'test-' + Date.now(),
      name: 'Test Product - Social Media Integration',
      description: 'Testing automatic and manual posting to all social media platforms from PickNTrust.',
      price: '₹999',
      originalPrice: '₹1,999',
      imageUrl: 'https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=PickNTrust+Test',
      productUrl: 'https://pickntrust.com/test-product',
      category: 'electronics',
      page: 'test',
      source: 'manual'
    };
    
    console.log('🧪 Testing all social media platforms...');
    const results = await this.postToAllPlatforms(testProduct);
    
    console.log('\n📊 Test Results:');
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`   ${status} ${result.platform}: ${result.success ? 'Success' : result.error}`);
      if (result.postUrl) {
        console.log(`      🔗 ${result.postUrl}`);
      }
    });
    
    return results;
  }
}

// Export singleton instance
export const socialMediaService = new SocialMediaService();
export default SocialMediaService;
export type { ProductData, SocialMediaResult };