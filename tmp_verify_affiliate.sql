SELECT id,title,affiliate_url,display_pages,source_platform,source_type,source_id
FROM unified_content
WHERE source_platform = 'telegram'
ORDER BY id DESC
LIMIT 7;
