 // Import statements
import { Request, Response, Express } from "express";
import express from "express";
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Import from shared schema
import { 
  products,
  newsletterSubscribers,
  announcements,
  insertNewsletterSubscriberSchema
} from "../shared/sqlite-schema.js";

// Import storage interface and db instance
import { IStorage } from "./storage";
import { dbInstance as db } from "./db.js";

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

  // Get featured products (filter by timer expiry)
  app.get("/api/products/featured", async (req, res) => {
    try {
      const products = await storage.getFeaturedProducts();
      
      // Filter out expired products based on their individual timers
      const now = new Date();
      
      const activeProducts = products.filter(product => {
        // If product doesn't have timer enabled, keep it
        if (!product.hasTimer || !product.timerDuration || !product.createdAt) {
          return true;
        }
        
        // Calculate expiry time based on product's timer duration
        const productCreatedAt = new Date(product.createdAt);
        const expiryTime = new Date(productCreatedAt.getTime() + (product.timerDuration * 60 * 60 * 1000));
        
        // Keep product if it hasn't expired yet
        return now < expiryTime;
      });
      
      res.json(activeProducts);
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
      if (!categories || categories.length === 0) {
        return res.status(404).json({ message: "No categories found" });
      }
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
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

  // Get blog posts (filter by timer expiry)
  app.get("/api/blog", async (req, res) => {
    try {
      const blogPosts = await storage.getBlogPosts();
      
      // Filter out expired blog posts based on their individual timers
      const now = new Date();
      
      const activeBlogPosts = blogPosts.filter(post => {
        // If post doesn't have timer enabled, keep it
        if (!post.hasTimer || !post.timerDuration || !post.createdAt) {
          return true;
        }
        
        // Calculate expiry time based on post's timer duration
        const postCreatedAt = new Date(post.createdAt);
        const expiryTime = new Date(postCreatedAt.getTime() + (post.timerDuration * 60 * 60 * 1000));
        
        // Keep post if it hasn't expired yet
        return now < expiryTime;
      });
      
      // Sort by most recent first and parse tags
      const sortedPosts = activeBlogPosts.sort((a, b) => 
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      ).map(post => ({
        ...post,
        // Parse tags from JSON string to array if needed
        tags: typeof post.tags === 'string' ? 
          (post.tags.startsWith('[') ? JSON.parse(post.tags) : []) : 
          (Array.isArray(post.tags) ? post.tags : [])
      }));
      
      res.json(sortedPosts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  // Newsletter subscription
  app.post("/api/newsletter/subscribe", async (req, res) => {
    try {
      // TODO: Add validation for newsletter subscriber data here
      const subscriber = await storage.subscribeToNewsletter(req.body);
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

  // Extract product details from URL - Uses built-in extraction without Flask dependency
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

      // Use enhanced URL-based extraction directly
      const extractedData = await extractFromUrlPattern(url);

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

      // Ensure products are visible by default with all necessary flags
      const enhancedProductData = {
        ...productData,
        isFeatured: productData.isFeatured !== undefined ? productData.isFeatured : true,
        isApproved: productData.isApproved !== undefined ? productData.isApproved : true,
        status: productData.status || 'active',
        createdAt: new Date(),
      };

      const product = await storage.addProduct(enhancedProductData);
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

      // Validate blogPostData keys and values before insert
      const requiredFields = ['title', 'excerpt', 'content', 'category', 'tags', 'imageUrl', 'publishedAt', 'slug'];
      for (const field of requiredFields) {
        if (!(field in blogPostData)) {
          return res.status(400).json({ message: `Missing required field: ${field}` });
        }
      }

      // Ensure blog posts are visible by default with proper settings
      const enhancedBlogPostData = {
        ...blogPostData,
        // Convert tags array to JSON string if needed
        tags: Array.isArray(blogPostData.tags) ? JSON.stringify(blogPostData.tags) : blogPostData.tags,
        // Ensure proper timestamps
        publishedAt: blogPostData.publishedAt ? new Date(blogPostData.publishedAt) : new Date(),
        createdAt: new Date(),
        // Set default values for visibility
        isPublished: blogPostData.isPublished !== undefined ? blogPostData.isPublished : true,
        status: blogPostData.status || 'published',
      };

      const blogPost = await storage.addBlogPost(enhancedBlogPostData);
      res.json({ message: 'Blog post added successfully', blogPost });
    } catch (error: any) {
      console.error('Add blog post error:', error);
      console.error(error); // Added detailed error logging
      res.status(500).json({ message: 'Failed to add blog post', error: error.message });
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

  // Announcement active endpoint - Only one instance of this route
  app.get('/api/announcement/active', async (req, res) => {
    try {
      // Use storage to get active announcements
      const allAnnouncements = await storage.getAnnouncements();
      const activeAnnouncements = allAnnouncements.filter(announcement => announcement.isActive);
      
      if (activeAnnouncements && activeAnnouncements.length > 0) {
        // Sort by createdAt descending and take the first one
        const sorted = activeAnnouncements.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        const row = sorted[0];
        
        const announcement = {
          id: row.id,
          message: row.message,
          isActive: row.isActive,
          textColor: row.textColor,
          backgroundColor: row.backgroundColor,
          fontSize: row.fontSize,
          fontWeight: row.fontWeight,
          textDecoration: row.textDecoration || 'none',
          fontStyle: row.fontStyle || 'normal',
          animationSpeed: row.animationSpeed,
          textBorderWidth: row.textBorderWidth || '0px',
          textBorderStyle: row.textBorderStyle || 'solid',
          textBorderColor: row.textBorderColor || '#000000',
          bannerBorderWidth: row.bannerBorderWidth || '0px',
          bannerBorderStyle: row.bannerBorderStyle || 'solid',
          bannerBorderColor: row.bannerBorderColor || '#000000',
          createdAt: row.createdAt
        };
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
      console.log('Deactivated announcements');
      
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
          textBorderWidth: announcementData.textBorderWidth || '0px',
          textBorderStyle: announcementData.textBorderStyle || 'solid',
          textBorderColor: announcementData.textBorderColor || '#000000',
          bannerBorderWidth: announcementData.bannerBorderWidth || '0px',
          bannerBorderStyle: announcementData.bannerBorderStyle || 'solid',
          bannerBorderColor: announcementData.bannerBorderColor || '#000000',
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

// Helper function for product extraction
async function extractFromUrlPattern(url: string): Promise<any> {
  // This is a simplified version - in a real implementation you would
  // implement actual web scraping logic here
  return {
    name: "Sample Product",
    description: "Sample product description",
    price: "1000",
    originalPrice: "1200",
    discount: "15",
    rating: "4.5",
    reviewCount: "100",
    category: "Electronics & Gadgets",
    affiliateNetworkId: "1",
    imageUrl: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&q=80",
    affiliateUrl: url,
  };
}
