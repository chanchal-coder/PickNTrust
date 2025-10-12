.headers off
.mode list
SELECT COUNT(*) AS route_count
FROM unified_content
WHERE (
  status IN ('active','published','ready','processed','completed') OR status IS NULL
)
AND (
  visibility IN ('public','visible') OR visibility IS NULL
)
AND (
  processing_status != 'archived' OR processing_status IS NULL
)
AND (
  is_featured = 1 OR
  CAST(is_featured AS TEXT) IN ('1','true','TRUE','yes','YES','y','Y') OR
  COALESCE(is_featured, 0) = 1 OR
  display_pages LIKE '%top-picks%' OR
  page_type = 'top-picks'
);