const fetch = require('node-fetch');

async function createTestProduct() {
  try {
    console.log('Creating test product with all page selections...');
    
    const productData = {
      password: 'pickntrust2025',
      name: 'Test Product - All Pages',
      description: 'This product should appear on all 9 pages to test the checkbox fix',
      price: '1000',
      originalPrice: '1500',
      currency: 'INR',
      imageUrl: 'https://m.media-amazon.com/images/I/61IGSSfF-JL._SX679_.jpg',
      affiliateUrl: 'https://www.amazon.in/test-product',
      category: 'Electronics & Gadgets',
      gender: '',
      rating: '4.5',
      reviewCount: '50',
      discount: '33',
      isFeatured: false,
      isService: false,
      isAIApp: false,
      hasTimer: true,
      timerDuration: '48', // 48 hours so it won't expire quickly
      displayPages: ['home', 'prime-picks', 'top-picks', 'cue-picks', 'value-picks', 'click-picks', 'deals-hub', 'loot-box', 'global-picks'],
      pricingType: 'one-time',
      monthlyPrice: '',
      yearlyPrice: '',
      isFree: false,
      priceDescription: ''
    };
    
    const response = await fetch('http://localhost:5000/api/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });
    
    const result = await response.json();
    console.log('Create response:', result);
    
    if (response.ok) {
      console.log('Success Test product created successfully!');
      console.log('Product ID:', result.id);
      
      // Wait a moment for the product to be saved
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Now check if it appears on all pages
      const pages = ['home', 'prime-picks', 'top-picks', 'cue-picks', 'value-picks', 'click-picks', 'deals-hub', 'loot-box', 'global-picks'];
      
      console.log('\nChecking product visibility on all pages:');
      let foundCount = 0;
      
      for (const page of pages) {
        try {
          const pageResponse = await fetch(`http://localhost:5000/api/products/page/${page}`);
          const products = await pageResponse.json();
          const found = products.find(p => p.name === 'Test Product - All Pages');
          const status = found ? 'Success FOUND' : 'Error NOT FOUND';
          console.log(`${page.padEnd(15)}: ${status}`);
          if (found) foundCount++;
        } catch (e) {
          console.log(`${page.padEnd(15)}: Error ERROR`);
        }
      }
      
      console.log(`\nStats Summary: Product found on ${foundCount}/9 pages`);
      
      if (foundCount === 9) {
        console.log('Celebration SUCCESS: Checkbox fix is working! Product appears on all selected pages.');
      } else {
        console.log('Warning  ISSUE: Product is missing from some pages. The checkbox values may still need adjustment.');
      }
      
    } else {
      console.log('Error Failed to create test product');
      console.log('Error:', result);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

createTestProduct();