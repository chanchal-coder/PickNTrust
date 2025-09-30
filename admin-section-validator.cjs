const axios = require('axios');

console.log('🔍 ADMIN SECTION VALIDATOR - Quick System Check');
console.log('='.repeat(60));

// Quick validation test for each category
const QUICK_TESTS = {
  flights: { sectionType: 'featured', name: 'Quick Test Flight' },
  hotels: { sectionType: 'destinations', name: 'Quick Test Hotel' },
  tours: { sectionType: 'featured', name: 'Quick Test Tour' },
  packages: { sectionType: 'special', name: 'Quick Test Package' },
  'car-rental': { sectionType: 'standard', name: 'Quick Test Car Rental' }
};

async function quickValidation() {
  console.log('🚀 Running quick validation for admin posting...');
  
  let allPassed = true;
  const results = [];
  
  for (const [category, testData] of Object.entries(QUICK_TESTS)) {
    try {
      console.log(`\n📂 Testing ${category.toUpperCase()}...`);
      
      // Submit test data
      const submitData = {
        ...testData,
        category: category,
        description: 'Quick validation test',
        price: '1000',
        currency: 'INR',
        imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&h=400&fit=crop',
        affiliateUrl: 'https://example.com'
      };
      
      const submitResponse = await axios.post('http://localhost:5000/api/admin/travel-products', submitData);
      
      if (submitResponse.status === 200) {
        console.log(`   ✅ ${category}: Submit successful`);
        
        // Quick fetch to verify
        await new Promise(resolve => setTimeout(resolve, 200));
        const fetchResponse = await axios.get(`http://localhost:5000/api/travel-products/${category}`);
        
        const item = fetchResponse.data.find(d => d.id === submitResponse.data.id);
        const actualSection = item?.section_type || item?.sectionType;
        
        if (actualSection === testData.sectionType) {
          console.log(`   ✅ ${category}: Section mapping correct (${actualSection})`);
          results.push({ category, status: 'PASS', section: actualSection });
        } else {
          console.log(`   ❌ ${category}: Section mapping failed - Expected: ${testData.sectionType}, Got: ${actualSection}`);
          results.push({ category, status: 'FAIL', expected: testData.sectionType, actual: actualSection });
          allPassed = false;
        }
      } else {
        console.log(`   ❌ ${category}: Submit failed`);
        results.push({ category, status: 'FAIL', error: 'Submit failed' });
        allPassed = false;
      }
      
    } catch (error) {
      console.log(`   ❌ ${category}: Error - ${error.message}`);
      results.push({ category, status: 'FAIL', error: error.message });
      allPassed = false;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 VALIDATION RESULTS');
  console.log('='.repeat(60));
  
  results.forEach(result => {
    const status = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${status} ${result.category.toUpperCase()}: ${result.status}`);
    if (result.section) console.log(`   Section: ${result.section}`);
    if (result.error) console.log(`   Error: ${result.error}`);
  });
  
  console.log('\n🎯 OVERALL STATUS:');
  if (allPassed) {
    console.log('✅ ALL SYSTEMS WORKING - Admin can post to any section without errors!');
    console.log('✅ Section mapping is functioning correctly across all categories');
  } else {
    console.log('❌ ISSUES DETECTED - Some sections may not be working correctly');
    console.log('❌ Please check the failed categories above');
  }
  
  return allPassed;
}

// Run validation
quickValidation().then(success => {
  if (success) {
    console.log('\n🎉 System validation completed successfully!');
    process.exit(0);
  } else {
    console.log('\n⚠️  System validation found issues that need attention.');
    process.exit(1);
  }
}).catch(error => {
  console.error('💥 Validation failed:', error.message);
  process.exit(1);
});