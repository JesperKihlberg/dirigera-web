import { before, describe, it } from "node:test";
import assert from "node:assert";

let scene: typeof import("./scene.ts");

describe("definitions/scene", () => {
  before(async () => {
    scene = await import("./scene.ts");
  });

  describe("getUserScenes", () => {
    it("returns only scenes of type userScene, mapped to id/name", () => {
      const scenes = [
        {
          id: "1",
          type: "userScene",
          info: { name: "Movie time" },
        },
        {
          id: "2",
          type: "smartScene",
          info: { name: "Sunset" },
        },
      ];

      // @ts-ignore
      const result = scene.getUserScenes(scenes);
      assert.deepStrictEqual(result, [{ id: "1", name: "Movie time" }]);
    });

    it("returns an empty array if there are no user scenes", () => {
      const scenes = [
        {
          id: "2",
          type: "smartScene",
          info: { name: "Sunset" },
        },
      ];

      // @ts-ignore
      assert.deepStrictEqual(scene.getUserScenes(scenes), []);
    });
  });
});
