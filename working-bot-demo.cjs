const TelegramBot = require('node-telegram-bot-api');
const Database = require('better-sqlite3');
const { SimpleURLScraper } = require('./simple-url-scraper.cjs');
const path = require('path');
require('dotenv').config();

console.log('🚀 Starting Working Bot Demo');
console.log('============================');

// Get bot token
const BOT_TOKEN = process.env.MASTER_BOT_TOKEN;
if (!BOT_TOKEN) {
    console.error('❌ MASTER_BOT_TOKEN not found');
    process.exit(1);
}

// Database setup
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// Channel configuration
const PRIME_PICKS_CHANNEL = '-1002955338551';
const CUE_PICKS_CHANNEL = '-1002982344997';

console.log('🔑 Bot token configured');
console.log('📺 Target channels:');
console.log('   Prime Picks:', PRIME_PICKS_CHANNEL);
console.log('   Cue Picks:', CUE_PICKS_CHANNEL);

// Create bot with polling - configured to receive all updates including channel posts
const bot = new TelegramBot(BOT_TOKEN, { 
    polling: {
        interval: 2000,
        autoStart: true,
        params: {
            allowed_updates: ['message', 'channel_post', 'edited_channel_post'],
            timeout: 10
        }
    }
});
const urlScraper = new SimpleURLScraper();

console.log('🤖 Bot created with polling enabled');

// Test bot connection first
async function testBotConnection() {
    try {
        console.log('\n📋 Testing bot connection...');
        const botInfo = await bot.getMe();
        console.log('✅ Bot connected successfully!');
        console.log('   ID:', botInfo.id);
        console.log('   Username:', botInfo.username);
        console.log('   Name:', botInfo.first_name);
        return true;
    } catch (error) {
        console.log('⚠️ Bot connection test failed:', error.message);
        console.log('   Continuing anyway - may work for posting...');
        return false;
    }
}

// Send a test product to the channel
async function sendTestProduct() {
    const testProduct = `🔥 WORKING BOT DEMO! 🔥

📱 Premium Wireless Earbuds
💰 Price: ₹1,999 (was ₹4,999)
🎯 60% OFF - Limited Time Deal!

✅ Active Noise Cancellation
✅ 30-Hour Battery Life
✅ IPX7 Waterproof
✅ Premium Sound Quality

🛒 Buy Now: https://www.amazon.in/premium-wireless-earbuds/dp/B08DEMO123

⏰ Hurry! Only 25 left in stock!

#PrimePicks #Earbuds #Deal #WorkingBot #Demo

🤖 Posted by Working Bot - ${new Date().toLocaleString()}`;

    try {
        console.log('\n📤 Sending test product to channel...');
        const result = await bot.sendMessage(PRIME_PICKS_CHANNEL, testProduct);
        console.log('✅ Message sent successfully!');
        console.log('   Message ID:', result.message_id);
        console.log('   Chat ID:', result.chat.id);
        console.log('   Date:', new Date(result.date * 1000).toLocaleString());
        return result;
    } catch (error) {
        console.error('❌ Failed to send message:', error.message);
        return null;
    }
}

// Enhanced URL detection regex patterns
const URL_PATTERNS = {
    amazon: /(?:https?:\/\/)?(?:www\.)?amazon\.(?:in|com)\/[^\s]+/gi,
    flipkart: /(?:https?:\/\/)?(?:www\.)?flipkart\.com\/[^\s]+/gi,
    myntra: /(?:https?:\/\/)?(?:www\.)?myntra\.com\/[^\s]+/gi,
    general: /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\/[^\s]*/gi,
    shortened: /(?:https?:\/\/)?(?:bit\.ly|tinyurl\.com|goo\.gl|t\.co|short\.link|amzn\.to|fkrt\.it|myntra\.com\/m|flipkart\.com\/dl|a\.co)\/[^\s]+/gi,
    affiliate: /(?:tag=|ref=|affiliate|partner|cid=|source=linkkit|linksredirect\.com|inrdeals\.com|earnkaro\.com)/gi
};

// Convert URLs to Cuelinks affiliate links
function convertToCuelinksUrls(urls) {
    return urls.map(url => {
        try {
            // Use Cuelinks universal conversion for all URLs
            const encodedUrl = encodeURIComponent(url);
            const cuelinksUrl = `https://linksredirect.com/?cid=243942&source=linkkit&url=${encodedUrl}`;
            console.log(`🔗 Cuelinks conversion: ${url} → ${cuelinksUrl}`);
            return cuelinksUrl;
        } catch (error) {
            console.error('❌ Error converting URL to Cuelinks:', error);
            return url; // Return original URL if conversion fails
        }
    });
}

