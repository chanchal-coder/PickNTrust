const fs = require('fs');
const path = require('path');

console.log('🔧 FIXING WIDGET SYSTEM COMPILATION ERRORS');
console.log('=' .repeat(60));

const pagesDir = path.join(__dirname, 'client', 'src', 'pages');

// Files that need fixing based on the compilation errors
const filesToFix = [
  'loot-box.tsx',
  'search.tsx',
  'wishlist.tsx'
];

// Function to check if file has UniversalPageLayout import
function hasUniversalPageLayoutImport(content) {
  return content.includes('import UniversalPageLayout');
}

// Function to check if file has proper UniversalPageLayout wrapper
function hasUniversalPageLayoutWrapper(content) {
  return content.includes('<UniversalPageLayout') && content.includes('</UniversalPageLayout>');
}

// Function to add UniversalPageLayout import
function addUniversalPageLayoutImport(content) {
  if (hasUniversalPageLayoutImport(content)) {
    return content;
  }
  
  // Find the last import statement
  const lines = content.split('\n');
  let lastImportIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      lastImportIndex = i;
    }
  }
  
  if (lastImportIndex >= 0) {
    lines.splice(lastImportIndex + 1, 0, "import UniversalPageLayout from '@/components/UniversalPageLayout';");
    return lines.join('\n');
  }
  
  return content;
}

// Function to wrap return statement with UniversalPageLayout
function wrapWithUniversalPageLayout(content, pageId) {
  if (hasUniversalPageLayoutWrapper(content)) {
    return content;
  }
  
  // Find the return statement
  const returnMatch = content.match(/(return\s*\([\s\S]*?\);)/s);
  if (!returnMatch) {
    console.log(`❌ Could not find return statement in ${pageId}`);
    return content;
  }
  
  const returnStatement = returnMatch[1];
  const returnStart = returnMatch.index;
  const returnEnd = returnStart + returnStatement.length;
  
  // Extract JSX content
  const jsxMatch = returnStatement.match(/return\s*\(([\s\S]*?)\);?$/s);
  if (!jsxMatch) {
    console.log(`❌ Could not extract JSX from ${pageId}`);
    return content;
  }
  
  const jsxContent = jsxMatch[1].trim();
  
  // Wrap with UniversalPageLayout
  const wrappedReturn = `return (
    <UniversalPageLayout pageId="${pageId}">
${jsxContent.split('\n').map(line => '      ' + line).join('\n')}
    </UniversalPageLayout>
  );`;
  
  return content.slice(0, returnStart) + wrappedReturn + content.slice(returnEnd);
}

// Function to get page ID from filename
function getPageId(filename) {
  return filename.replace('.tsx', '').toLowerCase();
}

// Main fixing function
function fixCompilationErrors() {
  console.log('\n1️⃣ FIXING COMPILATION ERRORS:');
  
  let fixedCount = 0;
  let errorCount = 0;
  
  for (const filename of filesToFix) {
    const filePath = path.join(pagesDir, filename);
    const pageId = getPageId(filename);
    
    console.log(`\n📄 Processing: ${filename}`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`   ❌ File not found: ${filename}`);
      errorCount++;
      continue;
    }
    
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      
      // Add import if missing
      if (!hasUniversalPageLayoutImport(content)) {
        content = addUniversalPageLayoutImport(content);
        modified = true;
        console.log(`   ✅ Added UniversalPageLayout import`);
      }
      
      // Wrap with UniversalPageLayout if not wrapped
      if (!hasUniversalPageLayoutWrapper(content)) {
        const wrappedContent = wrapWithUniversalPageLayout(content, pageId);
        if (wrappedContent !== content) {
          content = wrappedContent;
          modified = true;
          console.log(`   ✅ Wrapped with UniversalPageLayout`);
        } else {
          console.log(`   ⚠️ Could not wrap with UniversalPageLayout`);
        }
      }
      
      if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`   ✅ File updated successfully`);
        fixedCount++;
      } else {
        console.log(`   ℹ️ No changes needed`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error processing ${filename}: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log('\n2️⃣ FIXING SUMMARY:');
  console.log(`   ✅ Files fixed: ${fixedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📊 Success rate: ${((fixedCount / filesToFix.length) * 100).toFixed(1)}%`);
  
  return { fixedCount, errorCount };
}

// Additional fixes for specific syntax errors
function fixSpecificSyntaxErrors() {
  console.log('\n3️⃣ FIXING SPECIFIC SYNTAX ERRORS:');
  
  const specificFixes = [
    {
      file: 'loot-box.tsx',
      fixes: [
        {
          search: /return\s*\(\s*<div/,
          replace: 'return (\n    <UniversalPageLayout pageId="loot-box">\n      <div'
        },
        {
          search: /<\/div>\s*\);\s*}\s*$/,
          replace: '      </div>\n    </UniversalPageLayout>\n  );\n}'
        }
      ]
    },
    {
      file: 'search.tsx',
      fixes: [
        {
          search: /return\s*\(\s*<div/,
          replace: 'return (\n    <UniversalPageLayout pageId="search">\n      <div'
        },
        {
          search: /<\/div>\s*\);\s*}\s*$/,
          replace: '      </div>\n    </UniversalPageLayout>\n  );\n}'
        }
      ]
    },
    {
      file: 'wishlist.tsx',
      fixes: [
        {
          search: /return\s*\(\s*<div/,
          replace: 'return (\n    <UniversalPageLayout pageId="wishlist">\n      <div'
        },
        {
          search: /<\/div>\s*\);\s*}\s*$/,
          replace: '      </div>\n    </UniversalPageLayout>\n  );\n}'
        }
      ]
    }
  ];
  
  let appliedFixes = 0;
  
  for (const fileConfig of specificFixes) {
    const filePath = path.join(pagesDir, fileConfig.file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`   ❌ File not found: ${fileConfig.file}`);
      continue;
    }
    
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      
      for (const fix of fileConfig.fixes) {
        if (fix.search.test(content)) {
          content = content.replace(fix.search, fix.replace);
          modified = true;
          appliedFixes++;
        }
      }
      
      if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`   ✅ Applied fixes to ${fileConfig.file}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error fixing ${fileConfig.file}: ${error.message}`);
    }
  }
  
  console.log(`   📊 Applied ${appliedFixes} specific fixes`);
  return appliedFixes;
}

