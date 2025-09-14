// Universal Affiliate System
// Supports all major affiliate networks with automatic detection and tagging

export interface AffiliateNetwork {
  id: string;
  name: string;
  urlPatterns: string[];
  tagParameter: string;
  tagFormat: string;
  validation?: RegExp;
  customBuilder?: (url: string, tag: string) => string;
}

export interface AffiliateConfig {
  networkId: string;
  affiliateId: string;
  subId?: string;
  enabled: boolean;
}

class UniversalAffiliateSystem {
  private networks: Map<string, AffiliateNetwork> = new Map();
  private configs: Map<string, AffiliateConfig> = new Map();

  constructor() {
    this.initializeNetworks();
  }

  /**
   * Initialize all supported affiliate networks
   */
  private initializeNetworks(): void {
    // Amazon Associates
    this.networks.set('amazon', {
      id: 'amazon',
      name: 'Amazon Associates',
      urlPatterns: [
        'amazon.com',
        'amazon.in',
        'amazon.co.uk',
        'amazon.de',
        'amazon.fr',
        'amzn.to'
      ],
      tagParameter: 'tag',
      tagFormat: '?tag={affiliateId}',
      validation: /^[a-zA-Z0-9-]{1,20}$/
    });

    // CueLinks
    this.networks.set('cuelinks', {
      id: 'cuelinks',
      name: 'CueLinks',
      urlPatterns: [
        'cuelinks.com',
        'clnk.in'
      ],
      tagParameter: 'subid',
      tagFormat: '&subid={affiliateId}',
      validation: /^[a-zA-Z0-9_-]{1,50}$/
    });

    // Commission Junction (CJ Affiliate)
    this.networks.set('cj', {
      id: 'cj',
      name: 'Commission Junction',
      urlPatterns: [
        'cj.com',
        'commission-junction.com',
        'anrdoezrs.net',
        'dpbolvw.net',
        'jdoqocy.com'
      ],
      tagParameter: 'sid',
      tagFormat: '&sid={affiliateId}',
      validation: /^[0-9]{1,20}$/
    });

    // ShareASale
    this.networks.set('shareasale', {
      id: 'shareasale',
      name: 'ShareASale',
      urlPatterns: [
        'shareasale.com',
        'shareapic.net'
      ],
      tagParameter: 'afftrack',
      tagFormat: '&afftrack={affiliateId}',
      validation: /^[a-zA-Z0-9_-]{1,50}$/
    });

    // Impact Radius
    this.networks.set('impact', {
      id: 'impact',
      name: 'Impact Radius',
      urlPatterns: [
        'impact.com',
        'impactradius.com'
      ],
      tagParameter: 'clickid',
      tagFormat: '&clickid={affiliateId}',
      validation: /^[a-zA-Z0-9_-]{1,50}$/
    });

    // ClickBank
    this.networks.set('clickbank', {
      id: 'clickbank',
      name: 'ClickBank',
      urlPatterns: [
        'clickbank.net',
        'cb-analytics.com'
      ],
      tagParameter: 'tid',
      tagFormat: '?tid={affiliateId}',
      validation: /^[a-zA-Z0-9]{1,20}$/
    });

    // Flipkart Affiliate
    this.networks.set('flipkart', {
      id: 'flipkart',
      name: 'Flipkart Affiliate',
      urlPatterns: [
        'flipkart.com',
        'fkrt.it'
      ],
      tagParameter: 'affid',
      tagFormat: '&affid={affiliateId}',
      validation: /^[a-zA-Z0-9]{1,20}$/
    });

    // Generic/Custom Network
    this.networks.set('custom', {
      id: 'custom',
      name: 'Custom Network',
      urlPatterns: ['*'],
      tagParameter: 'ref',
      tagFormat: '?ref={affiliateId}',
      validation: /^[a-zA-Z0-9_-]{1,50}$/
    });
  }

  /**
   * Detect affiliate network from URL
   */
  detectNetwork(url: string): AffiliateNetwork | null {
    const lowerUrl = url.toLowerCase();
    
    for (const [networkId, network] of this.networks.entries()) {
      if (networkId === 'custom') continue; // Skip custom for auto-detection
      
      for (const pattern of network.urlPatterns) {
        if (lowerUrl.includes(pattern.toLowerCase())) {
          console.log(`Search Detected affiliate network: ${network.name} for URL: ${url}`);
          return network;
        }
      }
    }
    
    console.log(`Warning No specific network detected for URL: ${url}, using custom`);
    return this.networks.get('custom') || null;
  }

