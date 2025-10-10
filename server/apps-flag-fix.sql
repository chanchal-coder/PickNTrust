-- Flag AI Apps in unified_content so /api/products/page/apps and /api/products/page/apps-ai-apps return items
PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;

-- Safety: show current counts
SELECT 'BEFORE_ACTIVE_AI_APPS', COUNT(*) FROM unified_content WHERE is_ai_app = 1 AND processing_status = 'active' AND status = 'active' AND visibility = 'visible';
SELECT 'BEFORE_APPS_PAGES', COUNT(*) FROM unified_content WHERE (display_pages LIKE '%apps%' OR display_pages LIKE '%apps-ai-apps%') AND status = 'active' AND visibility = 'visible';

-- Promote items targeting apps pages to AI Apps
UPDATE unified_content
SET is_ai_app = 1,
    status = COALESCE(NULLIF(status,''),'active'),
    visibility = COALESCE(NULLIF(visibility,''),'visible'),
    processing_status = COALESCE(NULLIF(processing_status,''),'active')
WHERE (display_pages LIKE '%apps%' OR display_pages LIKE '%apps-ai-apps%');

-- Optional: If there are items categorized as apps via page_type
UPDATE unified_content
SET is_ai_app = 1
WHERE LOWER(page_type) = 'apps' OR LOWER(page_type) = 'app';

-- Ensure created_at present
UPDATE unified_content
SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP)
WHERE created_at IS NULL;

COMMIT;
VACUUM;

-- Show post-fix counts
SELECT 'AFTER_ACTIVE_AI_APPS', COUNT(*) FROM unified_content WHERE is_ai_app = 1 AND processing_status = 'active' AND status = 'active' AND visibility = 'visible';
SELECT 'AFTER_APPS_PAGES', COUNT(*) FROM unified_content WHERE (display_pages LIKE '%apps%' OR display_pages LIKE '%apps-ai-apps%') AND status = 'active' AND visibility = 'visible';