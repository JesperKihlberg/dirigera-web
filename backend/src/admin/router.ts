import express from "express";
import bodyParser from "body-parser";
import type { DirigeraClient } from "dirigera";
import type pg from "pg";
import { requireAdminAuth } from "./auth.ts";
import { createFloorsRouter } from "./floors.ts";
import { createRoomConfigRouter } from "./roomConfig.ts";
import { createSceneScopesRouter } from "./sceneScopes.ts";
import { createDeviceImagesRouter } from "./deviceImages.ts";

export function createAdminRouter(client: DirigeraClient, pool: pg.Pool) {
  const router = express.Router();

  router.use(requireAdminAuth);
  router.use(bodyParser.json());

  router.use(createFloorsRouter(client, pool));
  router.use(createRoomConfigRouter(client, pool));
  router.use(createSceneScopesRouter(client, pool));
  router.use(createDeviceImagesRouter(client, pool));

  return router;
}
