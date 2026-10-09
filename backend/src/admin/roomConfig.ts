import express from "express";
import type { DirigeraClient } from "dirigera";
import type pg from "pg";
import { getValidIds } from "./hubValidation.ts";

export function createRoomConfigRouter(client: DirigeraClient, pool: pg.Pool) {
  const router = express.Router();

  router.get("/room-config", async (_req, res) => {
    const result = await pool.query(
      "SELECT room_id, display_name, icon FROM room_config"
    );

    const rooms: Record<string, { name?: string; icon?: string }> = {};
    for (const row of result.rows) {
      rooms[row.room_id] = {
        ...(row.display_name !== null ? { name: row.display_name } : {}),
        ...(row.icon !== null ? { icon: row.icon } : {}),
      };
    }

    res.json({ rooms });
  });

  router.put("/room-config/:roomId", async (req, res) => {
    const { roomId } = req.params;
    const { name, icon } = req.body as { name?: string; icon?: string };

    const { roomIds } = await getValidIds(client);
    if (!roomIds.has(roomId)) {
      res.status(400).json({ error: "Unknown room id" });
      return;
    }

    await pool.query(
      `INSERT INTO room_config (room_id, display_name, icon)
       VALUES ($1, $2, $3)
       ON CONFLICT (room_id) DO UPDATE SET display_name = $2, icon = $3, updated_at = now()`,
      [roomId, name ?? null, icon ?? null]
    );

    res.json({ ok: true });
  });

  router.delete("/room-config/:roomId", async (req, res) => {
    await pool.query("DELETE FROM room_config WHERE room_id = $1", [
      req.params.roomId,
    ]);
    res.json({ ok: true });
  });

  return router;
}
