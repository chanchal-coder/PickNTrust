/**
 * Enhanced Autoposting System
 * Implements robust error handling, data validation, and quality control
 * Prevents 400/403 errors and ensures high-quality posts
 */

import { Database } from 'better-sqlite3';
import fetch from 'node-fetch';
import { URL } from 'url';

// Quality scoring interface
interface QualityScore {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  shouldPost: boolean;
  issues: string[];
  fixes: string[];
}

// Product data interface
interface ProductData {
  title?: string;
  description?: string;
  price?: string | number;
  originalPrice?: string | number;
  imageUrl?: string;
  affiliateUrl?: string;
  category?: string;
  currency?: string;
  rating?: string | number;
  reviewCount?: string | number;
  source?: string;
  [key: string]: any;
}

// Validation result interface
interface ValidationResult {
  valid: boolean;
  reason?: string;
  suggestion?: string;
}

// Enhanced posting metrics
interface PostingMetrics {
  totalProcessed: number;
  posted: number;
  skipped: number;
  fixedAndPosted: number;
  qualityDistribution: { A: number; B: number; C: number; D: number };
  errorTypes: { [key: string]: number };
}

class EnhancedPostingSystem {
  private db: Database;
  private metrics: PostingMetrics;
  private defaultImage: string = '/assets/default-product.jpg';
  private validDomains: string[];

  constructor(database: Database) {
    this.db = database;
    this.metrics = {
      totalProcessed: 0,
      posted: 0,
      skipped: 0,
      fixedAndPosted: 0,
      qualityDistribution: { A: 0, B: 0, C: 0, D: 0 },
      errorTypes: {}
    };
    
    this.validDomains = [
      'amazon.in', 'amazon.com', 'amazon.co.uk',
      'flipkart.com',
      'clk.omgt5.com', // CueLinks
      'inrdeals.com',
      'makemytrip.com',
      'booking.com',
      'agoda.com',
      'goibibo.com',
      'cleartrip.com',
      'yatra.com',
      'myntra.com',
      'ajio.com',
      'nykaa.com'
    ];
  }

  /**
   * Main posting function with enhanced error handling
   */
  async smartPost(rawData: ProductData, botType: string): Promise<{ success: boolean; reason: string; quality?: QualityScore }> {
    console.log(`🔍 Processing ${botType} product: ${rawData.title?.substring(0, 50)}...`);
    
    try {
      this.metrics.totalProcessed++;
      
      // Step 1: Validate and fix data
      const validatedData = await this.validateAndFixData(rawData);
      
      // Step 2: Calculate quality score
      const quality = this.calculateQualityScore(validatedData);
      
      // Step 3: Decide whether to post
      const shouldPost = this.shouldPostProduct(quality);
      
      if (shouldPost.post) {
        // Step 4: Post with retry logic
        const postResult = await this.postWithRetry(validatedData, botType, 3);
        
        if (postResult.success) {
          this.metrics.posted++;
          this.metrics.qualityDistribution[quality.grade]++;
          
          if (quality.fixes.length > 0) {
            this.metrics.fixedAndPosted++;
          }
          
          console.log(`✅ Posted ${botType} product with quality grade: ${quality.grade}`);
          return { success: true, reason: shouldPost.reason, quality };
        } else {
          this.metrics.skipped++;
          this.recordError(postResult.error || 'Unknown posting error');
          console.log(`❌ Failed to post ${botType} product: ${postResult.error}`);
          return { success: false, reason: postResult.error || 'Posting failed', quality };
        }
      } else {
        this.metrics.skipped++;
        this.metrics.qualityDistribution[quality.grade]++;
        console.log(`⏭️ Skipped ${botType} product: ${shouldPost.reason}`);
        return { success: false, reason: shouldPost.reason, quality };
      }
      
    } catch (error) {
      this.metrics.skipped++;
      this.recordError(error.message);
      console.error(`💥 Critical error processing ${botType} product:`, error);
      return { success: false, reason: `Critical error: ${error.message}` };
    }
  }

