// Travel Website Scraper - Automated deal discovery from travel booking sites
import axios from 'axios';
import * as cheerio from 'cheerio';
import { detectTravelSubcategoryEnhanced } from './travel-category-detector.js';
import { optimizeTravelUrl } from './travel-affiliate-optimizer.js';

export interface ScrapedDeal {
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  currency: string;
  imageUrl?: string;
  dealUrl: string;
  category: string;
  subcategory: string;
  partner: string;
  route?: string;
  validTill?: string;
  discount?: string;
  confidence: number;
  source: string;
}

class TravelWebsiteScraper {
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  private requestDelay = 2000; // 2 seconds between requests
  private maxRetries = 3;

  /**
   * Scrape deals from all configured travel websites
   */
  public async scrapeAllSites(): Promise<ScrapedDeal[]> {
    const allDeals: ScrapedDeal[] = [];
    
    const websites = [
      'makemytrip.com',
      'booking.com',
      'redbus.in',
      'goibibo.com',
      'cleartrip.com',
      'yatra.com'
    ];

    for (const website of websites) {
      try {
        console.log(`Search Scraping ${website}...`);
        const deals = await this.scrapeWebsite(website);
        allDeals.push(...deals);
        
        // Add delay between websites
        await this.delay(this.requestDelay);
      } catch (error) {
        console.error(`Error Failed to scrape ${website}:`, error.message);
      }
    }

    return allDeals;
  }

  /**
   * Scrape specific website for travel deals
   */
  public async scrapeWebsite(website: string): Promise<ScrapedDeal[]> {
    switch (website) {
      case 'makemytrip.com':
        return await this.scrapeMakeMyTrip();
      case 'booking.com':
        return await this.scrapeBooking();
      case 'redbus.in':
        return await this.scrapeRedBus();
      case 'goibibo.com':
        return await this.scrapeGoibibo();
      case 'cleartrip.com':
        return await this.scrapeCleartrip();
      case 'yatra.com':
        return await this.scrapeYatra();
      default:
        console.log(`Warning No scraper implemented for ${website}`);
        return [];
    }
  }

  /**
   * Scrape MakeMyTrip deals
   */
  private async scrapeMakeMyTrip(): Promise<ScrapedDeal[]> {
    try {
      const deals: ScrapedDeal[] = [];
      
      // Scrape flight deals
      const flightDeals = await this.scrapeMakeMyTripFlights();
      deals.push(...flightDeals);
      
      // Scrape hotel deals
      const hotelDeals = await this.scrapeMakeMyTripHotels();
      deals.push(...hotelDeals);
      
      return deals;
    } catch (error) {
      console.error('Error scraping MakeMyTrip:', error);
      return [];
    }
  }

  private async scrapeMakeMyTripFlights(): Promise<ScrapedDeal[]> {
    try {
      const url = 'https://www.makemytrip.com/flights/';
      const response = await this.makeRequest(url);
      const $ = cheerio.load(response.data);
      const deals: ScrapedDeal[] = [];

      // Look for flight deal sections (this is a simplified example)
      $('.offer-card, .deal-card, .promo-card').each((index, element) => {
        try {
          const $el = $(element);
          const name = $el.find('.offer-title, .deal-title, h3, h4').first().text().trim();
          const price = $el.find('.price, .amount, .fare').first().text().trim();
          const description = $el.find('.offer-desc, .deal-desc, p').first().text().trim();
          const link = $el.find('a').first().attr('href');
          
          if (name && price && link) {
            const fullUrl = link.startsWith('http') ? link : `https://www.makemytrip.com${link}`;
            
            deals.push({
              name: this.cleanText(name),
              description: this.cleanText(description) || name,
              price: this.extractPrice(price),
              currency: 'INR',
              dealUrl: fullUrl,
              category: 'Travel',
              subcategory: 'Flights',
              partner: 'MakeMyTrip',
              confidence: 0.8,
              source: 'makemytrip_scraper'
            });
          }
        } catch (error) {
          console.error('Error parsing MakeMyTrip flight deal:', error);
        }
      });

      console.log(`Success Found ${deals.length} flight deals from MakeMyTrip`);
      return deals;
    } catch (error) {
      console.error('Error scraping MakeMyTrip flights:', error);
      return [];
    }
  }

