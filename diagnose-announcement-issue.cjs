/**
 * COMPREHENSIVE ANNOUNCEMENT SYSTEM DIAGNOSIS
 * This script will identify and fix the exact issue preventing announcements from working
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚨 SERIOUS ANNOUNCEMENT DIAGNOSIS STARTING...');
console.log('='.repeat(60));

async function diagnoseAnnouncementIssue() {
  const issues = [];
  const fixes = [];

  try {
    console.log('\n1. 🔍 CHECKING FRONTEND DEPLOYMENT STATUS...');
    
    // Check if the frontend files were actually deployed
    const result1 = execSync('ssh -i "C:/Users/sharm/OneDrive/Desktop/Apps/pntkey.pem" ubuntu@51.21.112.211 "ls -la /home/ubuntu/PickNTrust/public/assets/ | head -5"', { encoding: 'utf8' });
    console.log('Frontend assets:', result1);
    
    // Check if UniversalPageLayout was actually deployed
    const result2 = execSync('ssh -i "C:/Users/sharm/OneDrive/Desktop/Apps/pntkey.pem" ubuntu@51.21.112.211 "grep -n AnnouncementBanner /home/ubuntu/PickNTrust/public/assets/*.js 2>/dev/null | head -3 || echo \'AnnouncementBanner not found in deployed assets\'"', { encoding: 'utf8' });
    console.log('AnnouncementBanner in deployed code:', result2);
    
    if (result2.includes('not found')) {
      issues.push('❌ AnnouncementBanner not deployed to production');
      fixes.push('Need to rebuild and redeploy frontend with AnnouncementBanner fix');
    }

    console.log('\n2. 🔍 TESTING LIVE WEBSITE ANNOUNCEMENT API...');
    
    // Test the actual live API
    const apiTest1 = execSync('curl -s "https://pickntrust.com/api/announcement/active" --connect-timeout 10 --insecure || echo "API_ERROR"', { encoding: 'utf8' });
    console.log('Global API response:', apiTest1);
    
    const apiTest2 = execSync('curl -s "https://pickntrust.com/api/announcement/active?page=apps" --connect-timeout 10 --insecure || echo "API_ERROR"', { encoding: 'utf8' });
    console.log('Apps page API response:', apiTest2);
    
    if (apiTest1.includes('API_ERROR') || apiTest2.includes('API_ERROR')) {
      issues.push('❌ Live API not responding');
      fixes.push('API endpoint not accessible from public internet');
    }

    console.log('\n3. 🔍 CHECKING BROWSER CONSOLE FOR ERRORS...');
    
    // Check if there are JavaScript errors preventing announcements
    const jsCheck = execSync('ssh -i "C:/Users/sharm/OneDrive/Desktop/Apps/pntkey.pem" ubuntu@51.21.112.211 "curl -s http://localhost/apps | grep -i announcement || echo \'No announcement HTML found\'"', { encoding: 'utf8' });
    console.log('Announcement in HTML:', jsCheck);
    
    if (jsCheck.includes('No announcement')) {
      issues.push('❌ Announcement component not rendering in HTML');
      fixes.push('Frontend deployment issue - AnnouncementBanner not included');
    }

    console.log('\n4. 🔍 CHECKING SERVER-SIDE ROUTING...');
    
    // Check if the server is properly serving the frontend
    const routeCheck = execSync('ssh -i "C:/Users/sharm/OneDrive/Desktop/Apps/pntkey.pem" ubuntu@51.21.112.211 "curl -I http://localhost/apps 2>/dev/null | head -5"', { encoding: 'utf8' });
    console.log('Apps page routing:', routeCheck);
    
    if (!routeCheck.includes('200 OK')) {
      issues.push('❌ Frontend routing not working');
      fixes.push('Server not serving frontend pages correctly');
    }

    console.log('\n5. 🔍 CHECKING ANNOUNCEMENT COMPONENT INTEGRATION...');
    
    // Check the actual deployed frontend code structure
    const componentCheck = execSync('ssh -i "C:/Users/sharm/OneDrive/Desktop/Apps/pntkey.pem" ubuntu@51.21.112.211 "find /home/ubuntu/PickNTrust -name \'*.js\' -exec grep -l \'AnnouncementBanner\' {} \\; 2>/dev/null | head -3 || echo \'Component not found\'"', { encoding: 'utf8' });
    console.log('AnnouncementBanner in deployed files:', componentCheck);
    
    if (componentCheck.includes('not found')) {
      issues.push('❌ AnnouncementBanner component missing from deployment');
      fixes.push('Frontend build did not include the AnnouncementBanner fix');
    }

    console.log('\n6. 🔍 CHECKING NETWORK AND CORS ISSUES...');
    
    // Check if CORS is blocking the API calls
    const corsCheck = execSync('ssh -i "C:/Users/sharm/OneDrive/Desktop/Apps/pntkey.pem" ubuntu@51.21.112.211 "curl -H \'Origin: https://pickntrust.com\' -H \'Access-Control-Request-Method: GET\' -H \'Access-Control-Request-Headers: X-Requested-With\' -X OPTIONS http://localhost:5000/api/announcement/active -v 2>&1 | grep -i cors || echo \'No CORS info\'"', { encoding: 'utf8' });
    console.log('CORS check:', corsCheck);

    console.log('\n7. 🔍 REAL-TIME FRONTEND TESTING...');
    
    // Test if the frontend is actually making API calls
    const frontendTest = execSync('ssh -i "C:/Users/sharm/OneDrive/Desktop/Apps/pntkey.pem" ubuntu@51.21.112.211 "timeout 10 tail -f /home/ubuntu/.pm2/logs/pickntrust-out.log | grep announcement || echo \'No announcement API calls detected\'"', { encoding: 'utf8' });
    console.log('Live API calls:', frontendTest);

    console.log('\n📋 DIAGNOSIS SUMMARY:');
    console.log('='.repeat(40));
    
    if (issues.length === 0) {
      console.log('✅ No obvious issues detected - need deeper investigation');
      issues.push('❓ Announcement system appears configured but not visible');
      fixes.push('Need to check browser developer tools and frontend rendering');
    }
    
    console.log('\n🚨 IDENTIFIED ISSUES:');
    issues.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue}`);
    });
    
    console.log('\n🔧 REQUIRED FIXES:');
    fixes.forEach((fix, i) => {
      console.log(`${i + 1}. ${fix}`);
    });

    console.log('\n🚀 IMMEDIATE ACTION PLAN:');
    console.log('1. Rebuild frontend with AnnouncementBanner integration');
    console.log('2. Ensure UniversalPageLayout changes are included in build');
    console.log('3. Deploy fresh build to EC2 server');
    console.log('4. Verify API endpoints are accessible');
    console.log('5. Test frontend rendering in browser developer tools');
    
    return { issues, fixes };
    
  } catch (error) {
    console.error('❌ Diagnosis error:', error.message);
    return { issues: ['Diagnosis failed'], fixes: ['Manual investigation required'] };
  }
}

// Run diagnosis
diagnoseAnnouncementIssue()
  .then(result => {
    console.log('\n✅ DIAGNOSIS COMPLETED');
    console.log(`Found ${result.issues.length} issues requiring ${result.fixes.length} fixes`);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ DIAGNOSIS FAILED:', error);
    process.exit(1);
  });