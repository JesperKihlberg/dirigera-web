# Admin Mode — Requirements Document

## 1. Problem

Four aspects of the app are currently configured by hand-editing static JSON files under `frontend/public/` and rebuilding/redeploying:

| File | Controls |
|---|---|
| `floors.config.json` | Floor list (name, short name, order) and which room IDs belong to each floor |
| `rooms.config.json` | Per-room display name override and icon |
| `scenes.config.json` | Which scenes appear at house / floor / room scope |
| `device-images.config.json` | Device ID → image filename, with the image file manually copied into `frontend/public/devices/` |

This requires editing JSON, knowing room/scene/device UUIDs (looked up via the GraphQL API), placing image files manually, and rebuilding the app to see changes reflected reliably in production. There is no UI for any of this.

## 2. Goal

Add an **Admin Mode** to the existing app: an authenticated section of the UI where these four things can be edited through forms instead of hand-edited JSON, including uploading device photos directly (no manual file placement). Configuration is persisted in a local Postgres database and served by a new backend API module, replacing the static JSON files as the source of truth at runtime.

## 3. Scope

**In scope:**
- Floors: create/edit/delete/reorder floors; assign rooms to a floor.
- Rooms: edit display name and icon per room (icon picker over the existing `react-icons/md` set).
- Scenes: assign scenes to house scope, floor scope(s), and/or room scope(s).
- Device photos: upload/replace/remove an image for a device.
- A new admin-only backend API (REST, mounted in the existing Express app) backed by Postgres.
- One-time migration of the four existing JSON files into Postgres as seed data.
- Admin UI screens in the existing frontend, gated behind the existing login.

**Out of scope (explicitly not doing now):**
- The `floor-plan/` package (SVG floor-plan renderer/editor) — separate, uncommitted, in-progress work. Not touched by this feature.
- Creating/deleting rooms, scenes, or devices themselves — these are owned by the Dirigera hub and only ever read live via the existing GraphQL API. Admin mode only attaches metadata (name/icon/floor/scene-scope/photo) to hub-provided IDs.
- Multi-user roles/permissions — this remains a single-household, single-password app.
- Image thumbnailing/resizing pipelines — store the uploaded file as-is (with basic size/type limits).

## 4. Current State (for reference)

- **Backend**: single Express process (`backend/src/index.ts`) serving the built frontend as static files and an Apollo GraphQL API at `/graphql`. Auth is one shared `PASSWORD` env var → JWT (`login` mutation), checked via a `@loggedIn` directive and, for websockets, `verify()` in `jwt.ts`.
- **Frontend**: React app that `fetch()`s the JSON config files directly from `/*.config.json` at runtime (`useFloors.ts`, `useRoomConfig.ts`, `useSceneScopes.ts`, `useDeviceImages.ts`), all with graceful fallback to "no config" if the file is missing/invalid.
- **Postgres**: a Postgres 16 container is already running locally (`docker ps` shows `postgres`, port `5432`, default db `mydb`). No project currently uses it from this repo. Recommend a dedicated database (e.g. `dirigera_web`) in this instance rather than a new container.
- **Room/scene/device IDs**: not owned by this app. They come live from the IKEA Dirigera hub via the existing GraphQL API and are only meaningful as long as they exist on the hub.

## 5. Functional Requirements

### 5.1 Floors
- Admin can view all floors in order, create a new floor (name, short name, order), edit an existing floor's name/short name/order, delete a floor, and reorder floors (drag or numeric order field).
- Admin can assign any live room (fetched from the GraphQL API) to a floor, or move it to a different floor, or unassign it (falls back to "Other"/unassigned grouping, matching current behavior).
- A room may belong to at most one floor (matches current `floors.config.json` semantics).

**Acceptance check:** editing floors in admin mode and reloading the main app reflects the new floor grouping/order without a rebuild or redeploy.

