import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';

interface ScrapedProductData {
  title: string;
  price: string;
  originalPrice?: string;
  imageUrl: string;
  rating?: string;
  reviewCount?: number;
  description?: string;
  category?: string;
}

export class CueLinksWebScraper {
  private readonly userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  private readonly timeout = 15000;

  /**
   * Main scraping method that routes to platform-specific scrapers
   */
  async scrapeProduct(url: string): Promise<ScrapedProductData | null> {
    try {
      console.log(`Search CueLinks scraping product: ${url}`);
      
      // Handle CueLinks redirect URLs
      let actualUrl = url;
      if (this.isCueLinksRedirectUrl(url)) {
        console.log(`Link Detected CueLinks redirect URL, following redirect...`);
        actualUrl = await this.followRedirect(url);
        console.log(`Target Resolved to actual URL: ${actualUrl}`);
      }
      
      const domain = this.extractDomain(actualUrl);
      console.log(`Global Detected domain: ${domain}`);

      // Route to platform-specific scraper
      switch (domain) {
        case 'amazon.in':
        case 'amazon.com':
          return await this.scrapeAmazon(actualUrl);
        case 'flipkart.com':
          return await this.scrapeFlipkart(actualUrl);
        case 'myntra.com':
          return await this.scrapeMyntra(actualUrl);
        case 'ajio.com':
          return await this.scrapeAjio(actualUrl);
        case 'nykaa.com':
          return await this.scrapeNykaa(actualUrl);
        case 'meesho.com':
          return await this.scrapeMeesho(actualUrl);
        case 'snapdeal.com':
          return await this.scrapeSnapdeal(actualUrl);
        case 'tatacliq.com':
          return await this.scrapeTataCliq(actualUrl);
        default:
          return await this.scrapeGeneric(actualUrl);
      }
    } catch (error) {
      console.error(`Error Error scraping ${url}:`, error.message);
      return await this.generateFallbackData(url);
    }
  }

  /**
   * Amazon-specific scraper with robust error handling
   */
  private async scrapeAmazon(url: string): Promise<ScrapedProductData | null> {
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`Refresh Amazon scraping attempt ${attempts}/${maxAttempts}`);
        
        const $ = await this.fetchPage(url);
        
        // Extract title with multiple fallbacks
        const title = this.extractWithFallbacks($, [
          '#productTitle',
          '.product-title',
          'h1.a-size-large',
          'h1[data-automation-id="product-title"]',
          '.a-size-large.product-title-word-break',
          'h1.a-size-base-plus',
          'h1'
        ]);

        // Extract price with comprehensive selectors
        const price = this.extractPriceWithFallbacks($, [
          '.a-price-current .a-offscreen',
          '.a-price .a-offscreen',
          '.a-price-range .a-offscreen',
          '#priceblock_dealprice',
          '#priceblock_ourprice',
          '.a-price-whole',
          '.a-price-symbol + .a-price-whole',
          '[data-a-price] .a-offscreen',
          '.a-price-display .a-offscreen',
          '#apex_desktop .a-price .a-offscreen',
          '.a-section .a-price .a-offscreen',
          '.a-price.a-text-price.a-size-medium.apexPriceToPay',
          '.a-offscreen[aria-hidden="true"]'
        ]);

        // Extract original price (was price) with multiple selectors
        const originalPrice = this.extractPriceWithFallbacks($, [
          '.a-price.a-text-price .a-offscreen',
          '.a-price-was .a-offscreen',
          '.a-text-strike .a-offscreen',
          '.a-price-basis .a-offscreen',
          '.a-text-price.a-size-base.a-color-secondary .a-offscreen'
        ]);

        // Extract image with comprehensive selectors
        const imageUrl = this.extractImageWithFallbacks($, [
          '#landingImage',
          '#imgBlkFront',
          '.a-dynamic-image',
          '#main-image',
          '.a-spacing-small img',
          '#altImages img',
          '.image.item img',
          '[data-a-dynamic-image]'
        ]);

        // Extract rating with multiple patterns
        const rating = this.extractRatingWithFallbacks($, [
          '.a-icon-alt',
          '.a-star-rating .a-icon-alt',
          '[data-hook="average-star-rating"] .a-icon-alt',
          '.cr-original-review-text .a-icon-alt',
          '.a-declarative .a-icon-alt'
        ]);

