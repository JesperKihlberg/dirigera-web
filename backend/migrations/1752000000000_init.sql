-- Up Migration
CREATE TABLE floor (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  short_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- room_id is PK (not just unique): a room belongs to at most one floor
CREATE TABLE floor_room (
  room_id  TEXT PRIMARY KEY,
  floor_id UUID NOT NULL REFERENCES floor(id) ON DELETE CASCADE
);
CREATE INDEX floor_room_floor_id_idx ON floor_room (floor_id);

CREATE TABLE room_config (
  room_id      TEXT PRIMARY KEY,
  display_name TEXT,
  icon         TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE scene_scope_type AS ENUM ('house', 'floor', 'room');

CREATE TABLE scene_scope (
  id         BIGSERIAL PRIMARY KEY,
  scene_id   TEXT NOT NULL,
  scope_type scene_scope_type NOT NULL,
  scope_id   TEXT,  -- floor.id (as text) for 'floor'; hub room UUID for 'room'; NULL for 'house'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT scene_scope_id_matches_type CHECK (
    (scope_type = 'house' AND scope_id IS NULL) OR
    (scope_type IN ('floor', 'room') AND scope_id IS NOT NULL)
  ),
  CONSTRAINT scene_scope_unique UNIQUE (scene_id, scope_type, scope_id)
);
CREATE INDEX scene_scope_scene_id_idx ON scene_scope (scene_id);

CREATE TABLE device_image (
  device_id    TEXT PRIMARY KEY,
  file_path    TEXT NOT NULL,   -- filename relative to DEVICE_IMAGE_DIR
  content_type TEXT NOT NULL,
  uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Down Migration
DROP TABLE device_image;
DROP TABLE scene_scope;
DROP TYPE scene_scope_type;
DROP TABLE room_config;
DROP TABLE floor_room;
DROP TABLE floor;
