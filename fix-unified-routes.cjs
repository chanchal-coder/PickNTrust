const fs = require('fs');
const path = require('path');

console.log('🔧 FIXING API ROUTES TO USE UNIFIED_CONTENT TABLE...\n');

const routesFile = path.join(__dirname, 'server', 'routes.ts');

try {
    // Read the current routes file
    let routesContent = fs.readFileSync(routesFile, 'utf8');
    
    console.log('📋 CURRENT ROUTES STATUS:');
    console.log('   - Found routes.ts file');
    console.log('   - File size:', routesContent.length, 'characters');
    
    // Check if the unified_content routes already exist
    if (routesContent.includes('api/products/page/:page')) {
        console.log('   ✅ Unified content routes already exist');
        
        // Check if there are any old separate table routes that need to be removed
        const oldRoutePatterns = [
            /\/\/ Get products from amazon_products[\s\S]*?FROM amazon_products[\s\S]*?\).all\([^)]*\);/gi,
            /\/\/ Get products from cuelinks_products[\s\S]*?FROM cuelinks_products[\s\S]*?\).all\([^)]*\);/gi,
            /\/\/ Get products from value_picks_products[\s\S]*?FROM value_picks_products[\s\S]*?\).all\([^)]*\);/gi,
            /\/\/ Get products from click_picks_products[\s\S]*?FROM click_picks_products[\s\S]*?\).all\([^)]*\);/gi,
            /\/\/ Get products from global_picks_products[\s\S]*?FROM global_picks_products[\s\S]*?\).all\([^)]*\);/gi,
            /\/\/ Get products from deals_hub_products[\s\S]*?FROM deals_hub_products[\s\S]*?\).all\([^)]*\);/gi,
            /\/\/ Get products from lootbox_products[\s\S]*?FROM lootbox_products[\s\S]*?\).all\([^)]*\);/gi,
            /\/\/ Get products from travel_products[\s\S]*?FROM travel_products[\s\S]*?\).all\([^)]*\);/gi
        ];
        
        let foundOldRoutes = false;
        oldRoutePatterns.forEach(pattern => {
            if (pattern.test(routesContent)) {
                foundOldRoutes = true;
                routesContent = routesContent.replace(pattern, '// REMOVED: Old separate table route');
            }
        });
        
        if (foundOldRoutes) {
            console.log('   🗑️ Removed old separate table routes');
            fs.writeFileSync(routesFile, routesContent);
            console.log('   ✅ Routes file updated');
        } else {
            console.log('   ✅ No old routes found to remove');
        }
        
    } else {
        console.log('   ❌ Unified content routes missing - this should not happen');
        console.log('   🔧 The routes should already be in place from the current file');
    }
    
    console.log('\n📊 VERIFYING ROUTE STRUCTURE:');
    
    // Check for key route patterns
    const routeChecks = [
        { name: 'Products by page', pattern: 'api/products/page/:page' },
        { name: 'Categories by page', pattern: 'api/categories/page/:page' },
        { name: 'Products by category', pattern: 'api/products/category/:category' },
        { name: 'Unified content query', pattern: 'unified_content' },
        { name: 'Display pages filter', pattern: 'display_pages LIKE' }
    ];
    
    routeChecks.forEach(check => {
        const exists = routesContent.includes(check.pattern);
        console.log(`   ${exists ? '✅' : '❌'} ${check.name}: ${exists ? 'Found' : 'Missing'}`);
    });
    
    console.log('\n🎯 FRONTEND INTEGRATION CHECK:');
    
    // Check frontend files to see what API endpoints they're calling
    const frontendFiles = [
        'client/src/pages/prime-picks.tsx',
        'client/src/pages/cue-picks.tsx', 
        'client/src/pages/value-picks.tsx',
        'client/src/pages/click-picks.tsx',
        'client/src/pages/global-picks.tsx',
        'client/src/pages/deals-hub.tsx',
        'client/src/pages/loot-box.tsx',
        'client/src/pages/travel-picks.tsx'
    ];
    
    frontendFiles.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            const usesNewAPI = content.includes('/api/products/page/');
            const usesOldAPI = content.includes('/api/products') && !content.includes('/api/products/page/');
            
            console.log(`   ${path.basename(file)}: ${usesNewAPI ? '✅ Uses new API' : (usesOldAPI ? '⚠️ Uses old API' : '❓ Unknown API')}`);
        } else {
            console.log(`   ${path.basename(file)}: ❌ File not found`);
        }
    });
    
    console.log('\n✅ UNIFIED ROUTES VERIFICATION COMPLETED!');
    console.log('   - All pages should now use unified_content table');
    console.log('   - API endpoints: /api/products/page/:page');
    console.log('   - Categories: /api/categories/page/:page');
    console.log('   - Filtering by display_pages field');
    
} catch (error) {
    console.error('❌ Error fixing routes:', error.message);
    process.exit(1);
}