  /**
   * Build affiliate URL with proper tagging
   */
  buildAffiliateUrl(originalUrl: string, networkId?: string): string {
    try {
      // Detect network if not specified
      const network = networkId ? 
        this.networks.get(networkId) : 
        this.detectNetwork(originalUrl);
      
      if (!network) {
        console.log(`Error No network found for URL: ${originalUrl}`);
        return originalUrl;
      }

      // Get affiliate config for this network
      const config = this.configs.get(network.id);
      if (!config || !config.enabled || !config.affiliateId) {
        console.log(`Warning No active config for network: ${network.name}`);
        return originalUrl;
      }

      // Validate affiliate ID
      if (network.validation && !network.validation.test(config.affiliateId)) {
        console.log(`Error Invalid affiliate ID for ${network.name}: ${config.affiliateId}`);
        return originalUrl;
      }

      // Use custom builder if available
      if (network.customBuilder) {
        return network.customBuilder(originalUrl, config.affiliateId);
      }

      // Build URL with tag
      const tagString = network.tagFormat.replace('{affiliateId}', config.affiliateId);
      const separator = originalUrl.includes('?') ? '&' : '?';
      const affiliateUrl = originalUrl + (tagString.startsWith('?') ? tagString : separator + tagString.substring(1));
      
      console.log(`Success Built affiliate URL for ${network.name}: ${affiliateUrl}`);
      return affiliateUrl;
      
    } catch (error) {
      console.error(`Error Error building affiliate URL: ${error}`);
      return originalUrl;
    }
  }

  /**
   * Configure affiliate network
   */
  configureNetwork(networkId: string, affiliateId: string, enabled: boolean = true, subId?: string): boolean {
    const network = this.networks.get(networkId);
    if (!network) {
      console.log(`Error Unknown network: ${networkId}`);
      return false;
    }

    // Validate affiliate ID
    if (network.validation && !network.validation.test(affiliateId)) {
      console.log(`Error Invalid affiliate ID format for ${network.name}: ${affiliateId}`);
      return false;
    }

    this.configs.set(networkId, {
      networkId,
      affiliateId,
      subId,
      enabled
    });

    console.log(`Success Configured ${network.name} with ID: ${affiliateId}`);
    return true;
  }

  /**
   * Get all supported networks
   */
  getSupportedNetworks(): AffiliateNetwork[] {
    return Array.from(this.networks.values());
  }

  /**
   * Get network configuration
   */
  getNetworkConfig(networkId: string): AffiliateConfig | null {
    return this.configs.get(networkId) || null;
  }

  /**
   * Bulk process URLs with affiliate tags
   */
  bulkProcessUrls(urls: string[]): { original: string; affiliate: string; network: string }[] {
    console.log(`Refresh Bulk processing ${urls.length} URLs...`);
    
    return urls.map(url => {
      const network = this.detectNetwork(url);
      const affiliateUrl = this.buildAffiliateUrl(url);
      
      return {
        original: url,
        affiliate: affiliateUrl,
        network: network?.name || 'Unknown'
      };
    });
  }

  /**
   * Validate affiliate URL
   */
  validateAffiliateUrl(url: string): { isValid: boolean; network?: string; issues?: string[] } {
    const network = this.detectNetwork(url);
    const issues: string[] = [];
    
    if (!network) {
      issues.push('Network not detected');
      return { isValid: false, issues };
    }

    const config = this.configs.get(network.id);
    if (!config) {
      issues.push(`No configuration for ${network.name}`);
    }

    if (config && !config.enabled) {
      issues.push(`${network.name} is disabled`);
    }

    if (config && network.validation && !network.validation.test(config.affiliateId)) {
      issues.push(`Invalid affiliate ID format`);
    }

    // Check if URL contains the expected tag parameter
    if (config && !url.includes(network.tagParameter)) {
      issues.push(`Missing ${network.tagParameter} parameter`);
    }

    return {
      isValid: issues.length === 0,
      network: network.name,
      issues: issues.length > 0 ? issues : undefined
    };
  }
}

// Export singleton instance
export const affiliateSystem = new UniversalAffiliateSystem();
export { UniversalAffiliateSystem };