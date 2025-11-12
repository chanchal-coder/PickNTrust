-- Retag mis-slugged rows so pages show content immediately
-- Run with: node server/apply-sql.cjs scripts/tmp_fix_display_pages.sql

-- Amazon PNT → prime-picks
UPDATE unified_content
SET display_pages = REPLACE(display_pages, '"amazon-pnt"', '"prime-picks"')
WHERE display_pages LIKE '%amazon-pnt%';

-- Cuelinks PNT → cue-picks
UPDATE unified_content
SET display_pages = REPLACE(display_pages, '"cuelinks-pnt"', '"cue-picks"')
WHERE display_pages LIKE '%cuelinks-pnt%';

-- Dealshub PNT → deals-hub
UPDATE unified_content
SET display_pages = REPLACE(display_pages, '"dealshub-pnt"', '"deals-hub"')
WHERE display_pages LIKE '%dealshub-pnt%';

-- Deodap pnt → loot-box
UPDATE unified_content
SET display_pages = REPLACE(display_pages, '"deodap-pnt"', '"loot-box"')
WHERE display_pages LIKE '%deodap-pnt%';

-- Optional normalization: lowercase all JSON strings when not null
UPDATE unified_content
SET display_pages = LOWER(display_pages)
WHERE display_pages IS NOT NULL;

-- Quick sanity checks (will print counts when run via a console tool)
-- SELECT COUNT(*) AS remaining_amazon_pnt FROM unified_content WHERE display_pages LIKE '%amazon-pnt%';
-- SELECT COUNT(*) AS remaining_cuelinks_pnt FROM unified_content WHERE display_pages LIKE '%cuelinks-pnt%';
-- SELECT COUNT(*) AS prime_picks_now FROM unified_content WHERE display_pages LIKE '%prime-picks%';