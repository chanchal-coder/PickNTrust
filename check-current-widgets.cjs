const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('🔍 Current Widget Status:');
console.log('=' .repeat(50));

try {
  const widgets = db.prepare('SELECT * FROM widgets').all();
  
  if (widgets.length === 0) {
    console.log('❌ No widgets found in database');
  } else {
    console.log(`📊 Found ${widgets.length} widget(s):`);
    console.log('');
    
    widgets.forEach((widget, index) => {
      console.log(`${index + 1}. Widget Details:`);
      console.log(`   ID: ${widget.id}`);
      console.log(`   Name: ${widget.name}`);
      console.log(`   Active: ${widget.is_active ? 'YES' : 'NO'}`);
      console.log(`   Target Page: ${widget.target_page}`);
      console.log(`   Position: ${widget.position}`);
      console.log(`   Desktop: ${widget.show_on_desktop ? 'YES' : 'NO'}`);
      console.log(`   Mobile: ${widget.show_on_mobile ? 'YES' : 'NO'}`);
      console.log(`   Created: ${widget.created_at}`);
      console.log(`   Code Preview: ${widget.code.substring(0, 100)}...`);
      console.log('');
    });
  }
  
} catch (error) {
  console.log('❌ Error:', error.message);
}

db.close();
console.log('✅ Widget check complete!');