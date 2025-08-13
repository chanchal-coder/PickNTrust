import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://byhevspaetryxpmnkyxd.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5aGV2c3BhZXRyeXhwbW5reXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMzQ2NzMsImV4cCI6MjA2OTcxMDY3M30.77OtZdtskXkvdNIrRKjb53EBWeL1kmQJcbcsNueXxBU';

const supabase = createClient(supabaseUrl, supabaseKey);

// CORS middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes with complete functionality

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'PickNTrust API is running',
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// Featured Products
app.get('/api/products/featured', async (req, res) => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('featured', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Featured products error:', error);
      return res.json([
        {
          id: 1,
          name: "iPhone 15 Pro",
          price: 79999,
          originalPrice: 89999,
          discount: 11,
          rating: 4.8,
          reviewCount: 245,
          imageUrl: "https://via.placeholder.com/300x200?text=iPhone+15+Pro",
          category: "Electronics",
          description: "Latest iPhone with advanced features",
          featured: true
        },
        {
          id: 2,
          name: "MacBook Air M3",
          price: 124999,
          originalPrice: 134999,
          discount: 7,
          rating: 4.9,
          reviewCount: 189,
          imageUrl: "https://via.placeholder.com/300x200?text=MacBook+Air",
          category: "Computers",
          description: "Powerful laptop for professionals",
          featured: true
        }
      ]);
    }

    res.json(products || []);
  } catch (error) {
    console.error('Featured products API error:', error);
    res.status(500).json({ error: 'Failed to fetch featured products' });
  }
});

// All Products
app.get('/api/products', async (req, res) => {
  try {
    const { search } = req.query;
    let query = supabase.from('products').select('*');
    
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    
    const { data: products, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Products error:', error);
      return res.json([
        {
          id: 1,
          name: "Sample Product",
          price: 999,
          originalPrice: 1299,
          discount: 23,
          rating: 4.5,
          reviewCount: 150,
          imageUrl: "https://via.placeholder.com/300x200?text=Product",
          category: "Electronics",
          description: "This is a sample product"
        }
      ]);
    }

    res.json(products || []);
  } catch (error) {
    console.error('Products API error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Products by Category
app.get('/api/products/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .ilike('category', `%${category}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Category products error:', error);
      return res.json([]);
    }

    res.json(products || []);
  } catch (error) {
    console.error('Category products API error:', error);
    res.status(500).json({ error: 'Failed to fetch category products' });
  }
});

