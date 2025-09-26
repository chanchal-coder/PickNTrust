#!/usr/bin/env node
// Debug static file serving issue

const fs = require('fs');
const path = require('path');

console.log('🔍 Debugging static file serving...');

// Simulate the server's path resolution
const serverDir = '/home/ubuntu/PickNTrust/dist/server';
const publicPath = path.resolve(serverDir, '../public');

console.log('Server directory:', serverDir);
console.log('Resolved publicPath:', publicPath);

// Check if paths exist
console.log('\n=== Path Existence Checks ===');
console.log('publicPath exists:', fs.existsSync(publicPath));
console.log('index.html exists:', fs.existsSync(path.join(publicPath, 'index.html')));

// List contents
if (fs.existsSync(publicPath)) {
  console.log('\n=== Public Directory Contents ===');
  const contents = fs.readdirSync(publicPath);
  contents.forEach(item => {
    const itemPath = path.join(publicPath, item);
    const isDir = fs.statSync(itemPath).isDirectory();
    console.log(`${isDir ? '[DIR]' : '[FILE]'} ${item}`);
  });
} else {
  console.log('❌ Public directory does not exist!');
}

// Check the condition that should trigger static serving
const condition = fs.existsSync(publicPath) && fs.existsSync(path.join(publicPath, 'index.html'));
console.log('\n=== Static Serving Condition ===');
console.log('Condition result:', condition);

if (condition) {
  console.log('✅ Static file serving should be enabled');
} else {
  console.log('❌ Static file serving condition failed');
  console.log('This explains why SPA routing is not working');
}

console.log('\n🔧 Debug completed.');