  /**
   * Comprehensive data validation and fixing
   */
  private async validateAndFixData(data: ProductData): Promise<ProductData> {
    const fixed = { ...data };
    
    // Fix title
    if (!fixed.title || fixed.title.length < 5) {
      fixed.title = this.generateTitle(fixed) || 'Special Deal';
    } else {
      fixed.title = this.cleanTitle(fixed.title);
    }
    
    // Fix description
    if (!fixed.description || fixed.description.length < 10) {
      fixed.description = this.generateDescription(fixed.title, fixed.category);
    } else {
      fixed.description = this.cleanDescription(fixed.description);
    }
    
    // Fix price
    if (fixed.price) {
      fixed.price = this.formatPrice(fixed.price);
    } else {
      fixed.price = 'See website';
    }
    
    // Fix original price
    if (fixed.originalPrice) {
      fixed.originalPrice = this.formatPrice(fixed.originalPrice);
    }
    
    // Fix and validate image
    const imageResult = await this.validateAndFixImage(fixed.imageUrl, fixed.title, fixed.category);
    fixed.imageUrl = imageResult.url;
    fixed.imageSource = imageResult.source;
    
    // Validate and fix affiliate URL
    const affiliateResult = this.validateAndFixAffiliateUrl(fixed.affiliateUrl);
    fixed.affiliateUrl = affiliateResult.url;
    fixed.affiliateValid = affiliateResult.valid;
    
    // Set defaults for missing fields
    fixed.currency = fixed.currency || 'INR';
    fixed.category = fixed.category || 'General';
    fixed.rating = fixed.rating || 0;
    fixed.reviewCount = fixed.reviewCount || 0;
    
    return fixed;
  }

  /**
   * Image validation and fixing with fallbacks
   */
  private async validateAndFixImage(imageUrl: string, productTitle: string, category: string): Promise<{ url: string; source: string }> {
    // Step 1: Check if original image is valid
    if (imageUrl && await this.isImageAccessible(imageUrl)) {
      return { url: imageUrl, source: 'original' };
    }
    
    // Step 2: Try to find alternative image
    console.log(`⚠️ Image issue with: ${imageUrl}. Searching alternatives...`);
    
    // Option A: Search for product image by title (if implemented)
    // const alternativeImage = await this.searchProductImage(productTitle);
    // if (alternativeImage) {
    //   return { url: alternativeImage, source: 'alternative' };
    // }
    
    // Option B: Use category-specific placeholder
    const categoryImage = this.getCategoryPlaceholder(category);
    return { url: categoryImage, source: 'placeholder' };
  }

