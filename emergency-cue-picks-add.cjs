/**
 * Emergency Cue Picks Product Addition
 * Direct SQLite insertion to bypass module issues
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'database.sqlite');

// Enhanced product data with accurate pricing validation
function validatePrice(price, originalPrice) {
  const numPrice = parseFloat(price);
  const numOriginalPrice = parseFloat(originalPrice);
  
  if (isNaN(numPrice) || numPrice <= 0) {
    throw new Error(`Invalid price: ${price}. Price must be a positive number.`);
  }
  
  if (originalPrice && (isNaN(numOriginalPrice) || numOriginalPrice <= numPrice)) {
    throw new Error(`Invalid original price: ${originalPrice}. Must be greater than current price: ${price}`);
  }
  
  return { price: numPrice, originalPrice: numOriginalPrice };
}

// Validate pricing before creating product
const pricing = validatePrice('1799', '3999');
const discount = Math.round(((pricing.originalPrice - pricing.price) / pricing.originalPrice) * 100);

// OPPO Enco Air2i product data - Updated with correct pricing from website
const oppoProduct = {
  name: 'OPPO Enco Air2i',
  description: 'OPPO Enco Air2i Wireless Earbuds - White. Premium sound quality with deep bass, excellent product good quality oppo sound quality very super. Get up to 15% cashback with MobiKwik Wallet & UPI.',
  price: pricing.price.toString(),
  original_price: pricing.originalPrice.toString(), 
  currency: 'INR',
  image_url: 'https://image01.oppo.com/content/dam/oppo/product-asset-library/enco/enco-air2i/assets/images/kv/enco-air2i-kv-white.png',
  affiliate_url: 'https://linksredirect.com/?cid=243942&source=linkkit&url=https%3A%2F%2Fwww.oppo.com%2Fin%2Fproduct%2Foppo-enco-air2i.P.P1100171',
  category: 'Electronics & Gadgets',
  rating: '4.9',
  review_count: 100,
  discount: discount,
  source: 'cuelinks-telegram',
  is_new: 1,
  is_featured: 1,
  display_pages: '["cue-picks"]',
  created_at: Math.floor(Date.now() / 1000),
  expires_at: Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000),
  telegram_message_id: 1001,
  telegram_channel_id: -1002982344997
};

function addEmergencyProduct() {
  return new Promise((resolve, reject) => {
    console.log('Alert Emergency Cue Picks Product Addition');
    console.log('Mobile Adding OPPO Enco Air2i to cue-picks page...');
    
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error Database connection failed:', err.message);
        reject(err);
        return;
      }
      console.log('Success Connected to SQLite database');
    });
    
    const insertSQL = `
      INSERT INTO products (
        name, description, price, original_price, currency, image_url, 
        affiliate_url, category, rating, review_count, discount, source,
        is_new, is_featured, display_pages, created_at, expires_at,
        telegram_message_id, telegram_channel_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      oppoProduct.name,
      oppoProduct.description,
      oppoProduct.price,
      oppoProduct.original_price,
      oppoProduct.currency,
      oppoProduct.image_url,
      oppoProduct.affiliate_url,
      oppoProduct.category,
      oppoProduct.rating,
      oppoProduct.review_count,
      oppoProduct.discount,
      oppoProduct.source,
      oppoProduct.is_new,
      oppoProduct.is_featured,
      oppoProduct.display_pages,
      oppoProduct.created_at,
      oppoProduct.expires_at,
      oppoProduct.telegram_message_id,
      oppoProduct.telegram_channel_id
    ];
    
    db.run(insertSQL, values, function(err) {
      if (err) {
        console.error('Error Failed to add emergency product:', err.message);
        
        if (err.message.includes('UNIQUE constraint')) {
          console.log('ℹ️ Product may already exist in database');
        } else if (err.message.includes('NOT NULL constraint')) {
          console.log('ℹ️ Missing required field:', err.message);
        }
        
        db.close();
        reject(err);
        return;
      }
      
      console.log('Success Product added successfully!');
      console.log(`Stats Product ID: ${this.lastID}`);
      console.log('Stats Product Details:');
      console.log(`   Name: ${oppoProduct.name}`);
      console.log(`   Price: ₹${oppoProduct.price} (was ₹${oppoProduct.original_price})`);
      console.log(`   Discount: ${oppoProduct.discount}%`);
      console.log(`   Rating: ${oppoProduct.rating}/5`);
      console.log(`   Category: ${oppoProduct.category}`);
      console.log(`   Target Page: cue-picks`);
      console.log(`   Expires: ${new Date(oppoProduct.expires_at * 1000).toISOString()}`);
      
      console.log('\nGlobal Check http://localhost:5000/cue-picks to see the product!');
      
      db.close((err) => {
        if (err) {
          console.error('Error Error closing database:', err.message);
        } else {
          console.log('Success Database connection closed');
        }
        resolve();
      });
    });
  });
}

// Run the emergency addition
addEmergencyProduct().then(() => {
  console.log('\n🔧 Emergency addition completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Emergency addition failed:', error.message);
  process.exit(1);
});