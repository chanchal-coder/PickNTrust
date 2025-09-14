const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('🔍 COMPREHENSIVE WIDGET DEBUGGING');
console.log('=' .repeat(60));

try {
  // 1. Check all widgets in database
  console.log('\n📊 ALL WIDGETS IN DATABASE:');
  const allWidgets = db.prepare('SELECT * FROM widgets ORDER BY id').all();
  
  if (allWidgets.length === 0) {
    console.log('❌ NO WIDGETS FOUND IN DATABASE');
  } else {
    allWidgets.forEach((widget, index) => {
      console.log(`\n${index + 1}. Widget ID: ${widget.id}`);
      console.log(`   Name: ${widget.name}`);
      console.log(`   Target Page: ${widget.target_page}`);
      console.log(`   Position: ${widget.position}`);
      console.log(`   Active: ${widget.is_active ? 'YES' : 'NO'}`);
      console.log(`   Desktop: ${widget.show_on_desktop ? 'YES' : 'NO'}`);
      console.log(`   Mobile: ${widget.show_on_mobile ? 'YES' : 'NO'}`);
      console.log(`   Display Order: ${widget.display_order}`);
      console.log(`   Max Width: ${widget.max_width || 'Not set'}`);
      console.log(`   Created: ${widget.created_at}`);
      console.log(`   Updated: ${widget.updated_at}`);
      console.log(`   Code Preview: ${widget.code.substring(0, 80)}...`);
    });
  }
  
  // 2. Check specific issues
  console.log('\n🔍 ISSUE ANALYSIS:');
  
  // Check for inactive widgets
  const inactiveWidgets = allWidgets.filter(w => !w.is_active);
  if (inactiveWidgets.length > 0) {
    console.log(`\n❌ INACTIVE WIDGETS (${inactiveWidgets.length}):`);
    inactiveWidgets.forEach(w => {
      console.log(`   • ID ${w.id}: ${w.name} (${w.target_page}/${w.position})`);
    });
  }
  
  // Check for widgets with no desktop/mobile support
  const noDesktopWidgets = allWidgets.filter(w => !w.show_on_desktop);
  const noMobileWidgets = allWidgets.filter(w => !w.show_on_mobile);
  
  if (noDesktopWidgets.length > 0) {
    console.log(`\n❌ WIDGETS WITH NO DESKTOP SUPPORT (${noDesktopWidgets.length}):`);
    noDesktopWidgets.forEach(w => {
      console.log(`   • ID ${w.id}: ${w.name}`);
    });
  }
  
  if (noMobileWidgets.length > 0) {
    console.log(`\n❌ WIDGETS WITH NO MOBILE SUPPORT (${noMobileWidgets.length}):`);
    noMobileWidgets.forEach(w => {
      console.log(`   • ID ${w.id}: ${w.name}`);
    });
  }
  
  // 3. Check for travel-picks widgets specifically
  console.log('\n🧳 TRAVEL-PICKS WIDGETS:');
  const travelWidgets = allWidgets.filter(w => w.target_page === 'travel-picks');
  
  if (travelWidgets.length === 0) {
    console.log('❌ NO WIDGETS FOUND FOR TRAVEL-PICKS PAGE');
  } else {
    travelWidgets.forEach(w => {
      console.log(`   ✅ ID ${w.id}: ${w.name}`);
      console.log(`      Position: ${w.position}`);
      console.log(`      Active: ${w.is_active ? 'YES' : 'NO'}`);
      console.log(`      Desktop: ${w.show_on_desktop ? 'YES' : 'NO'}`);
      console.log(`      Mobile: ${w.show_on_mobile ? 'YES' : 'NO'}`);
    });
  }
  
  // 4. Check for header widgets specifically
  console.log('\n📋 HEADER WIDGETS:');
  const headerWidgets = allWidgets.filter(w => w.position === 'header');
  
  if (headerWidgets.length === 0) {
    console.log('❌ NO WIDGETS FOUND FOR HEADER POSITION');
  } else {
    headerWidgets.forEach(w => {
      console.log(`   ✅ ID ${w.id}: ${w.name}`);
      console.log(`      Target Page: ${w.target_page}`);
      console.log(`      Active: ${w.is_active ? 'YES' : 'NO'}`);
      console.log(`      Desktop: ${w.show_on_desktop ? 'YES' : 'NO'}`);
      console.log(`      Mobile: ${w.show_on_mobile ? 'YES' : 'NO'}`);
    });
  }
  
  // 5. Identify the problematic widget from the image
  console.log('\n🎯 BANNER AD WIDGET ANALYSIS:');
  const bannerAdWidgets = allWidgets.filter(w => w.name === 'Banner Ad');
  
  if (bannerAdWidgets.length === 0) {
    console.log('❌ NO "Banner Ad" WIDGETS FOUND');
  } else {
    bannerAdWidgets.forEach(w => {
      console.log(`   Widget ID ${w.id}:`);
      console.log(`      Target Page: ${w.target_page} ${w.target_page !== 'travel-picks' ? '❌ WRONG' : '✅ CORRECT'}`);
      console.log(`      Position: ${w.position} ${w.position !== 'header' ? '❌ WRONG' : '✅ CORRECT'}`);
      console.log(`      Active: ${w.is_active ? 'YES ✅' : 'NO ❌'}`);
      console.log(`      Desktop: ${w.show_on_desktop ? 'YES ✅' : 'NO ❌'}`);
      console.log(`      Mobile: ${w.show_on_mobile ? 'YES ✅' : 'NO ❌'}`);
      
      // Suggest fixes
      const issues = [];
      if (w.target_page !== 'travel-picks') issues.push('Wrong target page');
      if (w.position !== 'header') issues.push('Wrong position');
      if (!w.is_active) issues.push('Widget inactive');
      if (!w.show_on_desktop) issues.push('Desktop disabled');
      if (!w.show_on_mobile) issues.push('Mobile disabled');
      
      if (issues.length > 0) {
        console.log(`      🔧 ISSUES TO FIX: ${issues.join(', ')}`);
      } else {
        console.log(`      ✅ WIDGET IS PROPERLY CONFIGURED`);
      }
    });
  }
  
  // 6. Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  
  if (inactiveWidgets.length > 0) {
    console.log('1. ❌ ACTIVATE INACTIVE WIDGETS:');
    inactiveWidgets.forEach(w => {
      console.log(`   UPDATE widgets SET is_active = 1 WHERE id = ${w.id}; -- ${w.name}`);
    });
  }
  
  if (noDesktopWidgets.length > 0) {
    console.log('2. ❌ ENABLE DESKTOP SUPPORT:');
    noDesktopWidgets.forEach(w => {
      console.log(`   UPDATE widgets SET show_on_desktop = 1 WHERE id = ${w.id}; -- ${w.name}`);
    });
  }
  
  if (noMobileWidgets.length > 0) {
    console.log('3. ❌ ENABLE MOBILE SUPPORT:');
    noMobileWidgets.forEach(w => {
      console.log(`   UPDATE widgets SET show_on_mobile = 1 WHERE id = ${w.id}; -- ${w.name}`);
    });
  }
  
  // Check for widgets with wrong target page/position
  const wrongConfigWidgets = allWidgets.filter(w => 
    w.name === 'Banner Ad' && (w.target_page !== 'travel-picks' || w.position !== 'header')
  );
  
  if (wrongConfigWidgets.length > 0) {
    console.log('4. ❌ FIX WIDGET CONFIGURATION:');
    wrongConfigWidgets.forEach(w => {
      console.log(`   UPDATE widgets SET target_page = 'travel-picks', position = 'header' WHERE id = ${w.id}; -- ${w.name}`);
    });
  }
  
  console.log('\n🎯 SUMMARY:');
  console.log(`   Total Widgets: ${allWidgets.length}`);
  console.log(`   Active Widgets: ${allWidgets.filter(w => w.is_active).length}`);
  console.log(`   Inactive Widgets: ${inactiveWidgets.length}`);
  console.log(`   Travel-Picks Widgets: ${travelWidgets.length}`);
  console.log(`   Header Widgets: ${headerWidgets.length}`);
  
} catch (error) {
  console.log('❌ ERROR:', error.message);
  console.log('Stack:', error.stack);
}

db.close();
console.log('\n✅ Comprehensive widget debugging complete!');