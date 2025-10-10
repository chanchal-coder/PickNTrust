-- Inspect unified_content distribution across key pages and flags
.mode tabs
SELECT 'TOTAL_UNIFIED', COUNT(*) FROM unified_content;
SELECT 'ACTIVE_VISIBLE', COUNT(*) FROM unified_content WHERE status='active' AND visibility='visible' AND processing_status='active';
SELECT 'PRIME_PICKS', COUNT(*) FROM unified_content WHERE display_pages LIKE '%prime-picks%';
SELECT 'TOP_PICKS', COUNT(*) FROM unified_content WHERE is_featured=1 OR display_pages LIKE '%top-picks%';
SELECT 'SERVICES_PAGE', COUNT(*) FROM unified_content WHERE is_service=1 OR display_pages LIKE '%services%';
SELECT 'APPS_PAGE', COUNT(*) FROM unified_content WHERE is_ai_app=1 OR display_pages LIKE '%apps%' OR display_pages LIKE '%apps-ai-apps%';
SELECT 'DISTINCT_PAGES', display_pages, COUNT(*) FROM unified_content GROUP BY display_pages ORDER BY COUNT(*) DESC LIMIT 20;