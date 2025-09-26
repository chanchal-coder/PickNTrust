import puppeteer from 'puppeteer';

async function debugCompiledCode() {
    console.log('🔍 DEBUGGING COMPILED CODE');
    console.log('==========================');
    
    let browser: any;
    try {
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        
        await page.goto('https://www.amazon.in/dp/B08N5WRWNW', { waitUntil: 'networkidle2' });
        
        // Test 1: Simple function without TypeScript types
        console.log('📝 Test 1: Simple function without types...');
        try {
            const result1 = await page.evaluate(() => {
                return { success: true, title: document.title };
            });
            console.log('✅ Simple function works:', result1.success);
        } catch (error: any) {
            console.log('❌ Simple function failed:', error.message);
        }
        
        // Test 2: Function with parameter but no types
        console.log('📝 Test 2: Function with parameter, no types...');
        try {
            const result2 = await page.evaluate((data) => {
                return { success: true, data: data };
            }, { test: 'value' });
            console.log('✅ Parameter function works:', result2.success);
        } catch (error: any) {
            console.log('❌ Parameter function failed:', error.message);
        }
        
        // Test 3: Function with TypeScript parameter type
        console.log('📝 Test 3: Function with TypeScript parameter type...');
        try {
            const result3 = await page.evaluate((data: any) => {
                return { success: true, data: data };
            }, { test: 'value' });
            console.log('✅ Typed parameter function works:', result3.success);
        } catch (error: any) {
            console.log('❌ Typed parameter function failed:', error.message);
            if (error.message.includes('__name')) {
                console.log('🎯 FOUND __name ERROR with typed parameters!');
            }
        }
        
        // Test 4: Function with interface parameter
        console.log('📝 Test 4: Function with interface parameter...');
        try {
            interface TestInterface {
                title: string[];
                price: string[];
            }
            
            const testData: TestInterface = {
                title: ['#productTitle'],
                price: ['.a-price-whole']
            };
            
            const result4 = await page.evaluate((selectors: TestInterface) => {
                return { 
                    success: true, 
                    titleFound: !!document.querySelector(selectors.title[0]),
                    priceFound: !!document.querySelector(selectors.price[0])
                };
            }, testData);
            console.log('✅ Interface parameter function works:', result4.success);
        } catch (error: any) {
            console.log('❌ Interface parameter function failed:', error.message);
            if (error.message.includes('__name')) {
                console.log('🎯 FOUND __name ERROR with interface parameters!');
            }
        }
        
        // Test 5: Exact reproduction with ProductSelectors type
        console.log('📝 Test 5: Exact reproduction with ProductSelectors...');
        try {
            interface ProductSelectors {
                title?: string[];
                price?: string[];
                originalPrice?: string[];
                image?: string[];
                description?: string[];
                rating?: string[];
                reviewCount?: string[];
                brand?: string[];
                availability?: string[];
            }
            
            const selectors: ProductSelectors = {
                title: ['#productTitle'],
                price: ['.a-price-whole']
            };
            
            const result5 = await page.evaluate((selectors: ProductSelectors) => {
                const getTextBySelectors = (selectorList: string[]): string | undefined => {
                    for (const selector of selectorList) {
                        const element = document.querySelector(selector);
                        if (element) {
                            return element.textContent?.trim();
                        }
                    }
                    return undefined;
                };
                
                return {
                    name: getTextBySelectors(selectors.title || []),
                    price: getTextBySelectors(selectors.price || [])
                };
            }, selectors);
            console.log('✅ ProductSelectors function works:', !!result5.name);
        } catch (error: any) {
            console.log('❌ ProductSelectors function failed:', error.message);
            if (error.message.includes('__name')) {
                console.log('🎯 FOUND __name ERROR with ProductSelectors!');
                console.log('Error stack:', error.stack);
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

debugCompiledCode();