        // Extract review count with comprehensive selectors
        const reviewCount = this.extractReviewCountWithFallbacks($, [
          '#acrCustomerReviewText',
          '[data-hook="total-review-count"]',
          '.a-link-normal .a-size-base',
          '#reviewsMedley .a-link-normal',
          '.cr-original-review-text'
        ]);

        // Extract description
        const description = this.extractDescriptionWithFallbacks($, [
          '#feature-bullets ul',
          '.a-unordered-list.a-vertical.a-spacing-mini',
          '#productDescription',
          '.product-description'
        ]);

        // Validate essential data
        if (!title || title.length < 5) {
          throw new Error('Title extraction failed or too short');
        }
        
        if (!price || price === '0') {
          throw new Error('Price extraction failed');
        }

        console.log(`Success Amazon scraping successful on attempt ${attempts}`);
        return {
          title: title.substring(0, 255),
          price: price,
          originalPrice: originalPrice || undefined,
          imageUrl: imageUrl || this.generateFallbackImageUrl(url),
          rating: rating || '4.0',
          reviewCount: reviewCount || 100,
          description: description || title,
          category: 'Electronics & Gadgets'
        };
        
      } catch (error) {
        console.error(`Error Amazon scraping attempt ${attempts} failed:`, error.message);
        
        if (attempts === maxAttempts) {
          console.error('Error All Amazon scraping attempts failed');
          return null;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
      }
    }
    
    return null;
  }

  /**
   * Flipkart-specific scraper
   */
  private async scrapeFlipkart(url: string): Promise<ScrapedProductData | null> {
    try {
      const $ = await this.fetchPage(url);
      
      const title = $('.B_NuCI').text().trim() ||
                   $('h1.yhB1nd').text().trim() ||
                   $('._35KyD6').text().trim();

      const price = $('._30jeq3._16Jk6d').text().trim() ||
                   $('._1_WHN1').text().trim();

      const originalPrice = $('._3I9_wc._2p6lqe').text().trim();

      const imageUrl = $('._396cs4._2amPTt._3qGmMb img').first().attr('src') ||
                      $('._2r_T1I img').first().attr('src');

      const ratingText = $('._3LWZlK').text().trim();
      const rating = ratingText.match(/([\d.]+)/) ? ratingText.match(/([\d.]+)/)[1] : '';

      const reviewText = $('._2_R_DZ').text().trim();
      const reviewCount = reviewText.match(/([\d,]+)/) ? parseInt(reviewText.match(/([\d,]+)/)[1].replace(/,/g, '')) : 0;

      return {
        title: title.substring(0, 255),
        price: price.replace(/[^\d,]/g, '').replace(/,/g, ''),
        originalPrice: originalPrice ? originalPrice.replace(/[^\d,]/g, '').replace(/,/g, '') : undefined,
        imageUrl: imageUrl || this.generateFallbackImageUrl(url),
        rating: rating || undefined,
        reviewCount: reviewCount || undefined,
        category: 'Electronics & Gadgets'
      };
    } catch (error) {
      console.error('Error Flipkart scraping error:', error.message);
      return null;
    }
  }

  /**
   * Myntra-specific scraper
   */
  private async scrapeMyntra(url: string): Promise<ScrapedProductData | null> {
    try {
      const $ = await this.fetchPage(url);
      
      const title = $('.pdp-product-name').text().trim() ||
                   $('h1.pdp-name').text().trim();

      const price = $('.pdp-price strong').text().trim() ||
                   $('.pdp-price .pdp-price-info').text().trim();

      const originalPrice = $('.pdp-mrp').text().trim();

      const imageUrl = $('.image-grid-image').first().attr('src') ||
                      $('.pdp-product-image img').first().attr('src');

      const ratingText = $('.index-overallRating').text().trim();
      const rating = ratingText.match(/([\d.]+)/) ? ratingText.match(/([\d.]+)/)[1] : '';

      return {
        title: title.substring(0, 255),
        price: price.replace(/[^\d,]/g, '').replace(/,/g, ''),
        originalPrice: originalPrice ? originalPrice.replace(/[^\d,]/g, '').replace(/,/g, '') : undefined,
        imageUrl: imageUrl || this.generateFallbackImageUrl(url),
        rating: rating || undefined,
        category: 'Fashion & Lifestyle'
      };
    } catch (error) {
      console.error('Error Myntra scraping error:', error.message);
      return null;
    }
  }

  /**
   * Generic scraper for unknown e-commerce sites
   */
  private async scrapeGeneric(url: string): Promise<ScrapedProductData | null> {
    try {
      const $ = await this.fetchPage(url);
      
      // Generic selectors for common e-commerce patterns
      const title = $('h1').first().text().trim() ||
                   $('.product-title').text().trim() ||
                   $('.product-name').text().trim() ||
                   $('[class*="title"]').first().text().trim();

      // Look for price patterns
      let price = '';
      const priceSelectors = [
        '.price',
        '.product-price',
        '[class*="price"]',
        '[data-price]'
      ];
      
      for (const selector of priceSelectors) {
        const priceText = $(selector).first().text().trim();
        if (priceText && (priceText.includes('₹') || priceText.includes('$') || priceText.match(/\d+/))) {
          price = priceText.replace(/[^\d,\.]/g, '').replace(/,/g, '');
          break;
        }
      }

      // Look for images
      let imageUrl = '';
      const imageSelectors = [
        '.product-image img',
        '.main-image img',
        '[class*="image"] img',
        'img[alt*="product"]'
      ];
      
      for (const selector of imageSelectors) {
        const imgSrc = $(selector).first().attr('src') || $(selector).first().attr('data-src');
        if (imgSrc && (imgSrc.startsWith('http') || imgSrc.startsWith('//'))) {
          imageUrl = imgSrc.startsWith('//') ? 'https:' + imgSrc : imgSrc;
          break;
        }
      }

      return {
        title: title.substring(0, 255) || 'Product from ' + this.extractDomain(url),
        price: price || '999',
        imageUrl: imageUrl || this.generateFallbackImageUrl(url),
        category: 'General'
      };
    } catch (error) {
      console.error('Error Generic scraping error:', error.message);
      return null;
    }
  }

  /**
   * Placeholder scrapers for other platforms
   */
  private async scrapeAjio(url: string): Promise<ScrapedProductData | null> {
    return await this.scrapeGeneric(url);
  }

  private async scrapeNykaa(url: string): Promise<ScrapedProductData | null> {
    return await this.scrapeGeneric(url);
  }

  private async scrapeMeesho(url: string): Promise<ScrapedProductData | null> {
    return await this.scrapeGeneric(url);
  }

  private async scrapeSnapdeal(url: string): Promise<ScrapedProductData | null> {
    return await this.scrapeGeneric(url);
  }

  private async scrapeTataCliq(url: string): Promise<ScrapedProductData | null> {
    return await this.scrapeGeneric(url);
  }

  /**
   * Helper methods for robust data extraction
   */
  private async fetchPage(url: string): Promise<cheerio.CheerioAPI> {
    const headers = {
      'User-Agent': this.userAgent,
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    };

    const response = await axios.get(url, {
      headers,
      timeout: this.timeout,
      maxRedirects: 5
    });

    return cheerio.load(response.data) as cheerio.CheerioAPI;
  }

  private extractWithFallbacks($: cheerio.CheerioAPI, selectors: string[]): string {
    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      if (text && text.length > 3) {
        return text;
      }
    }
    return '';
  }

  private extractPriceWithFallbacks($: cheerio.CheerioAPI, selectors: string[]): string {
    for (const selector of selectors) {
      const priceText = $(selector).first().text().trim();
      if (priceText && (priceText.includes('₹') || priceText.includes('Rs') || priceText.includes('$'))) {
        const cleanPrice = priceText.replace(/[^\d,\.]/g, '').replace(/,/g, '');
        if (cleanPrice && parseFloat(cleanPrice) > 0) {
          return cleanPrice;
        }
      }
    }
    return '';
  }

  private extractImageWithFallbacks($: cheerio.CheerioAPI, selectors: string[]): string {
    for (const selector of selectors) {
      const element = $(selector).first();
      let imgSrc = element.attr('src') || element.attr('data-src') || element.attr('data-a-dynamic-image');
      
      // Handle dynamic image data
      if (!imgSrc && element.attr('data-a-dynamic-image')) {
        try {
          const dynamicData = JSON.parse(element.attr('data-a-dynamic-image') || '{}');
          const imageKeys = Object.keys(dynamicData);
          if (imageKeys.length > 0) {
            imgSrc = imageKeys[0];
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
      }
      
      if (imgSrc && (imgSrc.includes('amazon') || imgSrc.includes('ssl-images') || imgSrc.startsWith('http'))) {
        // Clean up image URL and get higher quality version
        let cleanUrl = imgSrc.replace(/\._[A-Z0-9_,]+\./g, '.').replace(/\._.*?_\./g, '.');
        if (cleanUrl.includes('._')) {
          cleanUrl = cleanUrl.replace(/\._.*?\./g, '._AC_UX679_.');
        }
        return cleanUrl;
      }
    }
    return '';
  }

  private extractRatingWithFallbacks($: cheerio.CheerioAPI, selectors: string[]): string {
    for (const selector of selectors) {
      const ratingText = $(selector).first().text().trim();
      if (ratingText) {
        const ratingMatch = ratingText.match(/([\d.]+)/);
        if (ratingMatch && parseFloat(ratingMatch[1]) >= 1 && parseFloat(ratingMatch[1]) <= 5) {
          return ratingMatch[1];
        }
      }
    }
    return '';
  }

  private extractReviewCountWithFallbacks($: cheerio.CheerioAPI, selectors: string[]): number {
    for (const selector of selectors) {
      const reviewText = $(selector).first().text().trim();
      if (reviewText) {
        const reviewMatch = reviewText.match(/([\d,]+)/);
        if (reviewMatch) {
          const count = parseInt(reviewMatch[1].replace(/,/g, ''));
          if (count > 0) {
            return count;
          }
        }
      }
    }
    return 0;
  }

  private extractDescriptionWithFallbacks($: cheerio.CheerioAPI, selectors: string[]): string {
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        let description = '';
        if (selector.includes('ul')) {
          // Extract bullet points
          element.find('li').each((i, li) => {
            const text = $(li).text().trim();
            if (text && i < 5) { // Limit to 5 bullet points
              description += `• ${text}\n`;
            }
          });
        } else {
          description = element.text().trim();
        }
        
        if (description && description.length > 10) {
          return description.substring(0, 500); // Limit description length
        }
      }
    }
    return '';
  }

  private isCueLinksRedirectUrl(url: string): boolean {
    const cueLinksPatterns = [
      /amzn\.clnk\.in/,
      /linksredirect\.com/,
      /cuelinks\.com/,
      /clnk\.in/
    ];
    
    return cueLinksPatterns.some(pattern => pattern.test(url));
  }

  private async followRedirect(url: string): Promise<string> {
    try {
      const headers = {
        'User-Agent': this.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      };

      const response = await axios.get(url, {
        headers,
        timeout: this.timeout,
        maxRedirects: 10,
        validateStatus: () => true // Accept all status codes
      });

      // Get the final URL after all redirects
      const finalUrl = response.request.res.responseUrl || response.config.url || url;
      
      console.log(`Refresh Redirect chain: ${url} → ${finalUrl}`);
      return finalUrl;
    } catch (error) {
      console.error(`Error Error following redirect for ${url}:`, error.message);
      return url; // Return original URL if redirect fails
    }
  }

  private extractDomain(url: string): string {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.hostname.replace('www.', '');
    } catch (error) {
      return 'unknown';
    }
  }

  private generateFallbackImageUrl(url: string): string {
    const domain = this.extractDomain(url);
    return `https://via.placeholder.com/400x400?text=${encodeURIComponent(domain.toUpperCase())}`;
  }

  private async generateFallbackData(url: string): Promise<ScrapedProductData> {
    const domain = this.extractDomain(url);
    return {
      title: `Product from ${domain}`,
      price: '999',
      imageUrl: this.generateFallbackImageUrl(url),
      category: 'General'
    };
  }
}

export const cueLinksWebScraper = new CueLinksWebScraper();