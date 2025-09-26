const axios = require('axios');

async function updateTestProduct() {
  try {
    // First, let's add a complete test product with all required fields
    const productData = {
      name: "Samsung Galaxy S24 Ultra 5G",
      title: "Samsung Galaxy S24 Ultra 5G",
      description: "🔥 Samsung Galaxy S24 Ultra 5G (Titanium Black, 12GB, 256GB Storage) with 200MP Camera, S Pen, AI Features & 5000mAh Battery. Premium flagship smartphone with cutting-edge technology! 📱✨",
      price: "89999",
      original_price: "124999", 
      image_url: "https://m.media-amazon.com/images/I/71ZOtNdaZCL._SX679_.jpg",
      affiliate_url: "https://amzn.to/3Samsung24Ultra?tag=pickntrust03-21",
      url: "https://amzn.to/3Samsung24Ultra?tag=pickntrust03-21",
      content_type: "product",
      page_type: "prime-picks",
      category: "electronics",
      subcategory: "smartphones",
      source_type: "admin",
      source_id: "prime-picks",
      affiliate_platform: "amazon",
      rating: "4.5",
      review_count: "2847",
      discount: "28", // 28% discount
      currency: "INR",
      is_active: 1,
      is_featured: 1,
      display_pages: ["prime-picks"],
      processing_status: "active",
      status: "active",
      visibility: "public"
    };

    console.log('Adding complete test product...');
    const response = await axios.post('http://localhost:5000/api/admin/products', {
      password: 'pickntrust2025', // Correct admin password
      ...productData
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Product added successfully:', response.data);

    // Verify the product was added
    console.log('\nVerifying product in API...');
    const verifyResponse = await axios.get('http://localhost:5000/api/products/page/prime-picks');
    const products = verifyResponse.data.products || verifyResponse.data;
    
    const newProduct = products.find(p => p.title && p.title.includes('Samsung Galaxy S24'));
    if (newProduct) {
      console.log('\nNew product found in API:');
      console.log(JSON.stringify(newProduct, null, 2));
    } else {
      console.log('\nProduct not found in API response');
    }

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

updateTestProduct();