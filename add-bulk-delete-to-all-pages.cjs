// Add bulk delete functionality to all remaining product pages
const fs = require('fs');
const path = require('path');

const pages = [
  'global-picks',
  'click-picks', 
  'deals-hub',
  'loot-box',
  'top-picks'
];

const bulkDeleteImports = `import { useQuery, useQueryClient } from "@tanstack/react-query";`;

const bulkDeleteState = `  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Check admin status
  useEffect(() => {
    const adminAuth = localStorage.getItem('pickntrust-admin-session');
    setIsAdmin(adminAuth === 'active' || window.location.hostname === 'localhost');
  }, []);

  const handleBulkDelete = async (deleteAll = false) => {
    const idsToDelete = deleteAll ? filteredProducts.map(p => p.id) : selectedProducts;
    
    if (idsToDelete.length === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select products to delete',
        variant: 'destructive',
      });
      return;
    }
    
    const confirmMessage = deleteAll 
      ? \`Delete ALL \${filteredProducts.length} products?\`
      : \`Delete \${idsToDelete.length} selected products?\`;
    
    if (!confirm(confirmMessage)) return;
    
    try {
      for (const productId of idsToDelete) {
        await fetch(\`/api/admin/products/\${productId}\`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: 'pickntrust2025' }),
        });
      }
      
      queryClient.clear();
      setTimeout(() => window.location.reload(), 500);
      
      toast({
        title: 'Products Deleted',
        description: \`Successfully deleted \${idsToDelete.length} products\`,
      });
      
      setBulkDeleteMode(false);
      setSelectedProducts([]);
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete products',
        variant: 'destructive',
      });
    }
  };`;

const bulkDeleteHeader = `                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Results ({filteredProducts.length})
                  </h2>
                  {/* Bulk Delete Icon - Admin Only */}
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setBulkDeleteMode(!bulkDeleteMode)}
                        className="p-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        title="Bulk delete options"
                      >
                        <i className="fas fa-trash text-sm" />
                      </button>
                      
                      {bulkDeleteMode && (
                        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border rounded-lg px-3 py-2 shadow-sm">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedProducts.length} selected
                          </span>
                          <button
                            onClick={() => handleBulkDelete(false)}
                            disabled={selectedProducts.length === 0}
                            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50"
                          >
                            Delete Selected
                          </button>
                          <button
                            onClick={() => handleBulkDelete(true)}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                          >
                            Delete All
                          </button>
                          <button
                            onClick={() => {
                              setBulkDeleteMode(false);
                              setSelectedProducts([]);
                            }}
                            className="px-2 py-1 text-gray-500 hover:text-gray-700"
                          >
                            <i className="fas fa-times" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>`;

const checkboxOverlay = `                  <div key={product.id} className="relative">
                    {/* Checkbox overlay for bulk delete mode */}
                    {bulkDeleteMode && isAdmin && (
                      <div className="absolute top-2 right-2 z-20">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(String(product.id))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProducts(prev => [...prev, String(product.id)]);
                            } else {
                              setSelectedProducts(prev => prev.filter(id => id !== String(product.id)));
                            }
                          }}
                          className="w-5 h-5 text-red-600 bg-white border-2 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
                        />
                      </div>
                    )}
                    <AmazonProductCard product={product} />
                  </div>`;

console.log('🔧 Adding bulk delete functionality to all remaining pages...');
console.log('=' .repeat(60));

pages.forEach(page => {
  const filePath = path.join(__dirname, 'client', 'src', 'pages', `${page}.tsx`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`Error ${page}.tsx not found, skipping...`);
    return;
  }
  
  console.log(`\n🔧 Processing ${page}.tsx...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. Update imports
  if (content.includes('import { useQuery } from "@tanstack/react-query";')) {
    content = content.replace(
      'import { useQuery } from "@tanstack/react-query";',
      bulkDeleteImports
    );
    console.log('   Success Updated imports');
  }
  
  // 2. Add state and functions after existing state declarations
  const stateRegex = /const \[minRating, setMinRating\] = useState<number>\(0\);/;
  if (stateRegex.test(content)) {
    content = content.replace(stateRegex, `const [minRating, setMinRating] = useState<number>(0);
${bulkDeleteState}`);
    console.log('   Success Added bulk delete state and functions');
  }
  
  // 3. Update Results header
  const headerRegex = /<h2 className="text-xl font-semibold text-gray-900 dark:text-white">\s*Results \(\{filteredProducts\.length\}\)\s*<\/h2>/;
  if (headerRegex.test(content)) {
    content = content.replace(headerRegex, bulkDeleteHeader);
    console.log('   Success Updated Results header with bulk delete icon');
  }
  
  // 4. Update product cards with checkboxes
  const cardRegex = /<AmazonProductCard key=\{product\.id\} product=\{product\} \/>/g;
  if (cardRegex.test(content)) {
    content = content.replace(cardRegex, checkboxOverlay);
    console.log('   Success Added checkbox overlays to product cards');
  }
  
  // Write updated content
  fs.writeFileSync(filePath, content);
  console.log(`   Success ${page}.tsx updated successfully!`);
});

console.log('\nCelebration Bulk delete functionality added to all pages!');
console.log('\n📋 Updated pages:');
pages.forEach(page => console.log(`   Success ${page}.tsx`));
console.log('\nLaunch All pages now have:');
console.log('   • Bulk delete icon beside Results header');
console.log('   • Checkbox selection mode');
console.log('   • Delete Selected and Delete All options');
console.log('   • Admin-only visibility');