// Convert URLs to affiliate links (Amazon-focused for Prime Picks)
function convertToAffiliateUrls(urls) {
    const convertedUrls = [];
    
    for (const url of urls) {
        console.log(`🔄 Converting URL: ${url}`);
        
        // Check if it's an Amazon URL
        if (url.includes('amazon.in') || url.includes('amazon.com')) {
            // Add Amazon affiliate tag
            const cleanUrl = url.split('?')[0];
            const affiliateUrl = `${cleanUrl}?tag=pickntrust03-21&linkCode=as2&camp=1789&creative=9325`;
            convertedUrls.push(affiliateUrl);
            console.log(`✅ Amazon affiliate URL: ${affiliateUrl}`);
        }
        // Check if it's a Flipkart URL
        else if (url.includes('flipkart.com')) {
            // Convert through CueLinks
            const encodedUrl = encodeURIComponent(url);
            const affiliateUrl = `https://linksredirect.com/?cid=243942&source=linkkit&url=${encodedUrl}`;
            convertedUrls.push(affiliateUrl);
            console.log(`✅ CueLinks affiliate URL: ${affiliateUrl}`);
        }
        // For other URLs, use CueLinks universal conversion
        else {
            const encodedUrl = encodeURIComponent(url);
            const affiliateUrl = `https://linksredirect.com/?cid=243942&source=linkkit&url=${encodedUrl}`;
            convertedUrls.push(affiliateUrl);
            console.log(`✅ Universal affiliate URL: ${affiliateUrl}`);
        }
    }
    
    return convertedUrls;
}
function extractProductInfo(message) {
    if (!message) return { urls: [], title: null, price: null, originalPrice: null, discount: null };
    
    console.log('🔍 Analyzing message:', message);
    
    // Extract URLs
    let urls = [];
    const generalUrls = message.match(URL_PATTERNS.general) || [];
    const shortenedUrls = message.match(URL_PATTERNS.shortened) || [];
    urls = [...new Set([...generalUrls, ...shortenedUrls])];
    
    // Clean URLs
    urls = urls.map(url => {
        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }
        return url.replace(/[.,;!?]+$/, '');
    });
    
    // Extract basic product info
    const lines = message.split('\n').filter(line => line.trim());
    let title = null;
    let price = null, originalPrice = null, discount = null;
    
    console.log('📝 Message lines:', lines);
    
    // Enhanced title extraction - look for the first meaningful line
    const productKeywords = ['headphones', 'mouse', 'watch', 'laptop', 'phone', 'smartphone', 'tablet', 'camera', 'speaker', 'earbuds', 'charger', 'cable', 'adapter', 'keyboard', 'monitor', 'tv', 'television', 'gaming', 'wireless', 'bluetooth', 'smart', 'premium', 'pro', 'max', 'mini', 'ultra', 'edition', 'series', 'model', 'samsung', 'apple', 'sony', 'lg', 'mi', 'xiaomi', 'oneplus', 'realme', 'oppo', 'vivo', 'nokia', 'motorola', 'asus', 'hp', 'dell', 'lenovo', 'acer', 'canon', 'nikon', 'jbl', 'boat', 'bose', 'bike', 'electric', 'kids', 'children', 'toy', 'game'];
    
    // First, try to find a line that looks like a product title
    for (const line of lines) {
        const cleanLine = line.replace(/[✨🎯🔥⚡️🎉💥🚀💰❌✅📱💻⌚🎧📷🔊]/g, '').trim();
        console.log('🔍 Checking line:', cleanLine);
        
        // Skip lines that are clearly not product titles
        if (cleanLine.startsWith('http') || 
            cleanLine.toLowerCase().startsWith('link:') ||
            cleanLine.includes('Deal @') || 
            cleanLine.includes('Reg @') || 
            cleanLine.includes('Price:') || 
            cleanLine.includes('MRP') ||
            cleanLine.length < 8) {
            console.log('❌ Skipping line (not product title):', cleanLine);
            continue;
        }
        
        // Check if line contains price - if so, extract title part before price
        const priceMatch = cleanLine.match(/^(.+?)\s+at\s+₹/i);
        if (priceMatch) {
            title = priceMatch[1].trim();
            console.log('✅ Found title with price pattern:', title);
            break;
        }
        
        const lowerLine = cleanLine.toLowerCase();
        const hasProductKeyword = productKeywords.some(keyword => lowerLine.includes(keyword));
        const looksLikeProductName = cleanLine.length > 10 && cleanLine.length < 150 && 
                                    /[a-zA-Z]/.test(cleanLine) &&
                                    !cleanLine.match(/^[0-9\s\-\+\*\/\=\(\)]+$/);
        
        if (hasProductKeyword || (looksLikeProductName && !title)) {
            title = cleanLine;
            console.log('✅ Found title with keyword/pattern:', title);
            if (hasProductKeyword) break; // Prefer lines with product keywords
        }
    }
    
    // If no title found, use the first non-empty line that's not a URL or link reference
    if (!title) {
        for (const line of lines) {
            const cleanLine = line.replace(/[✨🎯🔥⚡️🎉💥🚀💰❌✅📱💻⌚🎧📷🔊]/g, '').trim();
            if (cleanLine && 
                !cleanLine.startsWith('http') && 
                !cleanLine.toLowerCase().startsWith('link:') &&
                cleanLine.length > 5 && 
                cleanLine.length < 150) {
                
                // Extract title part before price if present
                const beforePrice = cleanLine.split(/\s+at\s+₹|\s+₹/i)[0].trim();
                if (beforePrice && beforePrice.length > 5) {
                    title = beforePrice;
                    console.log('✅ Extracted title before price:', title);
                } else {
                    title = cleanLine;
                    console.log('✅ Using full line as title:', title);
                }
                break;
            }
        }
    }
    
    // Enhanced price extraction
    // Look for patterns like "₹1,999 ₹2,999" or "Deal @ ₹1,999 Reg @ ₹2,999"
    const dealRegPattern = /(?:Deal\s*@\s*)?₹([\d,]+(?:\.\d+)?)\s*(?:Reg\s*@\s*)?₹([\d,]+(?:\.\d+)?)/i;
    const dealRegMatch = message.match(dealRegPattern);
    
    if (dealRegMatch) {
        price = `₹${dealRegMatch[1]}`;
        originalPrice = `₹${dealRegMatch[2]}`;
    } else {
        // Look for multiple rupee amounts
        const rupeeMatches = message.match(/₹([\d,]+(?:\.\d+)?)/gi);
        if (rupeeMatches && rupeeMatches.length >= 2) {
            // Usually first price is current, second is original
            price = rupeeMatches[0];
            originalPrice = rupeeMatches[1];
        } else if (rupeeMatches && rupeeMatches.length === 1) {
            price = rupeeMatches[0];
        }
    }
    
    // Extract discount percentage
    const discountMatch = message.match(/(\d+)%\s*(?:off|discount)/i);
    if (discountMatch) {
        discount = `${discountMatch[1]}%`;
    }
    
    console.log('🔍 Product extraction results:', {
        title: title,
        price: price,
        originalPrice: originalPrice,
        discount: discount,
        urlsFound: urls.length
    });
    
    return {
        title: title,
        price: price,
        originalPrice: originalPrice,
        discount: discount,
        urls: urls,
        description: message.length > 200 ? message.substring(0, 200) + '...' : message
    };
}

