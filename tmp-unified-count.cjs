const Database = require("better-sqlite3");
const db = new Database("./database.sqlite");
const total = db.prepare("SELECT COUNT(*) c FROM unified_content").get().c;
const visible = db.prepare("SELECT COUNT(*) c FROM unified_content WHERE (status IN ('active','published') OR status IS NULL) AND (visibility IN ('public','visible') OR visibility IS NULL) AND (processing_status != 'archived' OR processing_status IS NULL)").get().c;
console.log(JSON.stringify({ total, visible }));
