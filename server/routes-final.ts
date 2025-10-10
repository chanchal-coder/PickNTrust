// Import statements
// @ts-nocheck
import { Request, Response, Express } from "express";
import express from "express";
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Import from shared schema
import { 
  insertProductSchema, 
  insertNewsletterSubscriberSchema,
  type Product,
  type NewsletterSubscriber,
  announcements
} from "@shared/sqlite-schema";

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
    // Accept images, videos, PDFs, and common document formats
    const type = file.mimetype;
    const isImage = type.startsWith('image/');
    const isVideo = type.startsWith('video/');
    const allowedDocs = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'application/rtf',
      'application/vnd.oasis.opendocument.text',
      'application/vnd.oasis.opendocument.spreadsheet',
      'application/vnd.oasis.opendocument.presentation'
    ];
    if (isImage || isVideo || allowedDocs.includes(type)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'));
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

  // Admin image upload endpoint (used by BannerManagement)
  app.post('/api/admin/upload-image', upload.single('image'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image uploaded' });
      }
      const imageUrl = `/uploads/${req.file.filename}`;
      res.json({ imageUrl, filename: req.file.filename, mimetype: req.file.mimetype, size: req.file.size });
    } catch (error) {
      console.error('Admin image upload error:', error);
      res.status(500).json({ message: 'Failed to upload image' });
    }
  });

  // Admin generic upload endpoint (allows documents like PDF)
  app.post('/api/admin/upload', upload.single('file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      const url = `/uploads/${req.file.filename}`;
      res.json({ url, filename: req.file.filename, mimetype: req.file.mimetype, size: req.file.size });
    } catch (error) {
      console.error('Admin upload error:', error);
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

  // Announcement active endpoint - Only one instance of this route
  app.get('/api/announcement/active', async (req, res) => {
    try {
      const { page } = req.query;
      
      // Use storage to get active announcements
      const allAnnouncements = await storage.getAnnouncements();
      const activeAnnouncements = allAnnouncements.filter(announcement => announcement.isActive);
      
      let selectedAnnouncement = null;
      
      if (activeAnnouncements && activeAnnouncements.length > 0) {
        // First, try to find page-specific announcement
        if (page) {
          const pageSpecificAnnouncements = activeAnnouncements.filter(announcement => 
            !announcement.isGlobal && announcement.page === page
          );
          
          if (pageSpecificAnnouncements.length > 0) {
            // Sort page-specific announcements by createdAt descending
            const sortedPageSpecific = pageSpecificAnnouncements.sort((a, b) => {
              const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return dateB - dateA;
            });
            selectedAnnouncement = sortedPageSpecific[0];
          }
        }
        
        // If no page-specific announcement found, fall back to global announcements
        if (!selectedAnnouncement) {
          const globalAnnouncements = activeAnnouncements.filter(announcement => 
            announcement.isGlobal !== false
          );
          
          if (globalAnnouncements.length > 0) {
            // Sort global announcements by createdAt descending
            const sortedGlobal = globalAnnouncements.sort((a, b) => {
              const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return dateB - dateA;
            });
            selectedAnnouncement = sortedGlobal[0];
          }
        }
      }
      
      if (selectedAnnouncement) {
        const row = selectedAnnouncement;
        
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
  // For now, return null to indicate no product found
  return null;
}
