const Database = require('better-sqlite3');
const axios = require('axios');
const cheerio = require('cheerio');

console.log('💰 ENHANCING PRICE DATA IN UNIFIED_CONTENT');
console.log('==========================================');

class PriceEnhancer {
    constructor() {
        this.db = new Database('./database.sqlite');
        this.enhanced = 0;
        this.errors = 0;
    }

    // Calculate discount percentage
    calculateDiscount(price, originalPrice) {
        if (!price || !originalPrice) return null;
        
        const currentPrice = parseFloat(price.replace(/[^\d.]/g, ''));
        const origPrice = parseFloat(originalPrice.replace(/[^\d.]/g, ''));
        
        if (origPrice > currentPrice && currentPrice > 0) {
            return Math.round(((origPrice - currentPrice) / origPrice) * 100);
        }
        return null;
    }

    // Format price with currency
    formatPrice(price) {
        if (!price) return null;
        const numPrice = parseFloat(price.toString().replace(/[^\d.]/g, ''));
        if (isNaN(numPrice)) return null;
        return `₹${numPrice.toLocaleString('en-IN')}`;
    }

    // Extract price from Amazon URL
    async extractAmazonPrice(url) {
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 10000
            });

            const $ = cheerio.load(response.data);
            
            // Amazon price selectors
            const priceSelectors = [
                '.a-price-whole',
                '.a-offscreen',
                '#priceblock_dealprice',
                '#priceblock_ourprice',
                '.a-price .a-offscreen'
            ];

            let currentPrice = null;
            let originalPrice = null;

            for (const selector of priceSelectors) {
                const priceText = $(selector).first().text().trim();
                if (priceText && priceText.includes('₹')) {
                    if (!currentPrice) {
                        currentPrice = priceText;
                    } else if (!originalPrice) {
                        originalPrice = priceText;
                    }
                }
            }

            return { currentPrice, originalPrice };
        } catch (error) {
            console.log(`   ❌ Failed to extract Amazon price: ${error.message}`);
            return null;
        }
    }

    // Extract price from Flipkart URL
    async extractFlipkartPrice(url) {
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 10000
            });

            const $ = cheerio.load(response.data);
            
            // Flipkart price selectors
            const currentPriceSelectors = [
                '._30jeq3._16Jk6d',
                '._1_WHN1',
                '._3I9_wc._2p6lqe'
            ];

            const originalPriceSelectors = [
                '._3I9_wc._27UcVY',
                '._14Jd01'
            ];

            let currentPrice = null;
            let originalPrice = null;

            for (const selector of currentPriceSelectors) {
                const priceText = $(selector).first().text().trim();
                if (priceText && priceText.includes('₹')) {
                    currentPrice = priceText;
                    break;
                }
            }

            for (const selector of originalPriceSelectors) {
                const priceText = $(selector).first().text().trim();
                if (priceText && priceText.includes('₹')) {
                    originalPrice = priceText;
                    break;
                }
            }

            return { currentPrice, originalPrice };
        } catch (error) {
            console.log(`   ❌ Failed to extract Flipkart price: ${error.message}`);
            return null;
        }
    }

    // Enhance products with missing or incomplete price data
    async enhanceProducts() {
        console.log('🔍 Finding products that need price enhancement...');
        
        const products = this.db.prepare(`
            SELECT id, title, price, original_price, discount, affiliate_url
            FROM unified_content 
            WHERE (original_price IS NULL OR discount IS NULL)
            AND affiliate_url IS NOT NULL
            ORDER BY created_at DESC
            LIMIT 20
        `).all();

        console.log(`Found ${products.length} products to enhance\n`);

        for (const product of products) {
            console.log(`🔄 Processing: ${product.title.substring(0, 50)}...`);
            console.log(`   Current price: ${product.price}`);
            console.log(`   Original price: ${product.original_price || 'NULL'}`);
            console.log(`   Discount: ${product.discount || 'NULL'}%`);

            try {
                let enhanced = false;
                let newOriginalPrice = product.original_price;
                let newDiscount = product.discount;

                // If we have both prices but no discount, calculate it
                if (product.price && product.original_price && !product.discount) {
                    newDiscount = this.calculateDiscount(product.price, product.original_price);
                    if (newDiscount) {
                        console.log(`   💡 Calculated discount: ${newDiscount}%`);
                        enhanced = true;
                    }
                }

                // Try to extract prices from affiliate URL if missing original price
                if (!product.original_price && product.affiliate_url) {
                    let extractedPrices = null;
                    
                    if (product.affiliate_url.includes('amazon')) {
                        console.log('   🔍 Extracting from Amazon...');
                        extractedPrices = await this.extractAmazonPrice(product.affiliate_url);
                    } else if (product.affiliate_url.includes('flipkart')) {
                        console.log('   🔍 Extracting from Flipkart...');
                        extractedPrices = await this.extractFlipkartPrice(product.affiliate_url);
                    }

                    if (extractedPrices && extractedPrices.originalPrice) {
                        newOriginalPrice = this.formatPrice(extractedPrices.originalPrice);
                        console.log(`   💰 Extracted original price: ${newOriginalPrice}`);
                        
                        // Calculate discount with new original price
                        if (product.price && newOriginalPrice) {
                            newDiscount = this.calculateDiscount(product.price, newOriginalPrice);
                            if (newDiscount) {
                                console.log(`   💡 Calculated discount: ${newDiscount}%`);
                            }
                        }
                        enhanced = true;
                    }
                }

                // Update database if we enhanced anything
                if (enhanced) {
                    const updateFields = [];
                    const updateValues = [];

                    if (newOriginalPrice && newOriginalPrice !== product.original_price) {
                        updateFields.push('original_price = ?');
                        updateValues.push(newOriginalPrice);
                    }

                    if (newDiscount && newDiscount !== product.discount) {
                        updateFields.push('discount = ?');
                        updateValues.push(newDiscount);
                    }

                    if (updateFields.length > 0) {
                        updateFields.push('updated_at = ?');
                        updateValues.push(Math.floor(Date.now() / 1000));
                        updateValues.push(product.id);

                        const updateSQL = `UPDATE unified_content SET ${updateFields.join(', ')} WHERE id = ?`;
                        this.db.prepare(updateSQL).run(...updateValues);
                        
                        this.enhanced++;
                        console.log(`   ✅ Enhanced product with ${updateFields.length - 1} improvements`);
                    }
                } else {
                    console.log('   ⚪ No enhancements needed');
                }

                // Add delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error) {
                console.log(`   ❌ Error enhancing product: ${error.message}`);
                this.errors++;
            }

            console.log(''); // Empty line for readability
        }
    }

    // Generate summary report
    generateSummary() {
        console.log('📊 PRICE ENHANCEMENT SUMMARY');
        console.log('============================');
        console.log(`✅ Products enhanced: ${this.enhanced}`);
        console.log(`❌ Errors encountered: ${this.errors}`);

        // Check current state
        const stats = this.db.prepare(`
            SELECT 
                COUNT(*) as total,
                COUNT(price) as with_price,
                COUNT(original_price) as with_original_price,
                COUNT(discount) as with_discount
            FROM unified_content
        `).get();

        console.log('\n📈 CURRENT DATABASE STATS:');
        console.log(`   Total products: ${stats.total}`);
        console.log(`   With price: ${stats.with_price} (${Math.round(stats.with_price/stats.total*100)}%)`);
        console.log(`   With original price: ${stats.with_original_price} (${Math.round(stats.with_original_price/stats.total*100)}%)`);
        console.log(`   With discount: ${stats.with_discount} (${Math.round(stats.with_discount/stats.total*100)}%)`);
    }

    async run() {
        try {
            await this.enhanceProducts();
            this.generateSummary();
        } catch (error) {
            console.error('❌ Fatal error:', error.message);
        } finally {
            this.db.close();
        }
    }
}

// Run the price enhancer
const enhancer = new PriceEnhancer();
enhancer.run().then(() => {
    console.log('\n🎉 Price enhancement completed!');
}).catch(error => {
    console.error('❌ Enhancement failed:', error.message);
});