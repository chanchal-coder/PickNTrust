const fetch = require('node-fetch');

console.log('🔍 Testing API Connection...');

async function testApiConnection() {
  try {
    console.log('\n1. Testing Categories API...');
    
    // Test if server is running on port 5000
    const response = await fetch('http://localhost:5000/api/categories');
    
    if (!response.ok) {
      console.log(`❌ API returned status: ${response.status}`);
      console.log(`Response: ${await response.text()}`);
      return false;
    }
    
    const categories = await response.json();
    console.log(`✅ Categories API working! Found ${categories.length} categories`);
    
    if (categories.length > 0) {
      console.log('\nSample categories:');
      categories.slice(0, 5).forEach((cat, index) => {
        console.log(`  ${index + 1}. ${cat.name} (ID: ${cat.id})`);
      });
    }
    
    return true;
    
  } catch (error) {
    console.log('❌ API Connection Failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🚨 SERVER NOT RUNNING!');
      console.log('Please start your development server:');
      console.log('   npm run dev');
      console.log('   or');
      console.log('   npm start');
    }
    
    return false;
  }
}

// Run the test
testApiConnection().then(success => {
  if (success) {
    console.log('\n🎉 API CONNECTION SUCCESSFUL!');
    console.log('✅ Your server is running and categories are available');
    console.log('✅ Frontend should be able to load categories');
    console.log('\n📝 If categories still not showing in frontend:');
    console.log('   1. Check browser console for errors');
    console.log('   2. Clear browser cache and reload');
    console.log('   3. Check if React Query is working properly');
  } else {
    console.log('\n❌ API CONNECTION FAILED!');
    console.log('\n🔧 Troubleshooting Steps:');
    console.log('   1. Make sure your development server is running');
    console.log('   2. Check if server is running on port 5000');
    console.log('   3. Verify database file exists (sqlite.db)');
    console.log('   4. Check server logs for errors');
  }
});
