-- Fix invalid display_pages JSON for telegram channel inserts
UPDATE unified_content
SET display_pages = '["prime-picks"]'
WHERE source_platform = 'telegram'
  AND source_type = 'channel'
  AND display_pages = '[prime-picks]';
-- Verify
SELECT id,title,display_pages,source_platform,source_type,source_id
FROM unified_content
WHERE source_platform = 'telegram'
ORDER BY id DESC
LIMIT 7;