// Verify all files have proper structure
function verifyAllFiles() {
  console.log('\n4️⃣ VERIFYING ALL MODIFIED FILES:');
  
  const allPages = fs.readdirSync(pagesDir).filter(file => file.endsWith('.tsx'));
  let verifiedCount = 0;
  let issueCount = 0;
  
  for (const filename of allPages) {
    const filePath = path.join(pagesDir, filename);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check if it has UniversalPageLayout
      const hasLayout = content.includes('UniversalPageLayout');
      
      if (hasLayout) {
        // Check if it has proper import
        const hasImport = hasUniversalPageLayoutImport(content);
        // Check if it has proper wrapper
        const hasWrapper = hasUniversalPageLayoutWrapper(content);
        
        if (hasImport && hasWrapper) {
          verifiedCount++;
        } else {
          console.log(`   ⚠️ ${filename}: Missing ${!hasImport ? 'import' : ''} ${!hasWrapper ? 'wrapper' : ''}`);
          issueCount++;
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Error verifying ${filename}: ${error.message}`);
      issueCount++;
    }
  }
  
  console.log(`\n📊 Verification Results:`);
  console.log(`   ✅ Files with widget support: ${verifiedCount}`);
  console.log(`   ⚠️ Files with issues: ${issueCount}`);
  console.log(`   📄 Total pages: ${allPages.length}`);
  console.log(`   📈 Widget coverage: ${((verifiedCount / allPages.length) * 100).toFixed(1)}%`);
  
  return { verifiedCount, issueCount, totalPages: allPages.length };
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting compilation error fixes...');
    
    const { fixedCount, errorCount } = fixCompilationErrors();
    const appliedFixes = fixSpecificSyntaxErrors();
    const { verifiedCount, issueCount, totalPages } = verifyAllFiles();
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ COMPILATION ERROR FIXING COMPLETE!');
    console.log('=' .repeat(60));
    
    console.log('\n📊 FINAL SUMMARY:');
    console.log(`   🔧 Files processed: ${filesToFix.length}`);
    console.log(`   ✅ Files fixed: ${fixedCount}`);
    console.log(`   🎯 Specific fixes applied: ${appliedFixes}`);
    console.log(`   ❌ Errors encountered: ${errorCount}`);
    console.log(`   📄 Total pages: ${totalPages}`);
    console.log(`   🎨 Pages with widgets: ${verifiedCount}`);
    console.log(`   ⚠️ Pages with issues: ${issueCount}`);
    console.log(`   📈 Final widget coverage: ${((verifiedCount / totalPages) * 100).toFixed(1)}%`);
    
    if (issueCount === 0) {
      console.log('\n🎉 SUCCESS: All compilation errors should be fixed!');
      console.log('   • TypeScript compilation should now pass');
      console.log('   • All pages have proper widget support');
      console.log('   • UniversalPageLayout is properly implemented');
    } else {
      console.log('\n⚠️ WARNING: Some issues remain:');
      console.log('   • Check the verification output above');
      console.log('   • Manual fixes may be needed for complex cases');
      console.log('   • Re-run this script after manual fixes');
    }
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('   1. Check TypeScript compilation in your IDE');
    console.log('   2. Test the website to ensure all pages load');
    console.log('   3. Verify widget functionality in admin panel');
    console.log('   4. Create test widgets for different pages');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

main();