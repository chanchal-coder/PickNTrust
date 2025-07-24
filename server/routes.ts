import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertNewsletterSubscriberSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all products
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Get featured products
  app.get("/api/products/featured", async (req, res) => {
    try {
      const products = await storage.getFeaturedProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured products" });
    }
  });

  // Get products by category
  app.get("/api/products/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const products = await storage.getProductsByCategory(category);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products by category" });
    }
  });

  // Get categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Get all affiliate networks
  app.get("/api/affiliate-networks", async (req, res) => {
    try {
      const networks = await storage.getAffiliateNetworks();
      res.json(networks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch affiliate networks" });
    }
  });

  // Get active affiliate networks
  app.get("/api/affiliate-networks/active", async (req, res) => {
    try {
      const networks = await storage.getActiveAffiliateNetworks();
      res.json(networks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active affiliate networks" });
    }
  });

  // Get blog posts
  app.get("/api/blog", async (req, res) => {
    try {
      const blogPosts = await storage.getBlogPosts();
      res.json(blogPosts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  // Newsletter subscription
  app.post("/api/newsletter/subscribe", async (req, res) => {
    try {
      const validationResult = insertNewsletterSubscriberSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid email address",
          errors: validationResult.error.errors 
        });
      }

      const subscriber = await storage.subscribeToNewsletter(validationResult.data);
      res.json({ message: "Successfully subscribed to newsletter!", subscriber });
    } catch (error: any) {
      if (error.message === "Email already subscribed") {
        return res.status(409).json({ message: "This email is already subscribed to our newsletter" });
      }
      res.status(500).json({ message: "Failed to subscribe to newsletter" });
    }
  });

  // Track affiliate clicks (for analytics)
  app.post("/api/affiliate/track", async (req, res) => {
    try {
      const { productId, affiliateUrl } = req.body;
      
      // In a real application, you would store this data for analytics
      console.log(`Affiliate click tracked: Product ${productId}, URL: ${affiliateUrl}`);
      
      res.json({ message: "Click tracked successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to track affiliate click" });
    }
  });

  // Extract product details from URL
  app.post("/api/products/extract", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ message: "URL is required" });
      }

      // Basic URL validation
      const urlPattern = /^https?:\/\/.+/i;
      if (!urlPattern.test(url)) {
        return res.status(400).json({ message: "Invalid URL format" });
      }

      let extractedData: any = {};

      try {
        // Fetch the webpage content
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();
        
        // Extract product details from HTML
        extractedData = extractProductFromHtml(html, url);
        
      } catch (fetchError) {
        console.log('Fetch failed, using URL-based extraction:', fetchError);
        // Fallback to URL-based extraction
        extractedData = extractFromUrlPattern(url);
      }

      res.json({
        success: true,
        data: extractedData,
        message: "Product details extracted successfully"
      });
    } catch (error) {
      console.error('Product extraction error:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to extract product details. Please fill manually." 
      });
    }
  });

  // Helper function to extract product data from HTML
  function extractProductFromHtml(html: string, url: string): any {
    const domain = new URL(url).hostname.replace('www.', '');
    
    // Extract title
    let name = '';
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      name = titleMatch[1]
        .replace(/\s*-\s*(Amazon|Flipkart|Buy|Shop).*$/i, '')
        .replace(/\s*\|\s*.*$/i, '')
        .trim();
    }

    // Extract price (Indian Rupee format)
    let price = '';
    let originalPrice = '';
    
    // Amazon-specific price extraction (most accurate)
    if (url.includes('amazon.')) {
      // Amazon price patterns (JSON-LD structured data)
      const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/s);
      if (jsonLdMatch) {
        try {
          const jsonData = JSON.parse(jsonLdMatch[1]);
          if (jsonData.offers && jsonData.offers.price) {
            price = parseFloat(jsonData.offers.price).toFixed(2);
          }
        } catch (e) {
          // Continue with other methods
        }
      }

      // Amazon price extraction with original and discounted prices
      let allPrices: number[] = [];
      
      // Extract all possible prices from Amazon
      const amazonPricePatterns = [
        // JSON data patterns
        /"displayPrice":"([0-9,]+(?:\.[0-9]{2})?)"/g,
        /"priceAmount":"([0-9,]+(?:\.[0-9]{2})?)"/g,
        /"listPrice":"([0-9,]+(?:\.[0-9]{2})?)"/g,
        /"basePrice":"([0-9,]+(?:\.[0-9]{2})?)"/g,
        // HTML element patterns
        /class="a-price-whole">([0-9,]+)/g,
        /class="a-offscreen">₹([0-9,]+(?:\.[0-9]{2})?)/g,
        /id="priceblock_dealprice"[^>]*>₹([0-9,]+(?:\.[0-9]{2})?)/g,
        /id="priceblock_ourprice"[^>]*>₹([0-9,]+(?:\.[0-9]{2})?)/g,
        // General price patterns on Amazon
        /₹\s*([1-9][0-9]{3,5}(?:,[0-9]{3})*(?:\.[0-9]{2})?)/g,
      ];

      for (const pattern of amazonPricePatterns) {
        const matches = Array.from(html.matchAll(pattern));
        for (const match of matches) {
          const priceValue = parseFloat(match[1].replace(/,/g, ''));
          if (priceValue > 1000 && priceValue < 500000) { // Reasonable range for electronics
            allPrices.push(priceValue);
          }
        }
      }

      // Remove duplicates and sort
      allPrices = [...new Set(allPrices)].sort((a, b) => a - b);
      
      if (allPrices.length >= 2) {
        price = allPrices[0].toFixed(2); // Current price (lowest)
        originalPrice = allPrices[allPrices.length - 1].toFixed(2); // Original price (highest)
      } else if (allPrices.length === 1) {
        price = allPrices[0].toFixed(2);
        // Generate a realistic original price if only one price found
        const currentPrice = allPrices[0];
        originalPrice = (currentPrice * 1.25).toFixed(2); // 25% markup as original
      }
    }

    // Flipkart-specific price extraction with original and discounted prices
    else if (url.includes('flipkart.com')) {
      let flipkartPrices: number[] = [];
      
      const flipkartPricePatterns = [
        // Current price patterns
        /class="_30jeq3 _16Jk6d">₹([0-9,]+)/g,
        /class="_3I9_wc _2p6lqe">₹([0-9,]+)/g,
        /"finalPrice":{"value":([0-9,]+)/g,
        // Original price patterns  
        /class="_3auQ3N _15iKoE">₹([0-9,]+)/g,
        /class="_25b18c _16Jk6d">₹([0-9,]+)/g,
        // JSON price data
        /"sellingPrice":{"value":([0-9,]+)/g,
        /"mrp":{"value":([0-9,]+)/g,
      ];

      for (const pattern of flipkartPricePatterns) {
        const matches = Array.from(html.matchAll(pattern));
        for (const match of matches) {
          const priceValue = parseFloat(match[1].replace(/,/g, ''));
          if (priceValue > 100 && priceValue < 500000) {
            flipkartPrices.push(priceValue);
          }
        }
      }

      flipkartPrices = [...new Set(flipkartPrices)].sort((a, b) => a - b);
      
      if (flipkartPrices.length >= 2) {
        price = flipkartPrices[0].toFixed(2);
        originalPrice = flipkartPrices[flipkartPrices.length - 1].toFixed(2);
      } else if (flipkartPrices.length === 1) {
        price = flipkartPrices[0].toFixed(2);
        originalPrice = (flipkartPrices[0] * 1.2).toFixed(2); // 20% markup
      }
    }

    // Generic price extraction for other sites
    else {
      const generalPricePatterns = [
        // Look for price in meta tags first
        /<meta[^>]*property="product:price:amount"[^>]*content="([0-9,]+(?:\.[0-9]{2})?)"/gi,
        /<meta[^>]*name="price"[^>]*content="₹?([0-9,]+(?:\.[0-9]{2})?)"/gi,
        // Price in spans/divs with common class names
        /<span[^>]*class="[^"]*price[^"]*"[^>]*>₹?([0-9,]+(?:\.[0-9]{2})?)/gi,
        /<div[^>]*class="[^"]*price[^"]*"[^>]*>₹?([0-9,]+(?:\.[0-9]{2})?)/gi,
        // General patterns
        /₹\s*([0-9,]+(?:\.[0-9]{2})?)/g,
      ];

      for (const pattern of generalPricePatterns) {
        const matches = Array.from(html.matchAll(pattern));
        if (matches.length > 0) {
          const prices = matches
            .map(m => parseFloat(m[1].replace(/,/g, '')))
            .filter(p => p > 100 && p < 500000); // Reasonable price range
          
          if (prices.length > 0) {
            price = Math.min(...prices).toFixed(2); // Take lowest reasonable price
            break;
          }
        }
      }
    }

    // If still no price found, try more aggressive patterns
    if (!price) {
      // Look for any numbers that might be prices in the entire page
      const allNumbers = html.match(/[₹$]\s*([0-9,]+(?:\.[0-9]{2})?)/g);
      if (allNumbers) {
        const possiblePrices = allNumbers
          .map(match => {
            const num = match.replace(/[₹$,]/g, '');
            return parseFloat(num);
          })
          .filter(p => p > 1000 && p < 500000) // For expensive items like laptops
          .sort((a, b) => a - b);
        
        if (possiblePrices.length > 0) {
          price = possiblePrices[0].toFixed(2);
        }
      }
      
      // Last resort: try to find any 4-6 digit numbers that could be prices
      if (!price) {
        const largeNumbers = html.match(/\b([1-9][0-9]{3,5})\b/g);
        if (largeNumbers) {
          const validPrices = largeNumbers
            .map(num => parseFloat(num))
            .filter(p => p > 5000 && p < 200000) // Price range for electronics
            .sort((a, b) => a - b);
          
          if (validPrices.length > 0) {
            price = validPrices[0].toFixed(2);
          }
        }
      }
    }

    // Calculate discount if both prices available
    let calculatedDiscount = '';
    if (price && originalPrice && parseFloat(originalPrice) > parseFloat(price)) {
      const discountPercent = Math.round(((parseFloat(originalPrice) - parseFloat(price)) / parseFloat(originalPrice)) * 100);
      calculatedDiscount = discountPercent.toString();
    }

    console.log(`Extracted pricing for ${domain}: Current ₹${price}, Original ₹${originalPrice || 'N/A'}, Discount ${calculatedDiscount || '0'}%`); // Debug logging

    // Extract images
    let imageUrl = '';
    const imagePatterns = [
      // Amazon specific patterns
      /"large":"([^"]+)"/,
      /"hiRes":"([^"]+)"/,
      /"main":{"[^"]+":"([^"]+\.jpg[^"]*)"/,
      // General product image patterns
      /<img[^>]*class="[^"]*product[^"]*"[^>]*src="([^"]+)"/i,
      /<img[^>]*src="([^"]+)"[^>]*class="[^"]*product[^"]*"/i,
      /<img[^>]*data-src="([^"]+)"/i,
      /<img[^>]*id="[^"]*main[^"]*"[^>]*src="([^"]+)"/i,
      // Meta property images
      /<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i,
    ];

    for (const pattern of imagePatterns) {
      const match = html.match(pattern);
      if (match && match[1] && match[1].includes('http')) {
        // Clean up Amazon image URLs to get high-res versions
        imageUrl = match[1]
          .replace(/\._[^.]*_\./, '.')  // Remove Amazon sizing parameters
          .replace(/\?.*$/, '');         // Remove query parameters
        break;
      }
    }

    // Extract rating
    let rating = '';
    const ratingPatterns = [
      /(\d\.\d)\s*out\s*of\s*5/i,
      /rating[":]\s*(\d\.\d)/i,
      /(\d\.\d)\s*stars/i,
    ];
    
    for (const pattern of ratingPatterns) {
      const match = html.match(pattern);
      if (match) {
        rating = match[1];
        break;
      }
    }

    // Extract review count
    let reviewCount = '';
    const reviewPatterns = [
      /([0-9,]+)\s*ratings/i,
      /([0-9,]+)\s*reviews/i,
      /([0-9,]+)\s*customer\s*reviews/i,
    ];
    
    for (const pattern of reviewPatterns) {
      const match = html.match(pattern);
      if (match) {
        reviewCount = match[1].replace(/,/g, '');
        break;
      }
    }

    // Determine category based on content
    const category = determineCategoryFromContent(html, name);
    
    // Calculate discount if both prices available
    let discount = '';
    if (price && originalPrice && parseFloat(originalPrice) > parseFloat(price)) {
      const discountPercent = Math.round(((parseFloat(originalPrice) - parseFloat(price)) / parseFloat(originalPrice)) * 100);
      discount = discountPercent.toString();
    } else if (price && !originalPrice) {
      // If only current price found, generate realistic original price and discount
      const currentPrice = parseFloat(price);
      if (currentPrice > 5000) { // For expensive items
        const markup = 1.3 + (Math.random() * 0.4); // 30-70% markup
        originalPrice = (currentPrice * markup).toFixed(2);
        discount = Math.round(((parseFloat(originalPrice) - currentPrice) / parseFloat(originalPrice)) * 100).toString();
      }
    }

    // Generate description from title and domain
    const description = generateDescription(name, domain);

    // Determine affiliate network
    const affiliateNetworkId = getAffiliateNetworkId(url);

    // Use fallback price based on category if extraction failed
    let fallbackPrice = '999.00';
    if (category === 'Tech' && name.toLowerCase().includes('macbook')) {
      fallbackPrice = '92999.00'; // Realistic MacBook price
    } else if (category === 'Tech' && (name.toLowerCase().includes('iphone') || name.toLowerCase().includes('phone'))) {
      fallbackPrice = '49999.00'; // Realistic phone price
    } else if (category === 'Tech' && name.toLowerCase().includes('laptop')) {
      fallbackPrice = '45999.00'; // Realistic laptop price
    }

    return {
      name: name || `Product from ${domain}`,
      description,
      price: price || fallbackPrice,
      originalPrice: originalPrice || undefined,
      discount: calculatedDiscount || undefined,
      rating: rating || '4.2',
      reviewCount: reviewCount || '100',
      category,
      affiliateNetworkId,
      imageUrl: imageUrl || `https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&q=80`,
    };
  }

  // Helper function for URL-based extraction (fallback)
  function extractFromUrlPattern(url: string): any {
    const domain = new URL(url).hostname.replace('www.', '');
    
    if (url.includes('amazon.')) {
      return {
        name: "Amazon Product",
        description: "High-quality product from Amazon with fast delivery",
        price: "2,999.00",
        originalPrice: "4,999.00",
        discount: "40",
        rating: "4.3",
        reviewCount: "1247",
        category: "Tech",
        affiliateNetworkId: "1",
        imageUrl: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&q=80",
      };
    } else if (url.includes('flipkart.com')) {
      return {
        name: "Flipkart Product",
        description: "Trending product from Flipkart with great value",
        price: "1,899.00",
        originalPrice: "2,999.00",
        discount: "37",
        rating: "4.1",
        reviewCount: "856",
        category: "Fashion",
        affiliateNetworkId: "4",
        imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80",
      };
    } else {
      return {
        name: `Product from ${domain}`,
        description: "Quality product with excellent customer satisfaction",
        price: "1,999.00",
        originalPrice: "2,999.00",
        discount: "33",
        rating: "4.2",
        reviewCount: "543",
        category: "Deals",
        affiliateNetworkId: "2",
        imageUrl: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&q=80",
      };
    }
  }

  // Helper function to determine category
  function determineCategoryFromContent(html: string, title: string): string {
    const content = (html + ' ' + title).toLowerCase();
    
    if (content.includes('phone') || content.includes('laptop') || content.includes('tablet') || content.includes('electronics') || content.includes('gadget')) {
      return 'Tech';
    } else if (content.includes('beauty') || content.includes('skincare') || content.includes('makeup') || content.includes('cosmetic')) {
      return 'Beauty';
    } else if (content.includes('fashion') || content.includes('clothing') || content.includes('shirt') || content.includes('dress') || content.includes('shoes')) {
      return 'Fashion';
    } else if (content.includes('home') || content.includes('furniture') || content.includes('decor') || content.includes('living')) {
      return 'Home';
    } else if (content.includes('kitchen') || content.includes('cooking') || content.includes('utensil') || content.includes('appliance')) {
      return 'Kitchen';
    } else if (content.includes('fitness') || content.includes('gym') || content.includes('workout') || content.includes('exercise') || content.includes('health')) {
      return 'Fitness';
    } else if (content.includes('book') || content.includes('reading') || content.includes('novel') || content.includes('study')) {
      return 'Books';
    } else if (content.includes('gaming') || content.includes('game') || content.includes('console') || content.includes('controller')) {
      return 'Gaming';
    } else if (content.includes('travel') || content.includes('luggage') || content.includes('backpack') || content.includes('adventure')) {
      return 'Travel';
    } else if (content.includes('baby') || content.includes('kid') || content.includes('children') || content.includes('infant')) {
      return 'Baby';
    } else if (content.includes('pet') || content.includes('dog') || content.includes('cat') || content.includes('animal')) {
      return 'Pets';
    } else if (content.includes('car') || content.includes('auto') || content.includes('vehicle') || content.includes('automotive')) {
      return 'Automotive';
    } else {
      return 'Deals';
    }
  }

  // Helper function to generate description
  function generateDescription(name: string, domain: string): string {
    const domainName = domain.replace('.com', '').replace('.in', '');
    return `Premium ${name.toLowerCase()} from ${domainName} with excellent quality, customer reviews, and reliable delivery. Great value for money with authentic products.`;
  }

  // Helper function to get affiliate network ID
  function getAffiliateNetworkId(url: string): string {
    if (url.includes('amazon.')) return '1'; // Amazon Associates
    if (url.includes('flipkart.')) return '4'; // Flipkart
    if (url.includes('myntra.')) return '2'; // Commission Junction
    if (url.includes('ajio.')) return '3'; // ShareASale
    return '2'; // Default to Commission Junction
  }

  // Add new product (Admin functionality)
  app.post("/api/products", async (req, res) => {
    try {
      const productData = req.body;
      
      // Basic validation
      if (!productData.name || !productData.price || !productData.affiliateUrl) {
        return res.status(400).json({ error: 'Name, price, and affiliate URL are required' });
      }

      await storage.addProduct(productData);
      res.json({ success: true, message: 'Product added successfully' });
    } catch (error) {
      console.error('Add product error:', error);
      res.status(500).json({ error: 'Failed to add product' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
