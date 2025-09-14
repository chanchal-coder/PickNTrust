const fetch = require('node-fetch');

console.log('Testing UI form submission format...');

// This simulates what the UI form sends
const uiFormData = {
  password: 'pickntrust2025',
  name: 'UI Test Product',
  description: 'Testing from UI form',
  price: '2,999', // Note: UI sends with commas
  originalPrice: '3,999',
  imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
  affiliateUrl: 'https://example.com/test',
  category: 'Electronics & Gadgets',
  gender: '',
  rating: '4.5',
  reviewCount: '100',
  discount: '25',
  isFeatured: true,
  isService: false,
  hasTimer: false,
  timerDuration: '24',
  customFields: {} // Empty object
};

async function testUIFormSubmission() {
  try {
    console.log('Sending UI form data:', JSON.stringify(uiFormData, null, 2));
    
    const response = await fetch('http://localhost:5000/api/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(uiFormData)
    });
    
    console.log('Response status:', response.status);
    const result = await response.json();
    console.log('Response:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testUIFormSubmission();
