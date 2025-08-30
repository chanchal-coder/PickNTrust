// Import statements
import { Request, Response, Express } from "express";
import express from "express";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Import from shared schema
import { 
  products,
  newsletterSubscribers,
  announcements,
  insertNewsletterSubscriberSchema,
  adminUsers
} from "../shared/sqlite-schema.js";

// Import storage interface and db instance
import { IStorage } from "./storage";
import { db } from "./db.js";
import { setupSocialMediaRoutes } from "./social-media-routes.js";
import { eq } from "drizzle-orm";

// N8N Integration Helper Functions
interface N8NWebhookPayload {
  event: string;
  data: any;
  timestamp: string;
  source: string;
}

// Function to trigger n8n webhooks (if you have n8n cloud webhooks)
async function triggerN8NWebhook(webhookUrl: string, payload: N8NWebhookPayload): Promise<void> {
  try {
    if (!webhookUrl) {
      console.log('N8N webhook URL not configured, skipping trigger');
      return;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error('N8N webhook trigger failed:', response.status, response.statusText);
    } else {
      console.log('N8N webhook triggered successfully:', payload.event);
    }
  } catch (error) {
    console.error('Error triggering N8N webhook:', error);
  }
}

// Helper to create standardized webhook payloads
function createN8NPayload(event: string, data: any): N8NWebhookPayload {
  return {
    event,
    data,
    timestamp: new Date().toISOString(),
    source: 'pickntrust-backend'
  };
}

// N8N Webhook URLs (set these in your environment variables)
const N8N_WEBHOOKS = {
  PRODUCT_CREATED: process.env.N8N_WEBHOOK_PRODUCT_CREATED,
  NEWSLETTER_SIGNUP: process.env.N8N_WEBHOOK_NEWSLETTER_SIGNUP,
  ORDER_PLACED: process.env.N8N_WEBHOOK_ORDER_PLACED,
  CUSTOM_EVENT: process.env.N8N_WEBHOOK_CUSTOM_EVENT
};

