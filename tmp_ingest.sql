INSERT INTO unified_content (
  title, description, content_type, display_pages, source_platform, source_type, source_id
)
SELECT
  substr(COALESCE(processed_text, original_text), 1, 80) AS title,
  COALESCE(processed_text, original_text) AS description,
  'post' AS content_type,
  '[' || website_page || ']' AS display_pages,
  'telegram' AS source_platform,
  'channel' AS source_type,
  CAST(message_id AS TEXT) AS source_id
FROM channel_posts cp
WHERE NOT EXISTS (
  SELECT 1 FROM unified_content uc
  WHERE uc.source_platform = 'telegram'
    AND uc.source_type = 'channel'
    AND uc.source_id = CAST(cp.message_id AS TEXT)
);