  /**
   * Check if image URL is accessible
   */
  private async isImageAccessible(imageUrl: string): Promise<boolean> {
    try {
      if (!imageUrl || !imageUrl.startsWith('http')) {
        return false;
      }
      
      const response = await fetch(imageUrl, { 
        method: 'HEAD', 
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (response.status !== 200) {
        return false;
      }
      
      const contentType = response.headers.get('content-type');
      return contentType?.startsWith('image/') || false;
      
    } catch (error) {
      console.log(`Image check failed for ${imageUrl}: ${error.message}`);
      return false;
    }
  }

  /**
   * Get category-specific placeholder image
   */
  private getCategoryPlaceholder(category: string): string {
    const placeholders = {
      'electronics': '/assets/placeholders/electronics.jpg',
      'fashion': '/assets/placeholders/fashion.jpg',
      'home': '/assets/placeholders/home.jpg',
      'books': '/assets/placeholders/books.jpg',
      'travel': '/assets/placeholders/travel.jpg',
      'food': '/assets/placeholders/food.jpg',
      'beauty': '/assets/placeholders/beauty.jpg',
      'sports': '/assets/placeholders/sports.jpg',
      'default': '/assets/placeholders/default.jpg'
    };
    
    const categoryKey = category?.toLowerCase() || 'default';
    return placeholders[categoryKey] || placeholders.default;
  }

  /**
   * Validate and fix affiliate URL
   */
  private validateAndFixAffiliateUrl(url: string): { url: string; valid: boolean; domain?: string } {
    if (!url) {
      return { url: '', valid: false };
    }
    
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');
      
      // Check if domain is in whitelist
      const isValidDomain = this.validDomains.some(validDomain => 
        domain.includes(validDomain)
      );
      
      return {
        url: url,
        valid: isValidDomain,
        domain: domain
      };
    } catch (error) {
      console.log(`Invalid URL format: ${url}`);
      return { url: '', valid: false };
    }
  }

  /**
   * Calculate product quality score
   */
  private calculateQualityScore(data: ProductData): QualityScore {
    let score = 0;
    const issues: string[] = [];
    const fixes: string[] = [];
    
    // Title scoring (20 points)
    if (data.title && data.title.length > 10) {
      score += 20;
    } else if (data.title && data.title.length > 5) {
      score += 10;
      issues.push('Title too short');
    } else {
      issues.push('Missing or very short title');
    }
    
    // Description scoring (15 points)
    if (data.description && data.description.length > 50) {
      score += 15;
    } else if (data.description && data.description.length > 20) {
      score += 8;
      issues.push('Description too short');
    } else {
      issues.push('Missing or very short description');
      if (data.description !== this.generateDescription(data.title, data.category)) {
        fixes.push('Generated description');
      }
    }
    
    // Price scoring (20 points)
    if (data.price && data.price !== 'See website' && !isNaN(parseFloat(String(data.price)))) {
      score += 20;
    } else if (data.price) {
      score += 10;
      issues.push('Price format unclear');
    } else {
      issues.push('Missing price');
    }
    
    // Image scoring (25 points)
    if (data.imageSource === 'original') {
      score += 25;
    } else if (data.imageSource === 'alternative') {
      score += 20;
      fixes.push('Found alternative image');
    } else if (data.imageSource === 'placeholder') {
      score += 10;
      fixes.push('Used placeholder image');
    } else {
      issues.push('No valid image');
    }
    
    // Affiliate URL scoring (20 points)
    if (data.affiliateValid && data.affiliateUrl) {
      score += 20;
    } else if (data.affiliateUrl) {
      score += 15;
      issues.push('Affiliate URL from unknown domain');
    } else {
      issues.push('Missing affiliate URL');
    }
    
    // Determine grade and posting decision
    let grade: 'A' | 'B' | 'C' | 'D';
    let shouldPost: boolean;
    
    if (score >= 80) {
      grade = 'A';
      shouldPost = true;
    } else if (score >= 60) {
      grade = 'B';
      shouldPost = true;
    } else if (score >= 40) {
      grade = 'C';
      shouldPost = data.title && data.affiliateUrl ? true : false;
    } else {
      grade = 'D';
      shouldPost = false;
    }
    
    return {
      score,
      grade,
      shouldPost,
      issues,
      fixes
    };
  }

  /**
   * Decide whether to post product based on quality
   */
  private shouldPostProduct(quality: QualityScore): { post: boolean; reason: string } {
    if (quality.grade === 'A') {
      return { post: true, reason: 'High quality product' };
    }
    
    if (quality.grade === 'B') {
      return { post: true, reason: 'Good quality after fixes' };
    }
    
    if (quality.grade === 'C') {
      return { 
        post: quality.shouldPost, 
        reason: quality.shouldPost ? 'Acceptable with critical data' : 'Missing critical data' 
      };
    }
    
    return { post: false, reason: 'Quality too low for posting' };
  }

  /**
   * Post with retry logic and comprehensive error handling
   */
  private async postWithRetry(data: ProductData, botType: string, maxRetries: number = 3): Promise<{ success: boolean; error?: string }> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📤 Posting attempt ${attempt}/${maxRetries} for ${botType}`);
        
        // Sanitize data for API
        const sanitizedData = this.sanitizeForAPI(data, botType);
        
        // Log the payload for debugging
        console.log(`📋 Payload:`, JSON.stringify(sanitizedData, null, 2));
        
        // Make the API call
        const response = await fetch('http://localhost:5000/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Enhanced-Bot-System/1.0'
          },
          body: JSON.stringify(sanitizedData),
          timeout: 10000
        });
        
        if (response.ok) {
          const result = await response.json() as any;
          console.log(`✅ Successfully posted to ${botType} on attempt ${attempt}`);
          return { success: true };
        } else {
          const errorText = await response.text();
          console.log(`❌ HTTP ${response.status} on attempt ${attempt}: ${errorText}`);
          
          // Don't retry on certain errors
          if (response.status === 401 || response.status === 403) {
            return { success: false, error: `Authentication error: ${response.status}` };
          }
          
          // For 400 errors, try to fix and retry
          if (response.status === 400 && attempt < maxRetries) {
            console.log(`🔧 Attempting to fix 400 error and retry...`);
            data = await this.fixBadRequestData(data, errorText);
            continue;
          }
          
          if (attempt === maxRetries) {
            return { success: false, error: `HTTP ${response.status}: ${errorText}` };
          }
        }
        
      } catch (error) {
        console.log(`💥 Network error on attempt ${attempt}: ${error.message}`);
        
        if (attempt === maxRetries) {
          return { success: false, error: `Network error: ${error.message}` };
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    return { success: false, error: 'Max retries exceeded' };
  }

  /**
   * Sanitize data for API posting
   */
  private sanitizeForAPI(data: ProductData, botType: string): any {
    return {
      name: data.title || 'Special Deal',
      description: data.description || 'Check website for details',
      price: String(data.price || 'See website'),
      originalPrice: data.originalPrice ? String(data.originalPrice) : null,
      currency: data.currency || 'INR',
      imageUrl: data.imageUrl || this.defaultImage,
      affiliateUrl: data.affiliateUrl || '',
      category: data.category || 'General',
      rating: Number(data.rating) || 0,
      reviewCount: Number(data.reviewCount) || 0,
      source: botType,
      displayPages: [botType],
      processingStatus: 'active',
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Fix data based on 400 error response
   */
  private async fixBadRequestData(data: ProductData, errorMessage: string): Promise<ProductData> {
    const fixed = { ...data };
    
    // Common 400 error fixes
    if (errorMessage.includes('title') || errorMessage.includes('name')) {
      fixed.title = this.cleanTitle(fixed.title) || 'Special Deal';
    }
    
    if (errorMessage.includes('price')) {
      fixed.price = this.formatPrice(fixed.price) || 'See website';
    }
    
    if (errorMessage.includes('image')) {
      fixed.imageUrl = this.getCategoryPlaceholder(fixed.category);
    }
    
    if (errorMessage.includes('url') || errorMessage.includes('affiliate')) {
      // Remove problematic characters from URL
      if (fixed.affiliateUrl) {
        fixed.affiliateUrl = fixed.affiliateUrl.replace(/[^\w\-\.\~\:\/\?\#\[\]\@\!\$\&\'\(\)\*\+\,\;\=]/g, '');
      }
    }
    
    return fixed;
  }

  /**
   * Utility functions for data cleaning
   */
  private cleanTitle(title: string): string {
    if (!title) return '';
    return title
      .replace(/[^\w\s\-\.\,\(\)]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim()
      .substring(0, 200); // Limit length
  }

  private cleanDescription(description: string): string {
    if (!description) return '';
    return description
      .replace(/[^\w\s\-\.\,\(\)\!\?]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim()
      .substring(0, 500); // Limit length
  }

  private formatPrice(price: string | number): string {
    if (!price) return 'See website';
    
    const numPrice = parseFloat(String(price).replace(/[^\d\.]/g, ''));
    if (isNaN(numPrice)) return 'See website';
    
    return numPrice.toFixed(2);
  }

  private generateTitle(data: ProductData): string {
    if (data.category) {
      return `Special ${data.category} Deal`;
    }
    return 'Special Deal';
  }

  private generateDescription(title: string, category: string): string {
    const templates = [
      `Check out this amazing ${category || 'product'} deal!`,
      `Great ${category || 'product'} at an excellent price.`,
      `Don't miss this ${category || 'product'} offer.`,
      `Quality ${category || 'product'} with great value.`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Record error for metrics
   */
  private recordError(error: string): void {
    const errorType = error.split(':')[0] || 'Unknown';
    this.metrics.errorTypes[errorType] = (this.metrics.errorTypes[errorType] || 0) + 1;
  }

  /**
   * Get posting statistics
   */
  public getStats(): any {
    const total = this.metrics.totalProcessed;
    if (total === 0) return { message: 'No products processed yet' };
    
    return {
      totalProcessed: total,
      posted: this.metrics.posted,
      skipped: this.metrics.skipped,
      successRate: ((this.metrics.posted / total) * 100).toFixed(1) + '%',
      qualityRate: (((this.metrics.qualityDistribution.A + this.metrics.qualityDistribution.B) / total) * 100).toFixed(1) + '%',
      fixRate: this.metrics.posted > 0 ? ((this.metrics.fixedAndPosted / this.metrics.posted) * 100).toFixed(1) + '%' : '0%',
      qualityDistribution: this.metrics.qualityDistribution,
      topErrors: Object.entries(this.metrics.errorTypes)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([error, count]) => ({ error, count }))
    };
  }

  /**
   * Reset metrics
   */
  public resetStats(): void {
    this.metrics = {
      totalProcessed: 0,
      posted: 0,
      skipped: 0,
      fixedAndPosted: 0,
      qualityDistribution: { A: 0, B: 0, C: 0, D: 0 },
      errorTypes: {}
    };
  }
}

export default EnhancedPostingSystem;
export type { ProductData, QualityScore };