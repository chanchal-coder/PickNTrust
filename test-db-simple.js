// Simple database test and setup
import { db } from './server/db.js';
import { products, blogPosts, categories, affiliateNetworks } from './shared/sqlite-schema.js';

async function testDatabase() {
  console.log('🔍 Testing database functionality...');
  
  try {
    // Test 1: Check if tables exist and are accessible
    console.log('\n1. Testing table access...');
    
    const existingProducts = await db.select().from(products);
    console.log(`✅ Products table accessible. Current count: ${existingProducts.length}`);
    
    const existingBlogPosts = await db.select().from(blogPosts);
    console.log(`✅ Blog posts table accessible. Current count: ${existingBlogPosts.length}`);
    
    // Test 2: Add sample data if tables are empty
    if (existingProducts.length === 0) {
      console.log('\n2. Adding sample products...');
      
      const sampleProducts = [
        {
          name: "Premium Wireless Headphones",
          description: "High-quality wireless headphones with noise cancellation and premium sound quality.",
          price: "2999",
          originalPrice: "4999",
          imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80",
          affiliateUrl: "https://example.com/headphones",
          category: "Electronics & Gadgets",
          rating: 4.5,
          reviewCount: 1250,
          discount: 40,
          isNew: true,
          isFeatured: true,
          hasTimer: false,
          createdAt: new Date()
        },
        {
          name: "Smart Fitness Watch",
          description: "Advanced fitness tracking with heart rate monitoring, GPS, and 7-day battery life.",
          price: "8999",
          originalPrice: "12999",
          imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80",
          affiliateUrl: "https://example.com/smartwatch",
          category: "Electronics & Gadgets",
          rating: 4.7,
          reviewCount: 890,
          discount: 31,
          isNew: false,
          isFeatured: true,
          hasTimer: false,
          createdAt: new Date()
        }
      ];
      
      for (const product of sampleProducts) {
        await db.insert(products).values(product);
        console.log(`✅ Added product: ${product.name}`);
      }
    }
    
    if (existingBlogPosts.length === 0) {
      console.log('\n3. Adding sample blog posts...');
      
      const sampleBlogPosts = [
        {
          title: "Top 10 Budget Smartphones Under ₹15,000",
          excerpt: "Discover the best budget smartphones that offer premium features without breaking the bank. Perfect for students and professionals.",
          content: "# Top 10 Budget Smartphones Under ₹15,000\n\nLooking for a great smartphone without spending a fortune? Here are our top picks...",
          category: "Tech News",
          tags: JSON.stringify(["budget", "smartphones", "tech", "deals"]),
          imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80",
          publishedAt: new Date(),
          readTime: "5 min read",
          slug: "top-10-budget-smartphones-under-15000",
          hasTimer: false,
          createdAt: new Date()
        }
      ];
      
      for (const post of sampleBlogPosts) {
        await db.insert(blogPosts).values(post);
        console.log(`✅ Added blog post: ${post.title}`);
      }
    }
    
    // Final verification
    console.log('\n4. Final verification...');
    const finalProducts = await db.select().from(products);
    const finalBlogPosts = await db.select().from(blogPosts);
    
    console.log(`✅ Final counts:`);
    console.log(`   Products: ${finalProducts.length}`);
    console.log(`   Blog Posts: ${finalBlogPosts.length}`);
    
    console.log('\n🎉 Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  }
}

// Run the test
testDatabase().then(() => {
  console.log('✅ Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
