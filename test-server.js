const { exec } = require('child_process');
const fs = require('fs');

// Run the start command and capture output
exec('npm run start', (error, stdout, stderr) => {
  let output = '';
  
  if (error) {
    output += 'Error: ' + error + '\n';
  }
  
  output += 'stdout: ' + stdout + '\n';
  output += 'stderr: ' + stderr + '\n';
  
  // Write output to file
  fs.writeFileSync('test-server-output.log', output);
  console.log('Output written to test-server-output.log');
});
