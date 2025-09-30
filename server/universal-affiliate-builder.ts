// Universal Affiliate Builder
// Wrapper around the affiliate system for easy integration

import { affiliateSystem } from './affiliate-system';

export interface AffiliateResult {
  success: boolean;
  originalUrl: string;
  affiliateUrl: string;
  networkId: string;
  networkName: string;
  error?: string;
}

/**
 * UniversalAffiliateBuilder - Simplified interface for affiliate URL building
 * Integrates with the universal affiliate system
 */
export class UniversalAffiliateBuilder {
  constructor() {
    console.log('Link Universal Affiliate Builder initialized');
    this.initializeDefaultConfigs();
  }

  /**
   * Initialize default affiliate configurations
   */
  private initializeDefaultConfigs(): void {
    try {
      // Configure Amazon Associates
      if (process.env.AMAZON_AFFILIATE_TAG) {
        affiliateSystem.configureNetwork(
          'amazon',
          process.env.AMAZON_AFFILIATE_TAG,
          true
        );
      }

      // Configure CueLinks
      if (process.env.CUELINKS_AFFILIATE_ID) {
        affiliateSystem.configureNetwork(
          'cuelinks',
          process.env.CUELINKS_AFFILIATE_ID,
          true
        );
      }

      // Configure Commission Junction
      if (process.env.CJ_AFFILIATE_ID) {
        affiliateSystem.configureNetwork(
          'cj',
          process.env.CJ_AFFILIATE_ID,
          true
        );
      }

      // Configure ShareASale
      if (process.env.SHAREASALE_AFFILIATE_ID) {
        affiliateSystem.configureNetwork(
          'shareasale',
          process.env.SHAREASALE_AFFILIATE_ID,
          true
        );
      }

      // Configure Impact Radius
      if (process.env.IMPACT_AFFILIATE_ID) {
        affiliateSystem.configureNetwork(
          'impact',
          process.env.IMPACT_AFFILIATE_ID,
          true
        );
      }

      console.log('Success Default affiliate configurations loaded');
    } catch (error) {
      console.error('Error Error initializing affiliate configs:', error);
    }
  }

  /**
   * Build affiliate URL for a given original URL
   */
  buildAffiliateUrl(originalUrl: string, networkId?: string): AffiliateResult {
    try {
      // Detect network if not specified
      const network = networkId ? 
        affiliateSystem.getSupportedNetworks().find(n => n.id === networkId) :
        affiliateSystem.detectNetwork(originalUrl);
      
      if (!network) {
        return {
          success: false,
          originalUrl,
          affiliateUrl: originalUrl,
          networkId: 'unknown',
          networkName: 'Unknown',
          error: 'Network not detected'
        };
      }

      // Build affiliate URL
      const affiliateUrl = affiliateSystem.buildAffiliateUrl(originalUrl, network.id);
      
      return {
        success: affiliateUrl !== originalUrl,
        originalUrl,
        affiliateUrl,
        networkId: network.id,
        networkName: network.name
      };
      
    } catch (error) {
      return {
        success: false,
        originalUrl,
        affiliateUrl: originalUrl,
        networkId: 'error',
        networkName: 'Error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Detect affiliate network from URL
   */
  detectNetwork(url: string) {
    return affiliateSystem.detectNetwork(url);
  }

  /**
   * Get all supported networks
   */
  getSupportedNetworks() {
    return affiliateSystem.getSupportedNetworks();
  }

  /**
   * Configure a specific network
   */
  configureNetwork(networkId: string, affiliateId: string, enabled: boolean = true, subId?: string): boolean {
    return affiliateSystem.configureNetwork(networkId, affiliateId, enabled, subId);
  }

  /**
   * Validate affiliate URL
   */
  validateAffiliateUrl(url: string) {
    return affiliateSystem.validateAffiliateUrl(url);
  }

  /**
   * Build custom affiliate URL with specific parameters
   */
  buildCustomAffiliateUrl(originalUrl: string, customTag: string): string {
    try {
      // For custom affiliate tagging (like ref=sicvppak for apps)
      const separator = originalUrl.includes('?') ? '&' : '?';
      return `${originalUrl}${separator}${customTag}`;
    } catch (error) {
      console.error('Error building custom affiliate URL:', error);
      return originalUrl;
    }
  }

  /**
   * Bulk process multiple URLs
   */
  buildBulkAffiliateUrls(urls: string[]): AffiliateResult[] {
    return urls.map(url => this.buildAffiliateUrl(url));
  }

  /**
   * Get affiliate statistics
   */
  getAffiliateStats() {
    const networks = this.getSupportedNetworks();
    return {
      totalNetworks: networks.length,
      activeNetworks: networks.filter(n => {
        // Check if network is configured (simplified check)
        return true; // Would need to check actual configs
      }).length,
      supportedDomains: networks.reduce((acc, network) => {
        return acc + network.urlPatterns.length;
      }, 0)
    };
  }
}