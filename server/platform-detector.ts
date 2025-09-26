// Platform Detection Engine
// Identifies e-commerce platforms and extracts product information

import { ResolvedURL } from './universal-url-resolver.js';

interface PlatformInfo {
  platform: string;
  platformName: string;
  productId?: string;
  category?: string;
  isSupported: boolean;
  scrapingStrategy: 'direct' | 'api' | 'generic';
  affiliateSupport: boolean;
  selectors?: ProductSelectors;
}

interface ProductSelectors {
  title: string[];
  price: string[];
  originalPrice?: string[];
  image: string[];
  description?: string[];
  rating?: string[];
  reviewCount?: string[];
  availability?: string[];
  brand?: string[];
}

class PlatformDetector {
  private platformConfigs: Map<string, PlatformInfo> = new Map();

  constructor() {
    this.initializePlatformConfigs();
  }

  /**
   * Initialize platform-specific configurations
   */
  private initializePlatformConfigs(): void {
    // Amazon Configuration
    this.platformConfigs.set('amazon', {
      platform: 'amazon',
      platformName: 'Amazon',
      isSupported: true,
      scrapingStrategy: 'direct',
      affiliateSupport: true,
      selectors: {
        title: ['#productTitle', '.product-title', 'h1.a-size-large'],
        price: ['#priceblock_dealprice', '#priceblock_ourprice', '.a-price-whole', '.a-offscreen'],
        originalPrice: ['#priceblock_listprice', '.a-price.a-text-price .a-offscreen'],
        image: ['#landingImage', '#imgBlkFront', '.a-dynamic-image'],
        description: ['#feature-bullets ul', '#productDescription', '.a-unordered-list'],
        rating: ['#acrPopover', '.a-icon-alt', '[data-hook="average-star-rating"]'],
        reviewCount: ['#acrCustomerReviewText', '[data-hook="total-review-count"]'],
        availability: ['#availability span', '.a-color-success', '.a-color-state'],
        brand: ['#bylineInfo', '.a-brand', '[data-attribute="brand"]']
      }
    });

    // Flipkart Configuration
    this.platformConfigs.set('flipkart', {
      platform: 'flipkart',
      platformName: 'Flipkart',
      isSupported: true,
      scrapingStrategy: 'direct',
      affiliateSupport: true,
      selectors: {
        title: ['.B_NuCI', '._35KyD6', '.x2Jnpn'],
        price: ['._1_WHN1', '._3I9_wc', '._25b18c'],
        originalPrice: ['._3I9_wc', '._2Rrgu5'],
        image: ['._396cs4', '._2r_T1I', '.CXW8mj img'],
        description: ['._1mXcCf', '._3WHvuP', '.IRJbn8'],
        rating: ['.hGSR34', '._3LWZlK', '.XQDdHH'],
        reviewCount: ['.Wphh3N', '._2_R_DZ', '._13vcmD'],
        availability: ['._16FRp0', '.Bz112c', '._2aK_gu'],
        brand: ['.G6XhBx', '._2WkVRV', '.aMaAEs']
      }
    });

    // Myntra Configuration
    this.platformConfigs.set('myntra', {
      platform: 'myntra',
      platformName: 'Myntra',
      isSupported: true,
      scrapingStrategy: 'direct',
      affiliateSupport: true,
      selectors: {
        title: ['.pdp-name', '.pdp-product-name', 'h1.pdp-name'],
        price: ['.pdp-price', '.pdp-price strong', '.pdp-mrp'],
        originalPrice: ['.pdp-mrp', '.pdp-discount-price'],
        image: ['.image-grid-image', '.pdp-img', '.product-image'],
        description: ['.pdp-product-description-content', '.product-description'],
        rating: ['.index-overallRating', '.pdp-rating'],
        reviewCount: ['.index-ratingsCount', '.pdp-rating-count'],
        brand: ['.pdp-title', '.brand-name']
      }
    });

    // Nykaa Configuration
    this.platformConfigs.set('nykaa', {
      platform: 'nykaa',
      platformName: 'Nykaa',
      isSupported: true,
      scrapingStrategy: 'direct',
      affiliateSupport: true,
      selectors: {
        title: ['.product-title', '.css-1gc4x7i', 'h1'],
        price: ['.css-1d1r2g4', '.product-price', '.price'],
        originalPrice: ['.css-1jczs19', '.original-price', '.mrp'],
        image: ['.css-11gn9r6 img', '.product-image', '.main-image'],
        description: ['.css-1qg4r5c', '.product-description'],
        rating: ['.css-4qxrld', '.rating'],
        reviewCount: ['.css-1hwfws3', '.review-count'],
        brand: ['.css-1gc4x7i', '.brand-name']
      }
    });

    // Boat Lifestyle Configuration
    this.platformConfigs.set('boat', {
      platform: 'boat',
      platformName: 'Boat Lifestyle',
      isSupported: true,
      scrapingStrategy: 'direct',
      affiliateSupport: true,
      selectors: {
        title: ['.product-title', 'h1.product__title', '.product-name'],
        price: ['.price', '.product-price', '.current-price'],
        originalPrice: ['.compare-at-price', '.original-price', '.was-price'],
        image: ['.product-image img', '.product__media img', '.main-image'],
        description: ['.product-description', '.product__description', '.rte'],
        brand: ['Boat']
      }
    });

    // Mamaearth Configuration
    this.platformConfigs.set('mamaearth', {
      platform: 'mamaearth',
      platformName: 'Mamaearth',
      isSupported: true,
      scrapingStrategy: 'direct',
      affiliateSupport: true,
      selectors: {
        title: ['.product-title', 'h1.product__title', '.product-name'],
        price: ['.price', '.product-price', '.current-price'],
        originalPrice: ['.compare-at-price', '.original-price', '.was-price'],
        image: ['.product-image img', '.product__media img', '.main-image'],
        description: ['.product-description', '.product__description', '.rte'],
        brand: ['Mamaearth']
      }
    });

    // Tata Neu Configuration
    this.platformConfigs.set('tataneu', {
      platform: 'tataneu',
      platformName: 'Tata Neu',
      isSupported: true,
      scrapingStrategy: 'direct',
      affiliateSupport: false,
      selectors: {
        title: [
          '.product-title',
          '.pdp-product-name',
          'h1[data-testid="product-title"]',
          '.product-name',
          '.item-title',
          'h1.title'
        ],
        price: [
          '.price-current',
          '.current-price',
          '.product-price',
          '[data-testid="price"]',
          '.price-value',
          '.selling-price'
        ],
        originalPrice: [
          '.price-original',
          '.original-price',
          '.mrp-price',
          '.was-price'
        ],
        image: [
          '.product-image-main img',
          '.product-gallery img',
          '.pdp-image img',
          '.main-product-image',
          '.product-photo img',
          '.item-image img',
          '[data-testid="product-image"] img',
          '.product-slider img',
          '.hero-image img'
        ],
        description: [
          '.product-description',
          '.product-details',
          '.pdp-description',
          '.item-description'
        ],
        rating: [
          '.rating-value',
          '.product-rating',
          '.stars-rating'
        ],
        reviewCount: [
          '.review-count',
          '.rating-count'
        ],
        brand: [
          '.brand-name',
          '.product-brand'
        ]
      }
    });

    // Generic E-commerce Configuration
    this.platformConfigs.set('generic', {
      platform: 'generic',
      platformName: 'Generic E-commerce',
      isSupported: true,
      scrapingStrategy: 'generic',
      affiliateSupport: false,
      selectors: {
        title: [
          'h1',
          '.product-title',
          '.product-name',
          '[data-testid="product-title"]',
          '.entry-title',
          '.product__title',
          '.pdp-name'
        ],
        price: [
          '.price',
          '.product-price',
          '.current-price',
          '[data-testid="price"]',
          '.cost',
          '.amount',
          '.price-current'
        ],
        originalPrice: [
          '.original-price',
          '.compare-at-price',
          '.was-price',
          '.price-old',
          '.regular-price'
        ],
        image: [
          // Primary product image selectors
          '.product-image img',
          '.product__media img',
          '.main-image',
          '.main-product-image',
          '.featured-image img',
          '.product-photo img',
          '.hero-image img',
          '.primary-image img',
          
          // Gallery and slider images
          '.product-gallery img',
          '.product-slider img',
          '.image-gallery img',
          '.product-images img',
          '.gallery-image img',
          '.slider-image img',
          
          // Common e-commerce patterns
          '.pdp-image img',
          '.product-detail-image img',
          '.item-image img',
          '.product-img img',
          '.prod-image img',
          '.main-img',
          '.hero-img',
          
          // Data attributes and test IDs
          '[data-testid="product-image"]',
          '[data-testid="main-image"]',
          '[data-role="product-image"]',
          '[data-image="product"]',
          
          // Generic image patterns
          'img[alt*="product"]',
          'img[alt*="Product"]',
          'img[src*="product"]',
          'img[src*="item"]',
          
          // Fallback selectors
          '.content img:first-of-type',
          'main img:first-of-type',
          'article img:first-of-type',
          '.container img:first-of-type'
        ],
        description: [
          '.product-description',
          '.product__description',
          '.product-details',
          '.description',
          '.product-content',
          '.rte'
        ],
        rating: [
          '.rating',
          '.stars',
          '.review-rating',
          '[data-testid="rating"]'
        ],
        reviewCount: [
          '.review-count',
          '.reviews-count',
          '.rating-count',
          '[data-testid="review-count"]'
        ],
        brand: [
          '.brand',
          '.brand-name',
          '.manufacturer',
          '[data-testid="brand"]'
        ]
      }
    });
  }

