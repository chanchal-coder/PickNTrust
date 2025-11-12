const Database = require('better-sqlite3');

function inspectUnified() {
  const db = new Database('/var/www/pickntrust/database.sqlite');
  const rows = db.prepare(`
    SELECT id, title, display_pages, processing_status, status, visibility, created_at
    FROM unified_content
    ORDER BY created_at DESC
    LIMIT 15
  `).all();
  console.log('UNIFIED_CONTENT_RECENT:', rows);
  db.close();
}

function inspectChannelPosts() {
  const db = new Database('/var/www/pickntrust/database.sqlite');
  const rows = db.prepare(`
    SELECT id, channel_handle, message_id, created_at, processed, processing_error
    FROM channel_posts
    ORDER BY created_at DESC
    LIMIT 20
  `).all();
  console.log('CHANNEL_POSTS_RECENT:', rows);
  db.close();
}

try {
  inspectUnified();
} catch (e) {
  console.error('UNIFIED_INSPECT_ERROR:', e && e.message ? e.message : e);
}

try {
  inspectChannelPosts();
} catch (e) {
  console.error('CHANNEL_POSTS_INSPECT_ERROR:', e && e.message ? e.message : e);
}