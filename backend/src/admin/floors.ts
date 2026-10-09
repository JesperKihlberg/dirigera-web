import express from "express";
import type { DirigeraClient } from "dirigera";
import type pg from "pg";
import { getValidIds } from "./hubValidation.ts";

// A bare SVG filename under frontend/public/floorplan/, or null for no plan.
export function isValidFloorPlan(value: unknown): value is string | null {
  return (
    value === null || (typeof value === "string" && /^[\w-]+\.svg$/.test(value))
  );
}

export function createFloorsRouter(client: DirigeraClient, pool: pg.Pool) {
  const router = express.Router();

  router.get("/floors", async (_req, res) => {
    const result = await pool.query(`
      SELECT
        f.id,
        f.name,
        f.short_name,
        f.sort_order,
        f.floor_plan,
        COALESCE(array_agg(fr.room_id) FILTER (WHERE fr.room_id IS NOT NULL), '{}') AS rooms
      FROM floor f
      LEFT JOIN floor_room fr ON fr.floor_id = f.id
      GROUP BY f.id
      ORDER BY f.sort_order
    `);

    res.json({
      floors: result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        shortName: row.short_name,
        order: row.sort_order,
        floorPlan: row.floor_plan,
        rooms: row.rooms,
      })),
    });
  });

  router.post("/floors", async (req, res) => {
    const { name, shortName, order, floorPlan = null } = req.body;

    if (!isValidFloorPlan(floorPlan)) {
      res.status(400).json({ error: "Invalid floor plan" });
      return;
    }

    const result = await pool.query(
      "INSERT INTO floor (name, short_name, sort_order, floor_plan) VALUES ($1, $2, $3, $4) RETURNING id",
      [name, shortName, order, floorPlan]
    );

    res.json({ id: result.rows[0].id });
  });

  router.put("/floors/:id", async (req, res) => {
    const { id } = req.params;
    const { name, shortName, order, floorPlan } = req.body;

    if (floorPlan !== undefined && !isValidFloorPlan(floorPlan)) {
      res.status(400).json({ error: "Invalid floor plan" });
      return;
    }

    const fields: string[] = [];
    const values: unknown[] = [];

    if (name !== undefined) {
      values.push(name);
      fields.push(`name = $${values.length}`);
    }
    if (shortName !== undefined) {
      values.push(shortName);
      fields.push(`short_name = $${values.length}`);
    }
    if (order !== undefined) {
      values.push(order);
      fields.push(`sort_order = $${values.length}`);
    }
    if (floorPlan !== undefined) {
      values.push(floorPlan);
      fields.push(`floor_plan = $${values.length}`);
    }

    if (fields.length === 0) {
      res.json({ ok: true });
      return;
    }

    fields.push("updated_at = now()");
    values.push(id);

    await pool.query(
      `UPDATE floor SET ${fields.join(", ")} WHERE id = $${values.length}`,
      values
    );

    res.json({ ok: true });
  });

  router.delete("/floors/:id", async (req, res) => {
    await pool.query("DELETE FROM floor WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  });

  router.put("/rooms/:roomId/floor", async (req, res) => {
    const { roomId } = req.params;
    const { floorId } = req.body as { floorId: string | null };

    const { roomIds } = await getValidIds(client);
    if (!roomIds.has(roomId)) {
      res.status(400).json({ error: "Unknown room id" });
      return;
    }

    if (floorId !== null) {
      const floorResult = await pool.query(
        "SELECT id FROM floor WHERE id = $1",
        [floorId]
      );
      if (floorResult.rows.length === 0) {
        res.status(400).json({ error: "Unknown floor id" });
        return;
      }

      await pool.query(
        `INSERT INTO floor_room (room_id, floor_id) VALUES ($1, $2)
         ON CONFLICT (room_id) DO UPDATE SET floor_id = $2`,
        [roomId, floorId]
      );
    } else {
      await pool.query("DELETE FROM floor_room WHERE room_id = $1", [roomId]);
    }

    res.json({ ok: true });
  });

  return router;
}
