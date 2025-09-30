SELECT id,
       placement_name AS name,
       placement_type AS description,
       dimensions,
       pricing_cpm AS base_price,
       page_location
FROM ad_placements
WHERE status = 'active'
ORDER BY pricing_cpm ASC;