#!/usr/bin/env node
import { DatabaseStorage } from './server/storage.js';
import { dbInstance as db } from './server/db.mjs';
import { products, blogPosts, categories, affiliateNetworks } from './shared/sqlite-schema.js';

const storage = new DatabaseStorage();

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');
  
  try {
    // Add sample affiliate networks
    const networks = [
      { name: 'Amazon Associates', slug: 'amazon', description: 'Amazon affiliate program', commissionRate: 4.0, logoUrl: 'https://via.placeholder.com/100x50?text=Amazon', isActive: true },
      { name: 'Flipkart Affiliate', slug: 'flipkart', description: 'Flipkart affiliate program', commissionRate: 5.0, logoUrl: 'https://via.placeholder.com/100x50?text=Flipkart', isActive: true }
    ];
    
    for (const network of networks) {
      await storage.addAffiliateNetwork(network);
    }
    console.log('✅ Added affiliate networks');

    // Add sample categories
    const sampleCategories = [
      { name: 'Electronics', icon: 'fas fa-laptop', color: '#3b82f6', description: 'Latest gadgets and tech' },
      { name: 'Fashion', icon: 'fas fa-tshirt', color: '#ec4899', description: 'Trendy clothing and accessories' },
      { name: 'Home & Living', icon: 'fas fa-home', color: '#10b981', description: 'Home decor and essentials' },
      { name: 'Beauty', icon: 'fas fa-spa', color: '#f59e0b', description: 'Skincare and beauty products' }
    ];

    for (const category of sampleCategories) {
      await db.insert(categories).values(category);
    }
    console.log('✅ Added categories');

    // Add sample products
    const sampleProducts = [
      {
        name: 'Premium Wireless Headphones',
        description: 'High-quality wireless headphones with active noise cancellation and 30-hour battery life',
        price: 299.99,
        originalPrice: 399.99,
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
        affiliateUrl: 'https://amazon.com/headphones',
        category: 'Electronics',
        rating: 4.5,
        reviewCount: 234,
        discount: 25,
        isNew: true,
        isFeatured: true,
        hasTimer: true,
        timerDuration: 24
      },
      {
        name: 'Organic Cotton T-Shirt',
        description: 'Comfortable organic cotton t-shirt available in multiple colors',
        price: 29.99,
        originalPrice: 39.99,
        imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop',
        affiliateUrl: 'https://flipkart.com/tshirt',
        category: 'Fashion',
        rating: 4.8,
        reviewCount: 156,
        discount: 25,
        isFeatured: true,
        hasTimer: true,
        timerDuration: 48
      },
      {
        name: 'Smart Home Hub',
        description: 'Control all your smart devices from one central hub with voice commands',
        price: 149.99,
        originalPrice: 199.99,
        imageUrl: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=400&h=300&fit=crop',
        affiliateUrl: 'https://amazon.com/smarthub',
        category: 'Electronics',
        rating: 4.3,
        reviewCount: 89,
        discount: 25,
        isFeatured: true,
        hasTimer: false
      },
      {
        name: 'Natural Face Serum',
        description: 'Vitamin C face serum for glowing skin with natural ingredients',
        price: 24.99,
        originalPrice: 34.99,
        imageUrl: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=300&fit=crop',
        affiliateUrl: 'https://amazon.com/serum',
        category: 'Beauty',
        rating: 4.7,
        reviewCount: 312,
        discount: 29,
        isNew: true,
        isFeatured: true,
        hasTimer: true,
        timerDuration: 12
      },
      {
        name: 'Minimalist Desk Lamp',
        description: 'Modern LED desk lamp with adjustable brightness and USB charging',
        price: 45.99,
        originalPrice: 59.99,
        imageUrl: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400&h=300&fit=crop',
        affiliateUrl: 'https://flipkart.com/lamp',
        category: 'Home & Living',
        rating: 4.4,
        reviewCount: 67,
        discount: 23,
        isFeatured: true,
        hasTimer: true,
        timerDuration: 36
      }
    ];

    for (const product of sampleProducts) {
      await storage.addProduct(product);
    }
    console.log('✅ Added sample products');

    // Add sample blog posts
    const sampleBlogPosts = [
      {
        title: 'Top 10 Tech Gadgets of 2024',
        excerpt: 'Discover the most innovative tech products that are changing the way we live and work in 2024',
        content: 'In this comprehensive guide, we explore the top 10 tech gadgets that have revolutionized our daily lives in 2024. From AI-powered smart home devices to cutting-edge wearables, these innovations are shaping the future...',
        category: 'Tech',
        tags: ['tech', 'gadgets', '2024', 'innovation'],
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=400&fit=crop',
        publishedAt: new Date('2024-01-15'),
        readTime: '5 min read',
        slug: 'top-10-tech-gadgets-2024',
        hasTimer: false
      },
      {
        title: 'Sustainable Fashion: A Complete Guide',
        excerpt: 'Learn how to build a sustainable wardrobe without breaking the bank while supporting ethical brands',
        content: 'Sustainable fashion is more than just a trend - it\'s a movement towards conscious consumerism. This guide covers everything from identifying eco-friendly materials to finding affordable sustainable brands...',
        category: 'Fashion',
        tags: ['sustainable', 'fashion', 'guide', 'eco-friendly'],
        imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop',
        publishedAt: new Date('2024-01-10'),
        readTime: '8 min read',
        slug: 'sustainable-fashion-guide',
        hasTimer: false
      },
      {
        title: 'Smart Home Automation Tips',
        excerpt: 'Transform your living space into a smart home with these simple and affordable automation tips',
        content: 'Creating a smart home doesn\'t have to be expensive or complicated. This post shares practical tips for automating your home on a budget, from smart plugs to voice assistants...',
        category: 'Home',
        tags: ['smart home', 'automation', 'tips', 'budget'],
        imageUrl: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&h=400&fit=crop',
        publishedAt: new Date('2024-01-05'),
        readTime: '6 min read',
        slug: 'smart-home-automation-tips',
        hasTimer: false
      }
    ];

    for (const post of sampleBlogPosts) {
      await storage.addBlogPost(post);
    }
    console.log('✅ Added sample blog posts');

    console.log('🎉 Database seeding completed successfully!');
    
    // Verify the data
    const productCount = await storage.getProducts();
    const blogCount = await storage.getBlogPosts();
    console.log(`📊 Database now contains: ${productCount.length} products and ${blogCount.length} blog posts`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}

// Run the seeding
seedDatabase();
