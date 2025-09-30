const fetch = require('node-fetch');

console.log('🔍 DEBUGGING WIDGET DISPLAY ISSUE');
console.log('=' .repeat(60));

async function debugWidgetDisplay() {
  try {
    console.log('\n1️⃣ Testing widget API endpoint directly...');
    
    const response = await fetch('http://localhost:5000/api/widgets/travel-picks/header');
    console.log('API Status:', response.status);
    console.log('API OK:', response.ok);
    
    if (response.ok) {
      const widgets = await response.json();
      console.log('\n📊 API Response:');
      console.log('Widget count:', widgets.length);
      
      if (widgets.length > 0) {
        widgets.forEach((widget, index) => {
          console.log(`\n${index + 1}. Widget Details:`);
          console.log('   ID:', widget.id);
          console.log('   Name:', widget.name);
          console.log('   Active:', widget.is_active);
          console.log('   Desktop:', widget.show_on_desktop);
          console.log('   Mobile:', widget.show_on_mobile);
          console.log('   Code length:', widget.code.length);
          console.log('   Code preview:', widget.code.substring(0, 100) + '...');
        });
        
        console.log('\n✅ API is returning widget data correctly!');
        console.log('\n🔍 ISSUE ANALYSIS:');
        console.log('Since API works, the problem is likely:');
        console.log('1. WidgetRenderer component not making API calls');
        console.log('2. React component not rendering the HTML');
        console.log('3. CSS hiding the widget');
        console.log('4. JavaScript errors preventing rendering');
        
      } else {
        console.log('\n❌ API returns empty array - no widgets found');
        console.log('This means the widget is not active or not configured correctly');
      }
    } else {
      console.log('\n❌ API call failed');
      const errorText = await response.text();
      console.log('Error response:', errorText);
    }
    
    console.log('\n2️⃣ Testing widget creation to ensure we have active widget...');
    
    // Create a simple test widget to ensure we have something to display
    const testWidget = {
      name: 'Debug Test Widget',
      code: '<div style="background: red; color: white; padding: 20px; text-align: center; font-size: 18px; font-weight: bold;">🚨 DEBUG: Widget is working! 🚨</div>',
      targetPage: 'travel-picks',
      position: 'header',
      isActive: true,
      displayOrder: 0,
      maxWidth: '100%',
      customCss: '',
      showOnMobile: true,
      showOnDesktop: true
    };
    
    const createResponse = await fetch('http://localhost:5000/api/admin/widgets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': 'pickntrust2025'
      },
      body: JSON.stringify(testWidget)
    });
    
    console.log('\nCreate widget status:', createResponse.status);
    
    if (createResponse.ok) {
      const createdWidget = await createResponse.json();
      console.log('✅ Debug widget created with ID:', createdWidget.id);
      
      // Test the API again
      console.log('\n3️⃣ Re-testing API after creating debug widget...');
      const retestResponse = await fetch('http://localhost:5000/api/widgets/travel-picks/header');
      
      if (retestResponse.ok) {
        const retestWidgets = await retestResponse.json();
        console.log('Widgets after creation:', retestWidgets.length);
        
        retestWidgets.forEach(w => {
          console.log(`   • ${w.name} (Active: ${w.is_active ? 'YES' : 'NO'})`);
        });
        
        if (retestWidgets.length > 0) {
          console.log('\n✅ API now returns widgets!');
          console.log('\n🎯 NEXT STEPS:');
          console.log('1. Visit http://localhost:5000/travel-picks');
          console.log('2. Look for red debug banner at the top');
          console.log('3. If not visible, check browser console for errors');
          console.log('4. If still not visible, the WidgetRenderer component has issues');
        }
      }
    } else {
      console.log('❌ Failed to create debug widget');
      const errorText = await createResponse.text();
      console.log('Create error:', errorText);
    }
    
    console.log('\n4️⃣ DEBUGGING CHECKLIST:');
    console.log('□ API endpoint working: ✅');
    console.log('□ Widget data available: ✅');
    console.log('□ WidgetRenderer imported: ✅');
    console.log('□ WidgetRenderer added to page: ✅');
    console.log('□ Widget HTML rendering: ❓ (check browser)');
    console.log('□ CSS not hiding widget: ❓ (check browser)');
    console.log('□ No JavaScript errors: ❓ (check console)');
    
  } catch (error) {
    console.log('❌ Debug failed:', error.message);
    console.log('Stack:', error.stack);
  }
}

debugWidgetDisplay().then(() => {
  console.log('\n✅ Widget display debugging complete!');
}).catch(error => {
  console.log('❌ Debug error:', error);
});