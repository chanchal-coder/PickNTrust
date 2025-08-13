import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

async function runMigration() {
  try {
    const dbPath = path.join(process.cwd(), 'sqlite.db');
    const migrationPath = path.join(process.cwd(), 'migrations', '0001_init.sql');

    if (!fs.existsSync(migrationPath)) {
      console.error('Migration file not found:', migrationPath);
      process.exit(1);
    }

    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    const db = new Database(dbPath);

    db.exec(migrationSql);
    console.log('Database migration executed successfully.');

    db.close();
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

runMigration();
