-- Flag Services in unified_content so /api/products/page/services returns items
PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;

-- Safety: show current counts
SELECT 'BEFORE_ACTIVE_SERVICES', COUNT(*) FROM unified_content WHERE is_service = 1 AND processing_status = 'active' AND status = 'active' AND visibility = 'visible';
SELECT 'BEFORE_SERVICES_PAGES', COUNT(*) FROM unified_content WHERE display_pages LIKE '%services%' AND (status IS NOT NULL OR visibility IS NOT NULL);

-- Promote items categorized as services to service flag
UPDATE unified_content
SET is_service = 1,
    status = COALESCE(NULLIF(status,''),'active'),
    visibility = COALESCE(NULLIF(visibility,''),'visible'),
    processing_status = COALESCE(NULLIF(processing_status,''),'active')
WHERE (
  LOWER(content_type) = 'service'
  OR LOWER(category) LIKE '%service%'
);

-- Optional: If there are items tagged by page_type/display_pages
UPDATE unified_content
SET is_service = 1
WHERE (
  LOWER(page_type) = 'services'
  OR display_pages LIKE '%services%'
);

-- Ensure created_at present
UPDATE unified_content
SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP)
WHERE created_at IS NULL;

COMMIT;
VACUUM;

-- Show post-fix counts
SELECT 'AFTER_ACTIVE_SERVICES', COUNT(*) FROM unified_content WHERE is_service = 1 AND processing_status = 'active' AND status = 'active' AND visibility = 'visible';