// Universal URL Resolution Service
// Handles shortened URLs and follows redirect chains to extract final product URLs

import fetch from 'node-fetch';
import { URL } from 'url';

interface ResolvedURL {
  originalUrl: string;
  finalUrl: string;
  redirectChain: string[];
  isShortened: boolean;
  platform?: string;
  productId?: string;
}

class UniversalURLResolver {
  private shortenedDomains = [
    'bit.ly',
    'tinyurl.com',
    'amzn.to',
    'fkrt.it',
    'bitli.in',
    'goo.gl',
    't.co',
    'short.link',
    'cutt.ly',
    'rb.gy',
    'is.gd',
    'v.gd',
    'ow.ly',
    'buff.ly'
  ];

  private maxRedirects = 10;
  private timeout = 10000; // 10 seconds

  /**
   * Check if URL is from a known shortened URL service
   */
  private isShortenedURL(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      return this.shortenedDomains.some(domain => 
        hostname === domain || hostname.endsWith('.' + domain)
      );
    } catch {
      return false;
    }
  }

  /**
   * Follow redirect chain to get final URL
   */
  private async followRedirects(url: string): Promise<ResolvedURL> {
    const redirectChain: string[] = [url];
    let currentUrl = url;
    let redirectCount = 0;

    console.log(`Link Starting URL resolution for: ${url}`);

    while (redirectCount < this.maxRedirects) {
      try {
        console.log(`Refresh Following redirect ${redirectCount + 1}: ${currentUrl}`);
        
        const response = await fetch(currentUrl, {
          method: 'HEAD',
          redirect: 'manual',
          timeout: this.timeout,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        // Check if it's a redirect response
        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get('location');
          if (!location) {
            console.log(`Warning Redirect response but no location header`);
            break;
          }

          // Handle relative URLs
          const nextUrl = location.startsWith('http') 
            ? location 
            : new URL(location, currentUrl).toString();

          redirectChain.push(nextUrl);
          currentUrl = nextUrl;
          redirectCount++;
        } else {
          // Final destination reached
          console.log(`Success Final URL reached: ${currentUrl}`);
          break;
        }
      } catch (error) {
        console.error(`Error Error following redirect: ${error}`);
        
        // Try with GET request as fallback
        try {
          const response = await fetch(currentUrl, {
            method: 'GET',
            redirect: 'follow',
            timeout: this.timeout,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          
          currentUrl = response.url;
          console.log(`Success Fallback GET request successful: ${currentUrl}`);
          break;
        } catch (fallbackError) {
          console.error(`Error Fallback request also failed: ${fallbackError}`);
          break;
        }
      }
    }

    if (redirectCount >= this.maxRedirects) {
      console.log(`Warning Maximum redirects (${this.maxRedirects}) reached`);
    }

    return {
      originalUrl: url,
      finalUrl: currentUrl,
      redirectChain,
      isShortened: this.isShortenedURL(url),
      platform: this.detectPlatform(currentUrl),
      productId: this.extractProductId(currentUrl)
    };
  }

  /**
   * Detect e-commerce platform from URL
   */
  private detectPlatform(url: string): string | undefined {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      if (hostname.includes('amazon.')) return 'amazon';
      if (hostname.includes('flipkart.')) return 'flipkart';
      if (hostname.includes('myntra.')) return 'myntra';
      if (hostname.includes('nykaa.')) return 'nykaa';
      if (hostname.includes('ajio.')) return 'ajio';
      if (hostname.includes('snapdeal.')) return 'snapdeal';
      if (hostname.includes('paytmmall.')) return 'paytmmall';
      if (hostname.includes('boat-lifestyle.')) return 'boat';
      if (hostname.includes('mamaearth.')) return 'mamaearth';
      if (hostname.includes('shopify.')) return 'shopify';
      if (hostname.includes('woocommerce.')) return 'woocommerce';
      
      return 'generic';
    } catch {
      return undefined;
    }
  }

  /**
   * Extract product ID from URL based on platform
   */
  private extractProductId(url: string): string | undefined {
    try {
      const platform = this.detectPlatform(url);
      
      switch (platform) {
        case 'amazon':
          // Extract ASIN from Amazon URL
          const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})/i);
          return asinMatch ? (asinMatch[1] || asinMatch[2]) : undefined;
          
        case 'flipkart':
          // Extract product ID from Flipkart URL
          const flipkartMatch = url.match(/\/p\/([a-zA-Z0-9]+)/i);
          return flipkartMatch ? flipkartMatch[1] : undefined;
          
        case 'myntra':
          // Extract product ID from Myntra URL
          const myntraMatch = url.match(/\/([0-9]+)\/buy/i);
          return myntraMatch ? myntraMatch[1] : undefined;
          
        default:
          // Generic product ID extraction
          const genericMatch = url.match(/product[\/-]([a-zA-Z0-9-_]+)/i) || 
                              url.match(/item[\/-]([a-zA-Z0-9-_]+)/i) ||
                              url.match(/p[\/-]([a-zA-Z0-9-_]+)/i);
          return genericMatch ? genericMatch[1] : undefined;
      }
    } catch {
      return undefined;
    }
  }

  /**
   * Main method to resolve any URL
   */
  async resolveURL(url: string): Promise<ResolvedURL> {
    console.log(`Target Resolving URL: ${url}`);
    
    // Validate URL format
    try {
      new URL(url);
    } catch {
      throw new Error('Invalid URL format');
    }

    // Check if URL is shortened
    if (this.isShortenedURL(url)) {
      console.log(`Link Detected shortened URL, following redirects...`);
      return await this.followRedirects(url);
    } else {
      console.log(`Link Direct URL detected, extracting platform info...`);
      return {
        originalUrl: url,
        finalUrl: url,
        redirectChain: [url],
        isShortened: false,
        platform: this.detectPlatform(url),
        productId: this.extractProductId(url)
      };
    }
  }

  /**
   * Batch resolve multiple URLs
   */
  async resolveMultipleURLs(urls: string[]): Promise<ResolvedURL[]> {
    console.log(`Target Batch resolving ${urls.length} URLs...`);
    
    const promises = urls.map(url => 
      this.resolveURL(url).catch(error => ({
        originalUrl: url,
        finalUrl: url,
        redirectChain: [url],
        isShortened: false,
        error: error.message
      } as ResolvedURL & { error: string }))
    );

    return await Promise.all(promises);
  }

  /**
   * Get supported platforms
   */
  getSupportedPlatforms(): string[] {
    return ['amazon', 'flipkart', 'myntra', 'nykaa', 'ajio', 'snapdeal', 'paytmmall', 'boat', 'mamaearth', 'shopify', 'woocommerce', 'generic'];
  }

  /**
   * Get supported shortened URL services
   */
  getSupportedShorteners(): string[] {
    return [...this.shortenedDomains];
  }
}

// Export singleton instance
export const urlResolver = new UniversalURLResolver();
export type { ResolvedURL };