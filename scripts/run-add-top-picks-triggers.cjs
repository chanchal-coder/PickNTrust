#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function findDbPath() {
  const candidates = [
    process.env.DB_PATH,
    path.join(__dirname, '..', 'server', 'database.sqlite'),
    path.join(__dirname, '..', 'database.sqlite'),
    '/var/www/pickntrust/database.sqlite',
  ].filter(Boolean);
  for (const p of candidates) {
    try {
      if (p && fs.existsSync(p)) return p;
    } catch (_) {}
  }
  throw new Error('Could not find database.sqlite. Set DB_PATH to the DB file.');
}

const sqlPath = path.join(__dirname, 'add-top-picks-triggers.sql');
if (!fs.existsSync(sqlPath)) {
  throw new Error(`Missing SQL file: ${sqlPath}`);
}
const sql = fs.readFileSync(sqlPath, 'utf8');

const dbPath = findDbPath();
const Database = require('better-sqlite3');
const db = new Database(dbPath);
db.exec(sql);
db.close();
console.log(`Triggers installed into ${dbPath}`);