-- Set affiliate_url from channel_posts.extracted_urls for telegram/channel items
UPDATE unified_content
SET affiliate_url = (
  SELECT json_extract(cp.extracted_urls, '$[0]')
  FROM channel_posts cp
  WHERE CAST(cp.message_id AS TEXT) = unified_content.source_id
)
WHERE source_platform = 'telegram'
  AND source_type = 'channel'
  AND (affiliate_url IS NULL OR affiliate_url = '');
-- Verify a few rows
SELECT id,title,affiliate_url,display_pages,source_platform,source_type,source_id
FROM unified_content
WHERE source_platform = 'telegram'
ORDER BY id DESC
LIMIT 7;
