import { describe, it } from "node:test";
import assert from "node:assert";
import { isValidFloorPlan } from "./floors.ts";

describe("admin/floors", () => {
  describe("isValidFloorPlan", () => {
    it("accepts a bare svg filename or null", () => {
      assert.strictEqual(isValidFloorPlan("ground.svg"), true);
      assert.strictEqual(isValidFloorPlan("second-floor_2.svg"), true);
      assert.strictEqual(isValidFloorPlan(null), true);
    });

    it("rejects paths, other extensions and non-strings", () => {
      assert.strictEqual(isValidFloorPlan("../secret.svg"), false);
      assert.strictEqual(isValidFloorPlan("floorplan/ground.svg"), false);
      assert.strictEqual(isValidFloorPlan("ground.png"), false);
      assert.strictEqual(isValidFloorPlan(""), false);
      assert.strictEqual(isValidFloorPlan(undefined), false);
      assert.strictEqual(isValidFloorPlan(42), false);
    });
  });
});
