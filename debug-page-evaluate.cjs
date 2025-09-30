const puppeteer = require('puppeteer');

async function debugPageEvaluate() {
    console.log('🔍 DEBUGGING PAGE.EVALUATE CONTEXT');
    console.log('===================================');
    
    let browser;
    try {
        console.log('🚀 Launching browser...');
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });
        
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        const url = 'https://www.amazon.in/dp/B08N5WRWNW';
        console.log(`📄 Navigating to: ${url}`);
        
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('🔍 Testing page.evaluate with Amazon selectors...');
        
        // Amazon selectors from platform-detector
        const selectors = {
            title: ['#productTitle', '.product-title', 'h1.a-size-large'],
            price: ['#priceblock_dealprice', '#priceblock_ourprice', '.a-price-whole', '.a-offscreen'],
            originalPrice: ['#priceblock_listprice', '.a-price.a-text-price .a-offscreen'],
            image: ['#landingImage', '#imgBlkFront', '.a-dynamic-image'],
            description: ['#feature-bullets ul', '#productDescription', '.a-unordered-list'],
            rating: ['#acrPopover', '.a-icon-alt', '[data-hook="average-star-rating"]'],
            reviewCount: ['#acrCustomerReviewText', '[data-hook="total-review-count"]'],
            availability: ['#availability span', '.a-color-success', '.a-color-state'],
            brand: ['#bylineInfo', '.a-brand', '[data-attribute="brand"]']
        };
        
        // Test 1: Basic evaluation
        console.log('📝 Test 1: Basic page evaluation...');
        const basicTest = await page.evaluate(() => {
            return {
                title: document.title,
                url: window.location.href,
                hasDocument: typeof document !== 'undefined',
                hasWindow: typeof window !== 'undefined'
            };
        });
        console.log('✅ Basic test result:', basicTest);
        
        // Test 2: Exact enhanced scraper evaluation
        console.log('📝 Test 2: Enhanced scraper evaluation (where __name error occurs)...');
        try {
            const productData = await page.evaluate((selectors) => {
                console.log('🔍 Inside page.evaluate - selectors:', selectors);
                
                const getTextBySelectors = (selectorList) => {
                    console.log('🔍 getTextBySelectors called with:', selectorList);
                    for (const selector of selectorList) {
                        console.log('🔍 Trying selector:', selector);
                        const element = document.querySelector(selector);
                        if (element) {
                            console.log('✅ Found element for selector:', selector);
                            return element.textContent?.trim() || element.getAttribute('alt')?.trim();
                        }
                    }
                    return undefined;
                };
                
                const getImageBySelectors = (selectorList) => {
                    console.log('🔍 getImageBySelectors called with:', selectorList);
                    for (const selector of selectorList) {
                        console.log('🔍 Trying image selector:', selector);
                        const element = document.querySelector(selector);
                        if (element) {
                            console.log('✅ Found image element for selector:', selector);
                            return element.src || element.getAttribute('data-src') || element.getAttribute('data-lazy-src');
                        }
                    }
                    return undefined;
                };
                
                console.log('🔍 About to extract product data...');
                
                const result = {
                    name: getTextBySelectors(selectors.title || []),
                    price: getTextBySelectors(selectors.price || []),
                    originalPrice: getTextBySelectors(selectors.originalPrice || []),
                    imageUrl: getImageBySelectors(selectors.image || []),
                    description: getTextBySelectors(selectors.description || []),
                    rating: getTextBySelectors(selectors.rating || []),
                    reviewCount: getTextBySelectors(selectors.reviewCount || []),
                    brand: getTextBySelectors(selectors.brand || []),
                    availability: getTextBySelectors(selectors.availability || [])
                };
                
                console.log('✅ Product data extracted:', result);
                return result;
            }, selectors);
            
            console.log('✅ Enhanced scraper test successful:', productData);
            
        } catch (error) {
            console.log('❌ Enhanced scraper test failed:', error.message);
            if (error.message.includes('__name')) {
                console.log('🎯 FOUND THE __name ERROR!');
                console.log('Error details:', error);
            }
        }
        
        // Test 3: Check for global variables
        console.log('📝 Test 3: Checking for problematic global variables...');
        const globalCheck = await page.evaluate(() => {
            const globals = {};
            for (let prop in window) {
                if (prop.includes('name') || prop.includes('__')) {
                    globals[prop] = typeof window[prop];
                }
            }
            return {
                globals,
                hasName: typeof name !== 'undefined',
                hasUnderscoreName: typeof __name !== 'undefined',
                nameValue: typeof name !== 'undefined' ? name : 'undefined'
            };
        });
        console.log('🔍 Global variables check:', globalCheck);
        
    } catch (error) {
        console.log('❌ Debug failed:', error.message);
        if (error.message.includes('__name')) {
            console.log('🎯 FOUND THE __name ERROR!');
        }
        console.log('Full error:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

debugPageEvaluate();