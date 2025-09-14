import axios from 'axios';
import * as cheerio from 'cheerio';

interface ExtractedTravelData {
  success: boolean;
  data?: {
    name: string;
    description: string;
    price: string;
    originalPrice?: string;
    currency: string;
    imageUrl: string;
    categoryFields: Record<string, any>;
    styling?: {
      cardBackground?: string;
      fieldColors?: Record<string, string>;
      fieldStyles?: Record<string, any>;
    };
  };
  error?: string;
}

export class TravelDataExtractor {
  private static readonly USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  
  static async extractFromUrl(url: string, category: string): Promise<ExtractedTravelData> {
    try {
      console.log(`🔍 Extracting ${category} data from:`, url);
      
      // Fetch the webpage
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
        timeout: 10000,
      });
      
      const $ = cheerio.load(response.data);
      const domain = new URL(url).hostname.toLowerCase();
      
      // Extract based on category and domain
      switch (category) {
        case 'flights':
          return this.extractFlightData($, domain, url);
        case 'hotels':
          return this.extractHotelData($, domain, url);
        case 'tours':
          return this.extractTourData($, domain, url);
        case 'cruises':
          return this.extractCruiseData($, domain, url);
        case 'bus':
          return this.extractBusData($, domain, url);
        case 'train':
          return this.extractTrainData($, domain, url);
        case 'packages':
          return this.extractPackageData($, domain, url);
        case 'car-rental':
          return this.extractCarRentalData($, domain, url);
        default:
          return this.extractGenericTravelData($, domain, url);
      }
    } catch (error) {
      console.error('Extraction error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to extract data from URL'
      };
    }
  }
  
  private static extractFlightData($: any, domain: string, url: string): ExtractedTravelData {
    let data: any = {
      name: '',
      description: '',
      price: '',
      originalPrice: '',
      currency: 'INR',
      imageUrl: '',
      categoryFields: {}
    };
    
    try {
      // Common flight booking sites
      if (domain.includes('makemytrip')) {
        data.name = $('h1, .font24, .makeFlex.hrtlCenter h1').first().text().trim() || 'Flight Booking';
        data.price = $('.price, .actual-price, .font22').first().text().replace(/[^\d,]/g, '') || '';
        data.originalPrice = $('.strike, .old-price').first().text().replace(/[^\d,]/g, '') || '';
        
        // Extract flight details
        data.categoryFields.departure = $('.dept-city, .from-city').first().text().trim();
        data.categoryFields.arrival = $('.arr-city, .to-city').first().text().trim();
        data.categoryFields.departureTime = $('.dept-time').first().text().trim();
        data.categoryFields.arrivalTime = $('.arr-time').first().text().trim();
        data.categoryFields.duration = $('.duration').first().text().trim();
        data.categoryFields.airline = $('.airline-name, .carrier-name').first().text().trim();
        data.categoryFields.stops = $('.stops-info').first().text().trim() || 'Non-stop';
        data.categoryFields.flightClass = $('.class-info').first().text().trim() || 'Economy';
        
      } else if (domain.includes('goibibo')) {
        data.name = $('h1, .title').first().text().trim() || 'Flight Deal';
        data.price = $('.price-info, .fare').first().text().replace(/[^\d,]/g, '') || '';
        
        data.categoryFields.departure = $('.origin').first().text().trim();
        data.categoryFields.arrival = $('.destination').first().text().trim();
        data.categoryFields.airline = $('.airline').first().text().trim();
        
      } else if (domain.includes('cleartrip')) {
        data.name = $('h1, .flight-name').first().text().trim() || 'Flight Booking';
        data.price = $('.price, .fare-price').first().text().replace(/[^\d,]/g, '') || '';
        
      } else {
        // Generic extraction
        data.name = $('h1, title').first().text().trim() || 'Flight Deal';
        data.price = $('[class*="price"], [class*="fare"], [class*="cost"]').first().text().replace(/[^\d,]/g, '') || '';
      }
      
      // Extract image
      data.imageUrl = $('img[src*="flight"], img[src*="plane"], .flight-image img').first().attr('src') || 
                     'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=300&fit=crop';
      
      // Set description
      data.description = `Book ${data.categoryFields.airline || 'flights'} from ${data.categoryFields.departure || 'your city'} to ${data.categoryFields.arrival || 'destination'} with great deals and offers.`;
      
      // Determine route type
      data.categoryFields.routeType = this.determineRouteType(data.categoryFields.departure, data.categoryFields.arrival);
      
      return { success: true, data };
      
    } catch (error) {
      console.error('Flight extraction error:', error);
      return { success: false, error: 'Failed to extract flight data' };
    }
  }
  
  private static extractHotelData($: any, domain: string, url: string): ExtractedTravelData {
    let data: any = {
      name: '',
      description: '',
      price: '',
      originalPrice: '',
      currency: 'INR',
      imageUrl: '',
      categoryFields: {}
    };
    
    try {
      if (domain.includes('booking.com')) {
        data.name = $('h2[data-testid="title"], .pp-header__title').first().text().trim();
        data.price = $('.priceblock-dealPrice, .bui-price-display__value').first().text().replace(/[^\d,]/g, '') || '';
        data.categoryFields.location = $('.hp_address_subtitle').first().text().trim();
        data.categoryFields.rating = $('.bui-review-score__badge').first().text().trim();
        
      } else if (domain.includes('agoda.com')) {
        data.name = $('h1[data-selenium="hotel-header-name"]').first().text().trim();
        data.price = $('.PropertyPriceSection__Value').first().text().replace(/[^\d,]/g, '') || '';
        
      } else if (domain.includes('makemytrip')) {
        data.name = $('.htl_name, .hotel-name').first().text().trim();
        data.price = $('.price, .actual-price').first().text().replace(/[^\d,]/g, '') || '';
        data.categoryFields.location = $('.htl_loc, .location').first().text().trim();
        
      } else {
        // Generic extraction
        data.name = $('h1, .hotel-name, [class*="hotel"][class*="name"]').first().text().trim();
        data.price = $('[class*="price"], [class*="rate"], [class*="cost"]').first().text().replace(/[^\d,]/g, '') || '';
      }
      
      // Extract hotel-specific details
      data.categoryFields.hotelType = this.determineHotelType(data.name);
      data.categoryFields.amenities = this.extractAmenities($);
      data.categoryFields.cancellation = $('.cancellation, .refund').first().text().trim() || 'Check cancellation policy';
      
      // Extract image
      data.imageUrl = $('img[src*="hotel"], .hotel-image img, .property-image img').first().attr('src') || 
                     'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop';
      
      data.description = `Stay at ${data.name} in ${data.categoryFields.location || 'prime location'} with excellent amenities and service.`;
      
      return { success: true, data };
      
    } catch (error) {
      console.error('Hotel extraction error:', error);
      return { success: false, error: 'Failed to extract hotel data' };
    }
  }
  
  private static extractTourData($: any, domain: string, url: string): ExtractedTravelData {
    // Implementation for tour data extraction
    return this.extractGenericTravelData($, domain, url);
  }
  
  private static extractGenericTravelData($: any, domain: string, url: string): ExtractedTravelData {
    try {
      const data = {
        name: $('h1, title').first().text().trim() || 'Travel Deal',
        description: $('meta[name="description"]').attr('content') || 'Great travel deal with amazing offers.',
        price: $('[class*="price"], [class*="cost"], [class*="fare"]').first().text().replace(/[^\d,]/g, '') || '',
        originalPrice: $('[class*="original"], [class*="strike"], [class*="old"]').first().text().replace(/[^\d,]/g, '') || '',
        currency: this.detectCurrency($),
        imageUrl: $('img').first().attr('src') || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop',
        categoryFields: {}
      };
      
      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Failed to extract generic travel data' };
    }
  }
  
  // Helper methods
  private static determineRouteType(departure?: string, arrival?: string): string {
    if (!departure || !arrival) return 'domestic';
    
    const indianCities = ['mumbai', 'delhi', 'bangalore', 'chennai', 'kolkata', 'hyderabad', 'pune', 'ahmedabad', 'jaipur', 'goa'];
    const isDepartureIndian = indianCities.some(city => departure.toLowerCase().includes(city));
    const isArrivalIndian = indianCities.some(city => arrival.toLowerCase().includes(city));
    
    return (isDepartureIndian && isArrivalIndian) ? 'domestic' : 'international';
  }
  
  private static determineHotelType(name: string): string {
    const luxuryKeywords = ['luxury', 'palace', 'resort', 'grand', 'royal', 'premium', 'deluxe'];
    const budgetKeywords = ['budget', 'economy', 'basic', 'simple'];
    
    const nameLower = name.toLowerCase();
    
    if (luxuryKeywords.some(keyword => nameLower.includes(keyword))) return 'Luxury';
    if (budgetKeywords.some(keyword => nameLower.includes(keyword))) return 'Budget';
    
    return 'Business';
  }
  
  private static extractAmenities($: any): string {
    const amenities: string[] = [];
    
    $('[class*="amenity"], [class*="facility"], .amenities li, .facilities li').each((_, el) => {
      const amenity = $(el).text().trim();
      if (amenity && amenity.length < 50) {
        amenities.push(amenity);
      }
    });
    
    return amenities.slice(0, 10).join(', ') || 'WiFi, AC, Room Service';
  }
  
  private static detectCurrency($: any): string {
    const text = $.html();
    
    if (text.includes('₹') || text.includes('INR')) return 'INR';
    if (text.includes('$') || text.includes('USD')) return 'USD';
    if (text.includes('€') || text.includes('EUR')) return 'EUR';
    if (text.includes('£') || text.includes('GBP')) return 'GBP';
    
    return 'INR'; // Default
  }
  
  // Additional extraction methods for other categories
  
  private static extractCruiseData($: any, domain: string, url: string): ExtractedTravelData {
    // Implementation for cruise data extraction
    return this.extractGenericTravelData($, domain, url);
  }
  
  private static extractBusData($: any, domain: string, url: string): ExtractedTravelData {
    // Implementation for bus data extraction
    return this.extractGenericTravelData($, domain, url);
  }
  
  private static extractTrainData($: any, domain: string, url: string): ExtractedTravelData {
    // Implementation for train data extraction
    return this.extractGenericTravelData($, domain, url);
  }
  
  private static extractPackageData($: any, domain: string, url: string): ExtractedTravelData {
    // Implementation for package data extraction
    return this.extractGenericTravelData($, domain, url);
  }
  
  private static extractCarRentalData($: any, domain: string, url: string): ExtractedTravelData {
    // Implementation for car rental data extraction
    return this.extractGenericTravelData($, domain, url);
  }
}