  private async scrapeMakeMyTripHotels(): Promise<ScrapedDeal[]> {
    try {
      const url = 'https://www.makemytrip.com/hotels/';
      const response = await this.makeRequest(url);
      const $ = cheerio.load(response.data);
      const deals: ScrapedDeal[] = [];

      // Look for hotel deal sections
      $('.hotel-offer, .hotel-deal, .promo-section').each((index, element) => {
        try {
          const $el = $(element);
          const name = $el.find('.hotel-name, .offer-title, h3, h4').first().text().trim();
          const price = $el.find('.price, .rate, .amount').first().text().trim();
          const description = $el.find('.hotel-desc, .offer-desc, p').first().text().trim();
          const link = $el.find('a').first().attr('href');
          
          if (name && price && link) {
            const fullUrl = link.startsWith('http') ? link : `https://www.makemytrip.com${link}`;
            
            deals.push({
              name: this.cleanText(name),
              description: this.cleanText(description) || name,
              price: this.extractPrice(price),
              currency: 'INR',
              dealUrl: fullUrl,
              category: 'Travel',
              subcategory: 'Hotels',
              partner: 'MakeMyTrip',
              confidence: 0.8,
              source: 'makemytrip_scraper'
            });
          }
        } catch (error) {
          console.error('Error parsing MakeMyTrip hotel deal:', error);
        }
      });

      console.log(`Success Found ${deals.length} hotel deals from MakeMyTrip`);
      return deals;
    } catch (error) {
      console.error('Error scraping MakeMyTrip hotels:', error);
      return [];
    }
  }

  /**
   * Scrape Booking.com deals
   */
  private async scrapeBooking(): Promise<ScrapedDeal[]> {
    try {
      const url = 'https://www.booking.com/deals.html';
      const response = await this.makeRequest(url);
      const $ = cheerio.load(response.data);
      const deals: ScrapedDeal[] = [];

      // Look for deal sections
      $('.deal-card, .offer-item, .promotion-card').each((index, element) => {
        try {
          const $el = $(element);
          const name = $el.find('.deal-title, .offer-title, h3, h4').first().text().trim();
          const price = $el.find('.price, .amount, .rate').first().text().trim();
          const description = $el.find('.deal-desc, .offer-desc, p').first().text().trim();
          const link = $el.find('a').first().attr('href');
          
          if (name && price && link) {
            const fullUrl = link.startsWith('http') ? link : `https://www.booking.com${link}`;
            
            deals.push({
              name: this.cleanText(name),
              description: this.cleanText(description) || name,
              price: this.extractPrice(price),
              currency: 'INR',
              dealUrl: fullUrl,
              category: 'Travel',
              subcategory: 'Hotels',
              partner: 'Booking.com',
              confidence: 0.8,
              source: 'booking_scraper'
            });
          }
        } catch (error) {
          console.error('Error parsing Booking.com deal:', error);
        }
      });

      console.log(`Success Found ${deals.length} deals from Booking.com`);
      return deals;
    } catch (error) {
      console.error('Error scraping Booking.com:', error);
      return [];
    }
  }

