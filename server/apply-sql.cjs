// Simple SQL file runner for database.sqlite
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

function usage() {
  console.log('Usage: node server/apply-sql.cjs <sql-file-path>');
  process.exit(1);
}

const sqlFileArg = process.argv[2];
if (!sqlFileArg) usage();

const sqlPath = path.isAbsolute(sqlFileArg)
  ? sqlFileArg
  : path.join(process.cwd(), sqlFileArg);

if (!fs.existsSync(sqlPath)) {
  console.error(`❌ SQL file not found: ${sqlPath}`);
  process.exit(1);
}

const dbPath = path.join(__dirname, '..', 'database.sqlite');
if (!fs.existsSync(dbPath)) {
  console.error('❌ database.sqlite not found at project root');
  process.exit(1);
}

const sql = fs.readFileSync(sqlPath, 'utf8');

try {
  const db = new Database(dbPath);
  db.exec('PRAGMA foreign_keys = ON;');
  console.log(`🔧 Applying SQL from: ${path.basename(sqlPath)}`);
  db.exec(sql);
  console.log('✅ SQL applied successfully');
  db.close();
} catch (err) {
  console.error('❌ Error applying SQL:', err.message);
  process.exit(1);
}