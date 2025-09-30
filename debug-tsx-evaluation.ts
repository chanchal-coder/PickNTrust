import puppeteer from 'puppeteer';
import { platformDetector } from './server/platform-detector';
import { ResolvedURL } from './server/universal-url-resolver';

async function debugTsxEvaluation() {
    console.log('🔍 DEBUGGING TSX PAGE.EVALUATE CONTEXT');
    console.log('=====================================');
    
    let browser: any;
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
        
        // Get platform info using the actual platform detector
        const resolvedUrl: ResolvedURL = { 
            finalUrl: url, 
            originalUrl: url,
            redirectChain: [url],
            isShortened: false,
            platform: 'amazon',
            productId: 'B08N5WRWNW'
        };
        const platformInfo = platformDetector.detectPlatform(resolvedUrl);
        console.log('🔍 Platform info:', platformInfo);
        
        console.log('📝 Testing exact enhanced scraper evaluation with TypeScript...');
        try {
            // This is the EXACT code from enhanced-universal-scraper.ts
            const productData = await page.evaluate((selectors: any) => {
                const result: any = {};
                
                // Helper function to get text content
                const getTextContent = (element: Element | null): string => {
                    if (!element) return '';
                    return element.textContent?.trim() || '';
                };
                
                // Helper function to get attribute
                const getAttribute = (element: Element | null, attr: string): string => {
                    if (!element) return '';
                    return element.getAttribute(attr) || '';
                };
                
                // Try to find title
                for (const selector of selectors.title || []) {
                    const element = document.querySelector(selector);
                    if (element) {
                        result.title = getTextContent(element);
                        break;
                    }
                }
                
                // Try to find price
                for (const selector of selectors.price || []) {
                    const element = document.querySelector(selector);
                    if (element) {
                        result.price = getTextContent(element);
                        break;
                    }
                }
                
                // Try to find image
                for (const selector of selectors.image || []) {
                    const element = document.querySelector(selector);
                    if (element) {
                        result.image = getAttribute(element, 'src') || getAttribute(element, 'data-src');
                        break;
                    }
                }
                
                return result;
            }, platformInfo.selectors);
            
            console.log('✅ Product data extracted:', productData);
            
        } catch (evalError) {
            console.error('❌ Page evaluation error:', evalError);
        }
        
    } catch (error) {
        console.error('❌ Browser error:', error);
    } finally {
        if (browser) {
            await browser.close();
            console.log('🔒 Browser closed');
        }
    }
}

debugTsxEvaluation();