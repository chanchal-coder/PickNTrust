-- Count featured and top-picks display assignments in unified_content
.headers off
.mode list
SELECT COUNT(*) AS featured_count FROM unified_content WHERE is_featured = 1;
SELECT COUNT(*) AS dp_count FROM unified_content WHERE display_pages LIKE '%top-picks%';