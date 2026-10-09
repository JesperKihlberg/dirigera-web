import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import tsEnv from "@lpgera/ts-env";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "..", "frontend", "public");
const deviceImageDir = tsEnv.stringOrThrow("DEVICE_IMAGE_DIR");

fs.mkdirSync(deviceImageDir, { recursive: true });

const pool = new pg.Pool({
  connectionString: tsEnv.stringOrThrow("DATABASE_URL"),
});

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

type FloorsConfig = {
  floors: {
    id: string;
    name: string;
    shortName: string;
    order: number;
    rooms: string[];
  }[];
};

type RoomsConfig = {
  rooms: Record<string, { name?: string; icon?: string }>;
};

type ScenesConfig = {
  house: string[];
  floors: Record<string, string[]>;
  rooms: Record<string, string[]>;
};

type DeviceImagesConfig = Record<string, string>;

function readJson<T>(filename: string): T {
  const filePath = path.join(publicDir, filename);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

async function main() {
  const existing = await pool.query("SELECT count(*) FROM floor");
  if (Number(existing.rows[0].count) > 0) {
    console.log("already migrated, aborting");
    await pool.end();
    process.exit(0);
  }

  const counts = {
    floor: 0,
    floor_room: 0,
    room_config: 0,
    scene_scope: 0,
    device_image: 0,
  };

  // floors.config.json
  const floorsConfig = readJson<FloorsConfig>("floors.config.json");
  const floorIdMap = new Map<string, string>();
  const roomToFloor = new Map<string, string>();

  for (const floor of floorsConfig.floors) {
    const result = await pool.query(
      "INSERT INTO floor (name, short_name, sort_order) VALUES ($1, $2, $3) RETURNING id",
      [floor.name, floor.shortName, floor.order]
    );
    const newId = result.rows[0].id;
    floorIdMap.set(floor.id, newId);
    counts.floor += 1;

    for (const roomId of floor.rooms) {
      if (roomToFloor.has(roomId)) {
        console.warn(
          `Room ${roomId} appears in multiple floors' room lists; keeping first assignment (${roomToFloor.get(
            roomId
          )})`
        );
        continue;
      }
      roomToFloor.set(roomId, newId);

      await pool.query(
        "INSERT INTO floor_room (room_id, floor_id) VALUES ($1, $2) ON CONFLICT (room_id) DO NOTHING",
        [roomId, newId]
      );
      counts.floor_room += 1;
    }
  }

  // rooms.config.json
  const roomsConfig = readJson<RoomsConfig>("rooms.config.json");
  for (const [roomId, config] of Object.entries(roomsConfig.rooms)) {
    await pool.query(
      "INSERT INTO room_config (room_id, display_name, icon) VALUES ($1, $2, $3)",
      [roomId, config.name ?? null, config.icon ?? null]
    );
    counts.room_config += 1;
  }

  // scenes.config.json
  const scenesConfig = readJson<ScenesConfig>("scenes.config.json");
  for (const sceneId of scenesConfig.house ?? []) {
    await pool.query(
      "INSERT INTO scene_scope (scene_id, scope_type, scope_id) VALUES ($1, 'house', NULL)",
      [sceneId]
    );
    counts.scene_scope += 1;
  }
  for (const [oldFloorId, sceneIds] of Object.entries(
    scenesConfig.floors ?? {}
  )) {
    const newFloorId = floorIdMap.get(oldFloorId);
    if (!newFloorId) {
      console.warn(
        `scenes.config.json references unknown floor id "${oldFloorId}"; skipping its scene assignments`
      );
      continue;
    }
    for (const sceneId of sceneIds) {
      await pool.query(
        "INSERT INTO scene_scope (scene_id, scope_type, scope_id) VALUES ($1, 'floor', $2)",
        [sceneId, newFloorId]
      );
      counts.scene_scope += 1;
    }
  }
  for (const [roomId, sceneIds] of Object.entries(scenesConfig.rooms ?? {})) {
    for (const sceneId of sceneIds) {
      await pool.query(
        "INSERT INTO scene_scope (scene_id, scope_type, scope_id) VALUES ($1, 'room', $2)",
        [sceneId, roomId]
      );
      counts.scene_scope += 1;
    }
  }

  // device-images.config.json
  const deviceImagesConfig = readJson<DeviceImagesConfig>(
    "device-images.config.json"
  );
  for (const [deviceId, filename] of Object.entries(deviceImagesConfig)) {
    if (deviceId.startsWith("_")) {
      continue;
    }
    const ext = path.extname(filename).slice(1).toLowerCase();
    const contentType = CONTENT_TYPE_BY_EXT[ext];
    if (!contentType) {
      console.warn(
        `Unknown extension for device image "${filename}"; skipping`
      );
      continue;
    }
    const destFilename = `${deviceId}.${ext}`;
    await fs.promises.copyFile(
      path.join(publicDir, "devices", filename),
      path.join(deviceImageDir, destFilename)
    );

    await pool.query(
      "INSERT INTO device_image (device_id, file_path, content_type) VALUES ($1, $2, $3)",
      [deviceId, destFilename, contentType]
    );
    counts.device_image += 1;
  }

  console.log("Migration complete:", counts);

  await pool.end();
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
