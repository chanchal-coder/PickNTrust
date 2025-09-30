const path = require('path');
const fs = require('fs');

console.log('🔍 Debugging compiled server database path...\n');

// Simulate the path resolution from dist/server/server/index.js
const compiledServerDir = path.join(__dirname, 'dist', 'server', 'server');
console.log('Compiled server directory:', compiledServerDir);

// From dist/server/server/, going up one level would be dist/server/
const dbPathFromCompiled = path.join(compiledServerDir, '..', 'database.sqlite');
console.log('Database path from compiled server (one level up):', dbPathFromCompiled);

// From dist/server/server/, going up two levels would be dist/
const dbPathFromCompiledTwo = path.join(compiledServerDir, '..', '..', 'database.sqlite');
console.log('Database path from compiled server (two levels up):', dbPathFromCompiledTwo);

// From dist/server/server/, going up three levels would be root
const dbPathFromCompiledThree = path.join(compiledServerDir, '..', '..', '..', 'database.sqlite');
console.log('Database path from compiled server (three levels up):', dbPathFromCompiledThree);

console.log('\n📁 File existence check:');
console.log(`dist/server/database.sqlite exists: ${fs.existsSync(dbPathFromCompiled)}`);
console.log(`dist/database.sqlite exists: ${fs.existsSync(dbPathFromCompiledTwo)}`);
console.log(`root/database.sqlite exists: ${fs.existsSync(dbPathFromCompiledThree)}`);

// Check what's in the dist/server directory
const distServerDir = path.join(__dirname, 'dist', 'server');
if (fs.existsSync(distServerDir)) {
    console.log('\n📋 Contents of dist/server:');
    const contents = fs.readdirSync(distServerDir);
    contents.forEach(item => {
        const itemPath = path.join(distServerDir, item);
        const isDir = fs.statSync(itemPath).isDirectory();
        console.log(`  ${isDir ? '📁' : '📄'} ${item}`);
    });
}

console.log('\n🎯 ISSUE IDENTIFIED:');
console.log('The server is running from dist/server/server/index.js');
console.log('When it uses path.join(__dirname, "..", "database.sqlite")');
console.log('It resolves to dist/server/database.sqlite, not the root database.sqlite');
console.log('We need to go up THREE levels: path.join(__dirname, "..", "..", "..", "database.sqlite")');