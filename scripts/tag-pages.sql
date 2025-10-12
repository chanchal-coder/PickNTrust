-- Tag services
UPDATE unified_content
SET display_pages = 
  CASE
    WHEN display_pages IS NULL OR TRIM(display_pages) = '' THEN '["services"]'
    WHEN display_pages LIKE '%"services"%' THEN display_pages
    WHEN display_pages LIKE '%]%' THEN REPLACE(display_pages, ']', ',"services"]')
    ELSE '["services"]'
  END
WHERE (is_service = 1 OR content_type = 'service' OR LOWER(category) LIKE '%service%')
  AND (status IN ('active','published') OR status IS NULL)
  AND (visibility IN ('public','visible') OR visibility IS NULL)
  AND (processing_status IN ('completed','active') OR processing_status IS NULL);

-- Tag apps-ai-apps
UPDATE unified_content
SET display_pages = 
  CASE
    WHEN display_pages IS NULL OR TRIM(display_pages) = '' THEN '["apps-ai-apps"]'
    WHEN display_pages LIKE '%"apps-ai-apps"%' THEN display_pages
    WHEN display_pages LIKE '%]%' THEN REPLACE(display_pages, ']', ',"apps-ai-apps"]')
    ELSE '["apps-ai-apps"]'
  END
WHERE (is_ai_app = 1 OR content_type IN ('app','ai-app') OR LOWER(category) LIKE '%app%' OR LOWER(category) LIKE '%ai%')
  AND (status IN ('active','published') OR status IS NULL)
  AND (visibility IN ('public','visible') OR visibility IS NULL)
  AND (processing_status IN ('completed','active') OR processing_status IS NULL);
