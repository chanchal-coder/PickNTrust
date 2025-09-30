import puppeteer from 'puppeteer';

async function debugMinimalError() {
    console.log('🔍 DEBUGGING MINIMAL ERROR');
    console.log('==========================');
    
    let browser: any;
    try {
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        
        await page.goto('https://www.amazon.in/dp/B08N5WRWNW', { waitUntil: 'networkidle2' });
        
        interface ProductSelectors {
            title?: string[];
            price?: string[];
        }
        
        const selectors: ProductSelectors = {
            title: ['#productTitle'],
            price: ['.a-price-whole']
        };
        
        // Test 1: Just return the selectors
        console.log('📝 Test 1: Just return selectors...');
        try {
            const result1 = await page.evaluate((selectors: ProductSelectors) => {
                return { selectors };
            }, selectors);
            console.log('✅ Return selectors works');
        } catch (error: any) {
            console.log('❌ Return selectors failed:', error.message);
        }
        
        // Test 2: Define function but don't call it
        console.log('📝 Test 2: Define function but don\'t call...');
        try {
            const result2 = await page.evaluate((selectors: ProductSelectors) => {
                const getTextBySelectors = (selectorList: string[]): string | undefined => {
                    return 'test';
                };
                return { defined: true };
            }, selectors);
            console.log('✅ Define function works');
        } catch (error: any) {
            console.log('❌ Define function failed:', error.message);
        }
        
        // Test 3: Call function with empty array
        console.log('📝 Test 3: Call function with empty array...');
        try {
            const result3 = await page.evaluate((selectors: ProductSelectors) => {
                const getTextBySelectors = (selectorList: string[]): string | undefined => {
                    return 'test';
                };
                return { result: getTextBySelectors([]) };
            }, selectors);
            console.log('✅ Call with empty array works');
        } catch (error: any) {
            console.log('❌ Call with empty array failed:', error.message);
        }
        
        // Test 4: Call function with selectors.title
        console.log('📝 Test 4: Call function with selectors.title...');
        try {
            const result4 = await page.evaluate((selectors: ProductSelectors) => {
                const getTextBySelectors = (selectorList: string[]): string | undefined => {
                    return 'test';
                };
                return { result: getTextBySelectors(selectors.title || []) };
            }, selectors);
            console.log('✅ Call with selectors.title works');
        } catch (error: any) {
            console.log('❌ Call with selectors.title failed:', error.message);
            if (error.message.includes('__name')) {
                console.log('🎯 FOUND __name ERROR when accessing selectors.title!');
            }
        }
        
        // Test 5: Access document.querySelector
        console.log('📝 Test 5: Access document.querySelector...');
        try {
            const result5 = await page.evaluate((selectors: ProductSelectors) => {
                const getTextBySelectors = (selectorList: string[]): string | undefined => {
                    for (const selector of selectorList) {
                        const element = document.querySelector(selector);
                        return 'found';
                    }
                    return undefined;
                };
                return { result: getTextBySelectors(selectors.title || []) };
            }, selectors);
            console.log('✅ document.querySelector works');
        } catch (error: any) {
            console.log('❌ document.querySelector failed:', error.message);
            if (error.message.includes('__name')) {
                console.log('🎯 FOUND __name ERROR in document.querySelector!');
            }
        }
        
        // Test 6: Access element properties
        console.log('📝 Test 6: Access element properties...');
        try {
            const result6 = await page.evaluate((selectors: ProductSelectors) => {
                const getTextBySelectors = (selectorList: string[]): string | undefined => {
                    for (const selector of selectorList) {
                        const element = document.querySelector(selector);
                        if (element) {
                            return element.textContent?.trim();
                        }
                    }
                    return undefined;
                };
                return { result: getTextBySelectors(selectors.title || []) };
            }, selectors);
            console.log('✅ Element properties work');
        } catch (error: any) {
            console.log('❌ Element properties failed:', error.message);
            if (error.message.includes('__name')) {
                console.log('🎯 FOUND __name ERROR in element properties!');
            }
        }
        
    } catch (error: any) {
        console.log('❌ Overall test failed:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

debugMinimalError();