import puppeteer from 'puppeteer';

async function testEvaluateString() {
    console.log('🧪 TESTING PAGE.EVALUATE WITH STRING INSTEAD OF FUNCTION');
    console.log('======================================================');
    
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        await page.goto('https://www.amazon.in/dp/B08N5WRWNW', { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Test 1: Using function (current approach that fails)
        console.log('🔍 Test 1: Using function (current approach)');
        try {
            const result1 = await page.evaluate((selectors) => {
                const getTextBySelectors = (selectorList) => {
                    for (const selector of selectorList) {
                        const element = document.querySelector(selector);
                        if (element) {
                            return element.textContent?.trim() || element.getAttribute('alt')?.trim();
                        }
                    }
                    return undefined;
                };
                
                return {
                    name: getTextBySelectors(selectors.title || []),
                    price: getTextBySelectors(selectors.price || [])
                };
            }, {
                title: ['#productTitle', 'h1[data-automation-id="product-title"]'],
                price: ['.a-price-whole', '.a-offscreen', '[data-testid="price-current-value"]']
            });
            console.log('✅ Function approach worked:', result1);
        } catch (error) {
            console.log('❌ Function approach failed:', error.message);
        }
        
        // Test 2: Using string (alternative approach)
        console.log('🔍 Test 2: Using string (alternative approach)');
        try {
            const result2 = await page.evaluate(`
                (function(selectors) {
                    const getTextBySelectors = function(selectorList) {
                        for (const selector of selectorList) {
                            const element = document.querySelector(selector);
                            if (element) {
                                return element.textContent && element.textContent.trim() || element.getAttribute('alt') && element.getAttribute('alt').trim();
                            }
                        }
                        return undefined;
                    };
                    
                    return {
                        name: getTextBySelectors(selectors.title || []),
                        price: getTextBySelectors(selectors.price || [])
                    };
                })({
                    title: ['#productTitle', 'h1[data-automation-id="product-title"]'],
                    price: ['.a-price-whole', '.a-offscreen', '[data-testid="price-current-value"]']
                })
            `);
            console.log('✅ String approach worked:', result2);
        } catch (error) {
            console.log('❌ String approach failed:', error.message);
        }
        
        // Test 3: Minimal function test
        console.log('🔍 Test 3: Minimal function test');
        try {
            const result3 = await page.evaluate(() => {
                return { test: 'minimal' };
            });
            console.log('✅ Minimal function worked:', result3);
        } catch (error) {
            console.log('❌ Minimal function failed:', error.message);
        }
        
    } finally {
        await browser.close();
    }
}

testEvaluateString().catch(console.error);