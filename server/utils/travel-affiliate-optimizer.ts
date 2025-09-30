// Travel Affiliate Optimization System
// Optimizes affiliate links and commission rates for maximum revenue

import fs from 'fs';
import path from 'path';

// Load travel picks configuration
const configPath = path.join(process.cwd(), 'travel-picks-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

export interface AffiliatePartner {
  name: string;
  commission: string;
  categories: string[];
  baseUrl?: string;
  affiliateId?: string;
  trackingParam?: string;
  priority?: number;
}

export interface OptimizationResult {
  originalUrl: string;
  optimizedUrl: string;
  selectedPartner: string;
  estimatedCommission: number;
  commissionRate: number;
  confidence: number;
}

class TravelAffiliateOptimizer {
  private partners: { [key: string]: AffiliatePartner };
  private userAffiliateIds: { [key: string]: string } = {};

  constructor() {
    this.partners = config.affiliatePartners;
    this.loadUserAffiliateIds();
  }

  private loadUserAffiliateIds() {
    // Load user's affiliate IDs from environment or config
    this.userAffiliateIds = {
      makemytrip: process.env.MAKEMYTRIP_AFFILIATE_ID || 'your_mmt_id',
      booking: process.env.BOOKING_AFFILIATE_ID || 'your_booking_id',
      redbus: process.env.REDBUS_AFFILIATE_ID || 'your_redbus_id',
      irctc: process.env.IRCTC_AFFILIATE_ID || 'your_irctc_id',
      goibibo: process.env.GOIBIBO_AFFILIATE_ID || 'your_goibibo_id',
      cleartrip: process.env.CLEARTRIP_AFFILIATE_ID || 'your_cleartrip_id',
      yatra: process.env.YATRA_AFFILIATE_ID || 'your_yatra_id'
    };
  }

  /**
   * Optimize affiliate URL for maximum commission
   */
  public optimizeUrl(originalUrl: string, subcategory: string, dealValue: number = 0): OptimizationResult {
    try {
      // Detect current partner from URL
      const currentPartner = this.detectPartnerFromUrl(originalUrl);
      
      // Find best partner for this subcategory
      const bestPartner = this.findBestPartner(subcategory, dealValue);
      
      // If current partner is already the best, just add tracking
      if (currentPartner === bestPartner.key) {
        return {
          originalUrl,
          optimizedUrl: this.addTrackingToUrl(originalUrl, bestPartner.key),
          selectedPartner: bestPartner.partner.name,
          estimatedCommission: this.calculateCommission(dealValue, bestPartner.partner.commission),
          commissionRate: this.parseCommissionRate(bestPartner.partner.commission),
          confidence: 0.9
        };
      }

      // Convert to better partner if possible
      const convertedUrl = this.convertToBetterPartner(originalUrl, bestPartner.key, subcategory);
      
      return {
        originalUrl,
        optimizedUrl: convertedUrl,
        selectedPartner: bestPartner.partner.name,
        estimatedCommission: this.calculateCommission(dealValue, bestPartner.partner.commission),
        commissionRate: this.parseCommissionRate(bestPartner.partner.commission),
        confidence: convertedUrl !== originalUrl ? 0.8 : 0.6
      };
    } catch (error) {
      console.error('Error optimizing affiliate URL:', error);
      return {
        originalUrl,
        optimizedUrl: originalUrl,
        selectedPartner: 'Unknown',
        estimatedCommission: 0,
        commissionRate: 0,
        confidence: 0.1
      };
    }
  }

  /**
   * Detect partner from URL domain
   */
  private detectPartnerFromUrl(url: string): string | null {
    const domain = this.extractDomain(url);
    
    const partnerMappings: { [key: string]: string } = {
      'makemytrip.com': 'makemytrip',
      'booking.com': 'booking',
      'redbus.in': 'redbus',
      'irctc.co.in': 'irctc',
      'goibibo.com': 'goibibo',
      'cleartrip.com': 'cleartrip',
      'yatra.com': 'yatra'
    };

    for (const [domainPattern, partner] of Object.entries(partnerMappings)) {
      if (domain.includes(domainPattern)) {
        return partner;
      }
    }

    return null;
  }

  /**
   * Find the best partner for given subcategory and deal value
   */
  private findBestPartner(subcategory: string, dealValue: number): { key: string; partner: AffiliatePartner } {
    const eligiblePartners = Object.entries(this.partners)
      .filter(([_, partner]) => 
        partner.categories.includes(subcategory.toLowerCase()) ||
        partner.categories.includes('all')
      )
      .map(([key, partner]) => ({
        key,
        partner,
        score: this.calculatePartnerScore(partner, dealValue)
      }))
      .sort((a, b) => b.score - a.score);

    if (eligiblePartners.length === 0) {
      // Fallback to highest commission partner
      const fallback = Object.entries(this.partners)
        .sort((a, b) => 
          this.parseCommissionRate(b[1].commission) - this.parseCommissionRate(a[1].commission)
        )[0];
      
      return { key: fallback[0], partner: fallback[1] };
    }

    return { key: eligiblePartners[0].key, partner: eligiblePartners[0].partner };
  }

  /**
   * Calculate partner score based on commission rate and other factors
   */
  private calculatePartnerScore(partner: AffiliatePartner, dealValue: number): number {
    const commissionRate = this.parseCommissionRate(partner.commission);
    const priority = partner.priority || 1;
    
    // Base score from commission rate
    let score = commissionRate * 10;
    
    // Bonus for higher priority partners
    score += priority * 2;
    
    // Bonus for higher deal values (better partners for expensive deals)
    if (dealValue > 10000) {
      score += 5;
    } else if (dealValue > 5000) {
      score += 2;
    }
    
    return score;
  }

  /**
   * Parse commission rate from string (e.g., "2-4%" -> 4)
   */
  private parseCommissionRate(commissionStr: string): number {
    const match = commissionStr.match(/([0-9.]+)%?$/); // Get the last number
    return match ? parseFloat(match[1]) : 0;
  }

  /**
   * Calculate estimated commission
   */
  private calculateCommission(dealValue: number, commissionStr: string): number {
    const rate = this.parseCommissionRate(commissionStr) / 100;
    return Math.round(dealValue * rate);
  }

  /**
   * Add tracking parameters to existing URL
   */
  private addTrackingToUrl(url: string, partnerKey: string): string {
    const affiliateId = this.userAffiliateIds[partnerKey];
    if (!affiliateId) return url;

    const separator = url.includes('?') ? '&' : '?';
    const trackingParams = this.getTrackingParams(partnerKey, affiliateId);
    
    return `${url}${separator}${trackingParams}`;
  }

  /**
   * Get tracking parameters for specific partner
   */
  private getTrackingParams(partnerKey: string, affiliateId: string): string {
    const trackingMappings: { [key: string]: string } = {
      makemytrip: `affiliate_id=${affiliateId}&source=travelpicks`,
      booking: `aid=${affiliateId}&label=travelpicks`,
      redbus: `affiliate=${affiliateId}&source=travelpicks`,
      irctc: `partner=${affiliateId}&ref=travelpicks`,
      goibibo: `aff=${affiliateId}&source=travelpicks`,
      cleartrip: `affiliate_id=${affiliateId}&source=travelpicks`,
      yatra: `affid=${affiliateId}&source=travelpicks`
    };

    return trackingMappings[partnerKey] || `ref=${affiliateId}&source=travelpicks`;
  }

  /**
   * Convert URL to better partner (if possible)
   */
  private convertToBetterPartner(originalUrl: string, targetPartner: string, subcategory: string): string {
    // This is a complex operation that would require:
    // 1. Extracting deal details from original URL
    // 2. Searching for same deal on target partner
    // 3. Returning the target partner URL
    
    // For now, we'll create a redirect URL through our system
    const encodedUrl = encodeURIComponent(originalUrl);
    return `https://your-domain.com/redirect/${targetPartner}?url=${encodedUrl}&category=${subcategory}&ref=travelpicks`;
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.toLowerCase();
    } catch {
      return '';
    }
  }

  /**
   * Get commission comparison for multiple partners
   */
  public getCommissionComparison(subcategory: string, dealValue: number): Array<{
    partner: string;
    commission: number;
    rate: number;
    eligible: boolean;
  }> {
    return Object.entries(this.partners).map(([key, partner]) => {
      const eligible = partner.categories.includes(subcategory.toLowerCase()) || 
                      partner.categories.includes('all');
      const rate = this.parseCommissionRate(partner.commission);
      const commission = this.calculateCommission(dealValue, partner.commission);
      
      return {
        partner: partner.name,
        commission,
        rate,
        eligible
      };
    }).sort((a, b) => b.commission - a.commission);
  }

  /**
   * Get performance analytics
   */
  public getPerformanceAnalytics(): {
    totalPartners: number;
    avgCommissionRate: number;
    bestPartners: Array<{ name: string; rate: number; categories: string[] }>;
  } {
    const partners = Object.values(this.partners);
    const totalPartners = partners.length;
    const avgCommissionRate = partners.reduce((sum, p) => 
      sum + this.parseCommissionRate(p.commission), 0
    ) / totalPartners;
    
    const bestPartners = partners
      .map(p => ({
        name: p.name,
        rate: this.parseCommissionRate(p.commission),
        categories: p.categories
      }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 3);

    return {
      totalPartners,
      avgCommissionRate: Math.round(avgCommissionRate * 100) / 100,
      bestPartners
    };
  }
}

// Export singleton instance
export const travelAffiliateOptimizer = new TravelAffiliateOptimizer();

// Export utility functions
export function optimizeTravelUrl(url: string, subcategory: string, dealValue: number = 0): OptimizationResult {
  return travelAffiliateOptimizer.optimizeUrl(url, subcategory, dealValue);
}

export function getTravelCommissionComparison(subcategory: string, dealValue: number) {
  return travelAffiliateOptimizer.getCommissionComparison(subcategory, dealValue);
}

export function getTravelAffiliateAnalytics() {
  return travelAffiliateOptimizer.getPerformanceAnalytics();
}