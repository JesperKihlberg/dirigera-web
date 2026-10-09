import express from "express";
import type { DirigeraClient } from "dirigera";
import type pg from "pg";
import { getValidIds } from "./hubValidation.ts";

export function createSceneScopesRouter(client: DirigeraClient, pool: pg.Pool) {
  const router = express.Router();

  router.get("/scene-scopes", async (_req, res) => {
    const result = await pool.query(
      "SELECT scene_id, scope_type, scope_id FROM scene_scope"
    );

    const house: string[] = [];
    const floors: Record<string, string[]> = {};
    const rooms: Record<string, string[]> = {};

    for (const row of result.rows) {
      if (row.scope_type === "house") {
        house.push(row.scene_id);
      } else if (row.scope_type === "floor") {
        (floors[row.scope_id] ??= []).push(row.scene_id);
      } else if (row.scope_type === "room") {
        (rooms[row.scope_id] ??= []).push(row.scene_id);
      }
    }

    res.json({ house, floors, rooms });
  });

  router.put("/scene-scopes/:sceneId", async (req, res) => {
    const { sceneId } = req.params;
    const { house, floorIds, roomIds } = req.body as {
      house: boolean;
      floorIds: string[];
      roomIds: string[];
    };

    const validIds = await getValidIds(client);
    if (!validIds.sceneIds.has(sceneId)) {
      res.status(400).json({ error: "Unknown scene id" });
      return;
    }

    for (const floorId of floorIds) {
      const floorResult = await pool.query(
        "SELECT id FROM floor WHERE id = $1",
        [floorId]
      );
      if (floorResult.rows.length === 0) {
        res.status(400).json({ error: `Unknown floor id: ${floorId}` });
        return;
      }
    }

    for (const roomId of roomIds) {
      if (!validIds.roomIds.has(roomId)) {
        res.status(400).json({ error: `Unknown room id: ${roomId}` });
        return;
      }
    }

    const dbClient = await pool.connect();
    try {
      await dbClient.query("BEGIN");
      await dbClient.query("DELETE FROM scene_scope WHERE scene_id = $1", [
        sceneId,
      ]);

      if (house === true) {
        await dbClient.query(
          "INSERT INTO scene_scope (scene_id, scope_type, scope_id) VALUES ($1, 'house', NULL)",
          [sceneId]
        );
      }

      for (const floorId of floorIds) {
        await dbClient.query(
          "INSERT INTO scene_scope (scene_id, scope_type, scope_id) VALUES ($1, 'floor', $2)",
          [sceneId, floorId]
        );
      }

      for (const roomId of roomIds) {
        await dbClient.query(
          "INSERT INTO scene_scope (scene_id, scope_type, scope_id) VALUES ($1, 'room', $2)",
          [sceneId, roomId]
        );
      }

      await dbClient.query("COMMIT");
    } catch (error) {
      await dbClient.query("ROLLBACK");
      throw error;
    } finally {
      dbClient.release();
    }

    res.json({ ok: true });
  });

  return router;
}
