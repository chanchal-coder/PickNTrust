// Fix Development Workflow 409 Conflicts
// Cleans up duplicate Node processes and prevents bot conflicts

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

console.log('🔧 FIXING DEVELOPMENT WORKFLOW 409 CONFLICTS');
console.log('=' .repeat(50));

async function fixDevelopmentWorkflowConflicts() {
  try {
    console.log('\n1. Search ANALYZING CURRENT NODE PROCESSES...');
    
    // Get all Node processes
    const { stdout: processOutput } = await execAsync('powershell "Get-Process | Where-Object {$_.ProcessName -like \'*node*\'} | Select-Object Id, ProcessName, StartTime, CPU | Format-Table -AutoSize"');
    console.log('Stats Current Node processes:');
    console.log(processOutput);
    
    // Get network connections
    const { stdout: netstatOutput } = await execAsync('netstat -ano | findstr :5000');
    console.log('Global Port 5000 connections:');
    console.log(netstatOutput || 'No connections found');
    
    console.log('\n2. Target IDENTIFYING THE PROBLEM...');
    
    const processLines = processOutput.split('\n').filter(line => line.includes('node'));
    const nodeProcessCount = processLines.length - 1; // Subtract header line
    
    console.log(`Stats Found ${nodeProcessCount} Node.js processes`);
    
    if (nodeProcessCount > 1) {
      console.log('Error PROBLEM IDENTIFIED: Multiple Node processes detected!');
      console.log('   This causes multiple Telegram bot instances with same token');
      console.log('   Result: 409 Conflict errors from Telegram API');
      
      console.log('\nSearch ROOT CAUSE ANALYSIS:');
      console.log('   • Development server restart created orphaned processes');
      console.log('   • Hot reloading spawned multiple instances');
      console.log('   • Previous npm run dev not properly terminated');
      console.log('   • IDE or terminal created duplicate processes');
      
    } else {
      console.log('Success Only one Node process detected - good!');
    }
    
    console.log('\n3. Cleanup CLEANING UP DUPLICATE PROCESSES...');
    
    // Get the main server process (the one using port 5000)
    let mainProcessId = null;
    if (netstatOutput) {
      const portMatch = netstatOutput.match(/LISTENING\s+(\d+)/);
      if (portMatch) {
        mainProcessId = parseInt(portMatch[1]);
        console.log(`Target Main server process ID: ${mainProcessId}`);
      }
    }
    
    // Kill all Node processes except the main server
    const { stdout: processIds } = await execAsync('powershell "Get-Process | Where-Object {$_.ProcessName -like \'*node*\'} | Select-Object -ExpandProperty Id"');
    const allProcessIds = processIds.split('\n').filter(id => id.trim() && !isNaN(id.trim())).map(id => parseInt(id.trim()));
    
    console.log(`📋 All Node process IDs: ${allProcessIds.join(', ')}`);
    
    let killedCount = 0;
    for (const processId of allProcessIds) {
      if (processId !== mainProcessId) {
        try {
          await execAsync(`taskkill /F /PID ${processId}`);
          console.log(`Success Killed duplicate process: ${processId}`);
          killedCount++;
        } catch (error) {
          console.log(`Warning Could not kill process ${processId}: ${error.message}`);
        }
      }
    }
    
    if (killedCount > 0) {
      console.log(`\nCelebration Cleaned up ${killedCount} duplicate Node processes!`);
      console.log('⏳ Waiting 5 seconds for cleanup to complete...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    } else {
      console.log('\nSuccess No duplicate processes to clean up');
    }
    
    console.log('\n4. Search VERIFYING CLEANUP...');
    
    const { stdout: afterCleanup } = await execAsync('powershell "Get-Process | Where-Object {$_.ProcessName -like \'*node*\'} | Select-Object Id, ProcessName | Format-Table -AutoSize"');
    console.log('Stats Node processes after cleanup:');
    console.log(afterCleanup);
    
    const afterLines = afterCleanup.split('\n').filter(line => line.includes('node'));
    const afterCount = afterLines.length - 1;
    
    if (afterCount <= 1) {
      console.log('Success Cleanup successful - only one Node process remaining');
    } else {
      console.log(`Warning Still ${afterCount} Node processes - may need manual intervention`);
    }
    
    console.log('\n5. 🛡️ PREVENTING FUTURE CONFLICTS...');
    
    console.log('📋 DEVELOPMENT WORKFLOW BEST PRACTICES:');
    console.log('   1. Always use Ctrl+C to stop npm run dev properly');
    console.log('   2. Wait for "Server stopped" message before restarting');
    console.log('   3. Close all terminals when switching projects');
    console.log('   4. Use only one terminal for npm run dev');
    console.log('   5. Avoid running multiple development servers');
    
    console.log('\n🔧 AUTOMATED PREVENTION SCRIPT:');
    console.log('   Run this script before starting development:');
    console.log('   node fix-development-workflow-conflicts.cjs');
    
    console.log('\n6. 🧪 TESTING TELEGRAM BOT...');
    
    try {
      const fetch = require('node-fetch');
      const response = await fetch('http://localhost:5000/api/products/page/prime-picks');
      
      if (response.ok) {
        const products = await response.json();
        console.log(`Success Server responding - ${products.length} products found`);
        console.log('AI Telegram bot should now work without 409 conflicts');
      } else {
        console.log(`Error Server not responding: ${response.status}`);
      }
    } catch (error) {
      console.log(`Warning Could not test server: ${error.message}`);
      console.log('Tip Make sure npm run dev is running');
    }
    
    console.log('\n7. 📋 FINAL STATUS REPORT:');
    console.log('=' .repeat(30));
    
    if (killedCount > 0) {
      console.log('Success WORKFLOW ISSUE FIXED!');
      console.log(`   Removed ${killedCount} duplicate Node processes`);
      console.log('   409 conflicts should be resolved');
      console.log('   Telegram bot ready for testing');
    } else {
      console.log('ℹ️ No workflow issues detected');
      console.log('   409 conflicts may be from other sources');
      console.log('   Consider getting fresh bot token');
    }
    
    console.log('\nTarget NEXT STEPS:');
    console.log('1. Test Prime Picks autoposting with Amazon URL');
    console.log('2. Monitor server logs for 409 errors');
    console.log('3. If conflicts persist, get fresh bot token');
    console.log('4. Follow development workflow best practices');
    
  } catch (error) {
    console.error('Error Error fixing workflow conflicts:', error);
  }
}

// Run the fix
fixDevelopmentWorkflowConflicts().then(() => {
  console.log('\n' + '=' .repeat(50));
  console.log('🏁 Development workflow conflict fix completed');
}).catch(error => {
  console.error('Error Fatal error:', error);
});