  /**
   * Detect platform from resolved URL
   */
  detectPlatform(resolvedUrl: ResolvedURL): PlatformInfo {
    console.log(`Search Detecting platform for: ${resolvedUrl.finalUrl}`);
    
    // Use platform from URL resolver if available
    if (resolvedUrl.platform && this.platformConfigs.has(resolvedUrl.platform)) {
      const config = this.platformConfigs.get(resolvedUrl.platform)!;
      console.log(`Success Platform detected: ${config.platformName}`);
      
      return {
        ...config,
        productId: resolvedUrl.productId
      };
    }

    // Fallback to URL analysis
    const url = resolvedUrl.finalUrl.toLowerCase();
    
    // Check for specific platform patterns
    if (url.includes('tataneu.com') || url.includes('tata-neu') || url.includes('tataneu')) {
      const config = this.platformConfigs.get('tataneu')!;
      console.log(`Success Platform detected via URL analysis: ${config.platformName}`);
      return {
        ...config,
        productId: resolvedUrl.productId
      };
    }
    
    for (const [platform, config] of this.platformConfigs.entries()) {
      if (platform === 'generic' || platform === 'tataneu') continue; // Skip generic and tataneu (already checked)
      
      if (url.includes(platform)) {
        console.log(`Success Platform detected via URL analysis: ${config.platformName}`);
        return {
          ...config,
          productId: resolvedUrl.productId
        };
      }
    }

    // Default to generic
    console.log(`Warning Unknown platform, using generic configuration`);
    return {
      ...this.platformConfigs.get('generic')!,
      productId: resolvedUrl.productId
    };
  }

