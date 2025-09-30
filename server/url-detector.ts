/**
 * Unified URL Detection System for Prime Picks and CueLinks
 * Handles both affiliate links and direct product URLs from multiple platforms
 */

export interface DetectedUrl {
  url: string;
  platform: string;
  type: 'affiliate' | 'direct';
  originalUrl?: string; // For affiliate links that need redirect resolution
}

export class UniversalUrlDetector {
  
  /**
   * Detect any e-commerce URL in text message
   */
  static async detectAnyUrl(text: string): Promise<DetectedUrl | null> {
    // First check for shortened URLs and resolve them
    const resolvedText = await this.resolveShortUrls(text);
    
    // Try Amazon URLs first (most common)
    const amazonUrl = this.detectAmazonUrl(resolvedText);
    if (amazonUrl) return amazonUrl;
    
    // Try CueLinks affiliate URLs
    const cueLinksUrl = this.detectCueLinksUrl(resolvedText);
    if (cueLinksUrl) return cueLinksUrl;
    
    // Try other e-commerce platforms
    const otherUrl = this.detectOtherEcommerceUrl(resolvedText);
    if (otherUrl) return otherUrl;
    
    return null;
  }
  
  /**
   * Detect multiple URLs in text message
   */
  static detectUrls(text: string): DetectedUrl[] {
    const urls: DetectedUrl[] = [];
    
    // Simple URL regex to find potential URLs
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    const matches = text.match(urlRegex);
    
    if (matches) {
      for (const match of matches) {
        // Try to detect what type of URL this is
        const amazonUrl = this.detectAmazonUrl(match);
        if (amazonUrl) {
          urls.push(amazonUrl);
          continue;
        }
        
        const cueLinksUrl = this.detectCueLinksUrl(match);
        if (cueLinksUrl) {
          urls.push(cueLinksUrl);
          continue;
        }
        
        const otherUrl = this.detectOtherEcommerceUrl(match);
        if (otherUrl) {
          urls.push(otherUrl);
          continue;
        }
        
        // If no specific platform detected, add as generic URL
        urls.push({
          url: match,
          platform: 'unknown',
          type: 'direct'
        });
      }
    }
    
    return urls;
  }
  