  /**
   * Scrape RedBus deals
   */
  private async scrapeRedBus(): Promise<ScrapedDeal[]> {
    try {
      const url = 'https://www.redbus.in/offers';
      const response = await this.makeRequest(url);
      const $ = cheerio.load(response.data);
      const deals: ScrapedDeal[] = [];

      // Look for bus offer sections
      $('.offer-card, .promo-card, .deal-item').each((index, element) => {
        try {
          const $el = $(element);
          const name = $el.find('.offer-title, .promo-title, h3, h4').first().text().trim();
          const description = $el.find('.offer-desc, .promo-desc, p').first().text().trim();
          const discount = $el.find('.discount, .save-amount, .offer-amount').first().text().trim();
          const link = $el.find('a').first().attr('href');
          
          if (name && link) {
            const fullUrl = link.startsWith('http') ? link : `https://www.redbus.in${link}`;
            
            deals.push({
              name: this.cleanText(name),
              description: this.cleanText(description) || name,
              price: discount || '₹0',
              currency: 'INR',
              dealUrl: fullUrl,
              category: 'Travel',
              subcategory: 'Bus',
              partner: 'RedBus',
              discount: this.extractDiscount(discount),
              confidence: 0.8,
              source: 'redbus_scraper'
            });
          }
        } catch (error) {
          console.error('Error parsing RedBus deal:', error);
        }
      });

      console.log(`Success Found ${deals.length} deals from RedBus`);
      return deals;
    } catch (error) {
      console.error('Error scraping RedBus:', error);
      return [];
    }
  }

  /**
   * Scrape Goibibo deals
   */
  private async scrapeGoibibo(): Promise<ScrapedDeal[]> {
    try {
      const url = 'https://www.goibibo.com/offers/';
      const response = await this.makeRequest(url);
      const $ = cheerio.load(response.data);
      const deals: ScrapedDeal[] = [];

      // Look for offer sections
      $('.offer-card, .deal-card, .promo-item').each((index, element) => {
        try {
          const $el = $(element);
          const name = $el.find('.offer-title, .deal-title, h3, h4').first().text().trim();
          const description = $el.find('.offer-desc, .deal-desc, p').first().text().trim();
          const price = $el.find('.price, .amount, .fare').first().text().trim();
          const link = $el.find('a').first().attr('href');
          
          if (name && link) {
            const fullUrl = link.startsWith('http') ? link : `https://www.goibibo.com${link}`;
            
            // Detect subcategory from content
            const detection = detectTravelSubcategoryEnhanced(name + ' ' + description, fullUrl);
            
            deals.push({
              name: this.cleanText(name),
              description: this.cleanText(description) || name,
              price: this.extractPrice(price) || '₹0',
              currency: 'INR',
              dealUrl: fullUrl,
              category: 'Travel',
              subcategory: detection.subcategory || 'General',
              partner: 'Goibibo',
              confidence: 0.8,
              source: 'goibibo_scraper'
            });
          }
        } catch (error) {
          console.error('Error parsing Goibibo deal:', error);
        }
      });

      console.log(`Success Found ${deals.length} deals from Goibibo`);
      return deals;
    } catch (error) {
      console.error('Error scraping Goibibo:', error);
      return [];
    }
  }

  /**
   * Scrape Cleartrip deals
   */
  private async scrapeCleartrip(): Promise<ScrapedDeal[]> {
    try {
      const url = 'https://www.cleartrip.com/offers';
      const response = await this.makeRequest(url);
      const $ = cheerio.load(response.data);
      const deals: ScrapedDeal[] = [];

      // Look for offer sections
      $('.offer-item, .deal-card, .promo-card').each((index, element) => {
        try {
          const $el = $(element);
          const name = $el.find('.offer-title, .deal-title, h3, h4').first().text().trim();
          const description = $el.find('.offer-desc, .deal-desc, p').first().text().trim();
          const price = $el.find('.price, .amount, .fare').first().text().trim();
          const link = $el.find('a').first().attr('href');
          
          if (name && link) {
            const fullUrl = link.startsWith('http') ? link : `https://www.cleartrip.com${link}`;
            
            deals.push({
              name: this.cleanText(name),
              description: this.cleanText(description) || name,
              price: this.extractPrice(price) || '₹0',
              currency: 'INR',
              dealUrl: fullUrl,
              category: 'Travel',
              subcategory: 'Flights',
              partner: 'Cleartrip',
              confidence: 0.8,
              source: 'cleartrip_scraper'
            });
          }
        } catch (error) {
          console.error('Error parsing Cleartrip deal:', error);
        }
      });

      console.log(`Success Found ${deals.length} deals from Cleartrip`);
      return deals;
    } catch (error) {
      console.error('Error scraping Cleartrip:', error);
      return [];
    }
  }