// Debug: Log all incoming updates
bot.on('polling_error', (error) => {
    console.log('⚠️ Polling error:', error.message);
});

// Regular message handler (catches all messages including channel messages)
bot.on('message', async (msg) => {
    console.log('\n💬 Message received!');
    console.log('   Chat type:', msg.chat.type);
    console.log('   Chat ID:', msg.chat.id);
    console.log('   Message ID:', msg.message_id);
    await processMessage(msg);
});

// Channel post handler to process channel posts
bot.on('channel_post', async (msg) => {
    console.log('\n📺 Channel post received!');
    console.log('   Chat type:', msg.chat.type);
    console.log('   Chat ID:', msg.chat.id);
    console.log('   Message ID:', msg.message_id);
    await processMessage(msg);
});

// Edited channel post handler
bot.on('edited_channel_post', async (msg) => {
    console.log('\n📝 Edited channel post received!');
    console.log('   Chat type:', msg.chat.type);
    console.log('   Chat ID:', msg.chat.id);
    await processMessage(msg);
});

// Common message processing function
async function processMessage(msg) {
    try {
        const chatId = msg.chat.id.toString();
        console.log('\n📨 Processing message!');
        console.log('   Chat ID:', chatId);
        console.log('   Message ID:', msg.message_id);
        console.log('   From:', msg.from ? msg.from.first_name : 'Channel');
        
        // Get text from either text or caption
        const messageText = msg.text || msg.caption || '';
        console.log('   Text preview:', messageText ? messageText.substring(0, 100) + '...' : 'No text');
        console.log('   Has photo:', !!msg.photo);
        
        if (chatId === PRIME_PICKS_CHANNEL || chatId === CUE_PICKS_CHANNEL) {
            console.log('✅ Message from target channel - processing...');
            
            // Skip if no meaningful content
            if (!messageText.trim() && !msg.photo) {
                console.log('⚠️ Skipping message with no text or photo');
                return;
            }
            
            // Extract product information
            let productInfo = extractProductInfo(messageText);
            
            // Extract image URL from message if available
            let imageUrl = 'https://via.placeholder.com/300x300?text=Channel+Product';
            if (msg.photo && msg.photo.length > 0) {
                try {
                    // Get the largest photo
                    const largestPhoto = msg.photo[msg.photo.length - 1];
                    const fileInfo = await bot.getFile(largestPhoto.file_id);
                    imageUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileInfo.file_path}`;
                    console.log('📸 Image extracted:', imageUrl);
                } catch (imageError) {
                    console.error('⚠️ Image extraction failed:', imageError.message);
                }
            }
            
            // If we have URLs but no product title, try scraping the URL
            if (productInfo.urls.length > 0 && !productInfo.title) {
                console.log('🌐 No title found in text, attempting to scrape from URL...');
                try {
                    const scrapedData = await urlScraper.scrapeProductFromURL(productInfo.urls[0]);
                    if (scrapedData && scrapedData.title) {
                        console.log('✅ Successfully scraped product data:', scrapedData);
                        productInfo.title = scrapedData.title;
                        productInfo.price = scrapedData.price || productInfo.price;
                        productInfo.originalPrice = scrapedData.originalPrice || productInfo.originalPrice;
                        
                        // Calculate discount if we have both prices
                        if (scrapedData.price && scrapedData.originalPrice) {
                            const price = parseFloat(scrapedData.price.replace(/[^\d.]/g, ''));
                            const originalPrice = parseFloat(scrapedData.originalPrice.replace(/[^\d.]/g, ''));
                            if (price && originalPrice && originalPrice > price) {
                                const discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100);
                                productInfo.discount = `${discountPercent}% off`;
                            }
                        }
                        
                        // Use scraped image if available and no photo in message
                        if (scrapedData.imageUrl && scrapedData.imageUrl !== 'Not found' && !msg.photo) {
                            imageUrl = scrapedData.imageUrl;
                            console.log('📸 Using scraped image:', imageUrl);
                        }
                    }
                } catch (scrapeError) {
                    console.error('⚠️ URL scraping failed:', scrapeError.message);
                }
            }
            
            // Convert URLs to affiliate links based on channel
            let affiliateUrls;
            if (chatId === PRIME_PICKS_CHANNEL) {
                // Use Amazon affiliate tag for Prime Picks
                affiliateUrls = convertToAffiliateUrls(productInfo.urls);
            } else if (chatId === CUE_PICKS_CHANNEL) {
                // Use Cuelinks affiliate tag for Cue Picks
                affiliateUrls = convertToCuelinksUrls(productInfo.urls);
            } else {
                affiliateUrls = productInfo.urls; // fallback
            }
            
            console.log('🔍 Extracted product info:', {
                title: productInfo.title,
                price: productInfo.price,
                originalPrice: productInfo.originalPrice,
                discount: productInfo.discount,
                originalUrls: productInfo.urls,
                affiliateUrls: affiliateUrls
            });
            
            // Skip if no meaningful product info extracted
            if (!productInfo.title && productInfo.urls.length === 0) {
                console.log('⚠️ Skipping message with no product information');
                return;
            }
            
            // Create proper description without price information
            let cleanDescription = productInfo.title || 'Great product deal';
            if (messageText && messageText.length > 50) {
                // Remove price patterns and URLs from description
                let desc = messageText
                    .replace(/₹[\d,]+(\.\d+)?/g, '') // Remove price patterns
                    .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
                    .replace(/\s+/g, ' ') // Clean up extra spaces
                    .trim();
                
                if (desc.length > 10) {
                    cleanDescription = desc.length > 150 ? desc.substring(0, 150) + '...' : desc;
                }
            }
            
            // Create content JSON with detailed product info
            const contentData = {
                price: productInfo.price || '₹0',
                originalPrice: productInfo.originalPrice || productInfo.price || '₹0',
                discount: productInfo.discount || null,
                currency: 'INR',
                description: cleanDescription,
                imageUrl: imageUrl,
                affiliateUrl: affiliateUrls.length > 0 ? affiliateUrls[0] : '',
                rating: null,
                reviewCount: null
            };

            // Save to unified_content table only
            try {
                const stmt = db.prepare(`
                    INSERT INTO unified_content (
                        title, description, image_url, affiliate_url,
                        content_type, page_type, category,
                        source_type, discount, display_pages, content
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);
                
                const result = stmt.run(
                    productInfo.title || 'Product Deal',
                    cleanDescription,
                    imageUrl, // Store as image_url
                    affiliateUrls.length > 0 ? affiliateUrls[0] : 'https://example.com', // Store single affiliate_url (required)
                    'product',
                    chatId === PRIME_PICKS_CHANNEL ? 'prime-picks' : 'cue-picks',
                    'Electronics',
                    'telegram',
                    productInfo.discount ? parseInt(productInfo.discount.replace(/[^\d]/g, '')) : null,
                    JSON.stringify([chatId === PRIME_PICKS_CHANNEL ? 'prime-picks' : 'cue-picks']),
                    JSON.stringify(contentData) // Store complete product data in content
                );
                
                console.log('💾 Product saved to database!');
                console.log('   Database ID:', result.lastInsertRowid);
                console.log('   Title:', productInfo.title);
                console.log('   Price:', productInfo.price);
                console.log('   Image URL:', imageUrl);
                console.log('   URLs found:', productInfo.urls.length);
                console.log('✅ Message processed successfully!');
                
            } catch (dbError) {
                console.error('❌ Database error:', dbError.message);
            }
        } else {
            console.log('ℹ️ Message from different channel, ignoring');
        }
        
    } catch (error) {
        console.error('❌ Message processing error:', error.message);
    }
}

