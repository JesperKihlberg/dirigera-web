import pg from "pg";
import fs from "fs";
import tsEnv from "@lpgera/ts-env";

let pool: pg.Pool | null = null;

export function getPool() {
  if (!pool) {
    pool = new pg.Pool({
      connectionString: tsEnv.stringOrThrow("DATABASE_URL"),
    });
  }
  return pool;
}

fs.mkdirSync(tsEnv.stringOrThrow("DEVICE_IMAGE_DIR"), { recursive: true });
