import fs from "fs";
import express from "express";
import multer from "multer";
import tsEnv from "@lpgera/ts-env";
import type { DirigeraClient } from "dirigera";
import type pg from "pg";
import { getValidIds } from "./hubValidation.ts";

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const DEVICE_ID_ALLOWLIST = /^[a-zA-Z0-9_-]+$/;

export function createDeviceImagesRouter(
  client: DirigeraClient,
  pool: pg.Pool
) {
  const router = express.Router();
  const deviceImageDir = tsEnv.stringOrThrow("DEVICE_IMAGE_DIR");

  const upload = multer({
    limits: { fileSize: tsEnv.number("MAX_UPLOAD_BYTES") },
    fileFilter: (_req, file, callback) => {
      if (!ALLOWED_MIME_TYPES[file.mimetype]) {
        callback(new Error("Unsupported file type"));
        return;
      }
      callback(null, true);
    },
    storage: multer.diskStorage({
      destination: (_req, _file, callback) => {
        callback(null, deviceImageDir);
      },
      filename: (req, file, callback) => {
        const ext = ALLOWED_MIME_TYPES[file.mimetype];
        callback(null, `${req.params.deviceId}.${ext}`);
      },
    }),
  });

  router.get("/device-images", async (_req, res) => {
    const result = await pool.query(
      "SELECT device_id, file_path, content_type, uploaded_at FROM device_image"
    );

    const images: Record<
      string,
      { url: string; contentType: string; uploadedAt: string }
    > = {};

    for (const row of result.rows) {
      images[row.device_id] = {
        url: `/api/devices/images/${row.file_path}`,
        contentType: row.content_type,
        uploadedAt: row.uploaded_at,
      };
    }

    res.json(images);
  });

  router.post(
    "/device-images/:deviceId",
    upload.single("image"),
    async (req, res) => {
      const { deviceId } = req.params;
      const file = req.file;

      if (!file) {
        res.status(400).json({ error: "No image uploaded" });
        return;
      }

      if (!DEVICE_ID_ALLOWLIST.test(deviceId)) {
        await fs.promises.unlink(file.path).catch(() => {});
        res.status(400).json({ error: "Invalid device id" });
        return;
      }

      const { deviceIds } = await getValidIds(client);
      if (!deviceIds.has(deviceId)) {
        await fs.promises.unlink(file.path).catch(() => {});
        res.status(400).json({ error: "Unknown device id" });
        return;
      }

      const existing = await pool.query(
        "SELECT file_path FROM device_image WHERE device_id = $1",
        [deviceId]
      );

      if (
        existing.rows.length > 0 &&
        existing.rows[0].file_path !== file.filename
      ) {
        await fs.promises
          .unlink(`${deviceImageDir}/${existing.rows[0].file_path}`)
          .catch((error) => {
            if (error.code !== "ENOENT") {
              throw error;
            }
          });
      }

      await pool.query(
        `INSERT INTO device_image (device_id, file_path, content_type)
       VALUES ($1, $2, $3)
       ON CONFLICT (device_id) DO UPDATE SET file_path = $2, content_type = $3, uploaded_at = now()`,
        [deviceId, file.filename, file.mimetype]
      );

      res.json({
        url: `/api/devices/images/${file.filename}`,
        contentType: file.mimetype,
      });
    }
  );

  router.delete("/device-images/:deviceId", async (req, res) => {
    const { deviceId } = req.params;

    const existing = await pool.query(
      "SELECT file_path FROM device_image WHERE device_id = $1",
      [deviceId]
    );

    if (existing.rows.length > 0) {
      await fs.promises
        .unlink(`${deviceImageDir}/${existing.rows[0].file_path}`)
        .catch((error) => {
          if (error.code !== "ENOENT") {
            throw error;
          }
        });
    }

    await pool.query("DELETE FROM device_image WHERE device_id = $1", [
      deviceId,
    ]);

    res.json({ ok: true });
  });

  return router;
}