  /**
   * Get platform configuration by name
   */
  getPlatformConfig(platform: string): PlatformInfo | undefined {
    return this.platformConfigs.get(platform);
  }

  /**
   * Get all supported platforms
   */
  getSupportedPlatforms(): PlatformInfo[] {
    return Array.from(this.platformConfigs.values());
  }

  /**
   * Check if platform supports affiliate links
   */
  supportsAffiliate(platform: string): boolean {
    const config = this.platformConfigs.get(platform);
    return config ? config.affiliateSupport : false;
  }

  /**
   * Get scraping selectors for platform
   */
  getSelectors(platform: string): ProductSelectors | undefined {
    const config = this.platformConfigs.get(platform);
    return config ? config.selectors : undefined;
  }

  /**
   * Determine best scraping strategy for platform
   */
  getScrapingStrategy(platform: string): 'direct' | 'api' | 'generic' {
    const config = this.platformConfigs.get(platform);
    return config ? config.scrapingStrategy : 'generic';
  }

  /**
   * Extract category from URL if possible
   */
  extractCategory(url: string, platform: string): string | undefined {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();
      
      // Platform-specific category extraction
      switch (platform) {
        case 'amazon':
          const amazonCategoryMatch = pathname.match(/\/(\w+)\//);
          return amazonCategoryMatch ? amazonCategoryMatch[1] : undefined;
          
        case 'flipkart':
          const flipkartCategoryMatch = pathname.match(/\/(\w+)\//); 
          return flipkartCategoryMatch ? flipkartCategoryMatch[1] : undefined;
          
        default:
          // Generic category extraction from URL path
          const segments = pathname.split('/').filter(s => s.length > 0);
          return segments.length > 0 ? segments[0] : undefined;
      }
    } catch {
      return undefined;
    }
  }
}

// Export singleton instance
export const platformDetector = new PlatformDetector();
export type { PlatformInfo, ProductSelectors };