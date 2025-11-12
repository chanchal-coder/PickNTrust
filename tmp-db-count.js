const Database = require("better-sqlite3");
const db = new Database("./database.sqlite");
const c1 = db.prepare("SELECT COUNT(*) c FROM categories").get().c;
const c2 = db.prepare("SELECT COUNT(*) c FROM unified_content").get().c;
console.log(JSON.stringify({ categories: c1, unified: c2 }));
