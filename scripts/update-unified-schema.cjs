// Migration script to add created_at and service enforcement triggers
// Uses better-sqlite3 to update c:\Users\sharm\OneDrive\Desktop\Apps\PickNTrust\database.sqlite
const Database = require('better-sqlite3');

function main() {
  const dbPath = 'database.sqlite';
  const db = new Database(dbPath);
  db.pragma('busy_timeout = 10000');
  db.pragma('journal_mode = WAL');
  console.log('Using DB:', dbPath);

  const hasColumn = !!db.prepare("SELECT 1 FROM pragma_table_info('unified_content') WHERE name='created_at'").get();
  if (!hasColumn) {
    console.log('Adding created_at column...');
    db.exec("ALTER TABLE unified_content ADD COLUMN created_at TEXT;");
  } else {
    console.log('created_at column already exists.');
  }

  console.log('Backfilling created_at for existing rows...');
  const backfillCreated = db.prepare("UPDATE unified_content SET created_at = datetime('now') WHERE created_at IS NULL");
  const infoCreated = backfillCreated.run();
  console.log('Backfilled created_at rows:', infoCreated.changes);

  // Backfill service typing/display for existing rows
  console.log('Backfilling content_type for is_service=1 ...');
  const backfillType = db.prepare("UPDATE unified_content SET content_type='service' WHERE is_service = 1 AND (content_type IS NULL OR LOWER(content_type) != 'service')");
  const infoType = backfillType.run();
  console.log('Updated content_type rows:', infoType.changes);

  console.log('Backfilling display_pages for is_service=1 when empty ...');
  const backfillDisplay = db.prepare("UPDATE unified_content SET display_pages='[\"services\"]' WHERE is_service = 1 AND (display_pages IS NULL OR TRIM(display_pages) = '')");
  const infoDisplay = backfillDisplay.run();
  console.log('Updated display_pages rows:', infoDisplay.changes);

  // Create triggers to enforce service typing/display on insert/update
  const triggerExists = (name) => !!db.prepare("SELECT 1 FROM sqlite_master WHERE type='trigger' AND name=?").get(name);

  const insertTriggerName = 'unified_service_insert';
  if (!triggerExists(insertTriggerName)) {
    console.log('Creating insert trigger:', insertTriggerName);
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS unified_service_insert
      AFTER INSERT ON unified_content
      FOR EACH ROW WHEN NEW.is_service = 1
      BEGIN
        UPDATE unified_content
        SET content_type='service',
            display_pages=CASE
              WHEN NEW.display_pages IS NULL OR TRIM(NEW.display_pages)='' THEN '["services"]'
              ELSE NEW.display_pages
            END
        WHERE id=NEW.id;
      END;
    `);
  } else {
    console.log('Insert trigger already exists:', insertTriggerName);
  }

  const updateTriggerName = 'unified_service_update';
  if (!triggerExists(updateTriggerName)) {
    console.log('Creating update trigger:', updateTriggerName);
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS unified_service_update
      AFTER UPDATE ON unified_content
      FOR EACH ROW WHEN NEW.is_service = 1
      BEGIN
        UPDATE unified_content
        SET content_type='service',
            display_pages=CASE
              WHEN NEW.display_pages IS NULL OR TRIM(NEW.display_pages)='' THEN '["services"]'
              ELSE NEW.display_pages
            END
        WHERE id=NEW.id;
      END;
    `);
  } else {
    console.log('Update trigger already exists:', updateTriggerName);
  }

  console.log('Migration completed successfully.');
}

try {
  main();
} catch (err) {
  console.error('Migration failed:', err);
  process.exitCode = 1;
}