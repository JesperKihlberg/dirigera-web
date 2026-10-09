-- Up Migration
-- SVG filename under frontend/public/floorplan/, e.g. 'ground.svg'; NULL = no floor plan
ALTER TABLE floor ADD COLUMN floor_plan TEXT;

-- Down Migration
ALTER TABLE floor DROP COLUMN floor_plan;