  /**
   * Scrape Yatra deals
   */
  private async scrapeYatra(): Promise<ScrapedDeal[]> {
    try {
      const url = 'https://www.yatra.com/offers';
      const response = await this.makeRequest(url);
      const $ = cheerio.load(response.data);
      const deals: ScrapedDeal[] = [];

      // Look for offer sections
      $('.offer-card, .deal-item, .promo-section').each((index, element) => {
        try {
          const $el = $(element);
          const name = $el.find('.offer-title, .deal-title, h3, h4').first().text().trim();
          const description = $el.find('.offer-desc, .deal-desc, p').first().text().trim();
          const price = $el.find('.price, .amount, .fare').first().text().trim();
          const link = $el.find('a').first().attr('href');
          
          if (name && link) {
            const fullUrl = link.startsWith('http') ? link : `https://www.yatra.com${link}`;
            
            deals.push({
              name: this.cleanText(name),
              description: this.cleanText(description) || name,
              price: this.extractPrice(price) || '₹0',
              currency: 'INR',
              dealUrl: fullUrl,
              category: 'Travel',
              subcategory: 'Packages',
              partner: 'Yatra',
              confidence: 0.8,
              source: 'yatra_scraper'
            });
          }
        } catch (error) {
          console.error('Error parsing Yatra deal:', error);
        }
      });

      console.log(`Success Found ${deals.length} deals from Yatra`);
      return deals;
    } catch (error) {
      console.error('Error scraping Yatra:', error);
      return [];
    }
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest(url: string, retries: number = 0): Promise<any> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 15000,
        maxRedirects: 5
      });
      
      return response;
    } catch (error) {
      if (retries < this.maxRetries) {
        console.log(`Warning Request failed, retrying... (${retries + 1}/${this.maxRetries})`);
        await this.delay(1000 * (retries + 1)); // Exponential backoff
        return this.makeRequest(url, retries + 1);
      }
      throw error;
    }
  }

  /**
   * Clean and normalize text
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[\n\r\t]/g, ' ')
      .trim()
      .substring(0, 200); // Limit length
  }

  /**
   * Extract price from text
   */
  private extractPrice(text: string): string {
    if (!text) return '₹0';
    
    const priceMatch = text.match(/₹\s*([0-9,]+)|INR\s*([0-9,]+)|Rs\.?\s*([0-9,]+)/i);
    if (priceMatch) {
      const price = priceMatch[1] || priceMatch[2] || priceMatch[3];
      return `₹${price}`;
    }
    
    // Look for just numbers
    const numberMatch = text.match(/([0-9,]+)/);
    if (numberMatch) {
      return `₹${numberMatch[1]}`;
    }
    
    return '₹0';
  }

  /**
   * Extract discount from text
   */
  private extractDiscount(text: string): string {
    if (!text) return '';
    
    const discountMatch = text.match(/(\d+)%\s*off|save\s*₹?\s*([0-9,]+)|up\s*to\s*₹?\s*([0-9,]+)/i);
    if (discountMatch) {
      return discountMatch[1] ? `${discountMatch[1]}%` : `₹${discountMatch[2] || discountMatch[3]}`;
    }
    
    return '';
  }

  /**
   * Add delay between requests
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get scraping statistics
   */
  public getScrapingStats(): {
    supportedSites: number;
    lastScrapeTime: string;
    requestDelay: number;
    maxRetries: number;
  } {
    return {
      supportedSites: 6,
      lastScrapeTime: new Date().toISOString(),
      requestDelay: this.requestDelay,
      maxRetries: this.maxRetries
    };
  }
}

// Export singleton instance
export const travelWebsiteScraper = new TravelWebsiteScraper();

// Export utility functions
export async function scrapeAllTravelSites(): Promise<ScrapedDeal[]> {
  return await travelWebsiteScraper.scrapeAllSites();
}

export async function scrapeTravelSite(website: string): Promise<ScrapedDeal[]> {
  return await travelWebsiteScraper.scrapeWebsite(website);
}