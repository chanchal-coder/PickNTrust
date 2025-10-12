-- Normalize featured items to be visible/active for Top Picks
UPDATE unified_content
SET status = COALESCE(status, 'active'),
    visibility = COALESCE(visibility, 'public')
WHERE is_featured = 1;

-- Show count matching API filters for Top Picks
SELECT COUNT(*) FROM unified_content
WHERE (
  is_featured = 1 OR display_pages LIKE '%top-picks%' OR page_type = 'top-picks'
)
AND (
  status IN ('active','published','ready','processed','completed') OR status IS NULL
)
AND (
  visibility IN ('public','visible') OR visibility IS NULL
)
AND (
  processing_status != 'archived' OR processing_status IS NULL
);