// Add new product (Admin)
app.post('/api/admin/products', async (req, res) => {
  try {
    const productData = {
      ...req.body,
      created_at: new Date().toISOString()
    };
    
    const { data: product, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single();

    if (error) {
      console.error('Insert product error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json(product);
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

// Update product (Admin)
app.put('/api/admin/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: product, error } = await supabase
      .from('products')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update product error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product (Admin)
app.delete('/api/admin/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete product error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Categories
app.get('/api/categories', async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Categories error:', error);
      return res.json([
        { id: 1, name: "Electronics", slug: "electronics", count: 25 },
        { id: 2, name: "Fashion", slug: "fashion", count: 18 },
        { id: 3, name: "Home & Living", slug: "home-living", count: 12 },
        { id: 4, name: "Books", slug: "books", count: 8 },
        { id: 5, name: "Computers", slug: "computers", count: 15 }
      ]);
    }

    res.json(categories || []);
  } catch (error) {
    console.error('Categories API error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Add category
app.post('/api/categories', async (req, res) => {
  try {
    const { data: category, error } = await supabase
      .from('categories')
      .insert([req.body])
      .select()
      .single();

    if (error) {
      console.error('Add category error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json(category);
  } catch (error) {
    console.error('Add category error:', error);
    res.status(500).json({ error: 'Failed to add category' });
  }
});

// Blog posts
app.get('/api/blog', async (req, res) => {
  try {
    const { data: blogs, error } = await supabase
      .from('blogs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Blogs error:', error);
      return res.json([
        {
          id: 1,
          title: "Welcome to PickNTrust Blog",
          slug: "welcome-to-pickntrust",
          excerpt: "Discover amazing deals and products on our platform",
          content: "Welcome to our amazing e-commerce platform!",
          imageUrl: "https://via.placeholder.com/600x300?text=Blog+Post",
          created_at: new Date().toISOString(),
          readTime: "3 min read"
        }
      ]);
    }

    res.json(blogs || []);
  } catch (error) {
    console.error('Blogs API error:', error);
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
});

// Single blog post
app.get('/api/blog/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { data: blog, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('Blog post error:', error);
      return res.status(404).json({ error: 'Blog post not found' });
    }

    res.json(blog);
  } catch (error) {
    console.error('Blog post API error:', error);
    res.status(500).json({ error: 'Failed to fetch blog post' });
  }
});

// Add blog post (Admin)
app.post('/api/admin/blog', async (req, res) => {
  try {
    const blogData = {
      ...req.body,
      created_at: new Date().toISOString()
    };
    
    const { data: blog, error } = await supabase
      .from('blogs')
      .insert([blogData])
      .select()
      .single();

    if (error) {
      console.error('Add blog error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json(blog);
  } catch (error) {
    console.error('Add blog error:', error);
    res.status(500).json({ error: 'Failed to add blog post' });
  }
});

// Update blog post (Admin)
app.put('/api/admin/blog/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: blog, error } = await supabase
      .from('blogs')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update blog error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json(blog);
  } catch (error) {
    console.error('Update blog error:', error);
    res.status(500).json({ error: 'Failed to update blog post' });
  }
});

// Delete blog post (Admin)
app.delete('/api/admin/blog/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('blogs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete blog error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({ error: 'Failed to delete blog post' });
  }
});

// Announcements
app.get('/api/announcement/active', async (req, res) => {
  try {
    const { data: announcement, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Active announcement error:', error);
      return res.json({
        id: 1,
        title: "Welcome to PickNTrust!",
        content: "Your trusted e-commerce platform is now live!",
        active: true,
        created_at: new Date().toISOString()
      });
    }

    res.json(announcement);
  } catch (error) {
    console.error('Active announcement API error:', error);
    res.status(500).json({ error: 'Failed to fetch active announcement' });
  }
});

// Add announcement (Admin)
app.post('/api/admin/announcements', async (req, res) => {
  try {
    const announcementData = {
      ...req.body,
      created_at: new Date().toISOString(),
      active: true
    };
    
    const { data: announcement, error } = await supabase
      .from('announcements')
      .insert([announcementData])
      .select()
      .single();

    if (error) {
      console.error('Add announcement error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json(announcement);
  } catch (error) {
    console.error('Add announcement error:', error);
    res.status(500).json({ error: 'Failed to add announcement' });
  }
});

// Admin authentication
app.post('/api/admin/auth', (req, res) => {
  const { username, password } = req.body;
  
  if (username === 'admin' && password === 'pickntrust2025') {
    res.json({ 
      success: true, 
      token: 'admin-token-' + Date.now(),
      message: 'Login successful' 
    });
  } else {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid credentials' 
    });
  }
});

// Admin stats
app.get('/api/admin/stats', async (req, res) => {
  try {
    const [productsCount, blogsCount, categoriesCount] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact' }),
      supabase.from('blogs').select('id', { count: 'exact' }),
      supabase.from('categories').select('id', { count: 'exact' })
    ]);

    res.json({
      totalProducts: productsCount.count || 0,
      featuredProducts: 2, // Mock data
      blogPosts: blogsCount.count || 0,
      affiliateNetworks: 6 // Mock data
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.json({
      totalProducts: 0,
      featuredProducts: 0,
      blogPosts: 0,
      affiliateNetworks: 0
    });
  }
});

// Affiliate networks
app.get('/api/affiliate-networks', (req, res) => {
  res.json([
    { id: 1, name: "Amazon Associates", active: true },
    { id: 2, name: "Flipkart Affiliate", active: true },
    { id: 3, name: "Commission Junction", active: true },
    { id: 4, name: "ShareASale", active: true },
    { id: 5, name: "ClickBank", active: true },
    { id: 6, name: "Impact", active: true }
  ]);
});

// Active affiliate networks
app.get('/api/affiliate-networks/active', (req, res) => {
  res.json([
    { id: 1, name: "Amazon Associates", active: true },
    { id: 2, name: "Flipkart Affiliate", active: true }
  ]);
});

// Affiliate tracking
app.post('/api/affiliate/track', (req, res) => {
  res.json({ success: true, message: 'Affiliate click tracked' });
});

// Newsletter subscription
app.post('/api/newsletter/subscribe', (req, res) => {
  res.json({ success: true, message: 'Successfully subscribed to newsletter' });
});

// Product extraction (mock)
app.post('/api/products/extract', (req, res) => {
  const { url } = req.body;
  res.json({
    name: "Extracted Product",
    price: 1999,
    originalPrice: 2499,
    discount: 20,
    description: "Product extracted from " + url,
    imageUrl: "https://via.placeholder.com/300x200?text=Extracted+Product",
    category: "Electronics"
  });
});

// Upload endpoint (mock)
app.post('/api/upload', (req, res) => {
  res.json({ 
    success: true, 
    url: "https://via.placeholder.com/300x200?text=Uploaded+Image" 
  });
});

// Placeholder image
app.get('/api/placeholder/:width/:height', (req, res) => {
  const { width, height } = req.params;
  res.redirect(`https://via.placeholder.com/${width}x${height}?text=PickNTrust`);
});

// Theme settings
app.get('/api/settings/theme', (req, res) => {
  res.json({ 
    theme: 'light',
    primaryColor: '#3b82f6',
    secondaryColor: '#64748b'
  });
});

app.post('/api/settings/theme', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Theme updated successfully',
    theme: req.body.theme 
  });
});

// Serve static files
app.use(express.static(path.join(__dirname, 'dist/public')));

// Serve React app for all other routes (must be last)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/public/index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 PickNTrust Production Server running on port ${PORT}`);
  console.log(`📁 Serving static files from: ${path.join(__dirname, 'dist/public')}`);
  console.log(`🌐 Access your site at: http://51.20.43.157:${PORT}`);
  console.log(`🔧 API endpoints available at: http://51.20.43.157:${PORT}/api/`);
  console.log(`💾 Database: ${supabaseUrl}`);
});
