const { db } = require('./server/db');
const { featuredProducts } = require('./shared/sqlite-schema');
const { eq } = require('drizzle-orm');

async function removeFakeProducts() {
  try {
    console.log('🗑️ Removing fake featured products from database...');
    
    // List of fake product names to remove
    const fakeProducts = [
      'Samsung Galaxy S24 Ultra',
      'Nike Air Max 270', 
      'MacBook Air M3',
      'Sony WH-1000XM5 Headphones',
      'Instant Pot Duo 7-in-1'
    ];
    
    for (const productName of fakeProducts) {
      const result = await db.delete(featuredProducts)
        .where(eq(featuredProducts.name, productName));
      console.log(`Success Deleted: ${productName}`);
    }
    
    console.log('Celebration All fake products removed!');
    
    // Show remaining products
    const remaining = await db.select().from(featuredProducts);
    console.log('\n📋 Remaining featured products:');
    remaining.forEach(p => {
      console.log(`- ${p.name} (${p.isService ? 'Service' : 'Product'})`);
    });
    
  } catch (error) {
    console.error('Error Error:', error);
  }
}

removeFakeProducts();