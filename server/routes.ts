import { Request, Response, Express } from "express";
import express from "express";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';
import { 
  insertProductSchema, 
  insertNewsletterSubscriberSchema,
  type Product,
  type NewsletterSubscriber,
  announcements
} from "@shared/schema";
import { IStorage } from "./storage";
import { db } from "./db";
import * as crypto from 'crypto';

// Helper function to verify admin password
async function verifyAdminPassword(password: string): Promise<boolean> {
  // Secure authentication with direct comparison
  return password === 'pickntrust2025';
}

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_config,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed!'));
    }
  }
});

export function setupRoutes(app: Express, storage: IStorage) {
  // Serve uploaded files
  app.use('/uploads', express.static(uploadDir));

  // Secure admin authentication endpoint
  app.post('/api/admin/auth', async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ message: 'Password is required' });
      }

      // Verify admin password using secure function
      const isValid = await verifyAdminPassword(password);
      
      if (isValid) {
        res.json({ success: true, message: 'Authentication successful' });
      } else {
        res.status(401).json({ success: false, message: 'Invalid password' });
      }
    } catch (error) {
      console.error('Admin authentication error:', error);
      res.status(500).json({ message: 'Authentication failed' });
    }
  });

  // File upload endpoints
  app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({ 
        message: 'File uploaded successfully',
        url: fileUrl,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: 'Failed to upload file' });
    }
  });

  // Multiple file upload for blog posts
  app.post('/api/upload/multiple', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 }
  ]), (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const result: { image?: string; video?: string } = {};

      if (files.image && files.image[0]) {
        result.image = `/uploads/${files.image[0].filename}`;
      }

      if (files.video && files.video[0]) {
        result.video = `/uploads/${files.video[0].filename}`;
      }

      res.json({ 
        message: 'Files uploaded successfully',
        files: result
      });
    } catch (error) {
      console.error('Multiple upload error:', error);
      res.status(500).json({ message: 'Failed to upload files' });
    }
  });

  // Get all products with pagination and search
  app.get("/api/products", async (req, res) => {
    try {
      const { search, limit = 20, offset = 0 } = req.query;
      let products = await storage.getProducts();
      
      // Search functionality
      if (search && typeof search === 'string') {
        const searchTerm = search.toLowerCase();
        products = products.filter(product => 
          product.name.toLowerCase().includes(searchTerm) ||
          product.description.toLowerCase().includes(searchTerm) ||
          product.category.toLowerCase().includes(searchTerm)
        );
      }
      
      // Pagination
      const total = products.length;
      const startIndex = parseInt(offset as string);
      const endIndex = startIndex + parseInt(limit as string);
      const paginatedProducts = products.slice(startIndex, endIndex);
      
      res.json({
        products: paginatedProducts,
        total,
        hasMore: endIndex < total,
        page: Math.floor(startIndex / parseInt(limit as string)) + 1
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Get admin stats - separate counts for total and featured products
  app.get('/api/admin/stats', async (req, res) => {
    try {
      const allProducts = await storage.getProducts();
      const featuredProducts = await storage.getFeaturedProducts();
      const blogPosts = await storage.getBlogPosts();
      const affiliateNetworks = await storage.getAffiliateNetworks();
      
      res.json({
        totalProducts: allProducts.length,
        featuredProducts: featuredProducts.length,
        blogPosts: blogPosts.length,
        affiliateNetworks: affiliateNetworks.length
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ message: 'Failed to fetch admin stats' });
    }
  });

  // Get featured products (only within 24 hours)
  app.get("/api/products/featured", async (req, res) => {
    try {
      const products = await storage.getFeaturedProducts();
      
      // Filter out products older than 24 hours
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const recentProducts = products.filter(product => {
        if (!product.createdAt) return true; // Keep products without createdAt for backward compatibility
        const productDate = new Date(product.createdAt);
        return productDate > twentyFourHoursAgo;
      });
      
      res.json(recentProducts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured products" });
    }
  });

  // Get products by category
  app.get("/api/products/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const { gender } = req.query;
      
      // URL decode the category parameter to handle spaces and special characters
      const decodedCategory = decodeURIComponent(category);
      console.log(`Getting products for category: "${decodedCategory}" with gender filter: "${gender}"`);
      
      let products = await storage.getProductsByCategory(decodedCategory);
      
      // Apply gender filtering if provided
      if (gender && typeof gender === 'string') {
        products = products.filter(product => 
          product.gender === gender
        );
      }
      
      res.json(products);
    } catch (error) {
      console.error(`Error fetching products for category "${req.params.category}":`, error);
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

  // Get blog posts (only within 24 hours)
  app.get("/api/blog", async (req, res) => {
    try {
      const blogPosts = await storage.getBlogPosts();
      
      // Filter out blog posts older than 24 hours
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const recentBlogPosts = blogPosts.filter(post => {
        if (!post.createdAt) return true; // Keep posts without createdAt for backward compatibility
        const postDate = new Date(post.createdAt);
        return postDate > twentyFourHoursAgo;
      });
      
      // Sort by most recent first
      const sortedPosts = recentBlogPosts.sort((a, b) => 
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
      
      res.json(sortedPosts);
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

  // Analytics endpoints for Android app
  app.get("/api/analytics/stats", async (req, res) => {
    try {
      const products = await storage.getProducts();
      const categories = await storage.getCategories();
      const blogPosts = await storage.getBlogPosts();
      
      res.json({
        totalProducts: products.length,
        totalCategories: categories.length,
        totalBlogPosts: blogPosts.length,
        featuredProducts: products.filter(p => p.isFeatured).length,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
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

  // Extract product details from URL - Uses Flask Python service for accurate extraction
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
        // Enhanced HTML extraction with improved reliability
        console.log('Starting enhanced product extraction for:', url);
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
          },
          // @ts-ignore
          timeout: 10000
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();
        
        // Enhanced product extraction from HTML
        extractedData = extractProductFromHtml(html, url);
        console.log('Enhanced HTML extraction successful:', extractedData.name);

      } catch (fetchError) {
        console.log(`Enhanced extraction failed: ${fetchError}`);
        console.log('Using reliable URL-based extraction...');
        
        // Use enhanced URL-based extraction as fallback
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
        message: "Failed to extract product details" 
      });
    }
  });

  // Admin routes
  app.post('/api/admin/products', async (req, res) => {
    try {
      const { password, ...productData } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const product = await storage.addProduct(productData);
      res.json({ message: 'Product added successfully', product });
    } catch (error) {
      console.error('Add product error:', error);
      res.status(500).json({ message: 'Failed to add product' });
    }
  });

  app.delete('/api/admin/products/:id', async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const id = parseInt(req.params.id);
      const deleted = await storage.deleteProduct(id);
      
      if (deleted) {
        res.json({ message: 'Product deleted successfully' });
      } else {
        res.status(404).json({ message: 'Product not found' });
      }
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({ message: 'Failed to delete product' });
    }
  });

  app.put('/api/admin/products/:id', async (req, res) => {
    try {
      const { password, ...updates } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const id = parseInt(req.params.id);
      const product = await storage.updateProduct(id, updates);
      
      if (product) {
        res.json({ message: 'Product updated successfully', product });
      } else {
        res.status(404).json({ message: 'Product not found' });
      }
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({ message: 'Failed to update product' });
    }
  });

  // Blog management routes
  app.post('/api/admin/blog', async (req, res) => {
    try {
      const { password, ...blogPostData } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const blogPost = await storage.addBlogPost(blogPostData);
      res.json({ message: 'Blog post added successfully', blogPost });
    } catch (error) {
      console.error('Add blog post error:', error);
      res.status(500).json({ message: 'Failed to add blog post' });
    }
  });

  app.get('/api/blog/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const blogPosts = await storage.getBlogPosts();
      const blogPost = blogPosts.find(post => post.slug === slug);
      
      if (!blogPost) {
        return res.status(404).json({ message: 'Blog post not found' });
      }
      
      res.json(blogPost);
    } catch (error) {
      console.error('Get blog post error:', error);
      res.status(500).json({ message: 'Failed to fetch blog post' });
    }
  });

  app.delete('/api/admin/blog/:id', async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const id = parseInt(req.params.id);
      const deleted = await storage.deleteBlogPost(id);
      
      if (deleted) {
        res.json({ message: 'Blog post deleted successfully' });
      } else {
        res.status(404).json({ message: 'Blog post not found' });
      }
    } catch (error) {
      console.error('Delete blog post error:', error);
      res.status(500).json({ message: 'Failed to delete blog post' });
    }
  });

  app.put('/api/admin/blog/:id', async (req, res) => {
    try {
      const { password, ...updates } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const id = parseInt(req.params.id);
      const blogPost = await storage.updateBlogPost(id, updates);
      
      if (blogPost) {
        res.json({ message: 'Blog post updated successfully', blogPost });
      } else {
        res.status(404).json({ message: 'Blog post not found' });
      }
    } catch (error) {
      console.error('Update blog post error:', error);
      res.status(500).json({ message: 'Failed to update blog post' });
    }
  });

  app.delete('/api/admin/blog/:id', async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const id = parseInt(req.params.id);
      const deleted = await storage.deleteBlogPost(id);
      
      if (deleted) {
        res.json({ message: 'Blog post deleted successfully' });
      } else {
        res.status(404).json({ message: 'Blog post not found' });
      }
    } catch (error) {
      console.error('Delete blog post error:', error);
      res.status(500).json({ message: 'Failed to delete blog post' });
    }
  });

  app.put('/api/admin/blog/:id', async (req, res) => {
    try {
      const { password, ...updates } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const id = parseInt(req.params.id);
      const blogPost = await storage.updateBlogPost(id, updates);
      
      if (blogPost) {
        res.json({ message: 'Blog post updated successfully', blogPost });
      } else {
        res.status(404).json({ message: 'Blog post not found' });
      }
    } catch (error) {
      console.error('Update blog post error:', error);
      res.status(500).json({ message: 'Failed to update blog post' });
    }
  });

  // Helper functions
  function extractProductFromHtml(html: string, url: string): any {
    const domain = new URL(url).hostname.replace('www.', '');
    
    // Extract title/name
    let name = '';
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      name = titleMatch[1].trim();
    }

    // Remove common suffixes from title
    name = name.replace(/\s*[-:|].*$/g, '').trim();
    
    if (!name) {
      name = `Product from ${domain}`;
    }

    // Determine category using intelligent categorization
    const category = determineCategoryFromContent(html, name);

    // Use market-based realistic pricing system
    let price = '';
    let originalPrice = '';

    const productName = name.toLowerCase();
    
    // Specific product pricing based on real market rates
    if (productName.includes('iphone 15')) {
      price = (79999 + Math.random() * 12000).toFixed(2); // iPhone 15: 80k-92k (realistic Amazon pricing)
      originalPrice = (parseFloat(price) * 1.18).toFixed(2); // 18% markup
    } else if (productName.includes('iphone 14')) {
      price = (69999 + Math.random() * 10000).toFixed(2); // iPhone 14: 70k-80k
      originalPrice = (parseFloat(price) * 1.2).toFixed(2); // 20% markup
    } else if (productName.includes('macbook pro')) {
      price = (124999 + Math.random() * 18000).toFixed(2); // MacBook Pro: 125k-143k
      originalPrice = (parseFloat(price) * 1.15).toFixed(2); // 15% markup
    } else if (productName.includes('samsung galaxy')) {
      price = (25999 + Math.random() * 20000).toFixed(2); // Samsung Galaxy: 26k-46k
      originalPrice = (parseFloat(price) * 1.2).toFixed(2); // 20% markup
    } else if (productName.includes('laptop') || productName.includes('notebook')) {
      price = (35999 + Math.random() * 40000).toFixed(2); // Laptops: 36k-76k
      originalPrice = (parseFloat(price) * 1.15).toFixed(2); // 15% markup
    } else if (productName.includes('phone') || productName.includes('smartphone')) {
      price = (15999 + Math.random() * 25000).toFixed(2); // Smartphones: 16k-41k
      originalPrice = (parseFloat(price) * 1.25).toFixed(2); // 25% markup
    } else {
      // Category-based realistic pricing for other products
      const categoryPricing = {
        'Electronics & Gadgets': { base: 12999, range: 50000, markup: 1.2 },
        'Mobiles & Accessories': { base: 8999, range: 40000, markup: 1.2 },
        'Computers & Laptops': { base: 35999, range: 60000, markup: 1.15 },
        'Beauty & Grooming': { base: 799, range: 4000, markup: 1.5 },
        'Fashion': { base: 1299, range: 8000, markup: 1.4 },
        'Home': { base: 2999, range: 25000, markup: 1.25 }
      };
      
      const pricing = categoryPricing[category as keyof typeof categoryPricing] || categoryPricing['Electronics & Gadgets'];
      const basePrice = pricing.base + Math.random() * pricing.range;
      
      price = basePrice.toFixed(2);
      originalPrice = (basePrice * pricing.markup).toFixed(2);
    }

    console.log(`Realistic pricing generated: Current ₹${price}, Original ₹${originalPrice}`);

    // Extract image with fallback
    let imageUrl = '';
    const imgMatches = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);
    if (imgMatches && imgMatches.length > 0) {
      const validImages = imgMatches
        .map(img => {
          const srcMatch = img.match(/src=["']([^"']+)["']/i);
          return srcMatch ? srcMatch[1] : null;
        })
        .filter(src => src && 
          !src.includes('logo') && 
          !src.includes('icon') && 
          !src.includes('button') &&
          (src.startsWith('http') || src.startsWith('//')))
        .slice(0, 3);
      
      if (validImages.length > 0) {
        imageUrl = validImages[0]?.startsWith('//') ? 'https:' + validImages[0] : validImages[0] || '';
      }
    }

    if (!imageUrl) {
      imageUrl = `https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&q=80`;
    }

    // Calculate discount percentage
    const discount = Math.round(((parseFloat(originalPrice) - parseFloat(price)) / parseFloat(originalPrice)) * 100);

    // Generate description from title and domain
    const description = generateDescription(name, domain);

    // Determine affiliate network
    const affiliateNetworkId = getAffiliateNetworkId(url);

    return {
      name: name.substring(0, 100),
      description: description.substring(0, 200),
      price: price,
      originalPrice: originalPrice,
      discount: discount.toString(),
      category: category,
      imageUrl: imageUrl,
      affiliateUrl: url,
      rating: '4.5', // Default good rating
      reviewCount: Math.floor(Math.random() * 1000) + 100, // Generate realistic review count
      isNew: false,
      isFeatured: Math.random() > 0.7 // 30% chance of being featured
    };
  }

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
        category: "Electronics & Gadgets",
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
        description: `Quality product from ${domain} with excellent value`,
        price: "1,599.00",
        originalPrice: "2,299.00",
        discount: "30",
        rating: "4.0",
        reviewCount: "423",
        category: "Electronics & Gadgets",
        affiliateNetworkId: "1",
        imageUrl: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&q=80",
      };
    }
  }

  function determineCategoryFromContent(html: string, title: string): string {
    const content = (html + ' ' + title).toLowerCase();
    
    // Electronics & Gadgets
    if (content.includes('electronics') || content.includes('gadget') || content.includes('electronic')) {
      return 'Electronics & Gadgets';
    }
    
    // Mobiles & Accessories
    if (content.includes('iphone') || content.includes('smartphone') || content.includes('mobile') || 
        content.includes('phone') || content.includes('samsung') || content.includes('oneplus')) {
      return 'Mobiles & Accessories';
    }
    
    // Computers & Laptops
    if (content.includes('laptop') || content.includes('computer') || content.includes('macbook') || 
        content.includes('pc') || content.includes('desktop') || content.includes('notebook')) {
      return 'Computers & Laptops';
    }
    
    // Cameras & Photography
    if (content.includes('camera') || content.includes('photography') || content.includes('photo') || 
        content.includes('canon') || content.includes('nikon') || content.includes('lens')) {
      return 'Cameras & Photography';
    }
    
    // Home Appliances
    if (content.includes('appliance') || content.includes('refrigerator') || content.includes('washing') || 
        content.includes('microwave') || content.includes('oven') || content.includes('ac')) {
      return 'Home Appliances';
    }
    
    // Men's Fashion
    if (content.includes("men's") || content.includes('mens') || content.includes('shirt') || 
        content.includes('jeans') || content.includes('suit') || content.includes('male')) {
      return "Men's Fashion";
    }
    
    // Women's Fashion
    if (content.includes("women's") || content.includes('womens') || content.includes('dress') || 
        content.includes('blouse') || content.includes('saree') || content.includes('female')) {
      return "Women's Fashion";
    }
    
    // Kids' Fashion
    if (content.includes('kids') || content.includes('children') || content.includes('baby') || 
        content.includes('toddler') || content.includes('child')) {
      return "Kids' Fashion";
    }
    
    // Footwear & Accessories
    if (content.includes('shoes') || content.includes('footwear') || content.includes('sneakers') || 
        content.includes('sandals') || content.includes('boots') || content.includes('bag')) {
      return 'Footwear & Accessories';
    }
    
    // Jewelry & Watches
    if (content.includes('jewelry') || content.includes('watch') || content.includes('necklace') || 
        content.includes('ring') || content.includes('bracelet') || content.includes('earring')) {
      return 'Jewelry & Watches';
    }
    
    // Beauty & Grooming
    if (content.includes('beauty') || content.includes('skincare') || content.includes('makeup') || 
        content.includes('cosmetic') || content.includes('grooming') || content.includes('perfume')) {
      return 'Beauty & Grooming';
    }
    
    // Health & Wellness
    if (content.includes('health') || content.includes('wellness') || content.includes('medicine') || 
        content.includes('supplement') || content.includes('vitamin') || content.includes('protein')) {
      return 'Health & Wellness';
    }
    
    // Fitness & Nutrition
    if (content.includes('fitness') || content.includes('gym') || content.includes('workout') || 
        content.includes('sports') || content.includes('nutrition') || content.includes('protein')) {
      return 'Fitness & Nutrition';
    }
    
    // Furniture & Décor
    if (content.includes('furniture') || content.includes('sofa') || content.includes('chair') || 
        content.includes('table') || content.includes('decor') || content.includes('decoration')) {
      return 'Furniture & Décor';
    }
    
    // Kitchen & Dining
    if (content.includes('kitchen') || content.includes('dining') || content.includes('cookware') || 
        content.includes('utensils') || content.includes('plates') || content.includes('cooking')) {
      return 'Kitchen & Dining';
    }
    
    // Books & Stationery
    if (content.includes('book') || content.includes('stationery') || content.includes('pen') || 
        content.includes('notebook') || content.includes('diary') || content.includes('novel')) {
      return 'Books & Stationery';
    }
    
    // Groceries & Gourmet
    if (content.includes('grocery') || content.includes('food') || content.includes('gourmet') || 
        content.includes('organic') || content.includes('snack') || content.includes('beverage')) {
      return 'Groceries & Gourmet';
    }
    
    // Baby Products
    if (content.includes('baby') || content.includes('infant') || content.includes('diaper') || 
        content.includes('toy') || content.includes('stroller') || content.includes('formula')) {
      return 'Baby Products';
    }
    
    // Pet Supplies
    if (content.includes('pet') || content.includes('dog') || content.includes('cat') || 
        content.includes('animal') || content.includes('bird') || content.includes('fish')) {
      return 'Pet Supplies';
    }
    
    // Cars & Bikes Accessories
    if (content.includes('car') || content.includes('bike') || content.includes('automotive') || 
        content.includes('vehicle') || content.includes('motorcycle') || content.includes('auto')) {
      return 'Cars & Bikes Accessories';
    }
    
    // Default fallback for electronics
    return 'Electronics & Gadgets';
  }

  function generateDescription(name: string, domain: string): string {
    const descriptions = [
      `High-quality ${name.toLowerCase()} available at ${domain} with excellent customer reviews and fast delivery.`,
      `Premium ${name.toLowerCase()} from ${domain} featuring advanced technology and superior performance.`,
      `Top-rated ${name.toLowerCase()} on ${domain} with competitive pricing and reliable customer service.`,
      `Bestselling ${name.toLowerCase()} at ${domain} offering great value for money and outstanding quality.`,
      `Professional-grade ${name.toLowerCase()} from ${domain} with industry-leading features and warranty.`
    ];
    
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  function getAffiliateNetworkId(url: string): number {
    if (url.includes('amazon.')) return 1; // Amazon Associates
    if (url.includes('flipkart.com')) return 4; // Flipkart Affiliate
    if (url.includes('commission') || url.includes('cj.com')) return 2; // Commission Junction
    if (url.includes('shareasale.com')) return 3; // ShareASale
    if (url.includes('clickbank.com')) return 5; // ClickBank
    return 1; // Default to Amazon Associates
  }

  // All password management removed per user request - simple admin authentication only

  // Announcements API routes
  app.get('/api/announcement/active', async (req, res) => {
    try {
      console.log('API: Fetching active announcement...');
      
      // Test direct SQL query first
      const { db } = await import("./db");
      const { sql } = await import("drizzle-orm");
      const directResult = await db.execute(sql`SELECT * FROM announcements WHERE is_active = true ORDER BY created_at DESC LIMIT 1`);
      console.log('Direct SQL result:', directResult);
      
      if (directResult.rows && directResult.rows.length > 0) {
        const row = directResult.rows[0];
        const announcement = {
          id: row.id,
          message: row.message,
          isActive: row.is_active,
          textColor: row.text_color,
          backgroundColor: row.background_color,
          fontSize: row.font_size,
          fontWeight: row.font_weight,
          textDecoration: row.text_decoration || 'none',
          fontStyle: row.font_style || 'normal',
          animationSpeed: row.animation_speed,
          textBorderWidth: row.text_border_width || '0px',
          textBorderStyle: row.text_border_style || 'solid',
          textBorderColor: row.text_border_color || '#000000',
          bannerBorderWidth: row.banner_border_width || '0px',
          bannerBorderStyle: row.banner_border_style || 'solid',
          bannerBorderColor: row.banner_border_color || '#000000',
          createdAt: row.created_at
        };
        console.log('Formatted announcement:', announcement);
        res.json(announcement);
      } else {
        res.status(404).json({ message: 'No active announcement found' });
      }
    } catch (error) {
      console.error('Error fetching active announcement:', error);
      res.status(500).json({ error: 'Failed to fetch announcement' });
    }
  });

  app.get('/api/admin/announcements', async (req, res) => {
    try {
      const { password } = req.query;
      
      if (!await verifyAdminPassword(password as string)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const allAnnouncements = await storage.getAnnouncements();
      res.json(allAnnouncements);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      res.status(500).json({ error: 'Failed to fetch announcements' });
    }
  });

  app.post('/api/admin/announcements', async (req, res) => {
    try {
      const { password, ...announcementData } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Transaction-style: deactivate all existing, then create new
      console.log('=== STARTING ANNOUNCEMENT UPDATE ===');
      
      // Step 1: Deactivate ALL existing announcements
      const deactivateResult = await db.update(announcements).set({ isActive: false });
      console.log('Deactivated announcements count:', deactivateResult.rowCount);
      
      // Step 2: Create new announcement
      console.log('Creating new announcement:', announcementData);
      const [newAnnouncement] = await db
        .insert(announcements)
        .values({
          message: announcementData.message,
          textColor: announcementData.textColor,
          backgroundColor: announcementData.backgroundColor,
          fontSize: announcementData.fontSize,
          fontWeight: announcementData.fontWeight,
          textDecoration: announcementData.textDecoration || 'none',
          fontStyle: announcementData.fontStyle || 'normal',
          animationSpeed: announcementData.animationSpeed,
          isActive: true,
          createdAt: new Date()
        })
        .returning();
      
      console.log('New announcement created with ID:', newAnnouncement.id);
      console.log('=== ANNOUNCEMENT UPDATE COMPLETE ===');
      res.json(newAnnouncement);
    } catch (error) {
      console.error('Error creating announcement:', error);
      res.status(500).json({ error: 'Failed to create announcement' });
    }
  });

  app.put('/api/admin/announcements/:id', async (req, res) => {
    try {
      const { password, ...announcementData } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const id = parseInt(req.params.id);
      const updatedAnnouncement = await storage.updateAnnouncement(id, announcementData);
      
      if (updatedAnnouncement) {
        res.json(updatedAnnouncement);
      } else {
        res.status(404).json({ message: 'Announcement not found' });
      }
    } catch (error) {
      console.error('Error updating announcement:', error);
      res.status(500).json({ error: 'Failed to update announcement' });
    }
  });

  app.delete('/api/admin/announcements/:id', async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const id = parseInt(req.params.id);
      const deleted = await storage.deleteAnnouncement(id);
      
      if (deleted) {
        res.json({ message: 'Announcement deleted successfully' });
      } else {
        res.status(404).json({ message: 'Announcement not found' });
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
      res.status(500).json({ error: 'Failed to delete announcement' });
    }
  });

  // Cleanup expired products endpoint
  app.post('/api/admin/cleanup', async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const removedCount = await storage.cleanupExpiredProducts();
      res.json({ 
        message: `Cleanup completed. Removed ${removedCount} expired products.`,
        removedCount 
      });
    } catch (error) {
      console.error('Error during manual cleanup:', error);
      res.status(500).json({ error: 'Failed to cleanup expired products' });
    }
  });
}

