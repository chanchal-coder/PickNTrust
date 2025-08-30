const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Google Sheets Connection...');

async function testGoogleSheetsConnection() {
  try {
    // Load credentials
    const credentialsPath = path.join(__dirname, 'google-credentials.json');
    
    if (!fs.existsSync(credentialsPath)) {
      console.error('❌ google-credentials.json not found');
      return;
    }
    
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    console.log('✅ Credentials loaded successfully');
    console.log(`📧 Service Account: ${credentials.client_email}`);
    console.log(`🆔 Project ID: ${credentials.project_id}`);
    
    // Create JWT auth
    const serviceAccountAuth = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file',
      ],
    });
    
    console.log('🔐 JWT authentication created');
    
    // Test authentication
    try {
      await serviceAccountAuth.authorize();
      console.log('✅ Google authentication successful');
    } catch (authError) {
      console.error('❌ Google authentication failed:', authError.message);
      return;
    }
    
    // Try to access a test spreadsheet (you need to provide your spreadsheet ID)
    const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || '1BH2Kkn9EMy8Eo5-Ks8-Ks8-Ks8-Ks8-Ks8'; // Replace with your actual ID
    
    if (!SPREADSHEET_ID || SPREADSHEET_ID.includes('Ks8')) {
      console.log('⚠️ No valid GOOGLE_SHEETS_ID provided');
      console.log('💡 To test with your actual sheet:');
      console.log('   1. Set GOOGLE_SHEETS_ID environment variable');
      console.log('   2. Share your Google Sheet with: automationpnt@automationpnt.iam.gserviceaccount.com');
      console.log('   3. Give Editor permissions');
      return;
    }
    
    console.log(`📊 Attempting to access spreadsheet: ${SPREADSHEET_ID}`);
    
    const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
    
    try {
      await doc.loadInfo();
      console.log('✅ Successfully connected to Google Sheets!');
      console.log(`📋 Sheet title: ${doc.title}`);
      console.log(`📄 Number of sheets: ${doc.sheetCount}`);
      
      // List all sheets
      console.log('\n📑 Available sheets:');
      Object.values(doc.sheetsById).forEach((sheet, index) => {
        console.log(`   ${index + 1}. ${sheet.title} (${sheet.rowCount} rows, ${sheet.columnCount} cols)`);
      });
      
      // Try to access url_inbox sheet
      const urlInboxSheet = doc.sheetsByTitle['url_inbox'];
      if (urlInboxSheet) {
        console.log('\n✅ Found url_inbox sheet');
        
        // Try to read some data
        const rows = await urlInboxSheet.getRows();
        console.log(`📊 url_inbox has ${rows.length} rows of data`);
        
        if (rows.length > 0) {
          console.log('\n📋 Sample data from url_inbox:');
          const sampleRow = rows[0];
          Object.keys(sampleRow._rawData).forEach((key, index) => {
            if (index < 5) { // Show first 5 columns
              console.log(`   Column ${index + 1}: ${sampleRow._rawData[key] || '(empty)'}`);
            }
          });
        }
        
        // Test writing data
        console.log('\n🔄 Testing write capability...');
        const testRow = {
          url: 'test-automation.com',
          category: 'test',
          source: 'automation_test',
          note: `Test connection at ${new Date().toISOString()}`,
          status: 'test_successful'
        };
        
        try {
          await urlInboxSheet.addRow(testRow);
          console.log('✅ Successfully wrote test data to Google Sheets!');
          console.log('🎊 Google Sheets integration is WORKING!');
        } catch (writeError) {
          console.error('❌ Failed to write to Google Sheets:', writeError.message);
        }
        
      } else {
        console.log('⚠️ url_inbox sheet not found');
        console.log('💡 Available sheets:', Object.keys(doc.sheetsByTitle));
      }
      
    } catch (docError) {
      console.error('❌ Failed to access spreadsheet:', docError.message);
      console.log('💡 Make sure to:');
      console.log('   1. Share your Google Sheet with: automationpnt@automationpnt.iam.gserviceaccount.com');
      console.log('   2. Give Editor permissions');
      console.log('   3. Use the correct spreadsheet ID');
    }
    
  } catch (error) {
    console.error('❌ Google Sheets connection test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Check if google-spreadsheet package is installed
try {
  require('google-spreadsheet');
  console.log('✅ google-spreadsheet package found');
} catch (e) {
  console.log('⚠️ google-spreadsheet package not found, installing...');
  console.log('Run: npm install google-spreadsheet google-auth-library');
  process.exit(1);
}

testGoogleSheetsConnection();