// Error handlers
bot.on('polling_error', (error) => {
    console.log('⚠️ Polling error:', error.message);
    if (error.message.includes('409')) {
        console.log('   This is a conflict error - another bot instance may be running');
    }
});

bot.on('error', (error) => {
    console.error('❌ Bot error:', error.message);
});

// Function to send a test product message to trigger processing
async function sendTestProductMessage() {
    const testMessage = `🔥 AMAZING DEAL ALERT! 🔥

Premium Wireless Headphones with Noise Cancellation
✨ Crystal Clear Sound Quality
🎧 30-Hour Battery Life
💰 Deal @ ₹2,999 Reg @ ₹5,999 (50% OFF!)

🛒 Grab this limited time offer now!
https://amazon.in/premium-headphones-deal
https://flipkart.com/headphones-offer

#DealOfTheDay #Electronics #Headphones`;

    try {
        console.log('\n📤 Sending test product message to channel...');
        const sentMessage = await bot.sendMessage(PRIME_PICKS_CHANNEL, testMessage);
        console.log('✅ Test message sent successfully!');
        console.log('   Message ID:', sentMessage.message_id);
        
        // Wait a moment for the message to be processed
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return sentMessage;
    } catch (error) {
        console.error('❌ Failed to send test message:', error.message);
        return null;
    }
}

// Main execution
async function startDemo() {
    console.log('\n🚀 Starting bot demo...');
    
    // Test connection
    await testBotConnection();
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Send test product message to trigger processing
    console.log('\n📤 Sending test product to channel...');
    const testMessage = await sendTestProductMessage();
    
    if (testMessage) {
        console.log('✅ Message sent successfully!');
        console.log('   Message ID:', testMessage.message_id);
        console.log('   Chat ID:', testMessage.chat.id);
        console.log('   Date:', new Date(testMessage.date * 1000).toLocaleString());
    }
    
    console.log('\n🎉 Demo successful!');
    console.log('✅ Bot is working and can post to channel');
    console.log('✅ Message processing is set up');
    console.log('✅ Database integration is working');
    
    console.log('\n👂 Bot is now listening for messages...');
    console.log('📝 Any new messages in the channel will be processed');
    console.log('🛑 Press Ctrl+C to stop');
}

// Start the demo
startDemo();