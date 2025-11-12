-- Backfill 'top-picks' tag for existing featured rows
BEGIN;

UPDATE unified_content
SET 
  display_pages = CASE
    WHEN COALESCE(display_pages, '') = '' THEN 'top-picks'
    WHEN INSTR(',' || display_pages || ',', ',top-picks,') = 0 THEN display_pages || ',top-picks'
    ELSE display_pages
  END,
  status = COALESCE(NULLIF(status, ''), 'active'),
  visibility = COALESCE(NULLIF(visibility, ''), 'public')
WHERE (
  is_featured = 1 OR LOWER(is_featured) IN ('true','yes','y','on')
) AND INSTR(',' || COALESCE(display_pages, '') || ',', ',top-picks,') = 0;

COMMIT;