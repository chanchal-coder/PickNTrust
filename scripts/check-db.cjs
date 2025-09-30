const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

function checkDb(dbPath) {
  console.log(`\n=== Checking DB: ${dbPath} ===`);
  if (!fs.existsSync(dbPath)) {
    console.log('NOT FOUND');
    return;
  }
  const db = new Database(dbPath);
  try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
    console.log('Tables:', tables);

    function count(name) {
      try {
        const c = db.prepare(`SELECT COUNT(*) as c FROM ${name}`).get().c;
        console.log(`${name} count:`, c);
      } catch (e) {
        console.log(`${name} missing:`, e.message);
      }
    }

    count('blog_posts');
    count('blogPosts');
    count('unified_content');

    try {
      const recent = db.prepare('SELECT id, title, slug, publishedAt FROM blog_posts ORDER BY id DESC LIMIT 3').all();
      console.log('Recent blog_posts:', recent);
    } catch (e) {
      console.log('No recent from blog_posts:', e.message);
    }
    try {
      const recent2 = db.prepare('SELECT id, title, slug, publishedAt FROM blogPosts ORDER BY id DESC LIMIT 3').all();
      console.log('Recent blogPosts:', recent2);
    } catch (e) {
      console.log('No recent from blogPosts:', e.message);
    }
    try {
      const products = db.prepare('SELECT id, title, page_type, category FROM unified_content ORDER BY id DESC LIMIT 5').all();
      console.log('Recent unified_content:', products);
    } catch (e) {
      console.log('No recent from unified_content:', e.message);
    }
  } finally {
    db.close();
  }
}

const rootDb = path.join(process.cwd(), 'database.sqlite');
const serverDb = path.join(process.cwd(), 'server', 'database.sqlite');

checkDb(rootDb);
checkDb(serverDb);