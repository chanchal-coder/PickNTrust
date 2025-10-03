// Activate a campaign in the server database by id
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'database.sqlite');
const db = new Database(dbPath);

const campaignIdArg = process.argv[2];
const campaignId = campaignIdArg ? parseInt(campaignIdArg, 10) : NaN;

if (!campaignIdArg || Number.isNaN(campaignId)) {
  const rows = db
    .prepare(
      'SELECT id, campaign_name, advertiser_id, status, start_date, end_date FROM ad_campaigns ORDER BY created_at DESC LIMIT 10'
    )
    .all();
  console.log('Usage: node activate-campaign-server.cjs <campaignId>');
  console.log('Recent campaigns (latest 10 in server DB):');
  console.table(rows);
  process.exit(1);
}

try {
  const info = db.prepare("UPDATE ad_campaigns SET status = 'active' WHERE id = ?").run(campaignId);
  console.log(`✅ Updated ${info.changes} row(s) for campaign ID ${campaignId}`);
  const row = db.prepare('SELECT id, campaign_name, status FROM ad_campaigns WHERE id = ?').get(campaignId);
  console.log('Current status:', row);
} catch (err) {
  console.error('❌ Failed to activate campaign:', err.message);
  process.exit(1);
} finally {
  db.close();
}