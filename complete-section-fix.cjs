const axios = require('axios');
const fs = require('fs');

console.log('🔧 COMPLETE SECTION MAPPING FIX - ALL CATEGORIES & SECTIONS');
console.log('='.repeat(70));

// Define all categories and their sections
const CATEGORIES = {
  flights: {
    sections: [
      { value: 'featured', label: 'Airlines & Brand Promotions' },
      { value: 'standard', label: 'Flight Search Results' },
      { value: 'destinations', label: 'Browse by Destinations' }
    ],
    testData: {
      name: 'Test Flight Item',
      description: 'Test flight for section validation',
      price: '5000',
      originalPrice: '6000',
      currency: 'INR',
      imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&h=400&fit=crop',
      affiliateUrl: 'https://example.com',
      airline: 'Test Airlines',
      departure: 'Mumbai',
      arrival: 'Delhi',
      flightClass: 'Economy',
      stops: 'Non-stop',
      routeType: 'domestic'
    }
  },
  hotels: {
    sections: [
      { value: 'featured', label: 'Featured Hotels & Premium Stays' },
      { value: 'standard', label: 'Quick Browse Hotels' },
      { value: 'destinations', label: 'Browse by Destination' }
    ],
    testData: {
      name: 'Test Hotel Item',
      description: 'Test hotel for section validation',
      price: '8000',
      originalPrice: '10000',
      currency: 'INR',
      imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=400&fit=crop',
      affiliateUrl: 'https://example.com',
      location: 'Goa',
      hotelType: 'Luxury',
      roomType: 'Deluxe Room',
      rating: '5',
      cancellation: 'Free cancellation'
    }
  },
  tours: {
    sections: [
      { value: 'featured', label: 'Featured Tour Packages & Premium Experiences' },
      { value: 'standard', label: 'Quick Browse Packages' },
      { value: 'destinations', label: 'Browse by Destination' }
    ],
    testData: {
      name: 'Test Tour Package',
      description: 'Test tour for section validation',
      price: '15000',
      originalPrice: '18000',
      currency: 'INR',
      imageUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=400&fit=crop',
      affiliateUrl: 'https://example.com',
      duration: '5 Days 4 Nights',
      destinations: 'Delhi, Agra, Jaipur',
      tourType: 'Cultural',
      groupSize: '2-15 people'
    }
  },
  cruises: {
    sections: [
      { value: 'featured', label: 'Our Featured Cruise Lines' },
      { value: 'standard', label: 'Most-booked Cruise Destinations' },
      { value: 'destinations', label: 'Browse by Destinations' }
    ],
    testData: {
      name: 'Test Cruise Package',
      description: 'Test cruise for section validation',
      price: '25000',
      originalPrice: '30000',
      currency: 'INR',
      imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=400&fit=crop',
      affiliateUrl: 'https://example.com',
      cruiseLine: 'Royal Caribbean',
      route: 'Mediterranean',
      duration: '7 nights',
      cabinType: 'Balcony'
    }
  },
  bus: {
    sections: [
      { value: 'featured', label: 'Bus Operators & Brand Promotions' },
      { value: 'standard', label: 'Bus Search Results' },
      { value: 'destinations', label: 'Browse by Destinations' }
    ],
    testData: {
      name: 'Test Bus Service',
      description: 'Test bus for section validation',
      price: '800',
      originalPrice: '1000',
      currency: 'INR',
      imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=400&fit=crop',
      affiliateUrl: 'https://example.com',
      operator: 'Volvo',
      departure: 'Mumbai',
      arrival: 'Pune',
      busType: 'AC Sleeper'
    }
  },
  train: {
    sections: [
      { value: 'featured', label: 'Train Operators & Brand Promotions' },
      { value: 'standard', label: 'Train Search Results' },
      { value: 'destinations', label: 'Browse by Destinations' }
    ],
    testData: {
      name: 'Test Train Service',
      description: 'Test train for section validation',
      price: '1200',
      originalPrice: '1500',
      currency: 'INR',
      imageUrl: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800&h=400&fit=crop',
      affiliateUrl: 'https://example.com',
      trainOperator: 'Indian Railways',
      departure: 'Mumbai Central',
      arrival: 'New Delhi',
      trainType: 'AC 2-Tier'
    }
  },
  packages: {
    sections: [
      { value: 'featured', label: 'Best Selling Destinations' },
      { value: 'standard', label: 'International Destinations' },
      { value: 'destinations', label: 'Visa Free Destinations' },
      { value: 'special', label: 'Last Minute Deals' },
      { value: 'cities', label: 'Destination Packages' }
    ],
    testData: {
      name: 'Test Package Deal',
      description: 'Test package for section validation',
      price: '35000',
      originalPrice: '40000',
      currency: 'INR',
      imageUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=400&fit=crop',
      affiliateUrl: 'https://example.com',
      duration: '7 Days 6 Nights',
      destinations: 'Dubai, Abu Dhabi',
      packageType: 'Luxury',
      routeType: 'international'
    }
  },
  'car-rental': {
    sections: [
      { value: 'featured', label: 'Car Rental Operators & Brand Promotions' },
      { value: 'standard', label: 'Car Rental Search Results' },
      { value: 'destinations', label: 'Browse by Destinations' }
    ],
    testData: {
      name: 'Test Car Rental',
      description: 'Test car rental for section validation',
      price: '2000',
      originalPrice: '2500',
      currency: 'INR',
      imageUrl: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&h=400&fit=crop',
      affiliateUrl: 'https://example.com',
      carType: 'SUV',
      location: 'Mumbai Airport',
      duration: '3 days',
      fuelType: 'Petrol'
    }
  }
};

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const errors = [];

