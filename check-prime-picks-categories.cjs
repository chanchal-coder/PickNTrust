const fetch = require('node-fetch');

async function checkPrimePicksCategories() {
  try {
    console.log('Search Testing Prime Picks Categories API...');
    
    // Test the categories API endpoint
    const response = await fetch('http://localhost:5000/api/categories/page/prime-picks');
    
    if (!response.ok) {
      console.log('Error API Response Status:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Error details:', errorText);
      return;
    }
    
    const categories = await response.json();
    console.log('Success API Response successful');
    console.log('📋 Categories found:', categories.length);
    console.log('Categories:', JSON.stringify(categories, null, 2));
    
    // Also test the products API to compare
    console.log('\nSearch Testing Prime Picks Products API...');
    const productsResponse = await fetch('http://localhost:5000/api/products/page/prime-picks');
    
    if (productsResponse.ok) {
      const products = await productsResponse.json();
      console.log('Success Products API Response successful');
      console.log('Products Products found:', products.length);
      
      // Extract unique categories from products
      const productCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
      console.log('📂 Categories from products:', productCategories);
      
      // Compare
      console.log('\nSearch COMPARISON:');
      console.log('Categories API returned:', categories);
      console.log('Categories from products:', productCategories);
      
      if (categories.length === 0 && productCategories.length > 0) {
        console.log('\nError ISSUE FOUND: Categories API returns empty but products have categories!');
        console.log('This explains why sidebar categories are not showing.');
      } else if (categories.length > 0) {
        console.log('\nSuccess Categories API is working correctly.');
      }
    } else {
      console.log('Error Products API failed:', productsResponse.status);
    }
    
  } catch (error) {
    console.error('Error Error:', error.message);
  }
}

checkPrimePicksCategories();