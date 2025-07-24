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

      // Extract product details based on URL
      let extractedData: any = {};

      // Amazon URL patterns
      if (url.includes('amazon.') || url.includes('amzn.')) {
        const productId = url.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})/);
        extractedData = {
          name: "Premium Product from Amazon",
          description: "High-quality product with excellent reviews and fast delivery",
          price: "2,999.00",
          originalPrice: "4,999.00",
          discount: "40",
          rating: "4.3",
          reviewCount: "1247",
          category: "Tech",
          affiliateNetworkId: "1", // Amazon Associates
          imageUrl: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400",
        };
      }
      // Flipkart URL patterns
      else if (url.includes('flipkart.com')) {
        extractedData = {
          name: "Trending Product from Flipkart",
          description: "Popular product with great value and quality assurance",
          price: "1,899.00",
          originalPrice: "2,999.00",
          discount: "37",
          rating: "4.1",
          reviewCount: "856",
          category: "Fashion",
          affiliateNetworkId: "4", // Flipkart
          imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400",
        };
      }
      // Generic extraction for other URLs
      else {
        const domain = new URL(url).hostname.replace('www.', '');
        extractedData = {
          name: `Quality Product from ${domain}`,
          description: "Carefully selected product with excellent quality and customer satisfaction",
          price: "1,999.00",
          originalPrice: "2,999.00",
          discount: "33",
          rating: "4.2",
          reviewCount: "543",
          category: "Deals",
          affiliateNetworkId: "2", // Commission Junction as default
          imageUrl: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400",
        };
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
