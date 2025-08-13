import { spawn } from 'child_process';
import fs from 'fs';

// Run the start command and capture output
const child = spawn('npm', ['run', 'start'], { shell: true });

let output = '';

child.stdout.on('data', (data) => {
  output += 'stdout: ' + data.toString() + '\n';
  console.log('stdout: ' + data.toString());
});

child.stderr.on('data', (data) => {
  output += 'stderr: ' + data.toString() + '\n';
  console.log('stderr: ' + data.toString());
});

child.on('close', (code) => {
  output += 'Process exited with code ' + code + '\n';
  fs.writeFileSync('server-output.log', output);
  console.log('Process exited with code ' + code);
  console.log('Output written to server-output.log');
});
