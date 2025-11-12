-- Adds triggers to automatically include 'top-picks' in display_pages
-- whenever a row is inserted or updated with is_featured set.
-- Also normalizes status/visibility when featuring.

PRAGMA foreign_keys = ON;

-- After INSERT: if the new row is featured, ensure display_pages includes 'top-picks'
CREATE TRIGGER IF NOT EXISTS trg_uc_insert_feature_top_picks
AFTER INSERT ON unified_content
WHEN (
  NEW.is_featured IN (1, '1', 'true', 'yes', 'y', 'on')
)
BEGIN
  UPDATE unified_content
  SET display_pages = (
    CASE
      WHEN COALESCE(display_pages, '') = '' THEN 'top-picks'
      WHEN INSTR(',' || display_pages || ',', ',top-picks,') = 0 THEN display_pages || ',top-picks'
      ELSE display_pages
    END
  ),
  status = COALESCE(NULLIF(status,''), 'active'),
  visibility = COALESCE(NULLIF(visibility,''), 'public')
  WHERE id = NEW.id;
END;

-- After UPDATE of is_featured: when toggled to featured, add 'top-picks' if missing
CREATE TRIGGER IF NOT EXISTS trg_uc_update_feature_top_picks
AFTER UPDATE OF is_featured ON unified_content
WHEN (
  NEW.is_featured IN (1, '1', 'true', 'yes', 'y', 'on')
)
BEGIN
  UPDATE unified_content
  SET display_pages = (
    CASE
      WHEN COALESCE(NEW.display_pages, '') = '' THEN 'top-picks'
      WHEN INSTR(',' || NEW.display_pages || ',', ',top-picks,') = 0 THEN NEW.display_pages || ',top-picks'
      ELSE NEW.display_pages
    END
  ),
  status = COALESCE(NULLIF(NEW.status,''), 'active'),
  visibility = COALESCE(NULLIF(NEW.visibility,''), 'public')
  WHERE id = NEW.id;
END;