### 5.2 Rooms
- Admin can see the list of live rooms from the hub and, per room, set a display name override and pick an icon from the supported `react-icons/md` set (same list currently documented in `rooms.config.json`'s `_instructions`).
- If unset, the room falls back to its name from the hub and no icon (matching current behavior when a room has no entry).

**Acceptance check:** setting a room's icon/name in admin mode updates it in the main app on next load.

### 5.3 Scenes
- Admin can see the list of live scenes from the hub and assign each scene to any combination of: house scope, one or more floors, one or more rooms.
- A scene may be in multiple scopes simultaneously (matches current behavior).
- Scenes not assigned to any scope are treated as "orphaned" (matches current `OrphanedScenes` behavior) — admin mode should make orphaned scenes visible so they can be assigned.

**Acceptance check:** assigning a scene to a room in admin mode makes it appear on that room's page without a rebuild.

### 5.4 Device Photos
- Admin can see the list of live devices from the hub (grouped by room, as today) and upload an image for a device, replace an existing image, or remove it.
- Supported formats: JPEG, PNG, WebP. Enforce a max upload size (suggest 5MB — confirm before implementing).
- Uploaded images are served back to the frontend so `useDeviceImages`-equivalent logic can render them without needing a filename convention or manual file placement.

**Acceptance check:** uploading a photo for a device in admin mode shows that photo on the room overview and device detail views without a rebuild.

### 5.5 Migration
- A one-time script/step imports the current contents of `floors.config.json`, `rooms.config.json`, `scenes.config.json`, and `device-images.config.json` (+ the existing files in `frontend/public/devices/`) into Postgres, so no configuration is lost when switching over.
- After migration, the frontend reads this configuration from the new API instead of the static JSON files. The JSON files can be removed once migration is verified (confirm before deleting).

## 6. Data Requirements (conceptual — schema TBD at implementation time)

- **floor**: id, name, short_name, order
- **floor_room**: floor_id, room_id (hub UUID, not a local FK)
- **room_config**: room_id (hub UUID, PK), display_name (nullable), icon (nullable)
- **scene_scope**: scene_id (hub UUID), scope_type (house | floor | room), scope_id (nullable — floor id or room id depending on scope_type)
- **device_image**: device_id (hub UUID, PK), file_path or blob reference, content_type, uploaded_at

Since room/scene/device IDs are foreign UUIDs from the hub with no local table of their own, the schema cannot enforce referential integrity against them — the API should validate against the live GraphQL API at write time (reject unknown IDs) rather than relying on DB constraints.

## 7. API Requirements

- New admin API surface added to the existing backend process (not a separate service/deployment) — e.g. REST endpoints under `/api/admin/*`, or an additional GraphQL schema module alongside the existing one. Reuses the existing JWT auth (same login/password as the rest of the app) — no new credential.
- Endpoints needed (exact shape TBD at design time): list/create/update/delete floors; assign room-to-floor; get/set room config; list scene scopes and assign/unassign a scene to a scope; upload/replace/delete a device image, and serve device images.
- Photo storage: store uploaded files on disk (e.g. a Docker volume mounted into the backend container) with the file path/metadata recorded in Postgres — not as bytea blobs in Postgres.

## 8. Frontend Requirements

- New admin section/route in the existing React app, reachable only when logged in (reuses existing auth state — no separate admin login screen).
- Screens: Floors management, Rooms management, Scenes management, Device photo management — each backed by the new admin API instead of `fetch()`-ing the static JSON files.
- Existing runtime hooks (`useFloors`, `useRoomConfig`, `useSceneScopes`, `useDeviceImages`) are repointed from static JSON files to the new API endpoints.

## 9. Non-Functional Requirements

- Single local household deployment — no multi-tenancy, no RBAC beyond the existing shared password.
- Postgres runs locally (existing shared container); connection configured via env vars consistent with the existing `.env` pattern.
- Config changes must be visible in the running app without a rebuild/redeploy (this is the core improvement over the JSON-file workflow).

## 10. Open Questions / Assumptions to confirm before implementation

1. **Database**: assumed a new dedicated database (`dirigera_web`) inside the existing shared Postgres container, using the existing `admin` user. Confirm connection details/credentials to use, and whether a new Postgres user should be created instead of reusing `admin`.
2. **Max upload size / formats** for device photos — proposed 5MB, JPEG/PNG/WebP.
3. **Deleting the JSON files** — confirm before removing `floors.config.json`, `rooms.config.json`, `scenes.config.json`, `device-images.config.json` and `frontend/public/devices/` once migrated, or whether to keep them as an inert backup.
4. **ID validation** — should saving a floor/scene/photo assignment validate the room/scene/device ID against the live hub via GraphQL at write time (recommended), or trust admin input?
5. **REST vs. a second GraphQL schema** for the new admin module — no strong reason to prefer one over the other yet; REST is simpler for file upload (multipart), GraphQL keeps one API style. Recommend REST specifically for the upload endpoint even if the rest of admin CRUD uses GraphQL, since GraphQL file upload adds complexity for no benefit here.