// Helper function to verify admin password
async function verifyAdminPassword(password: string): Promise<boolean> {
  try {
    // Get admin user from database
    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.email, 'admin@pickntrust.com'));
    
    if (!admin || !admin.isActive) {
      return false;
    }
    
    // Compare password with hashed password
    return await bcrypt.compare(password, admin.passwordHash);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
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
  // Setup social media routes
  setupSocialMediaRoutes(app);
  // Serve uploaded files
  app.use('/uploads', express.static(uploadDir));

  // N8N Automation Webhooks
  // Health check for n8n
  app.get('/api/n8n/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      service: 'pickntrust-n8n-integration',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  // Webhook for new product notifications
  app.post('/api/n8n/webhooks/product-created', async (req, res) => {
    try {
      const { productId, productName, category, price } = req.body;
      
      // Log the webhook event
      console.log('N8N Webhook - Product Created:', {
        productId,
        productName,
        category,
        price,
        timestamp: new Date().toISOString()
      });
      
      // You can add custom logic here for n8n automation
      // For example: send notifications, update external systems, etc.
      
      res.json({ 
        success: true, 
        message: 'Product creation webhook received',
        productId 
      });
    } catch (error) {
      console.error('N8N Product webhook error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Webhook processing failed' 
      });
    }
  });

  // Webhook for newsletter subscriptions
  app.post('/api/n8n/webhooks/newsletter-subscription', async (req, res) => {
    try {
      const { email, source } = req.body;
      
      // Log the webhook event
      console.log('N8N Webhook - Newsletter Subscription:', {
        email,
        source,
        timestamp: new Date().toISOString()
      });
      
      // You can add custom logic here for n8n automation
      // For example: add to email marketing lists, send welcome emails, etc.
      
      res.json({ 
        success: true, 
        message: 'Newsletter subscription webhook received',
        email 
      });
    } catch (error) {
      console.error('N8N Newsletter webhook error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Webhook processing failed' 
      });
    }
  });

  // Generic webhook for custom n8n workflows
  app.post('/api/n8n/webhooks/custom/:workflowName', async (req, res) => {
    try {
      const { workflowName } = req.params;
      const payload = req.body;
      
      // Log the webhook event
      console.log(`N8N Webhook - Custom Workflow (${workflowName}):`, {
        workflowName,
        payload,
        timestamp: new Date().toISOString()
      });
      
      // You can add custom logic here based on workflowName
      // For example: different actions for different workflows
      
      res.json({ 
        success: true, 
        message: `Custom workflow webhook received: ${workflowName}`,
        workflowName,
        receivedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error(`N8N Custom webhook error (${req.params.workflowName}):`, error);
      res.status(500).json({ 
        success: false, 
        message: 'Webhook processing failed' 
      });
    }
  });

  // Webhook to trigger actions from n8n
  app.post('/api/n8n/webhooks/trigger-action', async (req, res) => {
    try {
      const { action, data } = req.body;
      
      console.log('N8N Webhook - Trigger Action:', {
        action,
        data,
        timestamp: new Date().toISOString()
      });
      
      let result = null;
      
      // Handle different actions
      switch (action) {
        case 'get-products':
          result = await storage.getProducts();
          break;
        case 'get-categories':
          result = await storage.getCategories();
          break;
        case 'get-newsletter-count':
          result = await storage.getNewsletterSubscribers();
          break;
        default:
          return res.status(400).json({
            success: false,
            message: `Unknown action: ${action}`
          });
      }
      
      res.json({ 
        success: true, 
        message: `Action ${action} executed successfully`,
        data: result
      });
    } catch (error) {
      console.error('N8N Trigger action webhook error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Action execution failed' 
      });
    }
  });

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
        // Update last login
        const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.email, 'admin@pickntrust.com'));
        if (admin) {
          await storage.updateLastLogin(admin.id);
        }
        res.json({ success: true, message: 'Authentication successful' });
      } else {
        res.status(401).json({ success: false, message: 'Invalid password' });
      }
    } catch (error) {
      console.error('Admin authentication error:', error);
      res.status(500).json({ message: 'Authentication failed' });
    }
  });

  // Password reset request endpoint
  app.post('/api/admin/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      // Check if admin exists
      const admin = await storage.getAdminByEmail(email);
      if (!admin) {
        // Don't reveal if email exists or not for security
        return res.json({ message: 'If the email exists, a reset link has been sent.' });
      }

      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      // Save reset token to database
      await storage.setResetToken(email, resetToken, resetTokenExpiry);

      // Create email transporter (Gmail SMTP)
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD
        }
      });

      // Email content
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/reset-password?token=${resetToken}`;
      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: email,
        subject: 'PickNTrust Admin - Password Reset Request',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">Password Reset Request</h2>
            <p>You have requested to reset your password for PickNTrust Admin Panel.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request this password reset, please ignore this email.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">PickNTrust Admin Panel</p>
          </div>
        `
      };

      // Send email
      await transporter.sendMail(mailOptions);

      res.json({ 
        message: 'If the email exists, a reset link has been sent.',
        // In development, return the token for testing
        ...(process.env.NODE_ENV === 'development' && { resetToken })
      });

    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({ message: 'Failed to process password reset request' });
    }
  });

  // Password reset endpoint
  app.post('/api/admin/reset-password', async (req, res) => {
    try {
      const { token, newPassword, confirmPassword } = req.body;
      
      if (!token || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long' });
      }

      // Validate reset token
      const admin = await storage.validateResetToken(token);
      if (!admin) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password and clear reset token
      await storage.updateAdminPassword(admin.id, hashedPassword);
      await storage.clearResetToken(admin.id);

      res.json({ message: 'Password reset successfully' });

    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ message: 'Failed to reset password' });
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

  // Get service products (filter by timer expiry)
  app.get("/api/products/services", async (req, res) => {
    try {
      const products = await storage.getServiceProducts();
      
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
      res.status(500).json({ message: "Failed to fetch service products" });
    }
  });

  // Get AI Apps products (filter by timer expiry)
  app.get("/api/products/apps", async (req, res) => {
    try {
      const products = await storage.getAIAppsProducts();
      
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
      res.status(500).json({ message: "Failed to fetch AI Apps products" });
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
      
      // Apply gender filtering if provided with case-insensitive matching
      if (gender && typeof gender === 'string') {
        // Normalize gender values for consistent filtering
        const normalizeGender = (g: string): string => {
          const genderMap: { [key: string]: string } = {
            'men': 'Men',
            'women': 'Women', 
            'kids': 'Kids',
            'boys': 'Boys',
            'girls': 'Girls'
          };
          return genderMap[g.toLowerCase()] || g;
        };
        
        const normalizedGender = normalizeGender(gender);
        console.log(`Filtering products by normalized gender: "${normalizedGender}"`);
        
        products = products.filter(product => {
          if (!product.gender) return false;
          const productGender = normalizeGender(product.gender);
          const matches = productGender === normalizedGender;
          if (matches) {
            console.log(`Product "${product.name}" matches gender filter: ${product.gender} -> ${productGender}`);
          }
          return matches;
        });
      }
      
      console.log(`Returning ${products.length} products for category "${decodedCategory}" with gender "${gender}"`);
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
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Get product categories (for product forms)
  app.get("/api/categories/products", async (req, res) => {
    try {
      const categories = await storage.getProductCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching product categories:", error);
      res.status(500).json({ message: "Failed to fetch product categories" });
    }
  });

  // Get service categories (for service forms)
  app.get("/api/categories/services", async (req, res) => {
    try {
      const categories = await storage.getServiceCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching service categories:", error);
      res.status(500).json({ message: "Failed to fetch service categories" });
    }
  });

  // Get AI app categories (for AI app forms)
  app.get("/api/categories/aiapps", async (req, res) => {
    try {
      const categories = await storage.getAIAppCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching AI app categories:", error);
      res.status(500).json({ message: "Failed to fetch AI app categories" });
    }
  });

  // Admin category management routes
  app.post('/api/admin/categories', async (req, res) => {
    try {
      const { password, ...categoryData } = req.body;

      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const category = await storage.addCategory(categoryData);
      res.json({ message: 'Category added successfully', category });
    } catch (error) {
      console.error('Add category error:', error);
      res.status(500).json({ message: 'Failed to add category' });
    }
  });

  app.put('/api/admin/categories/:id', async (req, res) => {
    try {
      const { password, ...updates } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const id = parseInt(req.params.id);
      const category = await storage.updateCategory(id, updates);
      
      if (category) {
        res.json({ message: 'Category updated successfully', category });
      } else {
        res.status(404).json({ message: 'Category not found' });
      }
    } catch (error) {
      console.error('Update category error:', error);
      res.status(500).json({ message: 'Failed to update category' });
    }
  });

  app.delete('/api/admin/categories/:id', async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCategory(id);
      
      if (deleted) {
        res.json({ message: 'Category deleted successfully' });
      } else {
        res.status(404).json({ message: 'Category not found' });
      }
    } catch (error) {
      console.error('Delete category error:', error);
      res.status(500).json({ message: 'Failed to delete category' });
    }
  });

  // Update category display order
  app.put('/api/admin/categories/reorder', async (req, res) => {
    try {
      console.log('Reorder API: Request body:', JSON.stringify(req.body, null, 2));
      const { password, categoryOrders } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      if (!Array.isArray(categoryOrders)) {
        console.log('Reorder API: categoryOrders is not an array:', categoryOrders);
        return res.status(400).json({ message: 'categoryOrders must be an array' });
      }

      console.log('Reorder API: Processing', categoryOrders.length, 'category updates');

      // Update display order for each category
      for (const item of categoryOrders) {
        console.log(`Reorder API: Processing item:`, item);
        console.log(`Reorder API: Updating category ${item.id} to displayOrder ${item.displayOrder}`);
        
        const result = await storage.updateCategory(item.id, { displayOrder: item.displayOrder });
        if (!result) {
          console.log(`Reorder API: Failed to update category ${item.id}`);
          return res.status(404).json({ message: 'Category not found' });
        }
        console.log(`Reorder API: Successfully updated category ${item.id}`);
      }

      res.json({ message: 'Category display order updated successfully' });
    } catch (error) {
      console.error('Update category order error:', error);
      res.status(500).json({ message: 'Failed to update category order' });
    }
  });

  // Add category (Admin only)
  app.post('/api/categories', async (req, res) => {
    try {
      const { password, ...categoryData } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const category = await storage.addCategory(categoryData);
      res.json({ message: 'Category added successfully', category });
    } catch (error) {
      console.error('Add category error:', error);
      res.status(500).json({ message: 'Failed to add category' });
    }
  });

  // Get categories with subcategories (hierarchical structure)
  app.get("/api/categories/hierarchical", async (req, res) => {
    try {
      const categories = await storage.getCategoriesWithSubcategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching hierarchical categories:", error);
      res.status(500).json({ message: "Failed to fetch hierarchical categories" });
    }
  });

  // Get main categories only (no subcategories)
  app.get("/api/categories/main", async (req, res) => {
    try {
      const categories = await storage.getMainCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching main categories:", error);
      res.status(500).json({ message: "Failed to fetch main categories" });
    }
  });

  // Get subcategories for a specific parent category
  app.get("/api/categories/:parentId/subcategories", async (req, res) => {
    try {
      const parentId = parseInt(req.params.parentId);
      if (isNaN(parentId)) {
        return res.status(400).json({ message: "Invalid parent category ID" });
      }
      
      const subcategories = await storage.getSubcategories(parentId);
      res.json(subcategories);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      res.status(500).json({ message: "Failed to fetch subcategories" });
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

      // Handle customFields - convert object to JSON string for storage
      let customFieldsJson = null;
      if (productData.customFields && typeof productData.customFields === 'object') {
        customFieldsJson = JSON.stringify(productData.customFields);
      }

      // Ensure products are visible by default with all necessary flags
      const enhancedProductData = {
        ...productData,
        customFields: customFieldsJson,
        isFeatured: productData.isFeatured !== undefined ? productData.isFeatured : true,
        isApproved: productData.isApproved !== undefined ? productData.isApproved : true,
        status: productData.status || 'active',
        createdAt: new Date(),
      };

      const product = await storage.addProduct(enhancedProductData);
      
      // 🎨 TRIGGER CANVA AUTOMATION FOR NEW PRODUCT
      try {
        const { onContentCreated } = await import('./canva-triggers.js');
        
        // Trigger Canva automation in background
        onContentCreated('product', product.id, {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          image_url: product.imageUrl,
          category: product.category,
          is_service: product.isService || false
        }).catch(error => {
          console.error('Background Canva automation failed for product:', error);
        });
        
        console.log('🚀 Canva automation triggered for product:', product.id);
      } catch (automationError) {
        console.error('⚠️ Canva automation failed (product still created):', automationError);
        // Don't fail the product creation if automation fails
      }
      
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
      
      // 📝 TRIGGER CANVA AUTOMATION FOR NEW BLOG POST
      try {
        const { onContentCreated } = await import('./canva-triggers.js');
        
        // Trigger Canva automation in background
        onContentCreated('blog', blogPost.id, {
          id: blogPost.id,
          title: blogPost.title,
          excerpt: blogPost.excerpt,
          content: blogPost.content,
          category: blogPost.category,
          image_url: blogPost.imageUrl
        }).catch(error => {
          console.error('Background Canva automation failed for blog:', error);
        });
        
        console.log('🚀 Canva automation triggered for blog post:', blogPost.id);
      } catch (automationError) {
        console.error('⚠️ Canva automation failed (blog still created):', automationError);
        // Don't fail the blog creation if automation fails
      }
      
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

  // Video Content Management Routes
  app.get('/api/video-content', async (req, res) => {
    try {
      const videoContent = await storage.getVideoContent();
      
      // Filter out expired video content based on their individual timers
      const now = new Date();
      
      const activeVideoContent = videoContent.filter(video => {
        // If video doesn't have timer enabled, keep it
        if (!video.hasTimer || !video.timerDuration || !video.createdAt) {
          return true;
        }
        
        // Calculate expiry time based on video's timer duration
        const videoCreatedAt = video.createdAt ? new Date(video.createdAt) : new Date();
        const expiryTime = new Date(videoCreatedAt.getTime() + (video.timerDuration * 60 * 60 * 1000));
        
        // Keep video if it hasn't expired yet
        return now < expiryTime;
      });
      
      // Sort by most recent first and parse tags
      const sortedVideos = activeVideoContent.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      }).map(video => ({
        ...video,
        // Parse tags from JSON string to array if needed
        tags: typeof video.tags === 'string' ? 
          (video.tags.startsWith('[') ? JSON.parse(video.tags) : []) : 
          (Array.isArray(video.tags) ? video.tags : [])
      }));
      
      res.json(sortedVideos);
    } catch (error) {
      console.error('Error fetching video content:', error);
      res.status(500).json({ message: "Failed to fetch video content" });
    }
  });

  app.post('/api/admin/video-content', async (req, res) => {
    try {
      const { password, ...videoData } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Validate required fields
      const requiredFields = ['title', 'videoUrl', 'platform', 'category'];
      for (const field of requiredFields) {
        if (!(field in videoData)) {
          return res.status(400).json({ message: `Missing required field: ${field}` });
        }
      }

      // Ensure video content is visible by default with proper settings
      const enhancedVideoData = {
        ...videoData,
        // Convert tags array to JSON string if needed
        tags: Array.isArray(videoData.tags) ? JSON.stringify(videoData.tags) : videoData.tags,
        // Ensure proper timestamps
        createdAt: new Date(),
        // Set default values for visibility
        description: videoData.description || '',
        thumbnailUrl: videoData.thumbnailUrl || '',
        duration: videoData.duration || '',
      };

      const videoContent = await storage.addVideoContent(enhancedVideoData);
      
      // 🎬 TRIGGER CANVA AUTOMATION FOR NEW VIDEO CONTENT
      try {
        const { onContentCreated } = await import('./canva-triggers.js');
        
        // Trigger Canva automation in background
        onContentCreated('video', videoContent.id, {
          id: videoContent.id,
          title: videoContent.title,
          description: videoContent.description || 'Check out this amazing video content!',
          video_url: videoContent.videoUrl,
          thumbnail_url: videoContent.thumbnailUrl,
          category: videoContent.category
        }).catch(error => {
          console.error('Background Canva automation failed for video:', error);
        });
        
        console.log('🚀 Canva automation triggered for video content:', videoContent.id);
      } catch (automationError) {
        console.error('⚠️ Canva automation failed (video content still created):', automationError);
        // Don't fail the video content creation if automation fails
      }
      
      res.json({ message: 'Video content added successfully', videoContent });
    } catch (error: any) {
      console.error('Add video content error:', error);
      res.status(500).json({ message: 'Failed to add video content', error: error.message });
    }
  });

  app.delete('/api/admin/video-content/:id', async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const id = parseInt(req.params.id);
      const deleted = await storage.deleteVideoContent(id);
      
      if (deleted) {
        res.json({ message: 'Video content deleted successfully' });
      } else {
        res.status(404).json({ message: 'Video content not found' });
      }
    } catch (error) {
      console.error('Delete video content error:', error);
      res.status(500).json({ message: 'Failed to delete video content' });
    }
  });

  app.put('/api/admin/video-content/:id', async (req, res) => {
    try {
      const { password, ...updates } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const id = parseInt(req.params.id);
      const videoContent = await storage.updateVideoContent(id, updates);
      
      if (videoContent) {
        res.json({ message: 'Video content updated successfully', videoContent });
      } else {
        res.status(404).json({ message: 'Video content not found' });
      }
    } catch (error) {
      console.error('Update video content error:', error);
      res.status(500).json({ message: 'Failed to update video content' });
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

  // Canva Automation Routes
  
  // Get Canva settings
  app.get('/api/admin/canva/settings', async (req, res) => {
    try {
      const { password } = req.query;
      
      if (!await verifyAdminPassword(password as string)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const settings = await storage.getCanvaSettings();
      res.json(settings || {
        isEnabled: false,
        platforms: ['instagram', 'facebook', 'whatsapp', 'telegram'],
        autoGenerateCaptions: true,
        autoGenerateHashtags: true,
        scheduleType: 'immediate'
      });
    } catch (error) {
      console.error('Error fetching Canva settings:', error);
      res.status(500).json({ message: 'Failed to fetch Canva settings' });
    }
  });

  // Update Canva settings
  app.put('/api/admin/canva/settings', async (req, res) => {
    try {
      const { password, ...settingsData } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Convert platforms array to JSON string for storage
      if (Array.isArray(settingsData.platforms)) {
        settingsData.platforms = JSON.stringify(settingsData.platforms);
      }

      const settings = await storage.updateCanvaSettings(settingsData);
      res.json({ message: 'Canva settings updated successfully', settings });
    } catch (error) {
      console.error('Error updating Canva settings:', error);
      res.status(500).json({ message: 'Failed to update Canva settings' });
    }
  });

  // Get Canva posts
  app.get('/api/admin/canva/posts', async (req, res) => {
    try {
      const { password } = req.query;
      
      if (!await verifyAdminPassword(password as string)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const posts = await storage.getCanvaPosts();
      res.json(posts);
    } catch (error) {
      console.error('Error fetching Canva posts:', error);
      res.status(500).json({ message: 'Failed to fetch Canva posts' });
    }
  });

  // Get Canva templates
  app.get('/api/admin/canva/templates', async (req, res) => {
    try {
      const { password } = req.query;
      
      if (!await verifyAdminPassword(password as string)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const templates = await storage.getCanvaTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Error fetching Canva templates:', error);
      res.status(500).json({ message: 'Failed to fetch Canva templates' });
    }
  });

  // Add Canva template
  app.post('/api/admin/canva/templates', async (req, res) => {
    try {
      const { password, ...templateData } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const template = await storage.addCanvaTemplate(templateData);
      res.json({ message: 'Template added successfully', template });
    } catch (error) {
      console.error('Error adding Canva template:', error);
      res.status(500).json({ message: 'Failed to add template' });
    }
  });

  // Test Canva automation (for testing purposes)
  app.post('/api/admin/canva/test', async (req, res) => {
    try {
      const { password, contentType, contentId } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Get Canva settings
      const settings = await storage.getCanvaSettings();
      if (!settings || !settings.isEnabled) {
        return res.status(400).json({ message: 'Canva automation is not enabled' });
      }

      // Mock test - in production this would trigger actual Canva automation
      const testResult = {
        success: true,
        message: 'Canva automation test completed successfully',
        contentType,
        contentId,
        platforms: JSON.parse(settings.platforms || '[]'),
        timestamp: new Date().toISOString()
      };

      res.json(testResult);
    } catch (error) {
      console.error('Error testing Canva automation:', error);
      res.status(500).json({ message: 'Failed to test Canva automation' });
    }
  });

  // Enhanced content redirect endpoint for handling expired affiliate links
  app.get('/redirect/:type/:id', async (req, res) => {
    const { handleRedirect } = await import('./redirect-handler.js');
    await handleRedirect(req, res);
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

// Affiliate Automation System Integration
import AffiliateAutomationService, { AutomationConfig } from './affiliate-automation';

// Initialize affiliate automation service
let affiliateService: AffiliateAutomationService | null = null;

// Initialize affiliate automation
export async function initializeAffiliateAutomation() {
  try {
    const config: AutomationConfig = {
      spreadsheetId: process.env.GOOGLE_SHEETS_ID || '',
      affiliateConfig: {
        amazon: { tag: process.env.AMAZON_ASSOCIATE_TAG || 'pickntrust03-21' },
        earnkaro: { id: process.env.EARNKARO_ID || '4530348' },
        cuelinks: { id: process.env.CUELINKS_TOKEN || '' },
        lemonsqueezy: { code: process.env.LEMON_SQUEEZY_CODE || 'bl2W8D' }
      },
      syncIntervalMinutes: parseInt(process.env.SYNC_INTERVAL_MINUTES || '5'),
      enableSocialPosting: process.env.ENABLE_SOCIAL_POSTING === 'true',
      enableCanvaGeneration: process.env.ENABLE_CANVA_GENERATION !== 'false'
    };

    if (!config.spreadsheetId) {
      console.log('⚠️ Google Sheets ID not configured, affiliate automation disabled');
      return false;
    }

    affiliateService = new AffiliateAutomationService(config);
    const initialized = await affiliateService.initialize();
    
    if (initialized) {
      // Start auto-sync
      affiliateService.startAutoSync();
      console.log('✅ Affiliate automation service started');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Failed to initialize affiliate automation:', error);
    return false;
  }
}

// Add affiliate automation routes
export function setupAffiliateRoutes(app: Express) {
  // Automatic Google Sheets sync - runs without manual commands
  app.post('/api/affiliate/sync', async (req: Request, res: Response) => {
    try {
      console.log('🚀 Auto-running Google Sheets automation...');
      
      // Import and run the complete automation system
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);
      
      try {
        await execPromise('node complete-automation-system.cjs', {
          cwd: process.cwd(),
          timeout: 60000 // 1 minute timeout
        });
        
        res.json({
          success: true,
          message: 'Complete automation system executed successfully',
          details: 'All categories, gender filtering, and real images processed automatically'
        });
        
      } catch (automationError) {
        console.error('❌ Automation error:', automationError);
        res.status(500).json({
          success: false,
          message: 'Automation system failed',
          error: automationError instanceof Error ? automationError.message : 'Unknown error'
        });
      }
      
    } catch (error) {
      console.error('❌ Sync error:', error);
      res.status(500).json({
        success: false,
        message: `Sync failed: ${error}`
      });
    }
  });
  
  // DISABLED: Auto-trigger sync every hour (3600000 ms)
  // Commented out for N8N migration - can be re-enabled if needed
  /*
  setInterval(async () => {
    try {
      console.log('🔄 Auto-triggering Google Sheets sync...');
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);
      
      await execPromise('node complete-automation-system.cjs', {
        cwd: process.cwd(),
        timeout: 60000
      });
      
      console.log('✅ Hourly automation completed successfully');
    } catch (error) {
      console.error('❌ Hourly automation failed:', error);
    }
  }, 3600000); // Run every hour
  */

  // Google Sheets automation function
  async function runGoogleSheetsAutomation(): Promise<void> {
    const Database = require('better-sqlite3');
    const path = require('path');
    
    // Connect to database
    const dbPath = path.join(process.cwd(), 'database.sqlite');
    const db = new Database(dbPath);
    
    try {
      console.log('📋 Processing domains from Google Sheets simulation...');
      
      // Clear existing automation products
      const clearStmt = db.prepare("DELETE FROM products WHERE tags LIKE '%sheets_automation%'");
      const cleared = clearStmt.run();
      console.log(`🧹 Cleared ${cleared.changes} existing Google Sheets automation products`);
      
      // Simulate Google Sheets data (domains from url_inbox)
      const googleSheetsData = [
        { url: 'amazon.in', category: 'electronics' },
        { url: 'myntra.com', category: 'fashion' },
        { url: 'flipkart.com', category: 'electronics' }
      ];
      
      const automationProducts = [
        {
          name: '📱 iPhone 15 Pro (Google Sheets)',
          description: 'Latest iPhone discovered via Google Sheets automation from amazon.in',
          price: 134900,
          original_price: 149900,
          image_url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400',
          affiliate_url: 'https://amazon.in/iphone-15-pro?tag=pickntrust03-21&ref=sheets',
          category: 'Electronics',
          rating: 4.8,
          review_count: 2500,
          is_featured: 1,
          affiliateProgram: 'amazon_associates',
          merchantDomain: 'amazon.in',
          originalUrl: 'https://amazon.in/iphone-15-pro',
          commissionRate: '8%',
          tags: 'sheets_automation,amazon,smartphone,google_sheets',
          targetPage: 'top-picks'
        },
        {
          name: '👕 Nike Premium T-Shirt (Google Sheets)',
          description: 'Premium sports wear discovered via Google Sheets automation from myntra.com',
          price: 2499,
          original_price: 3499,
          image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
          affiliate_url: 'https://myntra.com/nike-tshirt?utm_source=pickntrust&ref=sheets',
          category: 'Fashion',
          rating: 4.5,
          review_count: 1200,
          is_featured: 1,
          affiliateProgram: 'myntra_affiliate',
          merchantDomain: 'myntra.com',
          originalUrl: 'https://myntra.com/nike-premium-tshirt',
          commissionRate: '12%',
          tags: 'sheets_automation,myntra,fashion,google_sheets',
          targetPage: 'top-picks'
        },
        {
          name: '💻 Dell Laptop (Google Sheets)',
          description: 'High-performance laptop discovered via Google Sheets automation from flipkart.com',
          price: 65999,
          original_price: 75999,
          image_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
          affiliate_url: 'https://flipkart.com/dell-laptop?affid=pickntrust&ref=sheets',
          category: 'Electronics',
          rating: 4.6,
          review_count: 850,
          is_featured: 1,
          affiliateProgram: 'flipkart_affiliate',
          merchantDomain: 'flipkart.com',
          originalUrl: 'https://flipkart.com/dell-laptop',
          commissionRate: '6%',
          tags: 'sheets_automation,flipkart,laptop,google_sheets',
          targetPage: 'top-picks'
        }
      ];
      
      // Insert products
      const insertStmt = db.prepare(`
        INSERT INTO products (
          name, description, price, original_price, image_url, affiliate_url,
          category, rating, review_count, is_featured, affiliateProgram,
          merchantDomain, originalUrl, commissionRate, tags, targetPage, isActive
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, 1
        )
      `);
      
      let addedCount = 0;
      for (const product of automationProducts) {
        try {
          const result = insertStmt.run(
            product.name, product.description, product.price, product.original_price,
            product.image_url, product.affiliate_url, product.category, product.rating,
            product.review_count, product.is_featured, product.affiliateProgram,
            product.merchantDomain, product.originalUrl, product.commissionRate,
            product.tags, product.targetPage
          );
          console.log(`✅ Added: ${product.name} (ID: ${result.lastInsertRowid})`);
          addedCount++;
        } catch (error) {
          console.log(`⚠️ Skipped: ${product.name}`);
        }
      }
      
      console.log(`🎊 Google Sheets automation complete! Added ${addedCount} products`);
      
    } finally {
      db.close();
    }
  }

  // Website crawl endpoint
  app.post('/api/affiliate/crawl-website', async (req: Request, res: Response) => {
    try {
      const { domain, maxProducts = 20, categoryFilter, crawlType = 'auto', searchKeywords } = req.body;
      
      if (!domain) {
        return res.status(400).json({ success: false, message: 'Domain is required' });
      }
      
      if (!affiliateService) {
        return res.status(503).json({ 
          success: false, 
          message: 'Affiliate automation service not initialized' 
        });
      }
      
      const result = await affiliateService.crawlWebsite(domain, {
        maxProducts,
        categoryFilter,
        crawlType,
        searchKeywords
      });
      
      res.json({
        success: result.success,
        message: result.success ? 'Website crawl completed successfully' : 'Website crawl failed',
        data: result
      });
    } catch (error) {
      console.error('Website crawl error:', error);
      res.status(500).json({ success: false, message: 'Website crawl failed' });
    }
  });

  // Bulk website crawl endpoint
  app.post('/api/affiliate/crawl-multiple', async (req: Request, res: Response) => {
    try {
      const { domains, maxProductsPerSite = 10, categoryFilter, crawlType = 'auto' } = req.body;
      
      if (!domains || !Array.isArray(domains) || domains.length === 0) {
        return res.status(400).json({ success: false, message: 'Domains array is required' });
      }
      
      if (!affiliateService) {
        return res.status(503).json({ 
          success: false, 
          message: 'Affiliate automation service not initialized' 
        });
      }
      
      const results = [];
      
      for (const domain of domains) {
        try {
          const result = await affiliateService.crawlWebsite(domain, {
            maxProducts: maxProductsPerSite,
            categoryFilter,
            crawlType
          });
          results.push({ domain, ...result });
          
          // Delay between domains to be respectful
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          results.push({
            domain,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      const totalProducts = results.reduce((sum, r) => sum + (r.productsProcessed || 0), 0);
      
      res.json({
        success: true,
        message: `Bulk crawl completed: ${successCount}/${domains.length} sites successful`,
        totalProducts,
        results
      });
    } catch (error) {
      console.error('Bulk crawl error:', error);
      res.status(500).json({ success: false, message: 'Bulk crawl failed' });
    }
  });

  // Get automation status
  app.get('/api/affiliate/status', (req: Request, res: Response) => {
    try {
      if (!affiliateService) {
        return res.json({ 
          initialized: false, 
          message: 'Service not initialized' 
        });
      }

      const status = affiliateService.getStatus();
      res.json({ initialized: true, ...status });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: `Failed to get status: ${error}` 
      });
    }
  });

  // Start/stop auto-sync
  app.post('/api/affiliate/auto-sync/:action', (req: Request, res: Response) => {
    try {
      if (!affiliateService) {
        return res.status(503).json({ 
          success: false, 
          message: 'Affiliate automation service not initialized' 
        });
      }

      const { action } = req.params;
      
      if (action === 'start') {
        affiliateService.startAutoSync();
        res.json({ success: true, message: 'Auto-sync started' });
      } else if (action === 'stop') {
        affiliateService.stopAutoSync();
        res.json({ success: true, message: 'Auto-sync stopped' });
      } else {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid action. Use start or stop' 
        });
      }
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: `Failed to ${req.params.action} auto-sync: ${error}` 
      });
    }
  });

  // Get products by target page
  app.get('/api/products/by-page/:page', async (req: Request, res: Response) => {
    try {
      const { page } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;
      
      // Query products by target page
      const pageProducts = await db.select()
        .from(products)
        .where(eq(products.category, page))
        .limit(limit);
      
      res.json({ 
        success: true, 
        products: pageProducts,
        count: pageProducts.length 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: `Failed to get products: ${error}` 
      });
    }
  });

  // Health check for affiliate system
  app.get('/api/affiliate/health', (req: Request, res: Response) => {
    const health = {
      service: affiliateService ? 'running' : 'not_initialized',
      timestamp: new Date().toISOString(),
      environment: {
        google_sheets_configured: !!process.env.GOOGLE_SHEETS_ID,
        amazon_tag_configured: !!process.env.AMAZON_ASSOCIATE_TAG,
        earnkaro_configured: !!process.env.EARNKARO_ID,
        lemon_squeezy_configured: !!process.env.LEMON_SQUEEZY_CODE
      }
    };
    
    res.json(health);
  });
}
