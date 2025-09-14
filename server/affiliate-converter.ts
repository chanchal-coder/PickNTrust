// Affiliate Link Converter
// Converts original product URLs to user's affiliate links with proper tracking parameters

import { ResolvedURL } from './universal-url-resolver';
import { PlatformInfo } from './platform-detector';

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

// Export singleton instance
export const affiliateConverter = new AffiliateConverter();
export type { ConvertedLink, AffiliateConfig };