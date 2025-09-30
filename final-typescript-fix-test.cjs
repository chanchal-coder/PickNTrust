const { spawn } = require('child_process');
const axios = require('axios');

console.log('🔧 FINAL TYPESCRIPT ERROR FIX VERIFICATION');
console.log('=' .repeat(60));

// Step 1: Check TypeScript compilation
console.log('\n1️⃣ CHECKING TYPESCRIPT COMPILATION:');

function checkTypeScriptErrors() {
  return new Promise((resolve) => {
    const tsc = spawn('npx', ['tsc', '--noEmit', '--project', 'server/tsconfig.json'], {
      cwd: process.cwd(),
      shell: true
    });
    
    let output = '';
    let errorOutput = '';
    
    tsc.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    tsc.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    tsc.on('close', (code) => {
      if (code === 0) {
        console.log('  ✅ TypeScript compilation successful - No errors!');
        resolve({ success: true, errors: 0 });
      } else {
        const errorLines = errorOutput.split('\n').filter(line => line.includes('error TS'));
        console.log(`  ⚠️  TypeScript compilation failed with ${errorLines.length} errors`);
        errorLines.slice(0, 5).forEach(error => {
          console.log(`     ${error.trim()}`);
        });
        if (errorLines.length > 5) {
          console.log(`     ... and ${errorLines.length - 5} more errors`);
        }
        resolve({ success: false, errors: errorLines.length });
      }
    });
  });
}

// Step 2: Test server status
async function testServerStatus() {
  console.log('\n2️⃣ TESTING SERVER STATUS:');
  
  try {
    const response = await axios.get('http://localhost:5000/api/products/page/prime-picks', {
      timeout: 5000
    });
    
    console.log(`  ✅ Server responding: ${response.status}`);
    console.log(`  📦 Prime Picks API: ${response.data.length} products`);
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('  ⚠️  Server not running or not accessible');
    } else {
      console.log(`  ❌ Server error: ${error.message}`);
    }
    return false;
  }
}

// Step 3: Test all API endpoints
async function testAllEndpoints() {
  console.log('\n3️⃣ TESTING ALL API ENDPOINTS:');
  
  const endpoints = [
    'prime-picks', 'cue-picks', 'value-picks', 'click-picks',
    'global-picks', 'travel-picks', 'deals-hub', 'lootbox'
  ];
  
  let workingEndpoints = 0;
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`http://localhost:5000/api/products/page/${endpoint}`, {
        timeout: 3000
      });
      console.log(`  ✅ ${endpoint}: ${response.data.length} products`);
      workingEndpoints++;
    } catch (error) {
      console.log(`  ❌ ${endpoint}: ${error.message}`);
    }
  }
  
  return { working: workingEndpoints, total: endpoints.length };
}

// Run all tests
async function runAllTests() {
  try {
    // Test TypeScript compilation
    const tsResult = await checkTypeScriptErrors();
    
    // Test server and APIs
    const serverRunning = await testServerStatus();
    let apiResults = { working: 0, total: 8 };
    
    if (serverRunning) {
      apiResults = await testAllEndpoints();
    }
    
    // Final summary
    console.log('\n🎯 FINAL VERIFICATION RESULTS:');
    console.log('=' .repeat(50));
    
    if (tsResult.success) {
      console.log('✅ TypeScript: No compilation errors');
    } else {
      console.log(`❌ TypeScript: ${tsResult.errors} errors remaining`);
    }
    
    if (serverRunning) {
      console.log('✅ Server: Running and accessible');
      console.log(`✅ APIs: ${apiResults.working}/${apiResults.total} endpoints working`);
    } else {
      console.log('❌ Server: Not running or not accessible');
    }
    
    if (tsResult.success && serverRunning && apiResults.working === apiResults.total) {
      console.log('\n🎊 SUCCESS: ALL ISSUES RESOLVED!');
      console.log('   ✅ Zero TypeScript compilation errors');
      console.log('   ✅ Server running without issues');
      console.log('   ✅ All API endpoints functional');
      console.log('   ✅ System ready for production');
    } else {
      console.log('\n⚠️  PARTIAL SUCCESS: Some issues remain');
      if (!tsResult.success) {
        console.log(`   🔧 Fix ${tsResult.errors} TypeScript errors`);
      }
      if (!serverRunning) {
        console.log('   🔧 Start or fix the server');
      }
      if (apiResults.working < apiResults.total) {
        console.log(`   🔧 Fix ${apiResults.total - apiResults.working} API endpoints`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }
}

// Execute tests
runAllTests();