-- Emergency visibility normalization across unified_content
.mode tabs
PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;

SELECT 'BEFORE_ACTIVE_VISIBLE', COUNT(*) FROM unified_content WHERE status='active' AND visibility='visible' AND processing_status='active';

-- Normalize global flags to make content visible
UPDATE unified_content
SET status = 'active'
WHERE status IS NULL OR TRIM(status) = '' OR status NOT IN ('active','inactive');

UPDATE unified_content
SET visibility = 'visible'
WHERE visibility IS NULL OR TRIM(visibility) = '' OR visibility NOT IN ('visible','hidden');

UPDATE unified_content
SET processing_status = 'active'
WHERE processing_status IS NULL OR TRIM(processing_status) = '' OR processing_status NOT IN ('active','inactive');

-- Ensure timestamps exist
UPDATE unified_content
SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP)
WHERE created_at IS NULL;

COMMIT;
VACUUM;

SELECT 'AFTER_ACTIVE_VISIBLE', COUNT(*) FROM unified_content WHERE status='active' AND visibility='visible' AND processing_status='active';