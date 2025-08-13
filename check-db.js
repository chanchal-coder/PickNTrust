const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Open the database
const dbPath = path.join(__dirname, 'sqlite.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }
  console.log('Connected to the SQLite database.');
});

// Check if admin_users table exists and get its contents
db.serialize(() => {
  db.all("SELECT name FROM sqlite_master WHERE type='table';", (err, tables) => {
    if (err) {
      console.error('Error getting tables:', err.message);
      return;
    }
    console.log('Tables in database:', tables);
  });
  
  db.all("SELECT * FROM admin_users LIMIT 5;", (err, rows) => {
    if (err) {
      console.error('Error querying admin_users:', err.message);
      return;
    }
    console.log('Admin users:', rows);
  });
});

// Close the database connection
db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message);
    return;
  }
  console.log('Database connection closed.');
});