  /**
   * Resolve shortened URLs to their actual destinations
   */
  static async resolveShortUrls(text: string): Promise<string> {
    // Common URL shorteners
    const shortUrlPatterns = [
      /https?:\/\/bit\.ly\/[^\s]+/gi,
      /https?:\/\/bitli\.in\/[^\s]+/gi,
      /https?:\/\/tinyurl\.com\/[^\s]+/gi,
      /https?:\/\/t\.co\/[^\s]+/gi,
      /https?:\/\/goo\.gl\/[^\s]+/gi,
      /https?:\/\/short\.link\/[^\s]+/gi,
      /https?:\/\/cutt\.ly\/[^\s]+/gi,
      /https?:\/\/rb\.gy\/[^\s]+/gi,
      /https?:\/\/is\.gd\/[^\s]+/gi
    ];
    
    let resolvedText = text;
    
    // Find all shortened URLs in the text
    const allMatches: string[] = [];
    shortUrlPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        allMatches.push(...matches);
      }
    });
    
    if (allMatches.length === 0) {
      return resolvedText;
    }
    
    console.log(`Link Found ${allMatches.length} shortened URLs: ${allMatches.join(', ')}`);
    console.log('Launch Resolving shortened URLs to actual destinations...');
    
    // Resolve each shortened URL
    for (const shortUrl of allMatches) {
      try {
        const resolvedUrl = await this.followRedirects(shortUrl);
        if (resolvedUrl && resolvedUrl !== shortUrl) {
          console.log(`Success Resolved: ${shortUrl} → ${resolvedUrl}`);
          resolvedText = resolvedText.replace(shortUrl, resolvedUrl);
        } else {
          console.log(`Warning Could not resolve: ${shortUrl}`);
        }
      } catch (error) {
        console.log(`Error Error resolving ${shortUrl}:`, error.message);
      }
    }
    
    return resolvedText;
  }
  
  /**
   * Follow HTTP redirects to get the final URL
   */
  static async followRedirects(url: string, maxRedirects: number = 5): Promise<string> {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      return response.url || url;
    } catch (error) {
      // If HEAD request fails, try GET request
      try {
        const response = await fetch(url, {
          method: 'GET',
          redirect: 'follow',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        return response.url || url;
      } catch (getError) {
        console.log(`Failed to resolve ${url}:`, getError.message);
        return url;
      }
    }
  }
  
  /**
   * Detect Amazon URLs (both direct and affiliate)
   */
  static detectAmazonUrl(text: string): DetectedUrl | null {
    const amazonPatterns = [
      // Direct Amazon URLs
      /https?:\/\/(?:www\.)?amazon\.[a-z.]+\/[^\s]+/gi,
      /https?:\/\/(?:www\.)?amazon\.[a-z.]+\/dp\/[A-Z0-9]+[^\s]*/gi,
      /https?:\/\/(?:www\.)?amazon\.[a-z.]+\/gp\/product\/[A-Z0-9]+[^\s]*/gi,
      
      // Amazon short URLs
      /https?:\/\/amzn\.to\/[^\s]+/gi,
      /https?:\/\/a\.co\/[^\s]+/gi,
      
      // Amazon affiliate URLs with tags
      /https?:\/\/(?:www\.)?amazon\.[a-z.]+\/[^\s]*[?&]tag=[^\s&]+[^\s]*/gi,
      
      // Partial URLs (without protocol)
      /amazon\.[a-z.]+\/[^\s]+/gi
    ];
    
    for (const pattern of amazonPatterns) {
      const match = text.match(pattern);
      if (match) {
        const url = match[0];
        const isAffiliate = url.includes('tag=') || url.includes('amzn.to') || url.includes('a.co');
        
        return {
          url: url.startsWith('http') ? url : 'https://' + url,
          platform: 'amazon',
          type: isAffiliate ? 'affiliate' : 'direct'
        };
      }
    }
    
    return null;
  }
  
  /**
   * Detect CueLinks affiliate URLs
   */
  static detectCueLinksUrl(text: string): DetectedUrl | null {
    const cueLinksPatterns = [
      // CueLinks redirect URLs
      /https?:\/\/amzn\.clnk\.in\/[^\s]+/gi,
      /https?:\/\/(?:www\.)?linksredirect\.com\/[^\s]+/gi,
      /https?:\/\/(?:www\.)?cuelinks\.com\/[^\s]+/gi,
      /https?:\/\/[^\s]*\.clnk\.in\/[^\s]+/gi,
      
      // Other CueLinks patterns
      /https?:\/\/[^\s]*cuelinks[^\s]*\/[^\s]+/gi,
      /https?:\/\/[^\s]*\?cid=[0-9]+[^\s]*/gi
    ];
    
    for (const pattern of cueLinksPatterns) {
      const match = text.match(pattern);
      if (match) {
        return {
          url: match[0],
          platform: 'cuelinks',
          type: 'affiliate',
          originalUrl: match[0] // Will need redirect resolution
        };
      }
    }
    
    return null;
  }
  
  /**
   * Detect other e-commerce platform URLs
   */
  static detectOtherEcommerceUrl(text: string): DetectedUrl | null {
    const ecommercePatterns = [
      // Flipkart
      { pattern: /https?:\/\/(?:www\.)?flipkart\.com\/[^\s]+/gi, platform: 'flipkart' },
      { pattern: /https?:\/\/dl\.flipkart\.com\/[^\s]+/gi, platform: 'flipkart' },
      
      // Myntra
      { pattern: /https?:\/\/(?:www\.)?myntra\.com\/[^\s]+/gi, platform: 'myntra' },
      
      // Ajio
      { pattern: /https?:\/\/(?:www\.)?ajio\.com\/[^\s]+/gi, platform: 'ajio' },
      
      // Nykaa
      { pattern: /https?:\/\/(?:www\.)?nykaa\.com\/[^\s]+/gi, platform: 'nykaa' },
      
      // Meesho
      { pattern: /https?:\/\/(?:www\.)?meesho\.com\/[^\s]+/gi, platform: 'meesho' },
      
      // Snapdeal
      { pattern: /https?:\/\/(?:www\.)?snapdeal\.com\/[^\s]+/gi, platform: 'snapdeal' },
      
      // TataCliq
      { pattern: /https?:\/\/(?:www\.)?tatacliq\.com\/[^\s]+/gi, platform: 'tatacliq' },
      
      // BigBasket
      { pattern: /https?:\/\/(?:www\.)?bigbasket\.com\/[^\s]+/gi, platform: 'bigbasket' },
      
      // Generic e-commerce patterns
      { pattern: /https?:\/\/[^\s]+\/(?:product|item|p|dp|buy|shop)\/[^\s]+/gi, platform: 'generic' }
    ];
    
    for (const { pattern, platform } of ecommercePatterns) {
      const match = text.match(pattern);
      if (match) {
        return {
          url: match[0],
          platform: platform,
          type: 'direct'
        };
      }
    }
    
    return null;
  }
  
  /**
   * Check if URL is suitable for Prime Picks (Amazon-focused)
   */
  static isPrimePicksUrl(detectedUrl: DetectedUrl): boolean {
    return detectedUrl.platform === 'amazon';
  }
  
  /**
   * Check if URL is suitable for CueLinks (any e-commerce)
   */
  static isCuePicksUrl(detectedUrl: DetectedUrl): boolean {
    // CueLinks can handle any e-commerce platform
    return true;
  }
  
  /**
   * Get appropriate bot system for detected URL
   */
  static getTargetSystem(detectedUrl: DetectedUrl): 'prime-picks' | 'cue-picks' | 'click-picks' | 'both' {
    if (detectedUrl.platform === 'amazon') {
      // Amazon URLs can go to both systems
      return 'both';
    } else if (detectedUrl.platform === 'cuelinks' || detectedUrl.type === 'affiliate') {
      // CueLinks affiliate URLs go to CueLinks system
      return 'cue-picks';
    } else {
      // Other e-commerce platforms can go to Click Picks for trending products
      // or CueLinks for general processing - default to CueLinks for now
      return 'cue-picks';
    }
  }
  
  /**
   * Extract clean product URL from detected URL
   */
  static cleanUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      
      // Remove tracking parameters but keep essential ones
      const essentialParams = ['tag', 'ref', 'cid', 'source'];
      const cleanParams = new URLSearchParams();
      
      for (const [key, value] of urlObj.searchParams) {
        if (essentialParams.includes(key)) {
          cleanParams.set(key, value);
        }
      }
      
      urlObj.search = cleanParams.toString();
      return urlObj.toString();
    } catch (error) {
      return url;
    }
  }
  
  /**
   * Validate if URL is accessible
   */
  static async validateUrl(url: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

// Legacy compatibility functions
export function extractAmazonUrl(text: string): string | null {
  const detected = UniversalUrlDetector.detectAmazonUrl(text);
  return detected ? detected.url : null;
}

export async function extractAnyEcommerceUrl(text: string): Promise<string | null> {
  const detected = await UniversalUrlDetector.detectAnyUrl(text);
  return detected ? detected.url : null;
}

export { UniversalUrlDetector as UrlDetector };