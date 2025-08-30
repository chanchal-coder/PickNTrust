import { CommissionRule } from './google-sheets-service';
import { URL } from 'url';

interface AffiliateConfig {
  amazon_tag: string;
  earnkaro_id: string;
  lemon_squeezy_code: string;
  cuelinks_token?: string;
}

interface ProcessedProduct {
  originalUrl: string;
  affiliateUrl: string;
  selectedProgram: string;
  commissionRate: string;
  merchantDomain: string;
  category: string;
  reasoning: string;
}

class AffiliateEngine {
  private config: AffiliateConfig;
  private commissionRules: CommissionRule[] = [];
  private linkRules: any[] = [];
  private lemonSqueezyAffiliates: any[] = [];
  private metaSettings: Record<string, string> = {};

  constructor(config: AffiliateConfig) {
    this.config = config;
  }

  // Update commission rules from commissions_config sheet
  updateCommissionRules(rules: CommissionRule[]) {
    this.commissionRules = rules.filter(rule => rule.active).sort((a, b) => {
      // Sort by priority (lower number = higher priority)
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      // Then by commission rate (higher = better)
      const rateA = parseFloat(a.commission_rate.replace('%', ''));
      const rateB = parseFloat(b.commission_rate.replace('%', ''));
      return rateB - rateA;
    });
    console.log(`🔄 Updated ${this.commissionRules.length} active commission rules`);
  }

  // Update link building templates from link_rules sheet
  updateLinkRules(rules: any[]) {
    this.linkRules = rules.filter(rule => rule.active);
    console.log(`🔗 Updated ${this.linkRules.length} active link building rules`);
  }

  // Update Lemon Squeezy affiliates from ls_affiliates sheet
  updateLemonSqueezyAffiliates(affiliates: any[]) {
    this.lemonSqueezyAffiliates = affiliates.filter(aff => aff.active);
    console.log(`🍋 Updated ${this.lemonSqueezyAffiliates.length} active Lemon Squeezy affiliates`);
  }

  // Update meta settings from meta sheet
  updateMetaSettings(settings: Record<string, string>) {
    this.metaSettings = settings;
    console.log(`⚙️ Updated ${Object.keys(settings).length} meta settings`);
  }

  // Legacy method for backward compatibility
  updateAffiliateCodes(codes: Record<string, string>) {
    // Convert to link rules format for compatibility
    console.log(`🔑 Legacy affiliate codes updated: ${Object.keys(codes).length}`);
  }

  // Legacy method for backward compatibility
  updateLemonSqueezySpecificCodes(codes: Record<string, string>) {
    // This is now handled by updateLemonSqueezyAffiliates
    console.log(`🍋 Legacy Lemon Squeezy codes updated: ${Object.keys(codes).length}`);
  }