async function testCategorySection(category, section, testData) {
  totalTests++;
  const testName = `${category.toUpperCase()} - ${section.label}`;
  
  try {
    console.log(`\n🧪 Testing: ${testName}`);
    console.log(`   Section Value: ${section.value}`);
    
    // Prepare test data with section
    const submitData = {
      ...testData,
      category: category,
      sectionType: section.value,
      name: `${testData.name} - ${section.label}`
    };
    
    // Submit data
    console.log(`   📤 Submitting to section: ${section.value}`);
    const submitResponse = await axios.post('http://localhost:5000/api/admin/travel-products', submitData);
    
    if (submitResponse.status !== 200) {
      throw new Error(`Submit failed with status: ${submitResponse.status}`);
    }
    
    console.log(`   ✅ Submit successful - ID: ${submitResponse.data.id}`);
    
    // Wait for data to be processed
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Fetch and verify
    console.log(`   📥 Fetching ${category} data...`);
    const fetchResponse = await axios.get(`http://localhost:5000/api/travel-products/${category}`);
    
    if (fetchResponse.status !== 200) {
      throw new Error(`Fetch failed with status: ${fetchResponse.status}`);
    }
    
    // Find the submitted item
    const submittedItem = fetchResponse.data.find(item => item.id === submitResponse.data.id);
    
    if (!submittedItem) {
      throw new Error('Submitted item not found in API response');
    }
    
    // Check section mapping
    const actualSectionType = submittedItem.section_type || submittedItem.sectionType;
    
    if (actualSectionType !== section.value) {
      throw new Error(`Section mismatch - Expected: ${section.value}, Got: ${actualSectionType}`);
    }
    
    console.log(`   ✅ Section mapping verified: ${actualSectionType}`);
    console.log(`   ✅ TEST PASSED: ${testName}`);
    
    passedTests++;
    
  } catch (error) {
    console.log(`   ❌ TEST FAILED: ${testName}`);
    console.log(`   ❌ Error: ${error.message}`);
    
    failedTests++;
    errors.push({
      test: testName,
      category: category,
      section: section.value,
      error: error.message
    });
  }
}

async function runCompleteTest() {
  console.log('\n🚀 Starting comprehensive section mapping test...');
  console.log(`📊 Total combinations to test: ${Object.keys(CATEGORIES).reduce((sum, cat) => sum + CATEGORIES[cat].sections.length, 0)}`);
  
  // Test all category-section combinations
  for (const [category, config] of Object.entries(CATEGORIES)) {
    console.log(`\n📂 Testing Category: ${category.toUpperCase()}`);
    console.log(`   Sections: ${config.sections.length}`);
    
    for (const section of config.sections) {
      await testCategorySection(category, section, config.testData);
    }
  }
  
  // Generate comprehensive report
  console.log('\n' + '='.repeat(70));
  console.log('📊 COMPREHENSIVE TEST RESULTS');
  console.log('='.repeat(70));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (failedTests > 0) {
    console.log('\n❌ FAILED TESTS:');
    errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.test}`);
      console.log(`   Category: ${error.category}`);
      console.log(`   Section: ${error.section}`);
      console.log(`   Error: ${error.error}`);
      console.log('');
    });
    
    // Save error report
    const errorReport = {
      timestamp: new Date().toISOString(),
      totalTests,
      passedTests,
      failedTests,
      successRate: ((passedTests / totalTests) * 100).toFixed(1),
      errors
    };
    
    fs.writeFileSync('./section-test-errors.json', JSON.stringify(errorReport, null, 2));
    console.log('💾 Error report saved to: section-test-errors.json');
  } else {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ Section mapping is working perfectly for all categories and sections!');
  }
  
  console.log('\n🔧 RECOMMENDATIONS:');
  if (failedTests === 0) {
    console.log('✅ No issues found - system is working correctly');
    console.log('✅ Admin can post to any section in any category without errors');
  } else {
    console.log('❌ Issues found that need to be fixed:');
    const uniqueErrors = [...new Set(errors.map(e => e.error))];
    uniqueErrors.forEach(error => {
      console.log(`   - ${error}`);
    });
  }
}

// Run the comprehensive test
runCompleteTest().catch(error => {
  console.error('💥 Test suite failed:', error.message);
  process.exit(1);
});