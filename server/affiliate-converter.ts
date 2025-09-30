// Affiliate Link Converter
// Converts original product URLs to user's affiliate links with proper tracking parameters

import { ResolvedURL } from './universal-url-resolver.js';
import { PlatformInfo } from './platform-detector.js';
import { ChannelConfig } from '../shared/sqlite-schema';

interface AffiliateConfig {
  platform: string;
  affiliateId?: string;
  trackingTag?: string;
  baseUrl?: string;
  urlPattern: string;
  parameters: Record<string, string>;
  isActive: boolean;
}

interface ConvertedLink {
  originalUrl: string;
  affiliateUrl: string;
  platform: string;
  affiliateNetwork?: string;
  trackingParameters: Record<string, string>;
  commission?: number;
  isConverted: boolean;
  error?: string;
}

export interface ConversionResult {
  success: boolean;
  originalUrl: string;
  affiliateUrl: string;
  platform: string;
  error?: string;
}

class AffiliateConverter {
  private affiliateConfigs: Map<string, AffiliateConfig> = new Map();
  private defaultTrackingParams = {
    utm_source: 'pickntrust',
    utm_medium: 'affiliate',
    utm_campaign: 'product_link'
  };

  constructor() {
    this.initializeAffiliateConfigs();
  }

  /**
   * Convert a URL to affiliate link based on channel configuration
   */
  static async convertUrl(url: string, channelConfig: ChannelConfig): Promise<ConversionResult> {
    try {
      // Clean and validate URL
      const cleanUrl = this.cleanUrl(url);
      if (!this.isValidUrl(cleanUrl)) {
        return {
          success: false,
          originalUrl: url,
          affiliateUrl: '',
          platform: channelConfig.affiliatePlatform,
          error: 'Invalid URL format'
        };
      }

      // Handle single platform channels
      if (channelConfig.affiliatePlatform !== 'multiple') {
        return await this.convertSinglePlatform(cleanUrl, channelConfig);
      }

      // Handle multiple platform channels - detect best platform
      return await this.convertMultiplePlatform(cleanUrl, channelConfig);
      
    } catch (error) {
      return {
        success: false,
        originalUrl: url,
        affiliateUrl: '',
        platform: channelConfig.affiliatePlatform,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Convert URL for single platform channels
   */
  private static async convertSinglePlatform(url: string, config: ChannelConfig): Promise<ConversionResult> {
    switch (config.affiliatePlatform) {
      case 'amazon':
        return this.convertAmazonUrl(url, config.affiliateTag!);
      
      case 'cuelinks':
        return this.convertCuelinksUrl(url, config.affiliateUrl!);
      
      case 'earnkaro':
        return this.convertEarnKaroUrl(url);
      
      case 'inrdeals':
        return this.convertInrDealsUrl(url, config.affiliateTag!);
      
      case 'deodap':
        return this.convertDeodapUrl(url, config.affiliateTag!);
      
      default:
        return {
          success: false,
          originalUrl: url,
          affiliateUrl: '',
          platform: config.affiliatePlatform,
          error: 'Unsupported platform'
        };
    }
  }

  /**
   * Convert URL for multiple platform channels - auto-detect best platform
   */
  private static async convertMultiplePlatform(url: string, config: ChannelConfig): Promise<ConversionResult> {
    const supportedPlatforms = config.supportedPlatforms || [];
    
    // Try platforms in priority order
    for (const platform of supportedPlatforms) {
      try {
        let result: ConversionResult;
        
        switch (platform) {
          case 'cuelinks':
            result = this.convertCuelinksUrl(url, 'https://linksredirect.com/?cid=243942&source=linkkit&url={{URL_ENC}}');
            break;
          case 'earnkaro':
            result = this.convertEarnKaroUrl(url);
            break;
          case 'inrdeals':
            result = this.convertInrDealsUrl(url, 'id=sha678089037');
            break;
          default:
            continue;
        }
        
        if (result.success) {
          return result;
        }
      } catch (error) {
        // Continue to next platform
        continue;
      }
    }

    // If no platform worked, return error
    return {
      success: false,
      originalUrl: url,
      affiliateUrl: '',
      platform: 'multiple',
      error: 'No supported platform could convert this URL'
    };
  }

  /**
   * Convert Amazon URLs
   */
  private static convertAmazonUrl(url: string, tag: string): ConversionResult {
    try {
      const urlObj = new URL(url);
      
      // Check if it's an Amazon URL
      if (!urlObj.hostname.includes('amazon.')) {
        return {
          success: false,
          originalUrl: url,
          affiliateUrl: '',
          platform: 'amazon',
          error: 'Not an Amazon URL'
        };
      }

      // Add affiliate tag
      urlObj.searchParams.set('tag', tag);
      
      return {
        success: true,
        originalUrl: url,
        affiliateUrl: urlObj.toString(),
        platform: 'amazon'
      };
    } catch (error) {
      return {
        success: false,
        originalUrl: url,
        affiliateUrl: '',
        platform: 'amazon',
        error: 'Failed to process Amazon URL'
      };
    }
  }

  /**
   * Convert URLs using Cuelinks
   */
  private static convertCuelinksUrl(url: string, templateUrl: string): ConversionResult {
    try {
      const encodedUrl = encodeURIComponent(url);
      const affiliateUrl = templateUrl.replace('{{URL_ENC}}', encodedUrl);
      
      return {
        success: true,
        originalUrl: url,
        affiliateUrl: affiliateUrl,
        platform: 'cuelinks'
      };
    } catch (error) {
      return {
        success: false,
        originalUrl: url,
        affiliateUrl: '',
        platform: 'cuelinks',
        error: 'Failed to process Cuelinks URL'
      };
    }
  }

  /**
   * Convert URLs using EarnKaro
   */
  private static convertEarnKaroUrl(url: string): ConversionResult {
    try {
      // EarnKaro conversion logic would go here
      // For now, return the original URL as placeholder
      return {
        success: true,
        originalUrl: url,
        affiliateUrl: url, // Placeholder - implement actual EarnKaro API
        platform: 'earnkaro'
      };
    } catch (error) {
      return {
        success: false,
        originalUrl: url,
        affiliateUrl: '',
        platform: 'earnkaro',
        error: 'Failed to process EarnKaro URL'
      };
    }
  }

  /**
   * Convert URLs using InrDeals
   */
  private static convertInrDealsUrl(url: string, tag: string): ConversionResult {
    try {
      const urlObj = new URL(url);
      
      // Add InrDeals affiliate parameter
      const separator = urlObj.search ? '&' : '?';
      const affiliateUrl = `${url}${separator}${tag}`;
      
      return {
        success: true,
        originalUrl: url,
        affiliateUrl: affiliateUrl,
        platform: 'inrdeals'
      };
    } catch (error) {
      return {
        success: false,
        originalUrl: url,
        affiliateUrl: '',
        platform: 'inrdeals',
        error: 'Failed to process InrDeals URL'
      };
    }
  }

  /**
   * Convert URLs using Deodap
   */
  private static convertDeodapUrl(url: string, tag: string): ConversionResult {
    try {
      const urlObj = new URL(url);
      
      // Add Deodap affiliate parameter
      const separator = urlObj.search ? '&' : '?';
      const affiliateUrl = `${url}${separator}${tag}`;
      
      return {
        success: true,
        originalUrl: url,
        affiliateUrl: affiliateUrl,
        platform: 'deodap'
      };
    } catch (error) {
      return {
        success: false,
        originalUrl: url,
        affiliateUrl: '',
        platform: 'deodap',
        error: 'Failed to process Deodap URL'
      };
    }
  }

  /**
   * Clean URL by removing tracking parameters
   */
  private static cleanUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      
      // Remove common tracking parameters
      const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'];
      trackingParams.forEach(param => urlObj.searchParams.delete(param));
      
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  /**
   * Validate URL format
   */
  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Initialize affiliate configurations for different platforms
   */
  private initializeAffiliateConfigs(): void {
    // Amazon India Affiliate Configuration
    this.affiliateConfigs.set('amazon', {
      platform: 'amazon',
      affiliateId: process.env.AMAZON_AFFILIATE_ID || 'pickntrust-21',
      trackingTag: process.env.AMAZON_TRACKING_TAG || 'pickntrust-21',
      baseUrl: 'https://www.amazon.in',
      urlPattern: '/dp/{productId}',
      parameters: {
        tag: process.env.AMAZON_AFFILIATE_ID || 'pickntrust-21',
        linkCode: 'as2',
        camp: '1789',
        creative: '9325'
      },
      isActive: true
    });

    // Flipkart Affiliate Configuration
    this.affiliateConfigs.set('flipkart', {
      platform: 'flipkart',
      affiliateId: process.env.FLIPKART_AFFILIATE_ID || 'pickntrust',
      baseUrl: 'https://www.flipkart.com',
      urlPattern: '/p/{productId}',
      parameters: {
        affid: process.env.FLIPKART_AFFILIATE_ID || 'pickntrust',
        affExtParam1: 'pickntrust_affiliate',
        affExtParam2: 'product_link'
      },
      isActive: true
    });

    // CueLinks Configuration (Universal Affiliate Network)
    this.affiliateConfigs.set('cuelinks', {
      platform: 'cuelinks',
      affiliateId: process.env.CUELINKS_AFFILIATE_ID || 'pickntrust',
      baseUrl: 'https://linksredirect.com',
      urlPattern: '/?id={affiliateId}&url={encodedUrl}',
      parameters: {
        id: process.env.CUELINKS_AFFILIATE_ID || 'pickntrust',
        subId: 'pickntrust_universal'
      },
      isActive: true
    });

    // EarnKaro Configuration
    this.affiliateConfigs.set('earnkaro', {
      platform: 'earnkaro',
      affiliateId: process.env.EARNKARO_AFFILIATE_ID || 'pickntrust',
      baseUrl: 'https://www.earnkaro.com',
      urlPattern: '/deals/{productSlug}',
      parameters: {
        ref: process.env.EARNKARO_AFFILIATE_ID || 'pickntrust',
        utm_source: 'pickntrust',
        utm_medium: 'affiliate'
      },
      isActive: true
    });

    // Generic Tracking Configuration (for unsupported platforms)
    this.affiliateConfigs.set('generic', {
      platform: 'generic',
      baseUrl: '',
      urlPattern: '{originalUrl}',
      parameters: {
        ref: 'pickntrust',
        utm_source: 'pickntrust',
        utm_medium: 'referral',
        utm_campaign: 'product_recommendation'
      },
      isActive: true
    });
  }

  /**
   * Convert Amazon URL to affiliate link
   */
  private convertAmazonLink(resolvedUrl: ResolvedURL, productId?: string): ConvertedLink {
    const config = this.affiliateConfigs.get('amazon')!;
    
    try {
      // Extract ASIN if not provided
      const asin = productId || this.extractAmazonASIN(resolvedUrl.finalUrl);
      
      if (!asin) {
        throw new Error('Could not extract Amazon ASIN');
      }
      
      // Build affiliate URL
      const affiliateUrl = new URL(`${config.baseUrl}/dp/${asin}`);
      
      // Add affiliate parameters
      Object.entries(config.parameters).forEach(([key, value]) => {
        affiliateUrl.searchParams.set(key, value);
      });
      
      // Add tracking parameters
      Object.entries(this.defaultTrackingParams).forEach(([key, value]) => {
        affiliateUrl.searchParams.set(key, value);
      });
      
      return {
        originalUrl: resolvedUrl.finalUrl,
        affiliateUrl: affiliateUrl.toString(),
        platform: 'amazon',
        affiliateNetwork: 'Amazon Associates',
        trackingParameters: { ...config.parameters, ...this.defaultTrackingParams },
        commission: 4, // Typical Amazon commission rate
        isConverted: true
      };
      
    } catch (error) {
      return this.createErrorResult(resolvedUrl, 'amazon', error as Error);
    }
  }

  /**
   * Convert Flipkart URL to affiliate link
   */
  private convertFlipkartLink(resolvedUrl: ResolvedURL, productId?: string): ConvertedLink {
    const config = this.affiliateConfigs.get('flipkart')!;
    
    try {
      // Use original URL with affiliate parameters
      const affiliateUrl = new URL(resolvedUrl.finalUrl);
      
      // Add affiliate parameters
      Object.entries(config.parameters).forEach(([key, value]) => {
        affiliateUrl.searchParams.set(key, value);
      });
      
      // Add tracking parameters
      Object.entries(this.defaultTrackingParams).forEach(([key, value]) => {
        affiliateUrl.searchParams.set(key, value);
      });
      
      return {
        originalUrl: resolvedUrl.finalUrl,
        affiliateUrl: affiliateUrl.toString(),
        platform: 'flipkart',
        affiliateNetwork: 'Flipkart Affiliate',
        trackingParameters: { ...config.parameters, ...this.defaultTrackingParams },
        commission: 3, // Typical Flipkart commission rate
        isConverted: true
      };
      
    } catch (error) {
      return this.createErrorResult(resolvedUrl, 'flipkart', error as Error);
    }
  }

  /**
   * Convert any URL using CueLinks universal network
   */
  private convertWithCueLinks(resolvedUrl: ResolvedURL): ConvertedLink {
    const config = this.affiliateConfigs.get('cuelinks')!;
    
    try {
      const encodedUrl = encodeURIComponent(resolvedUrl.finalUrl);
      const affiliateUrl = `${config.baseUrl}/?id=${config.parameters.id}&url=${encodedUrl}&subId=${config.parameters.subId}`;
      
      return {
        originalUrl: resolvedUrl.finalUrl,
        affiliateUrl,
        platform: resolvedUrl.platform || 'unknown',
        affiliateNetwork: 'CueLinks',
        trackingParameters: config.parameters,
        commission: 2.5, // Typical CueLinks commission rate
        isConverted: true
      };
      
    } catch (error) {
      return this.createErrorResult(resolvedUrl, 'cuelinks', error as Error);
    }
  }

  /**
   * Add generic tracking parameters to unsupported platforms
   */
  private addGenericTracking(resolvedUrl: ResolvedURL): ConvertedLink {
    const config = this.affiliateConfigs.get('generic')!;
    
    try {
      const affiliateUrl = new URL(resolvedUrl.finalUrl);
      
      // Add tracking parameters
      Object.entries(config.parameters).forEach(([key, value]) => {
        affiliateUrl.searchParams.set(key, value);
      });
      
      return {
        originalUrl: resolvedUrl.finalUrl,
        affiliateUrl: affiliateUrl.toString(),
        platform: resolvedUrl.platform || 'unknown',
        affiliateNetwork: 'Direct Tracking',
        trackingParameters: config.parameters,
        commission: 0, // No commission for generic tracking
        isConverted: true
      };
      
    } catch (error) {
      return this.createErrorResult(resolvedUrl, 'generic', error as Error);
    }
  }

  /**
   * Extract Amazon ASIN from URL
   */
  private extractAmazonASIN(url: string): string | null {
    const asinPatterns = [
      /\/dp\/([A-Z0-9]{10})/i,
      /\/gp\/product\/([A-Z0-9]{10})/i,
      /\/product\/([A-Z0-9]{10})/i,
      /asin=([A-Z0-9]{10})/i
    ];
    
    for (const pattern of asinPatterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  }

  /**
   * Create error result
   */
  private createErrorResult(resolvedUrl: ResolvedURL, platform: string, error: Error): ConvertedLink {
    return {
      originalUrl: resolvedUrl.finalUrl,
      affiliateUrl: resolvedUrl.finalUrl, // Fallback to original URL
      platform,
      trackingParameters: {},
      isConverted: false,
      error: error.message
    };
  }

  /**
   * Main conversion method
   */
  convertToAffiliate(resolvedUrl: ResolvedURL, platformInfo: PlatformInfo): ConvertedLink {
    console.log(`Price Converting to affiliate link: ${resolvedUrl.finalUrl}`);
    console.log(`Search Platform: ${platformInfo.platformName}`);
    
    // Check if platform supports affiliate conversion
    if (!platformInfo.affiliateSupport) {
      console.log(`Warning Platform ${platformInfo.platformName} doesn't support affiliate links, adding tracking`);
      return this.addGenericTracking(resolvedUrl);
    }
    
    // Platform-specific conversion
    switch (platformInfo.platform) {
      case 'amazon':
        return this.convertAmazonLink(resolvedUrl, platformInfo.productId);
        
      case 'flipkart':
        return this.convertFlipkartLink(resolvedUrl, platformInfo.productId);
        
      default:
        // Use CueLinks for universal affiliate conversion
        console.log(`Global Using CueLinks for universal affiliate conversion`);
        return this.convertWithCueLinks(resolvedUrl);
    }
  }

  /**
   * Batch convert multiple URLs
   */
  convertMultipleUrls(resolvedUrls: ResolvedURL[], platformInfos: PlatformInfo[]): ConvertedLink[] {
    console.log(`Price Batch converting ${resolvedUrls.length} URLs to affiliate links...`);
    
    return resolvedUrls.map((url, index) => {
      const platformInfo = platformInfos[index];
      return this.convertToAffiliate(url, platformInfo);
    });
  }

  /**
   * Get affiliate configuration for platform
   */
  getAffiliateConfig(platform: string): AffiliateConfig | undefined {
    return this.affiliateConfigs.get(platform);
  }

  /**
   * Update affiliate configuration
   */
  updateAffiliateConfig(platform: string, config: Partial<AffiliateConfig>): void {
    const existingConfig = this.affiliateConfigs.get(platform);
    if (existingConfig) {
      this.affiliateConfigs.set(platform, { ...existingConfig, ...config });
      console.log(`Success Updated affiliate config for ${platform}`);
    }
  }

  /**
   * Get supported affiliate platforms
   */
  getSupportedPlatforms(): string[] {
    return Array.from(this.affiliateConfigs.keys()).filter(platform => 
      this.affiliateConfigs.get(platform)?.isActive
    );
  }

  /**
   * Test affiliate link generation
   */
  testAffiliateConversion(url: string, platform: string): ConvertedLink {
    const mockResolvedUrl: ResolvedURL = {
      originalUrl: url,
      finalUrl: url,
      redirectChain: [url],
      isShortened: false,
      platform,
      productId: 'test'
    };
    
    const mockPlatformInfo: PlatformInfo = {
      platform,
      platformName: platform.charAt(0).toUpperCase() + platform.slice(1),
      isSupported: true,
      scrapingStrategy: 'direct',
      affiliateSupport: true
    };
    
    return this.convertToAffiliate(mockResolvedUrl, mockPlatformInfo);
  }

  /**
   * Calculate potential commission
   */
  calculateCommission(price: number, platform: string): number {
    const config = this.affiliateConfigs.get(platform);
    if (!config) return 0;
    
    // Platform-specific commission rates
    const commissionRates: Record<string, number> = {
      amazon: 0.04, // 4%
      flipkart: 0.03, // 3%
      myntra: 0.05, // 5%
      nykaa: 0.06, // 6%
      cuelinks: 0.025, // 2.5%
      generic: 0
    };
    
    const rate = commissionRates[platform] || 0;
    return Math.round(price * rate * 100) / 100; // Round to 2 decimal places
  }
}

// Export both class and singleton instance
export { AffiliateConverter };
export const affiliateConverter = new AffiliateConverter();
export type { ConvertedLink, AffiliateConfig };