  // Extract merchant domain from URL
  private extractMerchantDomain(url: string): string {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.hostname.replace('www.', '').toLowerCase();
    } catch (error) {
      console.error('❌ Invalid URL:', url);
      return '';
    }
  }

  // Check if pattern matches domain or category
  private matchesPattern(value: string, pattern: string): boolean {
    if (pattern === '*') return true;
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'), 'i');
      return regex.test(value);
    }
    return value.toLowerCase().includes(pattern.toLowerCase());
  }

  // Find best commission rule for product
  private findBestCommissionRule(merchantDomain: string, category: string): CommissionRule | null {
    // First, check for direct affiliate rules
    const directRules = this.commissionRules.filter(rule => 
      rule.direct_affiliate && 
      this.matchesPattern(merchantDomain, rule.merchant_pattern) &&
      this.matchesPattern(category, rule.category_pattern)
    );

    if (directRules.length > 0) {
      console.log(`🎯 Found direct affiliate rule for ${merchantDomain}`);
      return directRules[0];
    }

    // Then, find best commission rate among matching rules
    const matchingRules = this.commissionRules.filter(rule => 
      this.matchesPattern(merchantDomain, rule.merchant_pattern) &&
      this.matchesPattern(category, rule.category_pattern)
    );

    if (matchingRules.length === 0) {
      console.log(`⚠️ No commission rules found for ${merchantDomain} in ${category}`);
      return null;
    }

    // Sort by commission rate (highest first), then priority, then cookie days
    const bestRule = matchingRules.sort((a, b) => {
      const rateA = parseFloat(a.commission_rate.replace('%', ''));
      const rateB = parseFloat(b.commission_rate.replace('%', ''));
      
      if (rateA !== rateB) return rateB - rateA; // Higher commission first
      if (a.priority !== b.priority) return a.priority - b.priority; // Lower priority number first
      return b.cookie_days - a.cookie_days; // Longer cookie window first
    })[0];

    console.log(`💰 Best rule: ${bestRule.affiliate_program} (${bestRule.commission_rate})`);
    return bestRule;
  }

  // Generate affiliate link based on program
  private generateAffiliateLink(originalUrl: string, rule: CommissionRule): string {
    const merchantDomain = this.extractMerchantDomain(originalUrl);
    
    try {
      // Check for Lemon Squeezy specific codes first (from is_affiliate sheet)
      if (rule.affiliate_program.toLowerCase().includes('lemon') || 
          merchantDomain.includes('lemonsqueezy') || 
          merchantDomain.includes('revid.ai')) {
        const lemonCode = this.lemonSqueezySpecificCodes[merchantDomain];
        if (lemonCode) {
          return this.generateLemonSqueezyLinkWithCode(originalUrl, lemonCode);
        }
      }
      
      // Check if we have a general affiliate code for this domain
      const affiliateCode = this.affiliateCodes[merchantDomain];
      
      if (affiliateCode) {
        // Use the affiliate code from Google Sheets
        return this.generateLinkWithCode(originalUrl, affiliateCode, rule);
      }
      
      // Fallback to original logic
      switch (rule.affiliate_program.toLowerCase()) {
        case 'amazon_associates':
          return this.generateAmazonLink(originalUrl);
        
        case 'earnkaro':
          return this.generateEarnKaroLink(originalUrl);
        
        case 'lemon_squeezy':
          return this.generateLemonSqueezyLink(originalUrl);
        
        case 'cuelinks':
          return this.generateCuelinksLink(originalUrl);
        
        case 'deodap':
          return originalUrl; // Direct link for DeoDap
        
        default:
          // Use template URL if provided
          if (rule.template_url) {
            return rule.template_url
              .replace('{URL}', encodeURIComponent(originalUrl))
              .replace('{DOMAIN}', merchantDomain);
          }
          return originalUrl;
      }
    } catch (error) {
      console.error(`❌ Error generating ${rule.affiliate_program} link:`, error);
      return originalUrl;
    }
  }

  // Generate Lemon Squeezy link with specific code from is_affiliate sheet
  private generateLemonSqueezyLinkWithCode(originalUrl: string, affiliateCode: string): string {
    try {
      const parsedUrl = new URL(originalUrl);
      
      // Handle different Lemon Squeezy affiliate code formats
      if (affiliateCode.startsWith('?aff=')) {
        // Format: ?aff=bl2W8D
        parsedUrl.searchParams.set('aff', affiliateCode.replace('?aff=', ''));
      } else if (affiliateCode.includes('aff=')) {
        // Format: aff=bl2W8D
        parsedUrl.searchParams.set('aff', affiliateCode.split('aff=')[1]);
      } else {
        // Plain code: bl2W8D
        parsedUrl.searchParams.set('aff', affiliateCode);
      }
      
      console.log(`🍋 Generated Lemon Squeezy link with code ${affiliateCode}: ${parsedUrl.toString()}`);
      return parsedUrl.toString();
    } catch (error) {
      console.error('❌ Error generating Lemon Squeezy link with specific code:', error);
      return originalUrl;
    }
  }

  // Generate link using affiliate code from Google Sheets
  private generateLinkWithCode(originalUrl: string, affiliateCode: string, rule: CommissionRule): string {
    const merchantDomain = this.extractMerchantDomain(originalUrl);
    
    // Handle different affiliate code formats
    if (affiliateCode.includes('?aff=')) {
      // Lemon Squeezy format: bl2W8D -> ?aff=bl2W8D
      const parsedUrl = new URL(originalUrl);
      parsedUrl.searchParams.set('aff', affiliateCode.replace('?aff=', ''));
      return parsedUrl.toString();
    } else if (merchantDomain.includes('amazon')) {
      // Amazon format: use as tag parameter
      return this.generateAmazonLinkWithTag(originalUrl, affiliateCode);
    } else if (affiliateCode.match(/^\d+$/)) {
      // Numeric code (EarnKaro format)
      return `https://earnkaro.com/api/redirect?id=${affiliateCode}&url=${encodeURIComponent(originalUrl)}`;
    } else {
      // Generic format: append as parameter
      const parsedUrl = new URL(originalUrl);
      parsedUrl.searchParams.set('ref', affiliateCode);
      return parsedUrl.toString();
    }
  }

  // Generate Amazon link with custom tag
  private generateAmazonLinkWithTag(url: string, tag: string): string {
    try {
      const parsedUrl = new URL(url);
      
      // Extract ASIN from various Amazon URL formats
      let asin = '';
      const pathParts = parsedUrl.pathname.split('/');
      
      const dpIndex = pathParts.indexOf('dp');
      const productIndex = pathParts.indexOf('product');
      
      if (dpIndex !== -1 && pathParts[dpIndex + 1]) {
        asin = pathParts[dpIndex + 1];
      } else if (productIndex !== -1 && pathParts[productIndex + 1]) {
        asin = pathParts[productIndex + 1];
      }
      
      if (asin) {
        return `https://amazon.com/dp/${asin}?tag=${tag}`;
      } else {
        // Fallback: add tag to existing URL
        parsedUrl.searchParams.set('tag', tag);
        return parsedUrl.toString();
      }
    } catch (error) {
      console.error('❌ Error generating Amazon link with custom tag:', error);
      return url;
    }
  }

  // Amazon Associates link generation
  private generateAmazonLink(url: string): string {
    try {
      const parsedUrl = new URL(url);
      
      // Extract ASIN from various Amazon URL formats
      let asin = '';
      const pathParts = parsedUrl.pathname.split('/');
      
      // Format: /dp/ASIN or /gp/product/ASIN
      const dpIndex = pathParts.indexOf('dp');
      const productIndex = pathParts.indexOf('product');
      
      if (dpIndex !== -1 && pathParts[dpIndex + 1]) {
        asin = pathParts[dpIndex + 1];
      } else if (productIndex !== -1 && pathParts[productIndex + 1]) {
        asin = pathParts[productIndex + 1];
      }
      
      if (asin) {
        return `https://amazon.com/dp/${asin}?tag=${this.config.amazon_tag}`;
      } else {
        // Fallback: add tag to existing URL
        parsedUrl.searchParams.set('tag', this.config.amazon_tag);
        return parsedUrl.toString();
      }
    } catch (error) {
      console.error('❌ Error generating Amazon link:', error);
      return url;
    }
  }

  // EarnKaro link generation
  private generateEarnKaroLink(url: string): string {
    const baseUrl = 'https://earnkaro.com/api/redirect';
    return `${baseUrl}?id=${this.config.earnkaro_id}&url=${encodeURIComponent(url)}`;
  }

  // Lemon Squeezy link generation
  private generateLemonSqueezyLink(url: string): string {
    const parsedUrl = new URL(url);
    parsedUrl.searchParams.set('aff', this.config.lemon_squeezy_code);
    return parsedUrl.toString();
  }

  // Cuelinks link generation
  private generateCuelinksLink(url: string): string {
    if (!this.config.cuelinks_token) {
      console.warn('⚠️ Cuelinks token not configured');
      return url;
    }
    // Cuelinks API integration would go here
    return `https://linksredirect.com/?pub_id=${this.config.cuelinks_token}&url=${encodeURIComponent(url)}`;
  }

  // Main processing function
  processProduct(originalUrl: string, category: string): ProcessedProduct {
    const merchantDomain = this.extractMerchantDomain(originalUrl);
    
    if (!merchantDomain) {
      return {
        originalUrl,
        affiliateUrl: originalUrl,
        selectedProgram: 'none',
        commissionRate: '0%',
        merchantDomain: '',
        category,
        reasoning: 'Invalid URL format'
      };
    }

    const bestRule = this.findBestCommissionRule(merchantDomain, category);
    
    if (!bestRule) {
      return {
        originalUrl,
        affiliateUrl: originalUrl,
        selectedProgram: 'none',
        commissionRate: '0%',
        merchantDomain,
        category,
        reasoning: 'No matching commission rules found'
      };
    }

    const affiliateUrl = this.generateAffiliateLink(originalUrl, bestRule);
    
    const reasoning = bestRule.direct_affiliate 
      ? `Direct affiliate partnership with ${bestRule.affiliate_program}`
      : `Best rate: ${bestRule.commission_rate} (Priority: ${bestRule.priority}, Cookie: ${bestRule.cookie_days} days)`;

    return {
      originalUrl,
      affiliateUrl,
      selectedProgram: bestRule.affiliate_program,
      commissionRate: bestRule.commission_rate,
      merchantDomain,
      category,
      reasoning
    };
  }

  // Batch process multiple products
  processProducts(products: Array<{url: string, category: string}>): ProcessedProduct[] {
    console.log(`🔄 Processing ${products.length} products...`);
    
    const results = products.map(product => 
      this.processProduct(product.url, product.category)
    );

    const successful = results.filter(r => r.selectedProgram !== 'none').length;
    console.log(`✅ Successfully processed ${successful}/${products.length} products`);
    
    return results;
  }

  // Get statistics
  getStats(): any {
    const programStats = this.commissionRules.reduce((acc, rule) => {
      acc[rule.affiliate_program] = (acc[rule.affiliate_program] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRules: this.commissionRules.length,
      activeRules: this.commissionRules.filter(r => r.active).length,
      directAffiliateRules: this.commissionRules.filter(r => r.direct_affiliate).length,
      programDistribution: programStats,
      averageCommission: this.calculateAverageCommission()
    };
  }

  private calculateAverageCommission(): string {
    if (this.commissionRules.length === 0) return '0%';
    
    const total = this.commissionRules.reduce((sum, rule) => {
      return sum + parseFloat(rule.commission_rate.replace('%', ''));
    }, 0);
    
    return `${(total / this.commissionRules.length).toFixed(1)}%`;
  }
}

export default AffiliateEngine;
export { AffiliateConfig, ProcessedProduct };